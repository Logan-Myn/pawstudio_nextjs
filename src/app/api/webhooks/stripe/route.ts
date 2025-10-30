import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    // Initialize Stripe with env variables
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2024-12-18.acacia',
    })
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    if (!signature) {
      console.error('No Stripe signature found')
      return NextResponse.json({ error: 'No signature' }, { status: 400 })
    }

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return NextResponse.json(
        { error: `Webhook Error: ${err instanceof Error ? err.message : 'Unknown error'}` },
        { status: 400 }
      )
    }

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent

        console.log('Payment succeeded:', paymentIntent.id)

        // Extract metadata
        const userId = paymentIntent.metadata.userId
        const credits = parseInt(paymentIntent.metadata.credits)
        const packageName = paymentIntent.metadata.packageName

        if (!userId || !credits || !packageName) {
          console.error('Missing metadata in payment intent:', paymentIntent.id)
          return NextResponse.json({ error: 'Missing metadata' }, { status: 400 })
        }

        // Get current user credits
        const userData = await db.getUserById(userId)

        if (!userData) {
          console.error('User not found:', userId)
          return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        // Add credits to user account
        const newCreditBalance = userData.credits + credits

        const updateSuccess = await db.updateUserCredits(userId, newCreditBalance)

        if (!updateSuccess) {
          console.error('Failed to update credits for user:', userId)
          return NextResponse.json({ error: 'Failed to add credits' }, { status: 500 })
        }

        // Record transaction
        const transaction = await db.createCreditTransaction({
          user_id: userId,
          amount: credits,
          transaction_type: 'purchase',
          description: `Purchased ${packageName} via Stripe`,
          stripe_payment_intent_id: paymentIntent.id,
        })

        if (!transaction) {
          console.error('Failed to record transaction for user:', userId)
        }

        console.log(`Successfully added ${credits} credits to user ${userId}`)
        break
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        console.error('Payment failed:', paymentIntent.id, paymentIntent.last_payment_error?.message)
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}
