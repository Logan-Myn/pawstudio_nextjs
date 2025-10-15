import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Map RevenueCat product identifiers to credit amounts
const PRODUCT_CREDIT_MAPPING: Record<string, number> = {
  'starter': 5,
  'premium': 20,
  'ultimate': 50,
}

// RevenueCat webhook event types that should grant credits
const CREDIT_GRANTING_EVENTS = [
  'INITIAL_PURCHASE',
  'NON_RENEWING_PURCHASE',
  'RENEWAL',
]

interface RevenueCatWebhookEvent {
  event: {
    type: string
    app_user_id: string
    product_id: string
    transaction_id?: string
    original_transaction_id?: string
    purchased_at_ms?: number
    store?: string
    environment?: string
  }
  api_version: string
}

export async function POST(request: NextRequest) {
  try {
    // Log all headers to debug
    const allHeaders: Record<string, string> = {}
    request.headers.forEach((value, key) => {
      allHeaders[key] = value.substring(0, 50) // Only log first 50 chars
    })
    console.log('📨 All webhook headers:', allHeaders)

    // Verify webhook authenticity using Authorization header
    const authHeader = request.headers.get('authorization')
    const expectedToken = process.env.REVENUECAT_WEBHOOK_SECRET

    console.log('🔍 Webhook auth check:', {
      hasAuthHeader: !!authHeader,
      authHeaderPrefix: authHeader?.substring(0, 10),
      hasExpectedToken: !!expectedToken,
      expectedTokenPrefix: expectedToken?.substring(0, 10),
    })

    if (!expectedToken) {
      console.error('❌ REVENUECAT_WEBHOOK_SECRET not configured')
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      )
    }

    if (!authHeader || authHeader !== `Bearer ${expectedToken}`) {
      console.error('❌ Invalid webhook authorization', {
        receivedPrefix: authHeader?.substring(0, 20),
        expectedFormat: 'Bearer ' + expectedToken?.substring(0, 10) + '...',
      })
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse webhook payload
    const payload: RevenueCatWebhookEvent = await request.json()
    const { event } = payload

    console.log('📥 RevenueCat webhook received:', {
      type: event.type,
      userId: event.app_user_id,
      productId: event.product_id,
      environment: event.environment,
    })

    // Only process credit-granting events
    if (!CREDIT_GRANTING_EVENTS.includes(event.type)) {
      console.log('ℹ️ Event type does not grant credits, skipping:', event.type)
      return NextResponse.json({ received: true })
    }

    // Skip sandbox transactions in production
    if (event.environment === 'SANDBOX' && process.env.NODE_ENV === 'production') {
      console.log('⚠️ Skipping sandbox transaction in production')
      return NextResponse.json({ received: true })
    }

    // Get user ID from the event
    const userId = event.app_user_id
    if (!userId) {
      console.error('❌ No user ID in webhook event')
      return NextResponse.json(
        { error: 'Missing user ID' },
        { status: 400 }
      )
    }

    // Verify user exists
    const user = await db.getUserById(userId)
    if (!user) {
      console.error('❌ User not found:', userId)
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Get credit amount for the product
    const productId = event.product_id
    const creditsToAdd = PRODUCT_CREDIT_MAPPING[productId]

    if (!creditsToAdd) {
      console.error('❌ Unknown product ID:', productId)
      return NextResponse.json(
        { error: 'Unknown product' },
        { status: 400 }
      )
    }

    // Add credits to user account
    const newBalance = user.credits + creditsToAdd
    const updatedUser = await db.updateUserCredits(userId, newBalance)

    if (!updatedUser) {
      console.error('❌ Failed to update user credits')
      return NextResponse.json(
        { error: 'Failed to update credits' },
        { status: 500 }
      )
    }

    // Record transaction
    const transaction = await db.createCreditTransaction(
      userId,
      creditsToAdd,
      'purchase',
      `RevenueCat ${event.type}: ${productId} (${creditsToAdd} credits)`,
      event.transaction_id || event.original_transaction_id
    )

    if (!transaction) {
      console.error('⚠️ Failed to record transaction')
    }

    console.log('✅ Credits added successfully:', {
      userId,
      creditsAdded: creditsToAdd,
      newBalance,
      productId,
      eventType: event.type,
    })

    return NextResponse.json({
      success: true,
      creditsAdded: creditsToAdd,
      newBalance,
    })

  } catch (error) {
    console.error('❌ RevenueCat webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}
