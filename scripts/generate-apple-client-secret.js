const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

/**
 * Generate Apple Client Secret JWT
 *
 * This script generates a client secret JWT for Apple Sign In.
 * Apple requires a JWT that expires within 6 months (180 days).
 *
 * Required information:
 * - Team ID: Found in Apple Developer account (top right)
 * - Services ID (Client ID): The identifier you created (e.g., com.pawstudio.mobile.signin)
 * - Key ID: The ID of the key you created
 * - .p8 Key File: The private key file you downloaded
 */

// Configuration - UPDATE THESE VALUES
const TEAM_ID = "2TV6L85LGD";              // e.g., 'A1B2C3D4E5'
const CLIENT_ID = "com.pawstudio.mobile.signin";         // e.g., 'com.pawstudio.mobile.signin'
const KEY_ID = "579JKNN48X";                 // e.g., 'ABC123XYZ'
const KEY_FILE_PATH = "./AuthKey_579JKNN48X.p8";  // Path to your .p8 file

// Read the private key
let privateKey;
try {
  privateKey = fs.readFileSync(path.resolve(__dirname, KEY_FILE_PATH), 'utf8');
} catch (error) {
  console.error('❌ Error reading .p8 key file:', error.message);
  console.log('\n📝 Instructions:');
  console.log('1. Place your .p8 key file in the same directory as this script');
  console.log('2. Update KEY_FILE_PATH to match your .p8 filename');
  process.exit(1);
}

// Generate JWT
const now = Math.floor(Date.now() / 1000);
const expiresIn = 180 * 24 * 60 * 60; // 180 days (6 months - Apple's maximum)

const claims = {
  iss: TEAM_ID,        // Issuer: Your Team ID
  iat: now,            // Issued at: Current timestamp
  exp: now + expiresIn, // Expires: 180 days from now
  aud: 'https://appleid.apple.com', // Audience: Apple's auth server
  sub: CLIENT_ID,      // Subject: Your Services ID (Client ID)
};

const header = {
  alg: 'ES256',        // Algorithm: ECDSA with SHA-256
  kid: KEY_ID,         // Key ID: Your Key ID from Apple
};

try {
  const clientSecret = jwt.sign(claims, privateKey, {
    algorithm: 'ES256',
    header: header,
  });

  console.log('✅ Apple Client Secret Generated Successfully!\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📋 Your Apple Client Secret (JWT):');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log(clientSecret);
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📝 Configuration Details:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Team ID:       ${TEAM_ID}`);
  console.log(`Services ID:   ${CLIENT_ID}`);
  console.log(`Key ID:        ${KEY_ID}`);
  console.log(`Expires:       ${new Date((now + expiresIn) * 1000).toISOString()}`);
  console.log(`Days until:    ${Math.floor(expiresIn / (24 * 60 * 60))} days`);
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📝 Add these to your backend .env file:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`APPLE_CLIENT_ID=${CLIENT_ID}`);
  console.log(`APPLE_CLIENT_SECRET=${clientSecret}`);
  console.log('\n⚠️  IMPORTANT: This JWT expires in 180 days. Regenerate before expiration!\n');

} catch (error) {
  console.error('❌ Error generating JWT:', error.message);
  console.log('\n📝 Make sure:');
  console.log('1. TEAM_ID, CLIENT_ID, and KEY_ID are correctly set');
  console.log('2. The .p8 key file is valid and readable');
  console.log('3. The .p8 file contains the private key in proper format');
  process.exit(1);
}
