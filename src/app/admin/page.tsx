'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, ImageIcon, CreditCard, Activity, Clock, UserPlus, Zap, ShoppingCart } from 'lucide-react'
import Link from 'next/link'

interface DashboardStats {
  totalUsers: number
  newUsersThisMonth: number
  totalImages: number
  imagesThisMonth: number
  totalCreditsSpent: number
  creditsSpentThisMonth: number
  totalScenes: number
  activeScenes: number
  totalCreditsPurchased: number
  creditsPurchasedThisMonth: number
  totalPurchases: number
  purchasesThisMonth: number
}

interface ActivityEvent {
  id: string
  type: 'user_registered' | 'image_processed' | 'credits_purchased' | 'credits_used' | 'scene_created' | 'scene_updated'
  description: string
  user_email: string | null
  user_name: string | null
  metadata: Record<string, unknown>
  created_at: string
}

const activityTypeConfig: Record<string, { icon: React.ElementType; color: string; bgColor: string }> = {
  user_registered: { icon: UserPlus, color: 'text-green-600', bgColor: 'bg-green-100' },
  image_processed: { icon: ImageIcon, color: 'text-blue-600', bgColor: 'bg-blue-100' },
  credits_purchased: { icon: ShoppingCart, color: 'text-purple-600', bgColor: 'bg-purple-100' },
  credits_used: { icon: Zap, color: 'text-orange-600', bgColor: 'bg-orange-100' },
  scene_created: { icon: Activity, color: 'text-teal-600', bgColor: 'bg-teal-100' },
  scene_updated: { icon: Activity, color: 'text-cyan-600', bgColor: 'bg-cyan-100' },
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) return 'Just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`
  return date.toLocaleDateString()
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [activities, setActivities] = useState<ActivityEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsRes, activityRes] = await Promise.all([
          fetch('/api/admin/stats'),
          fetch('/api/admin/activity?limit=10')
        ])

        if (!statsRes.ok) {
          throw new Error('Failed to fetch stats')
        }
        if (!activityRes.ok) {
          throw new Error('Failed to fetch activity')
        }

        const statsData = await statsRes.json()
        const activityData = await activityRes.json()

        setStats(statsData.stats)
        setActivities(activityData.activities || [])
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err)
        setError(err instanceof Error ? err.message : 'Failed to load dashboard')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 mb-2">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="text-sm text-orange-600 hover:underline"
          >
            Try again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Overview of PawStudio system metrics and activity
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Users */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
            <p className="text-xs text-muted-foreground">
              +{stats?.newUsersThisMonth || 0} this month
            </p>
          </CardContent>
        </Card>

        {/* Total Images Processed */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Images Processed</CardTitle>
            <ImageIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalImages || 0}</div>
            <p className="text-xs text-muted-foreground">
              +{stats?.imagesThisMonth || 0} this month
            </p>
          </CardContent>
        </Card>

        {/* Credits Spent */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Credits Spent</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalCreditsSpent || 0}</div>
            <p className="text-xs text-muted-foreground">
              +{stats?.creditsSpentThisMonth || 0} this month
            </p>
          </CardContent>
        </Card>

        {/* Active Scenes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Scenes</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeScenes || 0}</div>
            <p className="text-xs text-muted-foreground">
              of {stats?.totalScenes || 0} total scenes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Status */}
        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                <span className="text-sm">Database</span>
              </div>
              <span className="text-sm text-green-600">Operational</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                <span className="text-sm">Image Processing</span>
              </div>
              <span className="text-sm text-green-600">Operational</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                <span className="text-sm">Authentication</span>
              </div>
              <span className="text-sm text-green-600">Operational</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                <span className="text-sm">Storage</span>
              </div>
              <span className="text-sm text-green-600">Operational</span>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-2">
              <Link
                href="/admin/scenes"
                className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              >
                <div className="flex items-center space-x-2">
                  <ImageIcon className="h-4 w-4 text-gray-600" />
                  <span className="text-sm font-medium">Manage Scenes</span>
                </div>
                <span className="text-xs text-gray-500">→</span>
              </Link>
              <Link
                href="/admin/users"
                className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              >
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-gray-600" />
                  <span className="text-sm font-medium">View Users</span>
                </div>
                <span className="text-xs text-gray-500">→</span>
              </Link>
              <Link
                href="/admin/activity"
                className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              >
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-gray-600" />
                  <span className="text-sm font-medium">View All Activity</span>
                </div>
                <span className="text-xs text-gray-500">→</span>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Log */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Recent Activity</span>
          </CardTitle>
          <Link
            href="/admin/activity"
            className="text-sm text-orange-600 hover:text-orange-700 font-medium"
          >
            View all →
          </Link>
        </CardHeader>
        <CardContent>
          {activities.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">No recent activity</p>
          ) : (
            <div className="space-y-3">
              {activities.slice(0, 5).map((activity) => {
                const config = activityTypeConfig[activity.type] || activityTypeConfig.scene_updated
                const Icon = config.icon
                return (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className={`p-1.5 rounded-full ${config.bgColor}`}>
                      <Icon className={`h-3.5 w-3.5 ${config.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 truncate">
                        {activity.description}
                        {activity.user_email && (
                          <span className="text-gray-500"> - {activity.user_name || activity.user_email}</span>
                        )}
                      </p>
                      <p className="text-xs text-gray-500">{formatTimeAgo(activity.created_at)}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
