import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

const CREDIT_PACKAGES = {
  'pack_5': { credits: 5, price: 99, name: '5 Credits' },
  'pack_10': { credits: 10, price: 199, name: '10 Credits' },
  'pack_25': { credits: 25, price: 399, name: '25 Credits' },
  'pack_50': { credits: 50, price: 699, name: '50 Credits' },
  'pack_100': { credits: 100, price: 999, name: '100 Credits' },
}

export async function POST(request: NextRequest) {
  try {
    // Get user from Better-Auth session
    const session = await auth.api.getSession({ headers: request.headers })

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = session.user

    // Parse request body
    const { packageId } = await request.json()

    if (!packageId) {
      return NextResponse.json({ error: 'Package ID is required' }, { status: 400 })
    }

    const selectedPackage = CREDIT_PACKAGES[packageId as keyof typeof CREDIT_PACKAGES]
    if (!selectedPackage) {
      return NextResponse.json({ error: 'Invalid package selected' }, { status: 400 })
    }

    // Get current user credits
    const userData = await db.getUserById(user.id)

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // For now, simulate successful purchase
    // In a real implementation, you would:
    // 1. Create Stripe checkout session
    // 2. Handle webhook for successful payment
    // 3. Only then add credits to user account

    const newCreditBalance = userData.credits + selectedPackage.credits

    // Update user credits
    const updateSuccess = await db.updateUserCredits(user.id, newCreditBalance)

    if (!updateSuccess) {
      console.error('Failed to update credits')
      return NextResponse.json({ error: 'Failed to add credits' }, { status: 500 })
    }

    // Record transaction
    const transaction = await db.createCreditTransaction({
      user_id: user.id,
      amount: selectedPackage.credits,
      transaction_type: 'purchase',
      description: `Purchased ${selectedPackage.name}`,
      stripe_payment_intent_id: `sim_${Date.now()}` // Simulated payment ID
    })

    if (!transaction) {
      console.error('Failed to record transaction')
    }

    return NextResponse.json({
      success: true,
      creditsAdded: selectedPackage.credits,
      newBalance: newCreditBalance,
      message: `Successfully purchased ${selectedPackage.name}`
    })

  } catch (error) {
    console.error('Purchase error:', error)
    return NextResponse.json(
      { error: 'Failed to process purchase' }, 
      { status: 500 }
    )
  }
}