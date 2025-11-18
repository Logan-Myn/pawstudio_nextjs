import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAccess } from '@/lib/admin'
import { processImageWithFlux } from '@/lib/flux'

interface PromptTest {
  name: string
  category?: string
  prompt: string
}

// Process image with FLUX.1 Kontext Pro (uses the imported function)
async function processImageWithPrompt(imageBuffer: Buffer, prompt: string, mimeType: string = 'image/jpeg') {
  return processImageWithFlux(imageBuffer, prompt, mimeType)
}

// POST /api/admin/scenes/preview - Test multiple prompts with a single image
export async function POST(request: NextRequest) {
  try {
    await verifyAdminAccess(request)

    const body = await request.json()
    const { testImage, prompts } = body

    // Validation
    if (!testImage || !prompts || !Array.isArray(prompts) || prompts.length === 0) {
      return NextResponse.json(
        { error: 'testImage and prompts array are required' },
        { status: 400 }
      )
    }

    console.log(`Testing ${prompts.length} prompts with test image`)

    // Parse test image (could be base64 or URL)
    let imageBuffer: Buffer
    let mimeType = 'image/jpeg'

    if (testImage.startsWith('data:')) {
      // Base64 data URL
      const matches = testImage.match(/^data:([^;]+);base64,(.+)$/)
      if (!matches) {
        return NextResponse.json({ error: 'Invalid base64 image format' }, { status: 400 })
      }
      mimeType = matches[1]
      imageBuffer = Buffer.from(matches[2], 'base64')
    } else if (testImage.startsWith('http://') || testImage.startsWith('https://')) {
      // URL - download the image
      const response = await fetch(testImage)
      if (!response.ok) {
        return NextResponse.json({ error: 'Failed to download test image' }, { status: 400 })
      }
      const arrayBuffer = await response.arrayBuffer()
      imageBuffer = Buffer.from(arrayBuffer)
      mimeType = response.headers.get('content-type') || 'image/jpeg'
    } else {
      return NextResponse.json(
        { error: 'testImage must be a base64 data URL or HTTP(S) URL' },
        { status: 400 }
      )
    }

    // Process each prompt with the test image
    const results = []

    for (const promptTest of prompts as PromptTest[]) {
      console.log(`Processing prompt: ${promptTest.name}`)

      try {
        const aiResult = await processImageWithPrompt(imageBuffer, promptTest.prompt, mimeType)

        if (aiResult.success) {
          results.push({
            name: promptTest.name,
            category: promptTest.category || 'uncategorized',
            prompt: promptTest.prompt,
            success: true,
            previewImage: `data:image/jpeg;base64,${aiResult.imageData}`,
          })
        } else {
          results.push({
            name: promptTest.name,
            category: promptTest.category || 'uncategorized',
            prompt: promptTest.prompt,
            success: false,
            error: aiResult.error || 'Processing failed',
          })
        }
      } catch (error) {
        console.error(`Error processing prompt "${promptTest.name}":`, error)
        results.push({
          name: promptTest.name,
          category: promptTest.category || 'uncategorized',
          prompt: promptTest.prompt,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    console.log(`Completed testing ${results.length} prompts`)

    return NextResponse.json({
      success: true,
      results,
      totalProcessed: results.length,
      successCount: results.filter(r => r.success).length,
      errorCount: results.filter(r => !r.success).length,
    })
  } catch (error: any) {
    console.error('Preview API error:', error)
    const status = error.message?.includes('permissions') ? 403 :
                  error.message?.includes('token') ? 401 : 500
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status }
    )
  }
}
