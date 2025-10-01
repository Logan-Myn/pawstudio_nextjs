'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store/auth'
import { Button } from '@/components/ui/button'
import { Camera, Sparkles, Heart } from 'lucide-react'
import { AuthModal } from '@/components/auth/auth-modal'

export default function LandingPage() {
  const router = useRouter()
  const { user, isLoading } = useAuthStore()
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [authModalTab, setAuthModalTab] = useState<'signin' | 'signup'>('signin')

  useEffect(() => {
    if (!isLoading && user) {
      router.push('/dashboard')
    }
  }, [user, isLoading, router])

  const openSignIn = () => {
    setAuthModalTab('signin')
    setAuthModalOpen(true)
  }

  const openSignUp = () => {
    setAuthModalTab('signup')
    setAuthModalOpen(true)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (user) {
    return null // Will redirect to dashboard
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        {/* Header */}
        <header className="relative z-10 bg-white/80 backdrop-blur-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <h1 className="text-2xl font-bold text-blue-600">🐾 PawStudio</h1>
              </div>
              <div className="flex items-center space-x-4">
                <Button variant="ghost" onClick={openSignIn}>
                  Sign In
                </Button>
                <Button onClick={openSignUp}>
                  Get Started
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="relative overflow-hidden py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center">
              <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 mb-6">
                Transform Your Pet Photos with
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                  {' '}AI Magic
                </span>
              </h1>
              <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
                Turn your beloved pet photos into stunning studio-quality portraits with our AI-powered filters.
                Professional results in seconds, no photography skills required.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="text-lg px-8 py-3" onClick={openSignUp}>
                  <Camera className="mr-2 h-5 w-5" />
                  Start Creating Free
                </Button>
                <Button variant="outline" size="lg" className="text-lg px-8 py-3" onClick={() => {
                  document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })
                }}>
                  <Sparkles className="mr-2 h-5 w-5" />
                  See Features
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                Powerful AI Filters
              </h2>
              <p className="text-xl text-gray-600">
                Choose from our collection of professional-grade AI filters
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                {
                  name: 'Studio Black & White',
                  description: 'Professional black and white studio portrait with dramatic lighting',
                  icon: '🎭',
                },
                {
                  name: 'Classic Painted Portrait',
                  description: 'Oil painting style portrait with artistic brushstrokes',
                  icon: '🎨',
                },
                {
                  name: 'Pop Art Vibrant',
                  description: 'Colorful pop art style with bold graphics',
                  icon: '🌈',
                },
                {
                  name: 'Winter Wonderland',
                  description: 'Magical winter themed portrait with snow effects',
                  icon: '❄️',
                },
              ].map((filter, index) => (
                <div key={index} className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
                  <div className="text-4xl mb-4">{filter.icon}</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{filter.name}</h3>
                  <p className="text-gray-600">{filter.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                Simple, Affordable Pricing
              </h2>
              <p className="text-xl text-gray-600">
                Pay only for what you use with our credit system
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { credits: 5, price: '$0.99', popular: false },
                { credits: 10, price: '$1.99', popular: true },
                { credits: 25, price: '$3.99', popular: false },
              ].map((plan, index) => (
                <div key={index} className={`bg-white rounded-xl p-8 shadow-lg ${plan.popular ? 'ring-2 ring-blue-500' : ''}`}>
                  {plan.popular && (
                    <div className="text-center mb-4">
                      <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                        Most Popular
                      </span>
                    </div>
                  )}
                  <div className="text-center">
                    <div className="text-4xl font-bold text-gray-900 mb-2">{plan.credits}</div>
                    <div className="text-gray-600 mb-4">Credits</div>
                    <div className="text-2xl font-bold text-blue-600 mb-6">{plan.price}</div>
                    <Button className="w-full" onClick={openSignUp}>
                      Get Started
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center mt-8">
              <p className="text-gray-600">
                New users get <span className="font-semibold text-blue-600">3 free credits</span> to try PawStudio
              </p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Ready to Transform Your Pet Photos?
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Join thousands of pet owners who have already discovered the magic of AI photo transformation
            </p>
            <Button size="lg" className="text-lg px-8 py-3" onClick={openSignUp}>
              <Heart className="mr-2 h-5 w-5" />
              Start Your Free Trial
            </Button>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center">
              <h3 className="text-2xl font-bold mb-4">🐾 PawStudio</h3>
              <p className="text-gray-400 mb-6">
                AI-powered pet photo transformation made simple
              </p>
              <div className="flex justify-center space-x-6">
                <button className="text-gray-400 hover:text-white">
                  Privacy Policy
                </button>
                <button className="text-gray-400 hover:text-white">
                  Terms of Service
                </button>
                <button className="text-gray-400 hover:text-white">
                  Support
                </button>
              </div>
            </div>
          </div>
        </footer>
      </div>

      {/* Auth Modal */}
      <AuthModal
        open={authModalOpen}
        onOpenChange={setAuthModalOpen}
        defaultTab={authModalTab}
      />
    </>
  )
}
