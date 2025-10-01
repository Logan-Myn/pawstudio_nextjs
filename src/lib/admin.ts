import { db } from './db';
import { NextRequest } from 'next/server';
import { auth } from './auth';

export interface AdminUser {
  id: string
  email: string
  role: 'admin' | 'super_admin'
}

/**
 * Verify admin access for API routes
 * Returns the admin user if authorized, throws error if not
 */
export async function verifyAdminAccess(request: NextRequest): Promise<AdminUser> {
  const authHeader = request.headers.get('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Missing or invalid authorization header');
  }

  const token = authHeader.substring(7);

  // Verify the token with Better-Auth
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session || !session.user) {
    throw new Error('Invalid or expired token');
  }

  // Get user details from database
  const user = await db.getUserById(session.user.id);

  if (!user) {
    throw new Error('User not found');
  }

  if (!['admin', 'super_admin'].includes(user.role)) {
    throw new Error('Insufficient permissions');
  }

  return {
    id: user.id,
    email: user.email,
    role: user.role as 'admin' | 'super_admin'
  };
}

/**
 * Wrapper for admin API routes
 * Handles authentication and error responses
 */
export function withAdminAuth(handler: (req: NextRequest, admin: AdminUser) => Promise<Response>) {
  return async (request: NextRequest) => {
    try {
      const admin = await verifyAdminAccess(request);
      return await handler(request, admin);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Authentication failed';
      return new Response(JSON.stringify({ error: message }), {
        status: message.includes('permissions') ? 403 : 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  };
}
