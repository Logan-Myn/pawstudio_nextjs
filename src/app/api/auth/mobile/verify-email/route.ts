import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

/**
 * Mobile-specific email verification endpoint
 * Returns JSON instead of HTML redirect for better mobile app integration
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Verification token is required' },
        { status: 400 }
      );
    }

    console.log('📱 Mobile email verification - Starting...');
    console.log('🔑 Token:', token);

    // Create a new Request object that Better Auth can use internally
    // This ensures the session creation is properly handled
    const verifyRequest = new Request(
      `${request.nextUrl.origin}/api/auth/verify-email?token=${token}`,
      {
        method: 'GET',
        headers: request.headers,
      }
    );

    // Call Better Auth's verify email method with the constructed request
    // This should trigger autoSignInAfterVerification
    const verificationResult = await auth.api.verifyEmail({
      query: { token },
      headers: request.headers,
    });

    console.log('📦 Verification result type:', typeof verificationResult);
    console.log('📦 Verification result:', verificationResult);

    // After verification, Better Auth should have created a session internally
    // Let's try to get that session now
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    console.log('📦 Session after verification:', session ? 'exists' : 'null');
    console.log('👤 Session user:', session?.user?.email);

    // If we got a session, that's perfect - return it
    if (session?.user && session?.session) {
      console.log('✅ Session found! User:', session.user.email);

      const responseData = {
        success: true,
        user: {
          id: session.user.id,
          email: session.user.email,
          name: session.user.name,
          credits: (session.user as any).credits || 3,
          role: (session.user as any).role || 'user',
          emailVerified: session.user.emailVerified,
          createdAt: session.user.createdAt,
          updatedAt: session.user.updatedAt,
        },
        session: {
          token: session.session.token,
          expiresAt: session.session.expiresAt,
        },
      };

      const response = NextResponse.json(responseData);

      // Set the session cookie
      response.cookies.set({
        name: 'better-auth.session_token',
        value: session.session.token,
        expires: new Date(session.session.expiresAt),
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
      });

      console.log('✅ Returning session data with cookie');
      return response;
    }

    // If no session was found, verification succeeded but autoSignIn didn't work
    // We need to manually create a session for the verified user
    console.log('⚠️ Email verified but no session created by Better Auth');
    console.log('🔍 Verification result details:', JSON.stringify(verificationResult, null, 2));

    // Extract user info from verification result
    let verifiedUser = (verificationResult as any).user;

    // If verifyEmail didn't return user data, we need to fetch it from the database
    // The token contains the email, so we can decode it to get the user
    if (!verifiedUser || !verifiedUser.id) {
      console.log('⚠️ No user in verification result, fetching from database...');

      // Decode the JWT token to get the email
      const tokenParts = token.split('.');
      if (tokenParts.length !== 3) {
        console.log('❌ Invalid token format');
        return NextResponse.json(
          {
            success: true,
            message: 'Email verified successfully. Please sign in.',
            requiresSignIn: true
          },
          { status: 200 }
        );
      }

      const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
      const email = payload.email;

      console.log('📧 Email from token:', email);

      // Fetch user from database
      const { Pool } = await import('pg');
      const pool = new Pool({
        connectionString: process.env.DATABASE_URL!,
        ssl: process.env.DATABASE_URL?.includes('neon.tech') ? { rejectUnauthorized: false } : false,
      });

      try {
        const result = await pool.query(
          'SELECT * FROM users WHERE email = $1',
          [email]
        );

        await pool.end();

        if (!result.rows || result.rows.length === 0) {
          console.log('❌ User not found in database');
          return NextResponse.json(
            {
              success: true,
              message: 'Email verified successfully. Please sign in.',
              requiresSignIn: true
            },
            { status: 200 }
          );
        }

        verifiedUser = result.rows[0];
        console.log('✅ User fetched from database:', verifiedUser.email);

      } catch (dbError) {
        console.error('❌ Failed to fetch user from database:', dbError);
        await pool.end();
        return NextResponse.json(
          {
            success: true,
            message: 'Email verified successfully. Please sign in.',
            requiresSignIn: true
          },
          { status: 200 }
        );
      }
    }

    // Manually create a session using Better Auth's session creation
    // We'll do this by directly calling the database
    const { Pool } = await import('pg');
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL!,
      ssl: process.env.DATABASE_URL?.includes('neon.tech') ? { rejectUnauthorized: false } : false,
    });

    try {
      // Generate a session token
      const crypto = await import('crypto');
      const sessionToken = crypto.randomBytes(32).toString('base64url');
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
      const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
      const userAgent = request.headers.get('user-agent') || 'unknown';

      console.log('🔐 Creating manual session for user:', verifiedUser.id);

      // Insert session into database
      await pool.query(
        `INSERT INTO sessions (id, user_id, expires_at, token, ip_address, user_agent, created_at, updated_at)
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, NOW(), NOW())`,
        [verifiedUser.id, expiresAt, sessionToken, ipAddress, userAgent]
      );

      console.log('✅ Manual session created successfully');

      const responseData = {
        success: true,
        user: {
          id: verifiedUser.id,
          email: verifiedUser.email,
          name: verifiedUser.name,
          credits: verifiedUser.credits || 3,
          role: verifiedUser.role || 'user',
          emailVerified: verifiedUser.emailVerified,
          createdAt: verifiedUser.createdAt,
          updatedAt: verifiedUser.updatedAt,
        },
        session: {
          token: sessionToken,
          expiresAt: expiresAt.toISOString(),
        },
      };

      const response = NextResponse.json(responseData);

      // Set the session cookie
      response.cookies.set({
        name: 'better-auth.session_token',
        value: sessionToken,
        expires: expiresAt,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
      });

      console.log('✅ Returning manual session data with cookie');

      await pool.end();
      return response;

    } catch (dbError) {
      console.error('❌ Failed to create manual session:', dbError);
      await pool.end();

      return NextResponse.json(
        {
          success: true,
          message: 'Email verified successfully. Please sign in.',
          requiresSignIn: true
        },
        { status: 200 }
      );
    }

  } catch (error) {
    console.error('❌ Mobile email verification error:', error);
    return NextResponse.json(
      {
        error: 'Email verification failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
