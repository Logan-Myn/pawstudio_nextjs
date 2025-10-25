# Featurebase Integration Setup

This document describes how to complete the Featurebase integration setup for PawStudio.

## Overview

Featurebase is integrated into the mobile app to allow users to submit feedback and feature requests. Users can access the feedback board from the Account screen.

## Prerequisites

1. A Featurebase account at [https://www.featurebase.app](https://www.featurebase.app)
2. Your Featurebase organization name: `pawstudio`
3. Your Featurebase URL: [https://pawstudio.featurebase.app](https://pawstudio.featurebase.app)

## Setup Steps

### 1. Get Your JWT Secret from Featurebase

1. Log in to your Featurebase dashboard
2. Go to **Settings** → **SSO** (Single Sign-On)
3. Click on **Get JWT Secret**
4. Copy the secret key

### 2. Add Environment Variable

Add the JWT secret to your environment variables:

**For local development:**
- Open or create `.env.local` in the frontend directory
- Add the following line:
  ```
  FEATUREBASE_JWT_SECRET=your_actual_jwt_secret_here
  ```

**For production (Vercel):**
- Go to your Vercel project settings
- Navigate to **Settings** → **Environment Variables**
- Add a new variable:
  - **Key**: `FEATUREBASE_JWT_SECRET`
  - **Value**: Your JWT secret from Featurebase
  - **Environment**: Production (and Preview if needed)
- Redeploy your application

### 3. Test the Integration

1. Launch the mobile app
2. Navigate to the **Account** tab
3. Tap on **Feedback & Suggestions**
4. Verify that the Featurebase feedback board loads correctly
5. Test submitting feedback

## How It Works

### Authentication Flow

1. User taps "Feedback & Suggestions" button in the Account screen
2. Mobile app sends a request to `/api/feedback/jwt`
3. Backend API:
   - Authenticates the user via Better Auth session
   - Retrieves user data (email, userId, name, credits)
   - Generates a JWT token signed with `FEATUREBASE_JWT_SECRET`
   - Returns the token to the mobile app
4. Mobile app opens a WebView with the URL: `https://pawstudio.featurebase.app/?jwt={token}`
5. Featurebase automatically logs in the user using the JWT token
6. User can view and submit feedback

### User Data Sync

The following user data is synced to Featurebase:
- **Email**: User's email address
- **User ID**: Unique user identifier
- **Name**: User's display name
- **Custom Fields**:
  - `credits`: User's current credit balance
  - `role`: User's role (e.g., "user", "admin")

### Security

- JWT tokens are generated server-side only
- Tokens expire after 1 hour
- The JWT secret is never exposed to the mobile app
- Each token is unique per user session

## Files Modified

### Mobile App
- `components/FeedbackModal.tsx` - Modal component with WebView
- `app/(tabs)/account.tsx` - Added "Feedback & Suggestions" button
- `package.json` - Added `react-native-webview` dependency

### Backend API
- `src/app/api/feedback/jwt/route.ts` - JWT token generation endpoint
- `package.json` - Added `jsonwebtoken` dependency
- `.env.local.example` - Added `FEATUREBASE_JWT_SECRET` documentation

## Troubleshooting

### "Feedback service not configured" error
- Ensure `FEATUREBASE_JWT_SECRET` is set in your environment variables
- Restart your development server after adding the environment variable

### WebView fails to load
- Check your internet connection
- Verify the Featurebase organization name is correct (`pawstudio`)
- Check the browser console for CORS or network errors

### User not authenticated in Featurebase
- Verify the JWT secret matches your Featurebase settings
- Check that the user's email and userId are being sent correctly
- Review server logs for JWT generation errors

## API Reference

### GET /api/feedback/jwt

Generates a JWT token for authenticating users with Featurebase.

**Authentication**: Required (Better Auth session)

**Response**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 3600
}
```

**Error Responses**:
- `401 Unauthorized`: User is not authenticated
- `404 Not Found`: User not found in database
- `500 Internal Server Error`: JWT secret not configured or token generation failed

## Additional Resources

- [Featurebase Documentation](https://help.featurebase.app/)
- [Featurebase JWT Authentication](https://help.featurebase.app/articles/5257986-creating-and-signing-a-jwt-for-single-sign-on)
- [Embed Featurebase into Mobile Apps](https://help.featurebase.app/articles/1131771-embed-featurebase-into-your-mobile-app)
