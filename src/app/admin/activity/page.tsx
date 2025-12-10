'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Clock,
  Filter,
  RefreshCw,
  UserPlus,
  ImageIcon,
  ShoppingCart,
  Zap,
  Activity,
  ChevronLeft,
  ChevronRight,
  Download
} from 'lucide-react'

interface ActivityEvent {
  id: string
  type: 'user_registered' | 'image_processed' | 'credits_purchased' | 'credits_used' | 'scene_created' | 'scene_updated'
  description: string
  user_email: string | null
  user_name: string | null
  metadata: Record<string, unknown>
  created_at: string
}

interface Pagination {
  total: number
  limit: number
  offset: number
  hasMore: boolean
}

const activityTypes = [
  { value: '', label: 'All Activity' },
  { value: 'user_registered', label: 'User Registrations' },
  { value: 'image_processed', label: 'Image Processing' },
  { value: 'credits_purchased', label: 'Credit Purchases' },
  { value: 'credits_used', label: 'Credit Usage' },
  { value: 'scene_created', label: 'Scene Created' },
  { value: 'scene_updated', label: 'Scene Updated' },
]

const activityTypeConfig: Record<string, { icon: React.ElementType; color: string; bgColor: string; label: string }> = {
  user_registered: { icon: UserPlus, color: 'text-green-600', bgColor: 'bg-green-100', label: 'Registration' },
  image_processed: { icon: ImageIcon, color: 'text-blue-600', bgColor: 'bg-blue-100', label: 'Processing' },
  credits_purchased: { icon: ShoppingCart, color: 'text-purple-600', bgColor: 'bg-purple-100', label: 'Purchase' },
  credits_used: { icon: Zap, color: 'text-orange-600', bgColor: 'bg-orange-100', label: 'Usage' },
  scene_created: { icon: Activity, color: 'text-teal-600', bgColor: 'bg-teal-100', label: 'Scene Created' },
  scene_updated: { icon: Activity, color: 'text-cyan-600', bgColor: 'bg-cyan-100', label: 'Scene Updated' },
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) return 'Just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatDateTime(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export default function ActivityPage() {
  const [activities, setActivities] = useState<ActivityEvent[]>([])
  const [pagination, setPagination] = useState<Pagination>({ total: 0, limit: 25, offset: 0, hasMore: false })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedType, setSelectedType] = useState('')
  const [refreshing, setRefreshing] = useState(false)

  const fetchActivities = useCallback(async (type: string, offset: number) => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        limit: '25',
        offset: offset.toString()
      })
      if (type) {
        params.set('type', type)
      }

      const response = await fetch(`/api/admin/activity?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch activity')
      }

      const data = await response.json()
      setActivities(data.activities || [])
      setPagination(data.pagination || { total: 0, limit: 25, offset: 0, hasMore: false })
    } catch (err) {
      console.error('Failed to fetch activity:', err)
      setError(err instanceof Error ? err.message : 'Failed to load activity')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchActivities(selectedType, 0)
  }, [selectedType, fetchActivities])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchActivities(selectedType, pagination.offset)
  }

  const handleTypeChange = (type: string) => {
    setSelectedType(type)
    setPagination(prev => ({ ...prev, offset: 0 }))
  }

  const handlePrevPage = () => {
    const newOffset = Math.max(0, pagination.offset - pagination.limit)
    setPagination(prev => ({ ...prev, offset: newOffset }))
    fetchActivities(selectedType, newOffset)
  }

  const handleNextPage = () => {
    if (pagination.hasMore) {
      const newOffset = pagination.offset + pagination.limit
      setPagination(prev => ({ ...prev, offset: newOffset }))
      fetchActivities(selectedType, newOffset)
    }
  }

  const exportToCSV = () => {
    if (activities.length === 0) return

    const headers = ['Date', 'Type', 'Description', 'User', 'Details']
    const rows = activities.map(activity => [
      formatDateTime(activity.created_at),
      activity.type,
      activity.description,
      activity.user_email || 'System',
      JSON.stringify(activity.metadata)
    ])

    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `pawstudio-activity-${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const currentPage = Math.floor(pagination.offset / pagination.limit) + 1
  const totalPages = Math.ceil(pagination.total / pagination.limit)

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Activity Log</h1>
          <p className="mt-1 text-gray-600">
            Track all system events and user actions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={exportToCSV}
            disabled={activities.length === 0}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {activityTypes.map((type) => (
              <button
                key={type.value}
                onClick={() => handleTypeChange(type.value)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  selectedType === type.value
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Activity List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent Activity
            {pagination.total > 0 && (
              <span className="text-sm font-normal text-gray-500">
                ({pagination.total} total)
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading && !refreshing ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600 mb-2">{error}</p>
              <button
                onClick={handleRefresh}
                className="text-sm text-orange-600 hover:underline"
              >
                Try again
              </button>
            </div>
          ) : activities.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No activity found</p>
              {selectedType && (
                <button
                  onClick={() => handleTypeChange('')}
                  className="text-sm text-orange-600 hover:underline mt-2"
                >
                  Clear filter
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Activity Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Type</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Description</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">User</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activities.map((activity) => {
                      const config = activityTypeConfig[activity.type] || activityTypeConfig.scene_updated
                      const Icon = config.icon
                      return (
                        <tr key={activity.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <div className={`p-1.5 rounded-full ${config.bgColor}`}>
                                <Icon className={`h-3.5 w-3.5 ${config.color}`} />
                              </div>
                              <span className="text-sm font-medium text-gray-700">{config.label}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <p className="text-sm text-gray-900">{activity.description}</p>
                          </td>
                          <td className="py-3 px-4">
                            {activity.user_email ? (
                              <div>
                                <p className="text-sm text-gray-900">{activity.user_name || 'Unknown'}</p>
                                <p className="text-xs text-gray-500">{activity.user_email}</p>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-400">System</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <div>
                              <p className="text-sm text-gray-900">{formatTimeAgo(activity.created_at)}</p>
                              <p className="text-xs text-gray-500">{formatDateTime(activity.created_at)}</p>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t border-gray-200 mt-4">
                  <p className="text-sm text-gray-500">
                    Showing {pagination.offset + 1} - {Math.min(pagination.offset + pagination.limit, pagination.total)} of {pagination.total}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePrevPage}
                      disabled={pagination.offset === 0}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-gray-600">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleNextPage}
                      disabled={!pagination.hasMore}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
