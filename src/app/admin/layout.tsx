'use client'

import { AdminRoute } from '@/components/auth/admin-route'
import { useAuthStore } from '@/lib/store/auth'
import { signOut } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { LogOut, User, Settings, BarChart3, ImageIcon, ArrowLeft, Clock } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const adminNavigation = [
  { name: 'Overview', href: '/admin', icon: BarChart3 },
  { name: 'Activity', href: '/admin/activity', icon: Clock },
  { name: 'Scenes', href: '/admin/scenes', icon: ImageIcon },
  { name: 'Users', href: '/admin/users', icon: User },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AdminRoute>
      <AdminContent>{children}</AdminContent>
    </AdminRoute>
  )
}

function AdminContent({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore()
  const pathname = usePathname()

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
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="flex items-center space-x-2 text-sm text-gray-600 hover:text-orange-600 transition-colors">
                <ArrowLeft className="h-4 w-4" />
                <span>Back to App</span>
              </Link>
              <div className="h-4 border-l border-gray-300"></div>
              <Link href="/admin" className="flex items-center space-x-2 group">
                <span className="text-2xl">🐾</span>
                <span className="text-xl font-bold text-gray-900 group-hover:text-orange-600 transition-colors">Admin Panel</span>
              </Link>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex space-x-8">
              {adminNavigation.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      isActive
                        ? 'text-orange-600'
                        : 'text-gray-700 hover:text-orange-600'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </Link>
                )
              })}
            </nav>

            {/* User menu */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-2">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200">
                    {user?.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                  </span>
                  <span className="text-sm text-gray-600">
                    {user?.name || user?.email}
                  </span>
                </div>
                <Button
                  onClick={handleSignOut}
                  variant="ghost"
                  size="sm"
                  className="flex items-center space-x-2 hover:text-red-600"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Sign out</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile navigation */}
      <nav className="md:hidden bg-white border-b border-gray-200">
        <div className="px-4 py-2">
          <div className="flex space-x-4">
            {adminNavigation.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center space-x-1 px-2 py-1 text-xs font-medium rounded transition-colors ${
                    isActive
                      ? 'text-orange-600'
                      : 'text-gray-700 hover:text-orange-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="h-3 w-3" />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}