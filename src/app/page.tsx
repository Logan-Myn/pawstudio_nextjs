'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store/auth'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import { AuthModal } from '@/components/auth/auth-modal'
import Link from 'next/link'

export default function LandingPage() {
  const router = useRouter()
  const { user, isLoading } = useAuthStore()
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [authModalTab, setAuthModalTab] = useState<'signin' | 'signup'>('signin')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    )
  }

  if (user) {
    return null // Will redirect to dashboard
  }

  return (
    <>
      {/* Navigation */}
      <nav className="bg-white shadow-sm sticky top-0 z-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-3 group">
              <span className="text-2xl group-hover:scale-110 transition-transform duration-200">🐾</span>
              <span className="text-xl font-bold text-gray-900 group-hover:text-orange-600 transition-colors">PawStudio</span>
            </Link>

            {/* Desktop Auth Buttons */}
            <div className="hidden md:flex items-center space-x-3">
              <Button
                variant="ghost"
                onClick={openSignIn}
                className="text-gray-700 hover:text-orange-600 font-medium transition-colors px-3 py-2 rounded-lg hover:bg-gray-50"
              >
                Sign In
              </Button>
              <Button
                onClick={openSignUp}
                className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2 rounded-lg font-medium hover:from-orange-600 hover:to-red-600 transform hover:scale-[1.02] transition-all duration-200 shadow-lg hover:shadow-orange-500/25"
              >
                Sign Up
              </Button>
            </div>

            {/* Mobile menu button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden inline-flex items-center justify-center p-2 rounded-lg text-gray-400 hover:text-gray-500 hover:bg-gray-100 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
              </svg>
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden">
              <div className="px-2 pt-2 pb-3 space-y-1 bg-white border-t border-gray-200">
                <Button
                  variant="ghost"
                  onClick={openSignIn}
                  className="block w-full text-left px-3 py-2 text-gray-700 hover:text-orange-600 hover:bg-gray-50 rounded-lg font-medium transition-colors"
                >
                  Sign In
                </Button>
                <Button
                  onClick={openSignUp}
                  className="block w-full text-left px-3 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg font-medium hover:from-orange-600 hover:to-red-600 transition-colors"
                >
                  Sign Up
                </Button>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-gray-800 via-orange-800 to-red-800 pt-20">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-50/5 to-transparent"></div>
        <div className="relative py-20 px-4 mx-auto max-w-7xl lg:py-32">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left Column: Content */}
            <div className="lg:text-left text-center">
              <h1 className="mb-6 text-5xl font-bold tracking-tight leading-tight text-white md:text-6xl lg:text-7xl">
                Professional Pet Photos
              </h1>
              <h2 className="mb-8 text-xl text-orange-100 md:text-2xl lg:text-3xl font-light">
                No expensive studio sessions required
              </h2>
              <p className="mb-12 text-lg text-orange-100 lg:text-xl leading-relaxed lg:max-w-none max-w-3xl mx-auto lg:mx-0">
                Transform any pet photo into stunning professional scenes in seconds. Join thousands of pet parents creating magazine-quality photos of their furry friends.
              </p>

              <div className="mb-8">
                <Button
                  onClick={openSignUp}
                  className="inline-flex justify-center items-center py-4 px-8 text-lg font-bold text-center text-white rounded-2xl bg-gradient-to-r from-orange-500 via-red-500 to-orange-600 hover:from-orange-600 hover:via-red-600 hover:to-orange-700 focus:ring-4 focus:ring-orange-300 shadow-xl hover:shadow-orange-500/25 transform hover:scale-105 transition-all duration-300"
                >
                  Start Your Free Trial
                  <svg className="w-5 h-5 ml-3 -mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                  </svg>
                </Button>
                <p className="mt-4 text-sm text-orange-200">✨ 3 free photos included • No credit card required</p>
              </div>
            </div>

            {/* Right Column: Before/After Showcase */}
            <div className="lg:justify-self-end w-full flex items-center justify-center">
              <Image
                src="/beforeafter1.png"
                alt="Before and after pet photo transformation"
                width={600}
                height={600}
                className="w-full max-w-lg h-auto object-contain drop-shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="bg-white py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Why Pet Parents Love PawStudio</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Stop settling for blurry phone photos. Create professional memories that capture your pet's personality.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12">
            {/* Benefit 1 */}
            <div className="flex flex-col lg:flex-row lg:text-left text-center group hover:transform hover:scale-105 transition-all duration-300 max-w-sm lg:max-w-none mx-auto">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-red-100 rounded-2xl flex items-center justify-center lg:mx-0 mx-auto mb-6 lg:mr-6 group-hover:from-orange-200 group-hover:to-red-200 transition-all">
                  <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"></path>
                  </svg>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Studio-Quality Results</h3>
                <p className="text-gray-600 leading-relaxed">
                  Transform ordinary pet photos into magazine-worthy portraits with professional backgrounds and lighting that would cost hundreds at a studio.
                </p>
              </div>
            </div>

            {/* Benefit 2 */}
            <div className="flex flex-col lg:flex-row lg:text-left text-center group hover:transform hover:scale-105 transition-all duration-300 max-w-sm lg:max-w-none mx-auto">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-red-100 rounded-2xl flex items-center justify-center lg:mx-0 mx-auto mb-6 lg:mr-6 group-hover:from-orange-200 group-hover:to-red-200 transition-all">
                  <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                  </svg>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Lightning Fast</h3>
                <p className="text-gray-600 leading-relaxed">
                  Get professional results in under 30 seconds. No more waiting weeks for a photographer or spending hours editing photos yourself.
                </p>
              </div>
            </div>

            {/* Benefit 3 */}
            <div className="flex flex-col lg:flex-row lg:text-left text-center group hover:transform hover:scale-105 transition-all duration-300 max-w-sm lg:max-w-none mx-auto">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-red-100 rounded-2xl flex items-center justify-center lg:mx-0 mx-auto mb-6 lg:mr-6 group-hover:from-orange-200 group-hover:to-red-200 transition-all">
                  <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
                  </svg>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Affordable Magic</h3>
                <p className="text-gray-600 leading-relaxed">
                  Professional pet photography sessions cost $200-500+. Create unlimited stunning photos for less than the price of a single studio visit.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="bg-gray-50 py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Transform your pet photos in three simple steps. No technical skills required.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12 relative">
            {/* Step 1 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-6 text-white text-xl font-bold shadow-lg">
                1
              </div>
              <div className="mb-6">
                <div className="w-24 h-24 p-4 bg-white rounded-2xl shadow-lg border border-gray-200 mx-auto">
                  <svg className="w-full h-full text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                  </svg>
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Upload Your Pet Photo</h3>
              <p className="text-gray-600 leading-relaxed">
                Simply drag and drop any photo of your pet. We accept all common formats including HEIC from your iPhone.
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-6 text-white text-xl font-bold shadow-lg">
                2
              </div>
              <div className="mb-6">
                <div className="w-24 h-24 p-4 bg-white rounded-2xl shadow-lg border border-gray-200 mx-auto">
                  <svg className="w-full h-full text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z"></path>
                  </svg>
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Choose Your Scene</h3>
              <p className="text-gray-600 leading-relaxed">
                Pick from professional studio backgrounds, seasonal scenes, or themed environments that match your pet's personality.
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-6 text-white text-xl font-bold shadow-lg">
                3
              </div>
              <div className="mb-6">
                <div className="w-24 h-24 p-4 bg-white rounded-2xl shadow-lg border border-gray-200 mx-auto">
                  <svg className="w-full h-full text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2z"></path>
                  </svg>
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Download & Share</h3>
              <p className="text-gray-600 leading-relaxed">
                Get your professional pet photo in under 30 seconds. Download in high resolution and share with family and friends.
              </p>
            </div>
          </div>

          <div className="text-center mt-16">
            <Button
              onClick={openSignUp}
              className="inline-flex justify-center items-center py-4 px-8 text-lg font-bold text-center text-white rounded-2xl bg-gradient-to-r from-orange-500 via-red-500 to-orange-600 hover:from-orange-600 hover:via-red-600 hover:to-orange-700 focus:ring-4 focus:ring-orange-300 shadow-xl hover:shadow-orange-500/25 transform hover:scale-105 transition-all duration-300"
            >
              Try It Free Now
              <svg className="w-5 h-5 ml-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
              </svg>
            </Button>
            <p className="mt-4 text-gray-600">Start with 3 free photos - no credit card required</p>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="bg-white py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Simple, Affordable Pricing</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Professional pet photography for less than the cost of a single studio session.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Free Plan */}
            <div className="bg-white rounded-3xl p-6 border-2 border-gray-200 relative hover:border-orange-300 transition-all duration-300">
              <div className="text-center">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Free Trial</h3>
                <div className="text-3xl font-bold text-gray-900 mb-4">$0</div>
              </div>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center text-sm">
                  <svg className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span>3 free photo transformations</span>
                </li>
                <li className="flex items-center text-sm">
                  <svg className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span>All scene types included</span>
                </li>
                <li className="flex items-center text-sm">
                  <svg className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span>High-resolution downloads</span>
                </li>
              </ul>
              <Button
                onClick={openSignUp}
                className="w-full py-3 px-4 bg-gray-100 text-gray-900 rounded-xl font-semibold hover:bg-gray-200 transition-colors text-sm"
              >
                Start Free Trial
              </Button>
            </div>

            {/* Credit Pack - Featured */}
            <div className="bg-white rounded-3xl p-6 border-2 border-orange-400 relative transform scale-105 shadow-xl z-10">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-1 rounded-full text-xs font-semibold">
                Most Popular
              </div>
              <div className="text-center">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Credit Pack</h3>
                <div className="text-3xl font-bold text-gray-900 mb-1">$9.99</div>
                <div className="text-gray-600 mb-4 text-sm">20 photo credits</div>
              </div>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center text-sm">
                  <svg className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span>20 photo transformations</span>
                </li>
                <li className="flex items-center text-sm">
                  <svg className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span>All premium scenes</span>
                </li>
                <li className="flex items-center text-sm">
                  <svg className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span>Priority processing</span>
                </li>
                <li className="flex items-center text-sm">
                  <svg className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span>Credits never expire</span>
                </li>
              </ul>
              <Button className="w-full py-3 px-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-semibold hover:from-orange-600 hover:to-red-600 transition-all text-sm">
                Get Credits
              </Button>
            </div>

            {/* Bulk Pack */}
            <div className="bg-white rounded-3xl p-6 border-2 border-gray-200 relative hover:border-orange-300 transition-all duration-300">
              <div className="text-center">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Bulk Pack</h3>
                <div className="text-3xl font-bold text-gray-900 mb-1">$39.99</div>
                <div className="text-gray-600 mb-4 text-sm">100 photo credits</div>
              </div>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center text-sm">
                  <svg className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span>100 photo transformations</span>
                </li>
                <li className="flex items-center text-sm">
                  <svg className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span>All premium scenes</span>
                </li>
                <li className="flex items-center text-sm">
                  <svg className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span>Highest priority processing</span>
                </li>
                <li className="flex items-center text-sm">
                  <svg className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span>Best value - $0.40/photo</span>
                </li>
              </ul>
              <Button className="w-full py-3 px-4 bg-gray-100 text-gray-900 rounded-xl font-semibold hover:bg-gray-200 transition-colors text-sm">
                Get Bulk Credits
              </Button>
            </div>
          </div>

          <div className="text-center mt-12">
            <p className="text-gray-600">Compare: Professional pet photography sessions cost $200-500+ per session</p>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="bg-gradient-to-r from-orange-500 via-red-500 to-orange-600 py-16 lg:py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">Ready to Create Professional Pet Photos?</h2>
          <p className="text-xl text-orange-100 mb-12 max-w-2xl mx-auto">
            Join thousands of pet parents who've already transformed their ordinary photos into extraordinary memories.
          </p>

          <Button
            onClick={openSignUp}
            className="inline-flex justify-center items-center py-4 px-8 text-lg font-bold text-center text-orange-600 bg-white rounded-2xl hover:bg-orange-50 focus:ring-4 focus:ring-orange-300 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 mr-4"
          >
            Start Your Free Trial
            <svg className="w-5 h-5 ml-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
            </svg>
          </Button>

          <p className="text-orange-200 text-sm mt-6">✨ 3 free transformations included • No credit card required • Get started in 30 seconds</p>
        </div>
      </section>

      {/* Auth Modal */}
      <AuthModal
        open={authModalOpen}
        onOpenChange={setAuthModalOpen}
        defaultTab={authModalTab}
      />
    </>
  )
}
