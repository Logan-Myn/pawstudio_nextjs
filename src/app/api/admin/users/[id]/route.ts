import { NextRequest } from 'next/server'
import { verifyAdminAccess } from '@/lib/admin'
import { db } from '@/lib/db'

interface RouteContext {
  params: Promise<{ id: string }>
}

// PATCH /api/admin/users/[id] - Update user
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    await verifyAdminAccess(request)

    const { id: userId } = await context.params
    const body = await request.json()

    const { name, email, credits, role } = body

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'User ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const validRoles = ['user', 'admin', 'super_admin']
    if (role && !validRoles.includes(role)) {
      return new Response(
        JSON.stringify({ error: 'Invalid role specified' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    if (credits !== undefined && (typeof credits !== 'number' || credits < 0)) {
      return new Response(
        JSON.stringify({ error: 'Credits must be a non-negative number' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const user = await db.updateUser(userId, {
      name,
      email,
      credits,
      role,
    })

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ success: true, user }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    console.error('Update user error:', error)
    const status = error.message?.includes('permissions') ? 403 :
                  error.message?.includes('token') ? 401 : 500
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to update user' }),
      { status, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

// DELETE /api/admin/users/[id] - Delete user
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const admin = await verifyAdminAccess(request)

    const { id: userId } = await context.params

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'User ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    if (userId === admin.id) {
      return new Response(
        JSON.stringify({ error: 'Cannot delete your own account' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const user = await db.deleteUser(userId)

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ success: true, message: 'User deleted successfully' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    console.error('Delete user error:', error)
    const status = error.message?.includes('permissions') ? 403 :
                  error.message?.includes('token') ? 401 : 500
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to delete user' }),
      { status, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
