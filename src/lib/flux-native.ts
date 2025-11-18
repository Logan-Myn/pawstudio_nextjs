/**
 * FLUX.1 Kontext Pro AI Service - Native Implementation
 * Direct API integration without external dependencies
 * Uses native fetch for better compatibility
 */

const API_BASE_URL = 'https://api.bfl.ai'

function getBflApiKey(): string {
  const key = process.env.BFL_API_KEY
  if (!key) {
    throw new Error('BFL_API_KEY environment variable is not set')
  }
  return key
}

interface FluxTask {
  id: string
  polling_url: string
}

interface FluxResult {
  id: string
  status: 'Pending' | 'Ready' | 'Error' | 'Content Moderated'
  result?: {
    sample: string
    prompt: string
    seed: number
  }
}

/**
 * Process image with FLUX.1 Kontext Pro using native fetch
 */
export async function processImageWithFluxNative(
  imageBuffer: Buffer,
  prompt: string,
  mimeType: string = 'image/jpeg'
): Promise<{ success: boolean; imageData?: string; error?: string }> {
  try {
    const BFL_API_KEY = getBflApiKey()

    // Convert buffer to base64 data URL
    const base64Image = imageBuffer.toString('base64')
    const dataUrl = `data:${mimeType};base64,${base64Image}`

    console.log('[FLUX Native] Starting image processing')
    console.log('[FLUX Native] Prompt:', prompt.substring(0, 100) + '...')

    // Submit generation request
    const submitResponse = await fetch(`${API_BASE_URL}/v1/flux-kontext-pro`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-key': BFL_API_KEY
      },
      body: JSON.stringify({
        prompt: prompt,
        input_image: dataUrl,
        safety_tolerance: 2
      })
    })

    if (!submitResponse.ok) {
      const errorText = await submitResponse.text()
      throw new Error(`API request failed: ${submitResponse.status} - ${errorText}`)
    }

    const task: FluxTask = await submitResponse.json()
    console.log('[FLUX Native] Task submitted:', task.id)
    console.log('[FLUX Native] Polling URL:', task.polling_url)

    // Poll for results
    const maxAttempts = 30
    const pollInterval = 2000 // 2 seconds

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      await new Promise(resolve => setTimeout(resolve, pollInterval))

      const pollResponse = await fetch(task.polling_url, {
        headers: {
          'x-key': BFL_API_KEY
        }
      })

      if (!pollResponse.ok) {
        throw new Error(`Polling failed: ${pollResponse.status}`)
      }

      const result: FluxResult = await pollResponse.json()
      console.log(`[FLUX Native] Attempt ${attempt}: ${result.status}`)

      if (result.status === 'Ready' && result.result?.sample) {
        console.log('[FLUX Native] Generation complete!')

        // Download the generated image
        const imageResponse = await fetch(result.result.sample)
        if (!imageResponse.ok) {
          throw new Error(`Failed to download generated image: ${imageResponse.status}`)
        }

        const imageArrayBuffer = await imageResponse.arrayBuffer()
        const imageBuffer = Buffer.from(imageArrayBuffer)
        const base64Result = imageBuffer.toString('base64')

        return {
          success: true,
          imageData: base64Result
        }
      } else if (result.status === 'Error') {
        throw new Error('Generation failed with error status')
      } else if (result.status === 'Content Moderated') {
        throw new Error('Content was moderated. Please revise your prompt.')
      }
    }

    throw new Error('Timeout: Generation did not complete in time')

  } catch (error) {
    console.error('[FLUX Native] Error:', error)

    if (error instanceof Error) {
      return {
        success: false,
        error: `FLUX processing error: ${error.message}`
      }
    }

    return {
      success: false,
      error: 'Unknown error occurred during image processing'
    }
  }
}
