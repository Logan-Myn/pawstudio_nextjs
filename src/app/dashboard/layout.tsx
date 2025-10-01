'use client'

import { ProtectedRoute } from '@/components/auth/protected-route'
import { useAuthStore } from '@/lib/store/auth'
import { signOut } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProtectedRoute>
      <DashboardContent>{children}</DashboardContent>
    </ProtectedRoute>
  )
}

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { user, credits } = useAuthStore()
  const pathname = usePathname()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleSignOut = async () => {
    try {
      await signOut()
      window.location.href = '/'
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  return (
    <div className="min-h-screen bg-orange-50">
      {/* Modern Tailwind Navbar */}
      <nav className="bg-white shadow-sm sticky top-0 z-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href="/dashboard" className="flex items-center space-x-3 group">
              <span className="text-2xl group-hover:scale-110 transition-transform duration-200">🐾</span>
              <span className="text-xl font-bold text-gray-900 group-hover:text-orange-600 transition-colors">PawStudio</span>
            </Link>

            {/* Authenticated User Section */}
            <div className="flex items-center space-x-8">
              {/* Navigation Links */}
              <div className="hidden md:flex items-center space-x-8">
                <Link
                  href="/dashboard"
                  className={`font-medium transition-colors ${
                    pathname === '/dashboard' ? 'text-orange-600' : 'text-gray-700 hover:text-orange-600'
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  href="/dashboard/library"
                  className={`font-medium transition-colors ${
                    pathname === '/dashboard/library' ? 'text-orange-600' : 'text-gray-700 hover:text-orange-600'
                  }`}
                >
                  📸 Library
                </Link>
                <Link
                  href="/dashboard/gallery"
                  className={`font-medium transition-colors ${
                    pathname === '/dashboard/gallery' ? 'text-orange-600' : 'text-gray-700 hover:text-orange-600'
                  }`}
                >
                  Gallery
                </Link>
              </div>

              {/* Credits Badge */}
              <div className="flex items-center space-x-8">
                <Link href="/dashboard/credits">
                  <button className="bg-gradient-to-r from-orange-100 to-red-100 text-orange-800 text-sm font-semibold px-3 py-1.5 rounded-full border border-orange-200 hover:from-orange-200 hover:to-red-200 transition-all duration-200 cursor-pointer" title="Click to buy more credits">
                    <span className="flex items-center space-x-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                      </svg>
                      <span>{credits}</span>
                    </span>
                  </button>
                </Link>

                {/* User Dropdown */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 rounded-lg p-1"
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center text-white text-sm font-medium shadow-lg">
                      {user?.email?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                    </svg>
                  </button>

                  {/* Dropdown Menu */}
                  {isDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900 truncate">{user?.email}</p>
                        <p className="text-sm text-gray-500">Manage your account</p>
                      </div>

                      <div className="py-2">
                        <Link href="/dashboard/profile" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                          <svg className="w-4 h-4 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                          </svg>
                          Profile Settings
                        </Link>

                        <Link href="/dashboard/credits" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                          <svg className="w-4 h-4 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
                          </svg>
                          Billing
                        </Link>
                      </div>

                      <div className="pt-2 border-t border-gray-100">
                        <button
                          onClick={handleSignOut}
                          className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                          </svg>
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Mobile menu button */}
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden inline-flex items-center justify-center p-2 rounded-lg text-gray-400 hover:text-gray-500 hover:bg-gray-100 transition-colors"
              >
                <span className="sr-only">Open main menu</span>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden">
              <div className="px-2 pt-2 pb-3 space-y-1 bg-white border-t border-gray-200">
                <Link
                  href="/dashboard"
                  className="block px-3 py-2 text-gray-700 hover:text-orange-600 hover:bg-gray-50 rounded-lg font-medium transition-colors"
                >
                  Dashboard
                </Link>
                <Link
                  href="/dashboard/library"
                  className="block px-3 py-2 text-gray-700 hover:text-orange-600 hover:bg-gray-50 rounded-lg font-medium transition-colors"
                >
                  📸 Library
                </Link>
                <Link
                  href="/dashboard/gallery"
                  className="block px-3 py-2 text-gray-700 hover:text-orange-600 hover:bg-gray-50 rounded-lg font-medium transition-colors"
                >
                  Gallery
                </Link>
                <div className="px-3 py-2">
                  <div className="bg-gradient-to-r from-orange-100 to-red-100 text-orange-800 text-sm font-semibold px-3 py-1.5 rounded-full border border-orange-200 inline-flex items-center space-x-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                    <span>{credits} Credits</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Main content */}
      <main>
        {children}
      </main>
    </div>
  )
}