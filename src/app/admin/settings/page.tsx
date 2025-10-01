'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Settings } from 'lucide-react'

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Settings</h1>
        <p className="mt-2 text-gray-600">
          Configure system settings, reports, and administrative preferences
        </p>
      </div>

      <Card>
        <CardHeader className="text-center py-12">
          <div className="mx-auto mb-4 h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center">
            <Settings className="h-6 w-6 text-gray-600" />
          </div>
          <CardTitle>Admin Settings</CardTitle>
          <CardDescription>
            This feature will be available in a future release.
            <br />
            Settings will include system configuration, report generation, and administrative controls.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  )
}