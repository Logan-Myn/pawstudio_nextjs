/**
 * FLUX.1 Kontext Pro API Test Script
 *
 * This script tests the FLUX.1 Kontext Pro integration before deploying.
 *
 * Usage:
 *   1. Ensure BFL_API_KEY is set in .env.local
 *   2. Place a test pet photo in the scripts folder named 'test-pet.jpg'
 *   3. Run: npx tsx scripts/test-flux.ts
 */

import dotenv from 'dotenv'
import { processImageWithFlux, testFluxConnection } from '../src/lib/flux'
import fs from 'fs'
import path from 'path'

// Load environment variables from .env.local
dotenv.config({ path: path.join(__dirname, '..', '.env.local') })

async function main() {
  console.log('🧪 FLUX.1 Kontext Pro API Test\n')
  console.log('=' .repeat(60))

  // Check if API key is configured
  if (!process.env.BFL_API_KEY) {
    console.error('❌ ERROR: BFL_API_KEY environment variable not set')
    console.log('\nPlease add BFL_API_KEY to your .env.local file:')
    console.log('BFL_API_KEY=your_api_key_here\n')
    process.exit(1)
  }

  console.log('✅ BFL_API_KEY found')
  console.log('API Key:', process.env.BFL_API_KEY.substring(0, 10) + '...\n')

  // Test 1: Connection test
  console.log('Test 1: Testing API connection...')
  const connectionOk = await testFluxConnection()

  if (!connectionOk) {
    console.error('❌ Connection test failed')
    console.log('\nPossible issues:')
    console.log('- Invalid API key')
    console.log('- Network connectivity issues')
    console.log('- API service unavailable\n')
    process.exit(1)
  }

  console.log('✅ Connection test passed\n')

  // Test 2: Process a real pet image if available
  const testImagePath = path.join(__dirname, 'test-pet.jpg')

  if (!fs.existsSync(testImagePath)) {
    console.log('⚠️  Test image not found at:', testImagePath)
    console.log('\nTo test with a real pet photo:')
    console.log('1. Place a pet photo at scripts/test-pet.jpg')
    console.log('2. Run this script again\n')
    console.log('✅ Basic tests passed! Ready to process real images.')
    return
  }

  console.log('Test 2: Processing test pet image...')
  console.log('Image path:', testImagePath)

  const imageBuffer = fs.readFileSync(testImagePath)
  console.log('Image size:', (imageBuffer.length / 1024).toFixed(2), 'KB\n')

  // Test with a simple transformation prompt
  const testPrompts = [
    {
      name: 'Professional Studio Portrait',
      prompt: 'Transform this pet photo into a professional studio portrait with a clean black background, professional lighting, and sharp focus on the pet.'
    },
    {
      name: 'Winter Wonderland',
      prompt: 'Place this pet in a magical winter wonderland scene with snow, pine trees, and soft winter lighting. Keep the pet natural and well-integrated.'
    }
  ]

  for (const test of testPrompts) {
    console.log(`\nTesting prompt: "${test.name}"`)
    console.log('Prompt:', test.prompt.substring(0, 80) + '...')
    console.log('Processing...')

    const startTime = Date.now()
    const result = await processImageWithFlux(imageBuffer, test.prompt, 'image/jpeg')
    const duration = ((Date.now() - startTime) / 1000).toFixed(2)

    if (result.success && result.imageData) {
      console.log(`✅ Success! (${duration}s)`)
      console.log('Generated image size:', (Buffer.from(result.imageData, 'base64').length / 1024).toFixed(2), 'KB')

      // Save the result
      const outputPath = path.join(__dirname, `output-${test.name.toLowerCase().replace(/\s+/g, '-')}.jpg`)
      fs.writeFileSync(outputPath, Buffer.from(result.imageData, 'base64'))
      console.log('Saved to:', outputPath)
    } else {
      console.log(`❌ Failed: ${result.error}`)
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log('✅ All tests completed!')
  console.log('\nNext steps:')
  console.log('1. Review the generated images in the scripts folder')
  console.log('2. If quality is good, proceed with deploying to production')
  console.log('3. Update .env.local with your BFL_API_KEY')
  console.log('4. Run: npm install')
  console.log('5. Test locally: npm run dev\n')
}

main().catch((error) => {
  console.error('\n❌ Test script failed:', error)
  process.exit(1)
})
