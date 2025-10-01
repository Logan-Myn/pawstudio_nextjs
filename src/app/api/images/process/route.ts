import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { GoogleGenerativeAI } from '@google/generative-ai'
import crypto from 'crypto'

// Backblaze B2 configuration
const B2_KEY_ID = process.env.B2_APPLICATION_KEY_ID
const B2_APPLICATION_KEY = process.env.B2_APPLICATION_KEY
const B2_BUCKET_NAME = process.env.B2_BUCKET_NAME
const B2_BUCKET_ID = process.env.B2_BUCKET_ID

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

function getPromptForFilter(filterType: string): string {
  const prompts: Record<string, string> = {
    'studio_portrait': 'Black and white professional studio portrait of a dog, high-end photography style. Neutral background, soft studio lighting with smooth shadows, sharp focus on the dog, elegant composition. The image should capture the dog sitting proudly, with a refined and artistic black and white finish, like a professional pet photoshoot.',
    'painted_portrait': 'Convert this pet photo into a classic oil painting portrait with visible brushstrokes, rich textures, warm color palette, and artistic composition. Apply traditional portrait painting techniques while preserving the pet\'s distinctive markings and expression.',
    'pop_art': 'Transform this pet photo into a vibrant pop art style image with bold, saturated colors, high contrast, graphic elements, and a contemporary artistic feel. Use bright, eye-catching colors and clean lines while maintaining the pet\'s recognizable features.',
    'seasonal_winter': 'Place this pet in a magical winter wonderland setting with soft falling snow, frosted elements, cool blue and white tones, and cozy winter atmosphere. Keep the pet as the focal point while adding enchanting winter elements around them.',
  }

  return prompts[filterType] || prompts['studio_portrait'] || 'Transform this pet photo professionally'
}

async function processImageWithAI(imageBuffer: Buffer, filterType: string, mimeType: string = 'image/jpeg') {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-image-preview' })
    
    const prompt = getPromptForFilter(filterType)
    
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
    // Get user from Better-Auth session
    const session = await auth.api.getSession({ headers: request.headers })
    console.log('Session present:', !!session)

    if (!session || !session.user) {
      console.log('No session or user, returning 401')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = session.user
    console.log('User authenticated:', user.id)

    // Parse request body
    const { imageUrl, filterId } = await request.json()

    if (!imageUrl || !filterId) {
      console.log('Missing required params')
      return NextResponse.json({ error: 'imageUrl and filterId are required' }, { status: 400 })
    }

    console.log('Processing image:', { imageUrl, filterId, userId: user.id })

    // Check if user has enough credits
    console.log('Checking user credits...')
    const userData = await db.getUserById(user.id)

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

    // Process image with AI
    const aiResult = await processImageWithAI(buffer, filterId, contentType)
    
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
    const processedFileName = `${user.id}/processed/${timestamp}-${randomString}.jpg`

    const authData = await getB2Authorization()
    const uploadData = await getUploadUrl(authData)
    // Upload processed image to B2
    await uploadToB2(uploadData, processedImageBuffer, processedFileName, 'image/jpeg')

    // Construct the public URL for processed image
    const processedUrl = `${authData.downloadUrl}/file/${B2_BUCKET_NAME}/${processedFileName}`

    // Update image record in database using Neon
    const updateSuccess = await db.updateImageByOriginalUrl(user.id, imageUrl, {
      processedUrl: processedUrl,
      filterType: filterId,
      processingStatus: 'completed',
      processedAt: new Date()
    })

    if (!updateSuccess) {
      console.error('Database update error')
      return NextResponse.json({ error: 'Failed to update image record' }, { status: 500 })
    }

    // Deduct credits and record transaction
    const newCreditBalance = userData.credits - 1

    // Update user credits using Neon
    const creditUpdateSuccess = await db.updateUserCredits(user.id, newCreditBalance)

    if (!creditUpdateSuccess) {
      console.error('Failed to deduct credits')
      return NextResponse.json({ error: 'Failed to deduct credits' }, { status: 500 })
    }

    // Record transaction using Neon
    const transaction = await db.createCreditTransaction(
      user.id,
      -1,
      'usage',
      `Applied ${filterId.replace('_', ' ')} filter`
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