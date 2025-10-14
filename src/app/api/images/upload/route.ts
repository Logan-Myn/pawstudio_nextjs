import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
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

export async function POST(request: NextRequest) {
  try {
    // Get user from Better-Auth session
    const session = await auth.api.getSession({ headers: request.headers })

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = session.user

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('image') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No image file provided' }, { status: 400 })
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 })
    }

    // Validate file size (25MB limit)
    const maxSize = 25 * 1024 * 1024 // 25MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File size must be less than 25MB' }, { status: 400 })
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Generate unique filename
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2)
    const fileExtension = file.name.split('.').pop()
    const fileName = `users/${user.id}/uploads/${timestamp}-${randomString}.${fileExtension}`

    // Upload to Backblaze B2
    const authData = await getB2Authorization()
    const uploadData = await getUploadUrl(authData)
    // Upload to B2
    await uploadToB2(uploadData, buffer, fileName, file.type)

    // Construct the public URL using CDN
    const publicUrl = `${CDN_URL}/${fileName}`

    // Save to photos table for library
    const photoRecord = await db.createPhoto({
      userId: user.id,
      originalFilename: file.name,
      fileUrl: publicUrl,
      fileSize: file.size
    })

    if (!photoRecord) {
      console.error('Failed to create photo record')
      return NextResponse.json({ error: 'Failed to save photo record' }, { status: 500 })
    }

    // Save to images table for processing tracking
    const imageRecord = await db.createImage({
      userId: user.id,
      originalUrl: publicUrl,
      filterType: 'none',
      photoId: photoRecord.id
    })

    if (!imageRecord) {
      console.error('Failed to create image record')
      return NextResponse.json({ error: 'Failed to save image record' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      url: publicUrl,
      imageId: imageRecord.id,
      photoId: photoRecord.id,
      message: 'Image uploaded successfully'
    })

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Failed to upload image' }, 
      { status: 500 }
    )
  }
}