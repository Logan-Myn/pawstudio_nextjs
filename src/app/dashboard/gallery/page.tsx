'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/lib/store/auth'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Download,
  Loader2,
  Sparkles,
  X,
  ZoomIn,
  ImageIcon,
  ArrowLeft,
  ArrowRight
} from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

interface ProcessedImage {
  id: number
  originalUrl: string
  processedUrl: string
  filterId: string
  filterName: string
  createdAt: string
  processedAt: string
  userId: string
}

export default function GalleryPage() {
  const { user } = useAuthStore()
  const router = useRouter()
  const [images, setImages] = useState<ProcessedImage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState<ProcessedImage | null>(null)
  const [showOriginal, setShowOriginal] = useState(false)

  useEffect(() => {
    fetchGallery()
  }, [])

  const fetchGallery = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/images/history')
      const data = await response.json()

      if (data.success) {
        setImages(data.images)
      }
    } catch (error) {
      console.error('Error fetching gallery:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownload = async (imageUrl: string, filterName: string) => {
    try {
      const filename = `pawstudio-${filterName.toLowerCase().replace(/\s+/g, '-')}.jpg`
      const downloadUrl = `/api/images/download?url=${encodeURIComponent(imageUrl)}&filename=${encodeURIComponent(filename)}`

      const a = document.createElement('a')
      a.href = downloadUrl
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error downloading image:', error)
      alert('Failed to download image. Please try again.')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handlePrevious = () => {
    if (!selectedImage) return
    const currentIndex = images.findIndex(img => img.id === selectedImage.id)
    if (currentIndex > 0) {
      setSelectedImage(images[currentIndex - 1])
      setShowOriginal(false)
    }
  }

  const handleNext = () => {
    if (!selectedImage) return
    const currentIndex = images.findIndex(img => img.id === selectedImage.id)
    if (currentIndex < images.length - 1) {
      setSelectedImage(images[currentIndex + 1])
      setShowOriginal(false)
    }
  }

  const currentIndex = selectedImage ? images.findIndex(img => img.id === selectedImage.id) : -1

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Sparkles className="h-8 w-8 text-orange-500" />
                Gallery
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Your transformed pet photos
              </p>
            </div>

            <Button
              onClick={() => router.push('/dashboard/editor')}
              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 shadow-lg"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Create New
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Loader2 className="w-12 h-12 animate-spin text-orange-600 mx-auto mb-4" />
              <p className="text-gray-600">Loading your gallery...</p>
            </div>
          </div>
        ) : images.length === 0 ? (
          <Card className="p-16 text-center bg-white/80 backdrop-blur-sm">
            <ImageIcon className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold mb-2">No photos yet</h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Start transforming your pet photos with our filters to see them here
            </p>
            <Button
              onClick={() => router.push('/dashboard/editor')}
              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 shadow-lg"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Create Your First Photo
            </Button>
          </Card>
        ) : (
          <>
            {/* Stats */}
            <div className="mb-6 bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-gray-200">
              <p className="text-sm text-gray-600">
                <span className="font-semibold text-gray-900">{images.length}</span> transformed {images.length === 1 ? 'photo' : 'photos'}
              </p>
            </div>

            {/* Masonry Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {images.map((image) => (
                <Card
                  key={image.id}
                  className="group relative overflow-hidden hover:shadow-2xl transition-all duration-300 cursor-pointer border-2 border-transparent hover:border-orange-300 bg-white"
                  onClick={() => setSelectedImage(image)}
                >
                  <div className="aspect-square relative bg-gradient-to-br from-gray-100 to-gray-200">
                    <Image
                      src={image.processedUrl}
                      alt={image.filterName}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    />

                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <ZoomIn className="h-4 w-4 text-white" />
                            <span className="text-white text-sm font-medium">View</span>
                          </div>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDownload(image.processedUrl, image.filterName)
                            }}
                            className="bg-white/90 hover:bg-white h-7 px-2"
                          >
                            <Download className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Filter Badge */}
                    <div className="absolute top-2 left-2 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-semibold px-2 py-1 rounded-full shadow-lg">
                      {image.filterName}
                    </div>
                  </div>

                  {/* Image Info */}
                  <div className="p-3 bg-white">
                    <p className="text-xs text-gray-500 truncate">
                      {formatDate(image.processedAt)}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Lightbox Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          {/* Close Button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 text-white hover:bg-white/10 z-10"
            onClick={() => setSelectedImage(null)}
          >
            <X className="h-6 w-6" />
          </Button>

          {/* Navigation Arrows */}
          {currentIndex > 0 && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/10 z-10"
              onClick={(e) => {
                e.stopPropagation()
                handlePrevious()
              }}
            >
              <ArrowLeft className="h-8 w-8" />
            </Button>
          )}

          {currentIndex < images.length - 1 && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/10 z-10"
              onClick={(e) => {
                e.stopPropagation()
                handleNext()
              }}
            >
              <ArrowRight className="h-8 w-8" />
            </Button>
          )}

          {/* Image Container */}
          <div
            className="max-w-5xl max-h-[90vh] w-full flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Image */}
            <div className="relative flex-1 flex items-center justify-center mb-4">
              <div className="relative w-full h-full flex items-center justify-center">
                <Image
                  src={showOriginal ? selectedImage.originalUrl : selectedImage.processedUrl}
                  alt={selectedImage.filterName}
                  width={1200}
                  height={1200}
                  className="max-w-full max-h-[70vh] w-auto h-auto object-contain rounded-lg shadow-2xl"
                  priority
                />
              </div>
            </div>

            {/* Controls */}
            <div className="bg-white/10 backdrop-blur-md rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-white font-semibold text-lg">{selectedImage.filterName}</h3>
                  <p className="text-gray-300 text-sm">{formatDate(selectedImage.processedAt)}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowOriginal(!showOriginal)}
                    className="bg-white/90 hover:bg-white"
                  >
                    {showOriginal ? 'Show AI Version' : 'Show Original'}
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleDownload(selectedImage.processedUrl, selectedImage.filterName)}
                    className="bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                </div>
              </div>

              {/* Progress indicator */}
              <div className="flex items-center gap-2">
                <p className="text-gray-300 text-xs">
                  {currentIndex + 1} of {images.length}
                </p>
                <div className="flex-1 bg-white/20 rounded-full h-1">
                  <div
                    className="bg-gradient-to-r from-orange-500 to-red-500 h-1 rounded-full transition-all duration-300"
                    style={{ width: `${((currentIndex + 1) / images.length) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
