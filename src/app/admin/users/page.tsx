'use client'

import UserManagement from '@/components/admin/UserManagement'

export default function UsersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
        <p className="mt-2 text-gray-600">
          Manage user accounts, credits, and permissions
        </p>
      </div>

      <UserManagement />
    </div>
  )
}