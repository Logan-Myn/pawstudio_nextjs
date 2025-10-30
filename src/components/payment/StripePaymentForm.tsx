'use client'

import { useEffect, useState } from 'react'
import { Elements } from '@stripe/react-stripe-js'
import { loadStripe, StripeElementsOptions } from '@stripe/stripe-js'
import { CheckoutForm } from './CheckoutForm'
import { Loader2 } from 'lucide-react'
import { CreditPackage } from '@/types'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface StripePaymentFormProps {
  selectedPackage: CreditPackage
  onSuccess: () => void
  onError: (error: string) => void
}

export function StripePaymentForm({ selectedPackage, onSuccess, onError }: StripePaymentFormProps) {
  const [clientSecret, setClientSecret] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    const createPaymentIntent = async () => {
      try {
        const response = await fetch('/api/credits/create-payment-intent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ packageId: selectedPackage.id }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to create payment intent')
        }

        const data = await response.json()
        if (mounted) {
          setClientSecret(data.clientSecret)
        }
      } catch (err) {
        console.error('Payment intent error:', err)
        if (mounted) {
          onError(err instanceof Error ? err.message : 'Failed to initialize payment')
        }
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    createPaymentIntent()

    return () => {
      mounted = false
    }
  }, [selectedPackage.id, onError])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!clientSecret) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Failed to initialize payment. Please try again.</p>
      </div>
    )
  }

  const options: StripeElementsOptions = {
    clientSecret,
    appearance: {
      theme: 'stripe',
      variables: {
        colorPrimary: '#3b82f6',
        colorBackground: '#ffffff',
        colorText: '#1f2937',
        colorDanger: '#ef4444',
        fontFamily: 'system-ui, sans-serif',
        borderRadius: '8px',
      },
    },
  }

  return (
    <Elements stripe={stripePromise} options={options}>
      <CheckoutForm
        onSuccess={onSuccess}
        onError={onError}
        packageName={selectedPackage.name}
        amount={selectedPackage.price}
      />
    </Elements>
  )
}
