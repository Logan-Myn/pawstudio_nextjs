'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { AlertCircle, Trash2, Upload, Loader2, RefreshCw } from 'lucide-react'

interface ArchiveEntry {
  id: string
  name: string
  category?: string
  prompt: string
  previewImageUrl: string
  testImageUrl?: string
  createdAt: string
}

export function PreviewArchive() {
  const [archives, setArchives] = useState<ArchiveEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set())
  const [addingIds, setAddingIds] = useState<Set<string>>(new Set())

  const fetchArchives = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/admin/scenes/preview/archive')

      if (!response.ok) {
        throw new Error('Failed to fetch archives')
      }

      const data = await response.json()
      setArchives(data.archives || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load archives')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchArchives()
  }, [])

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this archived preview?')) {
      return
    }

    setDeletingIds(prev => new Set(prev).add(id))
    setError(null)

    try {
      const response = await fetch(`/api/admin/scenes/preview/archive?id=${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete archive')
      }

      setArchives(prev => prev.filter(a => a.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete archive')
    } finally {
      setDeletingIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(id)
        return newSet
      })
    }
  }

  const handleAddToApp = async (archive: ArchiveEntry) => {
    setAddingIds(prev => new Set(prev).add(archive.id))
    setError(null)

    try {
      // Create scene directly from archived preview
      const response = await fetch('/api/admin/scenes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: archive.name,
          description: `AI-generated scene: ${archive.name}`,
          category: archive.category || null,
          promptTemplate: archive.prompt,
          creditCost: 1,
          imageReference: archive.previewImageUrl, // Use archived preview image
          isActive: false,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create scene')
      }

      alert(`"${archive.name}" has been added to the app! (inactive by default)`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add scene')
    } finally {
      setAddingIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(archive.id)
        return newSet
      })
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Preview Archive</h2>
          <p className="text-sm text-gray-600 mt-1">
            Saved prompt previews that you can review and add to the app later
          </p>
        </div>
        <Button
          variant="outline"
          onClick={fetchArchives}
          disabled={loading}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-center space-x-2 py-4">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <span className="text-red-800">{error}</span>
          </CardContent>
        </Card>
      )}

      {/* Archives Grid */}
      {archives.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-gray-500 text-center">
              No archived previews yet.
              <br />
              Generate prompts and click "Save to Archive" to save them here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {archives.map((archive) => (
            <Card key={archive.id} className="overflow-hidden">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{archive.name}</CardTitle>
                    <CardDescription className="text-xs mt-1">
                      {archive.category && (
                        <Badge variant="outline" className="capitalize mr-2">
                          {archive.category}
                        </Badge>
                      )}
                      {formatDate(archive.createdAt)}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Preview Image */}
                <div className="relative w-full aspect-square rounded-lg overflow-hidden border-2 border-gray-200">
                  <img
                    src={archive.previewImageUrl}
                    alt={archive.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Prompt */}
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-gray-600">Prompt:</p>
                  <p className="text-xs text-gray-700 line-clamp-3">
                    {archive.prompt}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => handleAddToApp(archive)}
                    disabled={addingIds.has(archive.id)}
                    className="flex-1"
                  >
                    {addingIds.has(archive.id) ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Add to App
                      </>
                    )}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(archive.id)}
                    disabled={deletingIds.has(archive.id)}
                  >
                    {deletingIds.has(archive.id) ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
