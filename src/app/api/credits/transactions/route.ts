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

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')

    // Fetch user's transaction history
    const transactions = await db.getCreditTransactions(user.id, limit)

    if (!transactions) {
      console.error('Failed to fetch transactions')
      return NextResponse.json({ error: 'Failed to fetch transaction history' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      transactions: transactions || []
    })

  } catch (error) {
    console.error('Transactions error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch transaction history' }, 
      { status: 500 }
    )
  }
}