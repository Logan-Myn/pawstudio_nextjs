import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    // Get user from Better-Auth session
    const session = await auth.api.getSession({ headers: request.headers })

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = session.user

    // Get user's current credit balance
    const userData = await db.getUserById(user.id)

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      credits: userData.credits
    })

  } catch (error) {
    console.error('Balance error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch credit balance' }, 
      { status: 500 }
    )
  }
}