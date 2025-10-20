import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAccess } from '@/lib/admin'
import crypto from 'crypto'
import { promises as fs } from 'fs'
import path from 'path'

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

// Store archives in a JSON file
const ARCHIVE_FILE = path.join(process.cwd(), 'data', 'preview-archives.json')

interface ArchiveEntry {
  id: string
  name: string
  category?: string
  prompt: string
  previewImageUrl: string
  testImageUrl?: string
  createdAt: string
}

async function ensureDataDirectory() {
  const dataDir = path.join(process.cwd(), 'data')
  try {
    await fs.mkdir(dataDir, { recursive: true })
  } catch (error) {
    // Directory might already exist
  }
}

async function readArchives(): Promise<ArchiveEntry[]> {
  try {
    const data = await fs.readFile(ARCHIVE_FILE, 'utf-8')
    return JSON.parse(data)
  } catch (error) {
    return []
  }
}

async function writeArchives(archives: ArchiveEntry[]) {
  await ensureDataDirectory()
  await fs.writeFile(ARCHIVE_FILE, JSON.stringify(archives, null, 2))
}

// POST /api/admin/scenes/preview/archive - Save a preview result to archive
export async function POST(request: NextRequest) {
  try {
    await verifyAdminAccess(request)

    const body = await request.json()
    const { name, category, prompt, previewImage, testImageUrl } = body

    if (!name || !prompt || !previewImage) {
      return NextResponse.json(
        { error: 'name, prompt, and previewImage are required' },
        { status: 400 }
      )
    }

    console.log(`Archiving preview: ${name}`)

    // Convert base64 preview image to buffer
    const base64Data = previewImage.split(',')[1]
    const imageBuffer = Buffer.from(base64Data, 'base64')

    // Upload to B2 in admin/preview folder
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2)
    const fileName = `admin/preview/${timestamp}-${name.replace(/\s+/g, '-').toLowerCase()}-${randomString}.jpg`

    const authData = await getB2Authorization()
    const uploadData = await getUploadUrl(authData)
    await uploadToB2(uploadData, imageBuffer, fileName, 'image/jpeg')

    const previewImageUrl = `${CDN_URL}/${fileName}`

    // Create archive entry
    const archiveEntry: ArchiveEntry = {
      id: `${timestamp}-${randomString}`,
      name,
      category: category || undefined,
      prompt,
      previewImageUrl,
      testImageUrl: testImageUrl || undefined,
      createdAt: new Date().toISOString()
    }

    // Read existing archives and add new one
    const archives = await readArchives()
    archives.unshift(archiveEntry) // Add to beginning
    await writeArchives(archives)

    console.log(`Preview archived successfully: ${name}`)

    return NextResponse.json({
      success: true,
      archive: archiveEntry
    })
  } catch (error: any) {
    console.error('Archive API error:', error)
    const status = error.message?.includes('permissions') ? 403 :
                  error.message?.includes('token') ? 401 : 500
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status }
    )
  }
}

// GET /api/admin/scenes/preview/archive - Get all archived previews
export async function GET(request: NextRequest) {
  try {
    await verifyAdminAccess(request)

    const archives = await readArchives()

    return NextResponse.json({
      success: true,
      archives
    })
  } catch (error: any) {
    console.error('Archive API error:', error)
    const status = error.message?.includes('permissions') ? 403 :
                  error.message?.includes('token') ? 401 : 500
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status }
    )
  }
}

// DELETE /api/admin/scenes/preview/archive - Delete an archived preview
export async function DELETE(request: NextRequest) {
  try {
    await verifyAdminAccess(request)

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Archive ID is required' },
        { status: 400 }
      )
    }

    const archives = await readArchives()
    const filteredArchives = archives.filter(a => a.id !== id)

    if (filteredArchives.length === archives.length) {
      return NextResponse.json(
        { error: 'Archive not found' },
        { status: 404 }
      )
    }

    await writeArchives(filteredArchives)

    return NextResponse.json({
      success: true,
      message: 'Archive deleted successfully'
    })
  } catch (error: any) {
    console.error('Archive delete error:', error)
    const status = error.message?.includes('permissions') ? 403 :
                  error.message?.includes('token') ? 401 : 500
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status }
    )
  }
}
