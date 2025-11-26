/**
 * FLUX.2 Pro AI Service
 * Handles image generation and editing using Black Forest Labs FLUX.2 Pro
 *
 * FLUX.2 Pro offers:
 * - Better photorealism and image quality
 * - Lower cost ($0.03 vs $0.04 per megapixel)
 * - Support for up to 8 reference images
 * - Resolution up to 4MP (2048x2048)
 * - Improved typography and hex color support
 */

import { processImageWithFluxNative } from './flux-native'

/**
 * Process image with FLUX.2 Pro
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
 * Test FLUX.2 Pro API connection
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
    console.error('[FLUX.2 Pro] Connection test failed:', error)
    return false
  }
}
