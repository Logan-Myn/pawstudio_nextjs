'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuthStore } from '@/lib/store/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { credits } from '@/lib/credits'
import { CREDIT_PACKAGES } from '@/types'
import { CreditCard, Sparkles, History, Star, Check, Loader2 } from 'lucide-react'

interface Transaction {
  id: string
  amount: number
  transaction_type: string
  description: string
  created_at: string
}

export default function CreditsPage() {
  const { user, credits: currentCredits, setCredits } = useAuthStore()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [, setIsLoading] = useState(false)
  const [loadingPackage, setLoadingPackage] = useState<string | null>(null)

  const fetchTransactions = useCallback(async () => {
    if (!user) return
    
    try {
      const data = await credits.getTransactions(user.id, 20)
      setTransactions(data)
    } catch (error) {
      console.error('Failed to fetch transactions:', error)
    }
  }, [user])

  useEffect(() => {
    if (user) {
      fetchTransactions()
    }
  }, [user, fetchTransactions])

  const handlePurchase = async (packageId: string) => {
    if (!user) return

    setLoadingPackage(packageId)
    setIsLoading(true)

    try {
      const result = await credits.purchaseCredits(packageId)
      if (result.success) {
        setCredits(result.newBalance)
        await fetchTransactions() // Refresh transaction history
        
        // Show success message (you could add a toast here)
        console.log('Credits purchased successfully!')
      }
    } catch (error: unknown) {
      console.error('Purchase failed:', (error as Error).message)
      // Show error message (you could add a toast here)
    } finally {
      setLoadingPackage(null)
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getTransactionIcon = (type: string) => {
    if (type === 'purchase' || type === 'bonus') {
      return <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
        <Sparkles className="w-4 h-4 text-green-600" />
      </div>
    } else {
      return <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
        <Star className="w-4 h-4 text-blue-600" />
      </div>
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-3">
          <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-full p-3">
            <CreditCard className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Credits & Billing
          </h1>
        </div>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Purchase credits to transform your pet photos with AI. Each transformation uses 1 credit.
        </p>
      </div>

      {/* Current Balance */}
      <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50">
        <CardContent className="p-6">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Sparkles className="w-6 h-6 text-blue-600" />
              <span className="text-lg font-medium text-gray-700">Current Balance</span>
            </div>
            <div className="text-4xl font-bold text-blue-700 mb-2">
              {currentCredits} Credit{currentCredits !== 1 ? 's' : ''}
            </div>
            <p className="text-sm text-gray-600">
              {currentCredits === 0 
                ? 'Purchase credits below to start transforming photos'
                : `You can transform ${currentCredits} more photo${currentCredits !== 1 ? 's' : ''}`
              }
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Credit Packages */}
      <div>
        <h2 className="text-2xl font-bold text-center mb-8">Choose a Credit Package</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {CREDIT_PACKAGES.map((pkg, index) => {
            const isPopular = index === 1 // Make the middle package popular
            const isLoading = loadingPackage === pkg.id
            
            return (
              <Card key={pkg.id} className={`relative ${isPopular ? 'ring-2 ring-purple-500 scale-105' : 'hover:shadow-lg'} transition-all duration-200`}>
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-purple-500 text-white px-3 py-1">
                      Most Popular
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="text-center">
                  <div className="text-3xl font-bold text-gray-900 mb-1">
                    {pkg.credits}
                  </div>
                  <CardTitle className="text-lg">Credits</CardTitle>
                  <div className="text-2xl font-bold text-blue-600">
                    {credits.formatPrice(pkg.price)}
                  </div>
                  <CardDescription>
                    ${(pkg.price / 100 / pkg.credits).toFixed(3)} per credit
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <ul className="space-y-2">
                    <li className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-green-600" />
                      <span className="text-sm">{pkg.credits} AI transformations</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-green-600" />
                      <span className="text-sm">All filter styles included</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-green-600" />
                      <span className="text-sm">High-resolution downloads</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-green-600" />
                      <span className="text-sm">Credits never expire</span>
                    </li>
                  </ul>
                  
                  <Button 
                    onClick={() => handlePurchase(pkg.id)}
                    disabled={isLoading}
                    className={`w-full ${isPopular ? 'bg-purple-600 hover:bg-purple-700' : ''}`}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      `Purchase ${pkg.credits} Credits`
                    )}
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <History className="w-5 h-5" />
            <span>Transaction History</span>
          </CardTitle>
          <CardDescription>
            Your recent credit purchases and usage
          </CardDescription>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-8">
              <History className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No transactions yet</p>
              <p className="text-sm text-gray-500">
                Purchase credits above to start transforming your pet photos!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {transactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getTransactionIcon(transaction.transaction_type)}
                    <div>
                      <p className="font-medium text-gray-900">
                        {transaction.description}
                      </p>
                      <p className="text-sm text-gray-600">
                        {formatDate(transaction.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className={`font-bold ${transaction.amount > 0 ? 'text-green-600' : 'text-blue-600'}`}>
                    {transaction.amount > 0 ? '+' : ''}{transaction.amount} credit{Math.abs(transaction.amount) !== 1 ? 's' : ''}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Help Section */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-6">
          <div className="flex items-start space-x-3">
            <Sparkles className="w-6 h-6 text-blue-600 mt-1" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">How Credits Work</h3>
              <ul className="space-y-1 text-sm text-blue-800">
                <li>• Each AI transformation uses 1 credit</li>
                <li>• Credits never expire - use them whenever you want</li>
                <li>• New users get 1 free credit to try PawStudio</li>
                <li>• All filter styles are included with your credits</li>
                <li>• Download your transformations in high resolution</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}