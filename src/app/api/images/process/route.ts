import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db, sql } from '@/lib/db'
import { processImageWithFlux } from '@/lib/flux'
import crypto from 'crypto'

// Backblaze B2 configuration
const B2_KEY_ID = process.env.B2_APPLICATION_KEY_ID
const B2_APPLICATION_KEY = process.env.B2_APPLICATION_KEY
const B2_BUCKET_NAME = process.env.B2_BUCKET_NAME
const B2_BUCKET_ID = process.env.B2_BUCKET_ID
const CDN_URL = process.env.CDN_URL || 'https://cdn.paw-studio.com'

interface BackblazeAuth {
  authorizationToken: string
  apiUrl: string
  downloadUrl: string
}

async function getB2Authorization(): Promise<BackblazeAuth> {
  const response = await fetch('https://api.backblazeb2.com/b2api/v2/b2_authorize_account', {
    method: 'GET',
    headers: {
      'Authorization': `Basic ${Buffer.from(`${B2_KEY_ID}:${B2_APPLICATION_KEY}`).toString('base64')}`
    }
  })

  if (!response.ok) {
    throw new Error('Failed to authorize with Backblaze B2')
  }

  const data = await response.json()
  return {
    authorizationToken: data.authorizationToken,
    apiUrl: data.apiUrl,
    downloadUrl: data.downloadUrl
  }
}

async function getUploadUrl(authData: BackblazeAuth) {
  const response = await fetch(`${authData.apiUrl}/b2api/v2/b2_get_upload_url`, {
    method: 'POST',
    headers: {
      'Authorization': authData.authorizationToken,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      bucketId: B2_BUCKET_ID
    })
  })

  if (!response.ok) {
    throw new Error('Failed to get upload URL from Backblaze B2')
  }

  return response.json()
}

