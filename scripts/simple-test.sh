#!/bin/bash

# Simple FLUX.1 Kontext Pro API Test Script
# This tests the API with a minimal example

echo "🧪 Testing FLUX.1 Kontext Pro API..."
echo ""

# Create a simple test image (1x1 red pixel)
TEST_IMAGE="iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg=="

echo "📤 Submitting image generation request..."

# Submit the request (all on one line)
RESPONSE=$(curl -s -X POST "https://api.bfl.ai/v1/flux-kontext-pro" \
  -H "Content-Type: application/json" \
  -H "x-key: a39bfffa-405f-4122-937d-f7efc15ef449" \
  -d "{\"prompt\":\"make this image brighter\",\"input_image\":\"data:image/png;base64,${TEST_IMAGE}\"}")

echo "Response: $RESPONSE"
echo ""

# Extract task ID
TASK_ID=$(echo $RESPONSE | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
POLLING_URL=$(echo $RESPONSE | grep -o '"polling_url":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TASK_ID" ]; then
  echo "❌ Failed to submit task. Response:"
  echo "$RESPONSE"
  exit 1
fi

echo "✅ Task submitted: $TASK_ID"
echo "🔍 Polling URL: $POLLING_URL"
echo ""
echo "⏳ Waiting for result (this takes ~8-10 seconds)..."

# Poll for result
for i in {1..30}; do
  sleep 2

  STATUS_RESPONSE=$(curl -s -H "x-key: a39bfffa-405f-4122-937d-f7efc15ef449" "$POLLING_URL")
  STATUS=$(echo $STATUS_RESPONSE | grep -o '"status":"[^"]*"' | cut -d'"' -f4)

  echo "[$i] Status: $STATUS"

  if [ "$STATUS" = "Ready" ]; then
    echo ""
    echo "✅ Generation complete!"
    echo ""
    echo "Full response:"
    echo "$STATUS_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$STATUS_RESPONSE"

    # Extract image URL
    IMAGE_URL=$(echo $STATUS_RESPONSE | grep -o '"sample":"[^"]*"' | cut -d'"' -f4)

    if [ ! -z "$IMAGE_URL" ]; then
      echo ""
      echo "🖼️  Generated Image URL:"
      echo "$IMAGE_URL"
      echo ""
      echo "To download the image:"
      echo "curl -o generated-image.jpg '$IMAGE_URL'"
    fi

    exit 0
  elif [ "$STATUS" = "Error" ]; then
    echo ""
    echo "❌ Generation failed!"
    echo "$STATUS_RESPONSE"
    exit 1
  fi
done

echo ""
echo "⏰ Timeout waiting for result"
exit 1
