'use client'

import { useState, FormEvent } from 'react'
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js'
import { Button } from '@/components/ui/button'
import { Loader2, CreditCard } from 'lucide-react'

interface CheckoutFormProps {
  onSuccess: () => void
  onError: (error: string) => void
  packageName: string
  amount: number
}

export function CheckoutForm({ onSuccess, onError, packageName, amount }: CheckoutFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [isProcessing, setIsProcessing] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setIsProcessing(true)

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/dashboard/credits?payment_success=true`,
        },
        redirect: 'if_required',
      })

      if (error) {
        onError(error.message || 'Payment failed')
      } else {
        onSuccess()
      }
    } catch (err) {
      onError('An unexpected error occurred')
      console.error('Payment error:', err)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CreditCard className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-gray-900">{packageName}</span>
            </div>
            <div className="text-xl font-bold text-blue-700">
              ${(amount / 100).toFixed(2)}
            </div>
          </div>
        </div>

        <PaymentElement />
      </div>

      <Button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Processing Payment...
          </>
        ) : (
          `Pay ${(amount / 100).toFixed(2)} USD`
        )}
      </Button>

      <p className="text-xs text-center text-gray-500">
        Your payment is processed securely by Stripe. We never see your card details.
      </p>
    </form>
  )
}
