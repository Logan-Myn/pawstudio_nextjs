import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import Stripe from 'stripe'

const CREDIT_PACKAGES = {
  'pack_5': { credits: 5, price: 99, name: '5 Credits' },
  'pack_10': { credits: 10, price: 199, name: '10 Credits' },
  'pack_25': { credits: 25, price: 399, name: '25 Credits' },
  'pack_50': { credits: 50, price: 699, name: '50 Credits' },
  'pack_100': { credits: 100, price: 999, name: '100 Credits' },
}

export async function POST(request: NextRequest) {
  try {
    // Debug: Log the first 20 characters of the key
    const stripeKey = process.env.STRIPE_SECRET_KEY!
    console.log('Stripe key starts with:', stripeKey?.substring(0, 20))
    console.log('All STRIPE env vars:', Object.keys(process.env).filter(k => k.includes('STRIPE')))

    // Initialize Stripe with env variable
    const stripe = new Stripe(stripeKey, {
      apiVersion: '2024-12-18.acacia',
    })

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

    // Create Stripe PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: selectedPackage.price,
      currency: 'usd',
      metadata: {
        userId: user.id,
        packageId: packageId,
        credits: selectedPackage.credits.toString(),
        packageName: selectedPackage.name,
      },
      description: `PawStudio - ${selectedPackage.name}`,
    })

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    })

  } catch (error) {
    console.error('PaymentIntent creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create payment intent' },
      { status: 500 }
    )
  }
}
