import { NextRequest, NextResponse } from 'next/server';
import { OAuth2Client } from 'google-auth-library';
import { sql } from '@/lib/db';
import { auth } from '@/lib/auth';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID_IOS);

export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json();

    if (!idToken) {
      return NextResponse.json(
        { error: 'ID token is required' },
        { status: 400 }
      );
    }

    // Verify the Google ID token
    let ticket;
    try {
      ticket = await client.verifyIdToken({
        idToken: idToken,
        audience: process.env.GOOGLE_CLIENT_ID_IOS,
      });
    } catch (error) {
      console.error('Token verification failed:', error);
      return NextResponse.json(
        { error: 'Invalid Google token' },
        { status: 401 }
      );
    }

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      return NextResponse.json(
        { error: 'Invalid token payload' },
        { status: 401 }
      );
    }

    const { sub: googleId, email, name, picture } = payload;

    // Check if user exists by email
    let [user] = await sql`
      SELECT id, email, name, credits, role, email_verified, created_at, updated_at
      FROM users
      WHERE email = ${email}
    `;

    // If user doesn't exist, create new user
    if (!user) {
      const userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      [user] = await sql`
        INSERT INTO users (id, email, name, email_verified, credits, role)
        VALUES (${userId}, ${email}, ${name || email.split('@')[0]}, true, 3, 'user')
        RETURNING id, email, name, credits, role, email_verified, created_at, updated_at
      `;
    } else {
      // Update email_verified if needed
      if (!user.email_verified) {
        [user] = await sql`
          UPDATE users
          SET email_verified = true, updated_at = NOW()
          WHERE id = ${user.id}
          RETURNING id, email, name, credits, role, email_verified, created_at, updated_at
        `;
      }
    }

    // Check if account link exists
    const [existingAccount] = await sql`
      SELECT * FROM accounts
      WHERE user_id = ${user.id} AND provider_id = 'google'
    `;

    // Create or update account link
    if (!existingAccount) {
      await sql`
        INSERT INTO accounts (
          id, user_id, account_id, provider_id,
          id_token, created_at, updated_at
        )
        VALUES (
          ${`acc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`},
          ${user.id},
          ${googleId},
          'google',
          ${idToken},
          NOW(),
          NOW()
        )
      `;
    } else {
      await sql`
        UPDATE accounts
        SET id_token = ${idToken}, updated_at = NOW()
        WHERE id = ${existingAccount.id}
      `;
    }

    // Create session using BetterAuth API
    const sessionResult = await auth.api.createSession({
      userId: user.id,
      headers: request.headers,
    });

    if (!sessionResult) {
      return NextResponse.json(
        { error: 'Failed to create session' },
        { status: 500 }
      );
    }

    // Prepare response data
    const responseData = {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        credits: user.credits,
        role: user.role,
        emailVerified: user.email_verified,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
        image: picture,
      },
      session: {
        token: sessionResult.session.token,
        expiresAt: sessionResult.session.expiresAt,
      },
    };

    // Create response with session cookie
    const response = NextResponse.json(responseData);

    // Set session cookie - BetterAuth uses "better-auth.session_token" as cookie name
    const cookieName = 'better-auth.session_token';
    const cookieValue = sessionResult.session.token;
    const expiresAt = new Date(sessionResult.session.expiresAt);

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
    console.error('Mobile Google auth error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}