async function uploadToB2(uploadData: {uploadUrl: string, authorizationToken: string}, fileBuffer: Buffer, fileName: string, contentType: string) {
  // Calculate SHA1 hash of the file
  const sha1Hash = crypto.createHash('sha1').update(fileBuffer).digest('hex')
  
  const response = await fetch(uploadData.uploadUrl, {
    method: 'POST',
    headers: {
      'Authorization': uploadData.authorizationToken,
      'X-Bz-File-Name': fileName,
      'Content-Type': contentType,
      'X-Bz-Content-Sha1': sha1Hash,
      'X-Bz-Info-Author': 'PawStudio'
    },
    body: new Uint8Array(fileBuffer)
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('B2 upload error:', response.status, response.statusText, errorText)
    throw new Error(`Failed to upload file to Backblaze B2: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

// Process image with FLUX.1 Kontext Pro (imported from @/lib/flux)
// This function is now a simple wrapper for consistency with existing code
async function processImageWithAI(imageBuffer: Buffer, prompt: string, mimeType: string = 'image/jpeg') {
  return processImageWithFlux(imageBuffer, prompt, mimeType)
}

export async function POST(request: NextRequest) {
  console.log('POST /api/images/process - Route handler called')
  try {
    // Try to get user from Better-Auth session first
    let userId: string | null = null;

    const session = await auth.api.getSession({ headers: request.headers });
    console.log('Session present:', !!session)

    if (session && session.user) {
      userId = session.user.id;
    } else {
      // Fallback: Check for manually-created session (mobile Google auth)
      const cookieHeader = request.headers.get('cookie');

      if (cookieHeader) {
        const sessionTokenMatch = cookieHeader.match(/better-auth\.session_token=([^;]+)/);

        if (sessionTokenMatch) {
          const sessionToken = sessionTokenMatch[1];

          // Validate session token in database
          const [dbSession] = await sql`
            SELECT user_id, expires_at
            FROM sessions
            WHERE token = ${sessionToken}
            AND expires_at > NOW()
          `;

          if (dbSession) {
            userId = dbSession.user_id;
          }
        }
      }
    }

    if (!userId) {
      console.log('No userId found, returning 401')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('User authenticated:', userId)

    // Parse request body
    const { imageUrl, filterId } = await request.json()

    if (!imageUrl || !filterId) {
      console.log('Missing required params')
      return NextResponse.json({ error: 'imageUrl and filterId are required' }, { status: 400 })
    }

    console.log('Processing image:', { imageUrl, filterId, userId })

    // Get scene from database
    const sceneId = parseInt(filterId)
    if (isNaN(sceneId)) {
      return NextResponse.json({ error: 'Invalid filterId' }, { status: 400 })
    }

    const scene = await db.getSceneById(sceneId)
    if (!scene) {
      return NextResponse.json({ error: 'Scene not found' }, { status: 404 })
    }

    console.log('Scene found:', { id: scene.id, name: scene.name })

    // Check if user has enough credits
    console.log('Checking user credits...')
    const userData = await db.getUserById(userId)

    console.log('Credits check result:', { userData })

    if (!userData) {
      console.log('User not found error')
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    console.log('User credits:', userData.credits, 'Trial mode:', userData.trial_mode)

    // Allow generation if user has credits OR is in trial mode
    if (userData.credits < 1 && !userData.trial_mode) {
      console.log('Insufficient credits and not in trial mode')
      return NextResponse.json({
        error: 'Insufficient credits. Please purchase more credits to continue.'
      }, { status: 402 })
    }

    console.log('Credits check passed, downloading image...')

    // Download the original image from B2
    const imageResponse = await fetch(imageUrl)
    if (!imageResponse.ok) {
      return NextResponse.json({ error: 'Failed to download original image' }, { status: 400 })
    }
    
    const imageBuffer = await imageResponse.arrayBuffer()
    const buffer = Buffer.from(imageBuffer)
    const contentType = imageResponse.headers.get('content-type') || 'image/jpeg'

    // Process image with AI using the scene's prompt
    const aiResult = await processImageWithAI(buffer, scene.prompt, contentType)
    
    console.log('AI Result:', {
      success: aiResult.success,
      hasImageData: !!aiResult.imageData,
      imageDataLength: aiResult.imageData ? aiResult.imageData.length : 0,
      error: aiResult.error
    })
    
    if (!aiResult.success) {
      return NextResponse.json({ 
        error: aiResult.error || 'Image processing failed' 
      }, { status: 500 })
    }

    // Upload processed image to B2
    const processedImageBuffer = Buffer.from(aiResult.imageData!, 'base64')
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2)
    const processedFileName = `users/${userId}/generated/${timestamp}-${randomString}.jpg`

    const authData = await getB2Authorization()
    const uploadData = await getUploadUrl(authData)
    // Upload processed image to B2
    await uploadToB2(uploadData, processedImageBuffer, processedFileName, 'image/jpeg')

    // Construct the public URL for processed image using CDN
    const processedUrl = `${CDN_URL}/${processedFileName}`

    // Always create a NEW image record for each generation
    // This allows users to generate multiple versions of the same photo with different scenes
    let imageRecord = await db.createImage({
      userId: userId,
      originalUrl: imageUrl,
      filterType: scene.name, // Use scene name instead of ID
    })

    if (imageRecord) {
      // Now update it with the processed data
      const updatedRecord = await db.updateImage(imageRecord.id, {
        processedUrl: processedUrl,
        processingStatus: 'completed',
        processedAt: new Date()
      })
      imageRecord = updatedRecord
    }

    if (!imageRecord) {
      console.error('Failed to save image record')
      return NextResponse.json({ error: 'Failed to save image record' }, { status: 500 })
    }

    // Deduct credits and record transaction (skip if in trial mode)
    let newCreditBalance = userData.credits

    if (!userData.trial_mode) {
      // Normal users: deduct 1 credit
      newCreditBalance = userData.credits - 1

      // Update user credits using Neon
      const creditUpdateSuccess = await db.updateUserCredits(userId, newCreditBalance)

      if (!creditUpdateSuccess) {
        console.error('Failed to deduct credits')
        return NextResponse.json({ error: 'Failed to deduct credits' }, { status: 500 })
      }

      // Record transaction using Neon
      const transaction = await db.createCreditTransaction(
        userId,
        -1,
        'usage',
        `Applied ${scene.name} filter`
      )

      if (!transaction) {
        console.error('Failed to record transaction')
      }

      console.log('Credits deducted. New balance:', newCreditBalance)
    } else {
      console.log('Trial mode: No credits deducted')
    }

    console.log('Image processed successfully:', processedUrl)

    return NextResponse.json({
      success: true,
      processedUrl: processedUrl,
      creditsRemaining: newCreditBalance,
      message: 'Image processed successfully'
    })

  } catch (error) {
    console.error('Process error:', error)
    return NextResponse.json(
      { error: 'Failed to process image' }, 
      { status: 500 }
    )
  }
}