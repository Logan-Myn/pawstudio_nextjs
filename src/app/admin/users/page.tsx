'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users } from 'lucide-react'

export default function UsersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
        <p className="mt-2 text-gray-600">
          Manage user accounts, credits, and permissions
        </p>
      </div>

      <Card>
        <CardHeader className="text-center py-12">
          <div className="mx-auto mb-4 h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center">
            <Users className="h-6 w-6 text-gray-600" />
          </div>
          <CardTitle>User Management</CardTitle>
          <CardDescription>
            This feature will be available in a future release.
            <br />
            User management functionality will include user listings, credit management, and role assignments.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  )
}