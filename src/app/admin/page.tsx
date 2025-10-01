'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, ImageIcon, CreditCard, TrendingUp, Activity, Clock } from 'lucide-react'

interface DashboardStats {
  totalUsers: number
  newUsersThisMonth: number
  totalImages: number
  imagesThisMonth: number
  totalCreditsSpent: number
  creditsSpentThisMonth: number
  totalScenes: number
  activeScenes: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Set placeholder stats directly for now since dashboard API doesn't exist yet
    setStats({
      totalUsers: 5,
      newUsersThisMonth: 2,
      totalImages: 14,
      imagesThisMonth: 8,
      totalCreditsSpent: 23,
      creditsSpentThisMonth: 12,
      totalScenes: 4,
      activeScenes: 4,
    })
    setLoading(false)
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
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
                <div className="h-2 w-2 bg-yellow-500 rounded-full"></div>
                <span className="text-sm">Storage</span>
              </div>
              <span className="text-sm text-yellow-600">Monitoring</span>
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
              <a 
                href="/admin/scenes" 
                className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              >
                <div className="flex items-center space-x-2">
                  <ImageIcon className="h-4 w-4 text-gray-600" />
                  <span className="text-sm font-medium">Manage Scenes</span>
                </div>
                <span className="text-xs text-gray-500">→</span>
              </a>
              <a 
                href="/admin/users" 
                className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              >
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-gray-600" />
                  <span className="text-sm font-medium">View Users</span>
                </div>
                <span className="text-xs text-gray-500">→</span>
              </a>
              <a 
                href="/admin/settings" 
                className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              >
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4 text-gray-600" />
                  <span className="text-sm font-medium">View Reports</span>
                </div>
                <span className="text-xs text-gray-500">→</span>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Log (Placeholder) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Recent Activity</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex justify-between items-center">
              <span>New user registered: logan.moyon15@gmail.com</span>
              <span className="text-xs">2 hours ago</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Scene "Winter Wonderland" processed 3 images</span>
              <span className="text-xs">4 hours ago</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Credit purchase: 10 credits by user@example.com</span>
              <span className="text-xs">1 day ago</span>
            </div>
            <div className="flex justify-between items-center">
              <span>New scene "Pop Art Vibrant" created</span>
              <span className="text-xs">2 days ago</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}