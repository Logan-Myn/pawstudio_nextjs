import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';

// Apple's JWKS client for verifying tokens
const client = jwksClient({
  jwksUri: 'https://appleid.apple.com/auth/keys',
  cache: true,
  cacheMaxAge: 86400000, // 24 hours
});

function getKey(header: any, callback: any) {
  client.getSigningKey(header.kid, (err, key) => {
    if (err) {
      callback(err);
      return;
    }
    const signingKey = key?.getPublicKey();
    callback(null, signingKey);
  });
}

export async function POST(request: NextRequest) {
  try {
    console.log('🍎 Mobile Apple auth - Starting...');
    const { idToken, nonce } = await request.json();

    if (!idToken) {
      console.log('❌ No idToken provided');
      return NextResponse.json(
        { error: 'ID token is required' },
        { status: 400 }
      );
    }

    console.log('🍎 Got idToken, verifying...');

    // Verify the Apple ID token
    // For mobile apps, Apple uses the app bundle ID as audience
    // For web, it uses the Services ID (CLIENT_ID)
    const validAudiences = [
      'com.pawstudio.mobile', // App bundle ID for mobile
      process.env.APPLE_CLIENT_ID, // Services ID for web
    ];

    let decodedToken: any;
    try {
      decodedToken = await new Promise((resolve, reject) => {
        jwt.verify(
          idToken,
          getKey,
          {
            algorithms: ['RS256'],
            audience: validAudiences,
            issuer: 'https://appleid.apple.com',
          },
          (err, decoded) => {
            if (err) {
              reject(err);
            } else {
              resolve(decoded);
            }
          }
        );
      });
      console.log('✅ Apple token verified successfully');
      console.log('📧 Token audience:', decodedToken.aud);
    } catch (error) {
      console.error('❌ Apple token verification failed:', error);
      return NextResponse.json(
        { error: 'Invalid Apple token' },
        { status: 401 }
      );
    }

    if (!decodedToken || !decodedToken.email) {
      console.log('❌ Invalid token payload');
      return NextResponse.json(
        { error: 'Invalid token payload' },
        { status: 401 }
      );
    }

    const { sub: appleId, email } = decodedToken;
    console.log('📧 Email from token:', email);

    // Check if user exists by email
    console.log('🔍 Checking if user exists...');
    let [user] = await sql`
      SELECT id, email, name, credits, trial_mode, role, email_verified, created_at, updated_at
      FROM users
      WHERE email = ${email}
    `;

    // If user doesn't exist, create new user
    if (!user) {
      console.log('👤 Creating new user...');
      const userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const defaultName = email.split('@')[0];
      [user] = await sql`
        INSERT INTO users (id, email, name, email_verified, credits, trial_mode, role)
        VALUES (${userId}, ${email}, ${defaultName}, true, 0, true, 'user')
        RETURNING id, email, name, credits, trial_mode, role, email_verified, created_at, updated_at
      `;
      console.log('✅ User created:', user.id);
    } else {
      console.log('✅ User found:', user.id);
      // Update email_verified if needed
      if (!user.email_verified) {
        console.log('📧 Updating email_verified...');
        [user] = await sql`
          UPDATE users
          SET email_verified = true, updated_at = NOW()
          WHERE id = ${user.id}
          RETURNING id, email, name, credits, trial_mode, role, email_verified, created_at, updated_at
        `;
      }
    }

    // Check if account link exists
    console.log('🔗 Checking account link...');
    const [existingAccount] = await sql`
      SELECT * FROM accounts
      WHERE user_id = ${user.id} AND provider_id = 'apple'
    `;

    // Create or update account link
    if (!existingAccount) {
      console.log('🔗 Creating account link...');
      await sql`
        INSERT INTO accounts (
          id, user_id, account_id, provider_id,
          id_token, created_at, updated_at
        )
        VALUES (
          ${`acc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`},
          ${user.id},
          ${appleId},
          'apple',
          ${idToken},
          NOW(),
          NOW()
        )
      `;
      console.log('✅ Account link created');
    } else {
      console.log('🔗 Updating account link...');
      await sql`
        UPDATE accounts
        SET id_token = ${idToken}, updated_at = NOW()
        WHERE id = ${existingAccount.id}
      `;
      console.log('✅ Account link updated');
    }

    // Create session manually in database
    console.log('🔐 Creating session...');

    // Generate session token
    const sessionToken = `${user.id}_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Get client IP and user agent
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Insert session into database
    const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;

    const [session] = await sql`
      INSERT INTO sessions (
        id, token, user_id, expires_at, ip_address, user_agent, created_at, updated_at
      )
      VALUES (
        ${sessionId},
        ${sessionToken},
        ${user.id},
        ${expiresAt.toISOString()},
        ${ipAddress},
        ${userAgent},
        NOW(),
        NOW()
      )
      RETURNING id, token, user_id, expires_at, created_at
    `;

    if (!session) {
      console.log('❌ Failed to create session');
      return NextResponse.json(
        { error: 'Failed to create session' },
        { status: 500 }
      );
    }

    console.log('✅ Session created successfully');

    // Prepare response data
    const responseData = {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        credits: user.credits,
        trialMode: user.trial_mode,
        role: user.role,
        emailVerified: user.email_verified,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
      },
      session: {
        token: session.token,
        expiresAt: session.expires_at,
      },
    };

    // Create response with session cookie
    const response = NextResponse.json(responseData);

    // Set session cookie - BetterAuth uses "better-auth.session_token" as cookie name
    const cookieName = 'better-auth.session_token';
    const cookieValue = session.token;

    response.cookies.set({
      name: cookieName,
      value: cookieValue,
      expires: expiresAt,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    return response;

  } catch (error) {
    console.error('❌ Mobile Apple auth error:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      {
        error: 'Authentication failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
