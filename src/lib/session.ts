import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { sql } from '@/lib/db';

/**
 * Validates user session from request headers
 * Supports both BetterAuth sessions and manually-created mobile sessions
 *
 * @param request - NextRequest object
 * @returns userId if valid session found, null otherwise
 */
export async function validateSession(request: NextRequest): Promise<string | null> {
  try {
    // Try to get user from Better-Auth session first
    const session = await auth.api.getSession({ headers: request.headers });

    if (session && session.user) {
      console.log('✅ BetterAuth session found:', session.user.id);
      return session.user.id;
    }

    console.log('⚠️ No BetterAuth session, checking cookie fallback...');

    // Fallback: Check for manually-created session (mobile Google auth)
    const cookieHeader = request.headers.get('cookie');

    if (!cookieHeader) {
      console.log('❌ No cookie header found');
      return null;
    }

    const sessionTokenMatch = cookieHeader.match(/better-auth\.session_token=([^;]+)/);

    if (!sessionTokenMatch) {
      console.log('❌ Could not extract session token from cookie');
      return null;
    }

    const sessionToken = sessionTokenMatch[1];
    console.log('🔑 Extracted session token for validation');

    // Validate session token in database
    const [dbSession] = await sql`
      SELECT user_id, expires_at
      FROM sessions
      WHERE token = ${sessionToken}
      AND expires_at > NOW()
    `;

    if (dbSession) {
      console.log('✅ Valid session found in DB for user:', dbSession.user_id);
      return dbSession.user_id;
    }

    console.log('❌ No valid session found in DB for token');
    return null;
  } catch (error) {
    console.error('❌ Session validation error:', error);
    return null;
  }
}
