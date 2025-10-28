import { NextRequest } from 'next/server'
import { verifyAdminAccess } from '@/lib/admin'
import { db, sql } from '@/lib/db'
import { auth } from '@/lib/auth'

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

// POST /api/admin/users - Create new user
export async function POST(request: NextRequest) {
  try {
    await verifyAdminAccess(request)

    const body = await request.json()
    const { email, password, name, credits, role } = body

    // Validation
    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: 'Email and password are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email format' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Password strength validation
    if (password.length < 6) {
      return new Response(
        JSON.stringify({ error: 'Password must be at least 6 characters long' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Role validation
    const validRoles = ['user', 'admin', 'super_admin']
    if (role && !validRoles.includes(role)) {
      return new Response(
        JSON.stringify({ error: 'Invalid role specified' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Credits validation
    if (credits !== undefined && (typeof credits !== 'number' || credits < 0)) {
      return new Response(
        JSON.stringify({ error: 'Credits must be a non-negative number' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Check if user already exists
    const existingUsers = await db.getAllUsers()
    const userExists = existingUsers.some((u: any) => u.email.toLowerCase() === email.toLowerCase())

    if (userExists) {
      return new Response(
        JSON.stringify({ error: 'A user with this email already exists' }),
        { status: 409, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Use Better Auth API to create user with email/password
    const signUpRequest = new Request('http://localhost:3000/api/auth/sign-up/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password,
        name: name || undefined,
      }),
    })

    const signUpResponse = await auth.handler(signUpRequest)
    const signUpData = await signUpResponse.json()

    if (!signUpResponse.ok || !signUpData.user) {
      console.error('Better Auth signup error:', signUpData)
      return new Response(
        JSON.stringify({ error: signUpData.error?.message || 'Failed to create user' }),
        { status: signUpResponse.status, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const userId = signUpData.user.id

    // Update credits and role if provided (Better Auth doesn't handle these by default)
    if (credits !== undefined || role) {
      await sql`
        UPDATE users
        SET
          credits = ${credits !== undefined ? credits : 3},
          role = ${role || 'user'},
          email_verified = true
        WHERE id = ${userId}
      `
    } else {
      // Mark email as verified for admin-created users
      await sql`
        UPDATE users
        SET email_verified = true
        WHERE id = ${userId}
      `
    }

    // Fetch the updated user
    const user = await db.getUserById(userId)

    return new Response(
      JSON.stringify({ success: true, user }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    console.error('Create user error:', error)

    // Check for duplicate email constraint violation
    if (error.message?.includes('unique') || error.message?.includes('duplicate')) {
      return new Response(
        JSON.stringify({ error: 'A user with this email already exists' }),
        { status: 409, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const status = error.message?.includes('permissions') ? 403 :
                  error.message?.includes('token') ? 401 : 500
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to create user' }),
      { status, headers: { 'Content-Type': 'application/json' } }
    )
  }
}