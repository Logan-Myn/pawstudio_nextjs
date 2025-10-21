import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db, sql } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    console.log('👤 /auth/profile GET - Starting...');

    // Try to get user from Better-Auth session first
    let userId: string | null = null;

    const session = await auth.api.getSession({ headers: request.headers });

    if (session && session.user) {
      console.log('✅ BetterAuth session found:', session.user.id);
      userId = session.user.id;
    } else {
      console.log('⚠️ No BetterAuth session, checking cookie fallback...');

      // Fallback: Check for manually-created session (mobile Google auth)
      const cookieHeader = request.headers.get('cookie');
      console.log('🍪 Cookie header:', cookieHeader ? 'exists' : 'missing');

      if (cookieHeader) {
        console.log('🔍 Cookie value:', cookieHeader.substring(0, 100) + '...');
        const sessionTokenMatch = cookieHeader.match(/better-auth\.session_token=([^;]+)/);

        if (sessionTokenMatch) {
          const sessionToken = sessionTokenMatch[1];
          console.log('🔑 Extracted session token:', sessionToken.substring(0, 30) + '...');

          // Validate session token in database
          const [dbSession] = await sql`
            SELECT user_id, expires_at
            FROM sessions
            WHERE token = ${sessionToken}
            AND expires_at > NOW()
          `;

          if (dbSession) {
            console.log('✅ Valid session found in DB for user:', dbSession.user_id);
            userId = dbSession.user_id;
          } else {
            console.log('❌ No valid session found in DB for token');
          }
        } else {
          console.log('❌ Could not extract session token from cookie');
        }
      }
    }

    if (!userId) {
      console.log('❌ No userId found, returning 401');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('✅ User authenticated:', userId);

    // Get user data from database
    const userData = await db.getUserById(userId);

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get user statistics
    const imageStats = await sql`
      SELECT processing_status
      FROM images
      WHERE user_id = ${userId}
    `;

    let totalProcessed = 0;
    let totalPending = 0;

    if (imageStats) {
      totalProcessed = imageStats.filter((img: any) => img.processing_status === 'completed').length;
      totalPending = imageStats.filter((img: any) =>
        img.processing_status === 'processing' || img.processing_status === 'pending'
      ).length;
    }

    const profile = {
      id: userData.id,
      email: userData.email,
      name: userData.name || '',
      credits: userData.credits,
      role: userData.role || 'user',
      created_at: userData.created_at,
      updated_at: userData.updated_at,
      statistics: {
        totalProcessed,
        totalPending,
        totalImages: totalProcessed + totalPending
      }
    };

    return NextResponse.json(profile);

  } catch (error) {
    console.error('Profile error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user profile' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Try to get user from Better-Auth session first
    let userId: string | null = null;

    const session = await auth.api.getSession({ headers: request.headers });

    if (session && session.user) {
      userId = session.user.id;
    } else {
      // Fallback: Check for manually-created session (mobile Google auth)
      const cookieHeader = request.headers.get('cookie');
      if (cookieHeader) {
        const sessionTokenMatch = cookieHeader.match(/better-auth\.session_token=([^;]+)/);
        if (sessionTokenMatch) {
          const sessionToken = sessionTokenMatch[1];

          // Validate session token in database
          const [dbSession] = await sql`
            SELECT user_id, expires_at
            FROM sessions
            WHERE token = ${sessionToken}
            AND expires_at > NOW()
          `;

          if (dbSession) {
            userId = dbSession.user_id;
          }
        }
      }
    }

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const updates = await request.json();

    // Only allow updating certain fields
    const allowedUpdates: any = {};

    if (updates.name !== undefined) {
      allowedUpdates.name = updates.name;
    }

    // Update user profile using db helper
    const updatedUser = await db.updateUserProfile(userId, allowedUpdates);

    if (!updatedUser) {
      return NextResponse.json(
        { error: 'Failed to update user profile' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser
    });

  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
