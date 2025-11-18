/**
 * FLUX.1 Kontext Pro AI Service
 * Handles image generation and editing using Black Forest Labs FLUX.1 Kontext Pro
 */

import { processImageWithFluxNative } from './flux-native'

/**
 * Process image with FLUX.1 Kontext Pro
 * Uses native fetch implementation for better reliability
 * @param imageBuffer - Buffer containing the input image
 * @param prompt - Text prompt describing desired transformation
 * @param mimeType - MIME type of the image (default: image/jpeg)
 * @returns Object with success status and image data (base64) or error
 */
export async function processImageWithFlux(
  imageBuffer: Buffer,
  prompt: string,
  mimeType: string = 'image/jpeg'
): Promise<{ success: boolean; imageData?: string; error?: string }> {
  // Use native implementation (more reliable than bfl-api package)
  return processImageWithFluxNative(imageBuffer, prompt, mimeType)
}

/**
 * Test FLUX.1 API connection
 * @returns Boolean indicating if API is accessible
 */
export async function testFluxConnection(): Promise<boolean> {
  try {
    // Create a simple 1x1 pixel test image
    const testImage = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    )

    const result = await processImageWithFlux(testImage, 'test', 'image/png')
    return result.success
  } catch (error) {
    console.error('[FLUX] Connection test failed:', error)
    return false
  }
}
