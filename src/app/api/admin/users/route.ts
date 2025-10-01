import { NextRequest } from 'next/server'
import { verifyAdminAccess } from '@/lib/admin'
import { db } from '@/lib/db'

// GET /api/admin/users - List all users
export async function GET(request: NextRequest) {
  try {
    await verifyAdminAccess(request)

    const users = await db.getAllUsers()

    if (!users) {
      console.error('Failed to fetch users')
      return new Response(
        JSON.stringify({ error: 'Failed to fetch users' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ success: true, users }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    console.error('Users API error:', error)
    const status = error.message?.includes('permissions') ? 403 : 
                  error.message?.includes('token') ? 401 : 500
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status, headers: { 'Content-Type': 'application/json' } }
    )
  }
}