'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/lib/store/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Upload, Trash2, ImageIcon, Loader2 } from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

interface LibraryPhoto {
  id: number
  userId: string
  originalFilename: string
  fileUrl: string
  fileSize: number
  uploadedAt: string
  createdAt: string
}

export default function LibraryPage() {
  const { user } = useAuthStore()
  const router = useRouter()
  const [photos, setPhotos] = useState<LibraryPhoto[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  useEffect(() => {
    fetchPhotos()
  }, [])

  const fetchPhotos = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/photos/library')
      const data = await response.json()

      if (data.success) {
        setPhotos(data.photos)
      }
    } catch (error) {
      console.error('Error fetching photos:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (photoId: number) => {
    if (!confirm('Delete this photo? This will also delete any AI transformations created from it.')) return

    try {
      setDeletingId(photoId)
      const response = await fetch(`/api/photos/${photoId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setPhotos(photos.filter(p => p.id !== photoId))
      }
    } catch (error) {
      console.error('Error deleting photo:', error)
      alert('Failed to delete photo. Please try again.')
    } finally {
      setDeletingId(null)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">📸 Photo Library</h1>
              <p className="text-sm text-gray-600 mt-1">
                Your uploaded photos - reuse them in multiple generations
              </p>
            </div>

            <Button
              onClick={() => router.push('/dashboard/editor')}
              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
            >
              <Upload className="mr-2 h-4 w-4" />
              Upload New Photo
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
          </div>
        ) : photos.length === 0 ? (
          <Card className="p-12">
            <div className="text-center">
              <ImageIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium mb-2">No photos yet</h3>
              <p className="text-gray-600 mb-6">
                Upload photos to reuse them in multiple AI generations
              </p>
              <Button
                onClick={() => router.push('/dashboard/editor')}
                className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
              >
                <Upload className="mr-2 h-4 w-4" />
                Upload Your First Photo
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {photos.map((photo) => (
              <Card key={photo.id} className="group relative overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-square relative bg-gray-100">
                  <Image
                    src={photo.fileUrl}
                    alt={photo.originalFilename}
                    fill
                    className="object-cover"
                  />

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => router.push(`/dashboard/editor?photoId=${photo.id}`)}
                        className="bg-white/90 hover:bg-white"
                      >
                        Use in Editor
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(photo.id)}
                        disabled={deletingId === photo.id}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        {deletingId === photo.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>

                <CardContent className="p-3">
                  <p className="text-xs truncate font-medium text-gray-900">{photo.originalFilename}</p>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-gray-500">{formatFileSize(photo.fileSize)}</p>
                    <p className="text-xs text-gray-500">{formatDate(photo.uploadedAt)}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
