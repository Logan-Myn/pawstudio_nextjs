import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db, sql } from '@/lib/db'
import { GoogleGenerativeAI } from '@google/generative-ai'
import crypto from 'crypto'

// Backblaze B2 configuration
const B2_KEY_ID = process.env.B2_APPLICATION_KEY_ID
const B2_APPLICATION_KEY = process.env.B2_APPLICATION_KEY
const B2_BUCKET_NAME = process.env.B2_BUCKET_NAME
const B2_BUCKET_ID = process.env.B2_BUCKET_ID
const CDN_URL = process.env.CDN_URL || 'https://cdn.paw-studio.com'

// Initialize Google Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

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

async function processImageWithAI(imageBuffer: Buffer, prompt: string, mimeType: string = 'image/jpeg') {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-image-preview' })

    console.log('Using AI prompt:', prompt.substring(0, 100) + '...')
    
    const imagePart = {
      inlineData: {
        data: imageBuffer.toString('base64'),
        mimeType: mimeType,
      },
    }

    const result = await model.generateContent([prompt, imagePart])
    const response = await result.response
    
    console.log('Gemini API Response candidates:', response.candidates?.length)
    
    // Look for image data in the response parts
    let imageData: string | null = null
    
    if (response.candidates && response.candidates.length > 0) {
      const candidate = response.candidates[0]
      if (candidate && candidate.content && candidate.content.parts) {
        for (const part of candidate.content.parts) {
          console.log('Part type:', part)
          if (part && part.inlineData && part.inlineData.data) {
            // Found image data in inlineData
            imageData = part.inlineData.data
            console.log('Found image data, length:', imageData.length)
            break
          } else if (part && part.text) {
            console.log('Found text part:', part.text.substring(0, 100) + '...')
          }
        }
      }
    }
    
    if (!imageData) {
      throw new Error('No image data found in Gemini API response. Response may contain only text.')
    }

    return {
      success: true,
      imageData: imageData,
    }
  } catch (error) {
    console.error('Gemini 2.5 Flash Image API error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Image processing failed',
    }
  }
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

    console.log('User credits:', userData.credits)

    if (userData.credits < 1) {
      console.log('Insufficient credits')
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
    console.log('✅ Creating new image record for generation:', { userId, imageUrl: imageUrl.substring(0, 50), scene: scene.name })

    let imageRecord = await db.createImage({
      userId: userId,
      originalUrl: imageUrl,
      filterType: scene.name, // Use scene name instead of ID
    })

    console.log('📝 Created image record:', imageRecord ? `ID: ${imageRecord.id}, Status: ${imageRecord.processing_status}` : 'FAILED')

    if (imageRecord) {
      console.log('🔄 Updating image record with processed data...')
      // Now update it with the processed data
      const updatedRecord = await db.updateImage(imageRecord.id, {
        processedUrl: processedUrl,
        processingStatus: 'completed',
        processedAt: new Date()
      })
      console.log('✅ Updated image record:', updatedRecord ? `ID: ${updatedRecord.id}, Status: ${updatedRecord.processing_status}, ProcessedURL: ${updatedRecord.processed_url ? 'YES' : 'NO'}` : 'FAILED')
      imageRecord = updatedRecord
    }

    if (!imageRecord) {
      console.error('❌ Database update/create error - imageRecord is null')
      return NextResponse.json({ error: 'Failed to save image record' }, { status: 500 })
    }

    console.log('✅ Final image record:', {
      id: imageRecord.id,
      userId: imageRecord.user_id,
      status: imageRecord.processing_status,
      hasProcessedUrl: !!imageRecord.processed_url,
      filterType: imageRecord.filter_type
    })

    // Deduct credits and record transaction
    const newCreditBalance = userData.credits - 1

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