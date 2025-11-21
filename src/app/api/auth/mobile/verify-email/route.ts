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

    // Call Better Auth's verify email method
    const verificationResult = await auth.api.verifyEmail({
      query: { token },
      headers: request.headers,
    });

    if (!verificationResult) {
      console.log('❌ Verification failed - no result');
      return NextResponse.json(
        { error: 'Email verification failed' },
        { status: 400 }
      );
    }

    console.log('✅ Email verified successfully');

    // Since autoSignInAfterVerification is enabled, the user should now have a session
    // Get the current session
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      console.log('⚠️ Email verified but no session created');
      return NextResponse.json(
        {
          success: true,
          message: 'Email verified successfully. Please sign in.',
          requiresSignIn: true
        },
        { status: 200 }
      );
    }

    console.log('✅ Session created for user:', session.user.email);

    // Return the session data in JSON format
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

    // Create response with session cookie
    const response = NextResponse.json(responseData);

    // Set the session cookie (same as Better Auth does)
    const cookieName = 'better-auth.session_token';
    const cookieValue = session.session.token;
    const expiresAt = new Date(session.session.expiresAt);

    response.cookies.set({
      name: cookieName,
      value: cookieValue,
      expires: expiresAt,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    console.log('✅ Returning session data with cookie');

    return response;

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
