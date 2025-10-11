'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useAuthStore } from '@/lib/store/auth'
import { useEditorStore } from '@/lib/store/editor'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ImageUpload } from '@/components/editor/image-upload'
import { FilterSelection } from '@/components/editor/filter-selection'
import { ProcessingStatus } from '@/components/editor/processing-status'
import { imageAPI } from '@/lib/api'
import { Scene, ProcessedImage } from '@/types'
import { Camera, Sparkles, AlertCircle, Upload, Palette, Wand2, Download, ImageIcon, Loader2 } from 'lucide-react'

type EditorStep = 'upload' | 'filter' | 'processing' | 'result'

interface LibraryPhoto {
  id: number
  userId: string
  originalFilename: string
  fileUrl: string
  fileSize: number
  uploadedAt: string
}

export default function EditorPage() {
  const { user, credits: userCredits, setUser } = useAuthStore()
  const { isProcessing, setProcessing, addProcessedImage } = useEditorStore()

  const [currentStep, setCurrentStep] = useState<EditorStep>('upload')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedImagePreview, setSelectedImagePreview] = useState<string | null>(null)
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null)
  const [processedResult, setProcessedResult] = useState<ProcessedImage | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isDownloading, setIsDownloading] = useState(false)

  // Library state
  const [libraryPhotos, setLibraryPhotos] = useState<LibraryPhoto[]>([])
  const [isLoadingLibrary, setIsLoadingLibrary] = useState(false)
  const [uploadTab, setUploadTab] = useState<'upload' | 'library'>('upload')

  // Scenes state
  const [scenes, setScenes] = useState<Scene[]>([])
  const [isLoadingScenes, setIsLoadingScenes] = useState(true)

  // Fetch scenes on mount
  useEffect(() => {
    fetchScenes()
  }, [])

  // Fetch library photos when library tab is opened
  useEffect(() => {
    if (uploadTab === 'library' && libraryPhotos.length === 0) {
      fetchLibraryPhotos()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uploadTab])

  const fetchScenes = async () => {
    try {
      setIsLoadingScenes(true)
      const response = await fetch('/api/scenes')
      const data = await response.json()

      if (Array.isArray(data)) {
        setScenes(data)
      }
    } catch (error) {
      console.error('Error fetching scenes:', error)
    } finally {
      setIsLoadingScenes(false)
    }
  }

  const fetchLibraryPhotos = async () => {
    try {
      setIsLoadingLibrary(true)
      console.log('Fetching library photos...')
      const response = await fetch('/api/photos/library')
      const data = await response.json()
      console.log('Library response:', data)

      if (data.success) {
        console.log('Setting library photos:', data.photos)
        setLibraryPhotos(data.photos)
      }
    } catch (error) {
      console.error('Error fetching library:', error)
    } finally {
      setIsLoadingLibrary(false)
    }
  }

  const handleLibraryPhotoSelect = (photo: LibraryPhoto) => {
    setSelectedImagePreview(photo.fileUrl)
    setCurrentStep('filter')
    setError(null)
  }

  const handleImageSelect = (file: File, preview: string) => {
    setSelectedFile(file)
    setSelectedImagePreview(preview)
    setCurrentStep('filter')
    setError(null)
  }

  const handleImageRemove = () => {
    setSelectedFile(null)
    setSelectedImagePreview(null)
    setCurrentStep('upload')
    setSelectedFilter(null)
    setError(null)
  }

  const handleFilterSelect = (filterId: string) => {
    setSelectedFilter(filterId)
    setError(null)
  }

  const handleProcess = async () => {
    if (!selectedImagePreview || !selectedFilter || !user) return

    const selectedScene = scenes.find(s => String(s.id) === selectedFilter)
    if (!selectedScene) return

    // Check if user has enough credits
    if ((userCredits || 0) < selectedScene.credit_cost) {
      setError(`You need ${selectedScene.credit_cost} credit${selectedScene.credit_cost !== 1 ? 's' : ''} to use this filter. Please purchase more credits.`)
      return
    }

    setCurrentStep('processing')
    setProcessing(true)
    setError(null)

    try {
      let imageUrl = selectedImagePreview

      // Only upload if we have a new file (not from library)
      if (selectedFile) {
        const formData = new FormData()
        formData.append('image', selectedFile)

        const uploadResponse = await imageAPI.upload(formData)
        imageUrl = uploadResponse.data.url
      }

      // Process with AI
      const processResponse = await imageAPI.process({
        imageUrl,
        filterId: selectedFilter
      })

      // Update local user credits from API response (credits are deducted in the API)
      if (processResponse.data.creditsRemaining !== undefined) {
        setUser({ ...user, credits: processResponse.data.creditsRemaining })
      }

      // Create processed image object
      const processedImage: ProcessedImage = {
        id: processResponse.data.id || Date.now().toString(),
        originalUrl: imageUrl,
        processedUrl: processResponse.data.processedUrl,
        filterId: selectedFilter,
        filterName: selectedScene.name,
        createdAt: new Date().toISOString(),
        userId: user.id
      }

      // Update state
      setProcessedResult(processedImage)
      addProcessedImage(processedImage)
      setCurrentStep('result')

    } catch (err: unknown) {
      console.error('Processing error:', err)
      const errorMessage = (err as {response?: {data?: {message?: string}}}).response?.data?.message;
      setError(errorMessage || 'Failed to process image. Please try again.')
      setCurrentStep('filter')
    } finally {
      setProcessing(false)
    }
  }

  const handleStartOver = () => {
    setCurrentStep('upload')
    setSelectedFile(null)
    setSelectedImagePreview(null)
    setSelectedFilter(null)
    setProcessedResult(null)
    setError(null)
  }

  const handleDownload = async () => {
    if (!processedResult || isDownloading) return
    
    setIsDownloading(true)
    try {
      // Fetch the image as a blob to handle CORS properly
      const response = await fetch(processedResult.processedUrl)
      
      if (!response.ok) {
        throw new Error('Failed to fetch image')
      }
      
      const blob = await response.blob()
      
      // Create object URL from blob
      const url = window.URL.createObjectURL(blob)
      
      // Create download link
      const link = document.createElement('a')
      link.href = url
      link.download = `pawstudio-${processedResult.filterName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.jpg`
      document.body.appendChild(link)
      link.click()
      
      // Clean up
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
    } catch (error) {
      console.error('Download failed:', error)
      // Fallback to direct link if fetch fails
      const link = document.createElement('a')
      link.href = processedResult.processedUrl
      link.download = `pawstudio-${processedResult.filterName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.jpg`
      link.target = '_blank'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } finally {
      setIsDownloading(false)
    }
  }

  const handleShare = async () => {
    if (processedResult && navigator.share) {
      try {
        await navigator.share({
          title: `My pet's ${processedResult.filterName} transformation`,
          text: 'Check out this amazing AI transformation of my pet photo!',
          url: window.location.href
        })
      } catch {
        // Fallback to copying URL
        navigator.clipboard.writeText(window.location.href)
      }
    } else {
      // Fallback to copying URL
      navigator.clipboard.writeText(window.location.href)
    }
  }

  const selectedScene = selectedFilter ? scenes.find(s => String(s.id) === selectedFilter) : null

  const steps = [
    { id: 'upload', label: 'Upload', icon: Upload, active: currentStep === 'upload', completed: !!selectedImagePreview },
    { id: 'filter', label: 'Select Scene', icon: Palette, active: currentStep === 'filter', completed: !!selectedFilter },
    { id: 'processing', label: 'Process', icon: Wand2, active: currentStep === 'processing', completed: currentStep === 'result' },
    { id: 'result', label: 'Download', icon: Download, active: currentStep === 'result', completed: false }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Step Indicator */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                AI Photo Editor
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Transform your pet photos with AI magic
              </p>
            </div>
            
            {/* Credits Display with Warning if Low */}
            <div className={`flex items-center space-x-2 px-4 py-2 rounded-full border ${
              (userCredits || 0) < 3 
                ? 'bg-amber-50 border-amber-200' 
                : 'bg-blue-50 border-blue-200'
            }`}>
              <Sparkles className={`w-4 h-4 ${
                (userCredits || 0) < 3 ? 'text-amber-600' : 'text-blue-600'
              }`} />
              <span className={`text-sm font-medium ${
                (userCredits || 0) < 3 ? 'text-amber-900' : 'text-blue-900'
              }`}>
                {userCredits || 0} credit{(userCredits || 0) !== 1 ? 's' : ''}
                {(userCredits || 0) < 3 && ' - Running Low!'}
              </span>
              {(userCredits || 0) < 3 && (
                <Button 
                  size="sm" 
                  variant="outline"
                  className="ml-2 h-6 px-2 text-xs border-amber-300 text-amber-700 hover:bg-amber-100"
                  onClick={() => window.location.href = '/dashboard/credits'}
                >
                  Buy More
                </Button>
              )}
            </div>
          </div>
          
          {/* Step Progress Bar */}
          <div className="pb-6">
            <div className="flex items-center justify-center space-x-8">
              {steps.map((step, index) => {
                const StepIcon = step.icon
                return (
                  <div key={step.id} className="flex items-center">
                    <div className="flex items-center space-x-3">
                      <div className={`
                        w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-200
                        ${step.completed ? 'bg-green-500 text-white' : 
                          step.active ? 'bg-blue-500 text-white' : 
                          'bg-gray-200 text-gray-400'}
                      `}>
                        <StepIcon className="w-5 h-5" />
                      </div>
                      <span className={`text-sm font-medium ${
                        step.active ? 'text-blue-600' : 
                        step.completed ? 'text-green-600' : 
                        'text-gray-400'
                      }`}>
                        {step.label}
                      </span>
                    </div>
                    {index < steps.length - 1 && (
                      <div className={`w-12 h-0.5 mx-4 ${
                        steps[index + 1].completed || steps[index + 1].active ? 'bg-blue-200' : 'bg-gray-200'
                      }`} />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!selectedImagePreview ? (
          /* Upload State - Full Width Upload Area with Tabs */
          <div className="max-w-4xl mx-auto">
            <Card className="bg-white shadow-sm border border-gray-200">
              <CardContent className="p-8">
                <div className="flex items-center justify-center space-x-2 mb-6">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Upload className="w-5 h-5 text-blue-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">Choose Your Pet Photo</h2>
                </div>

                <Tabs value={uploadTab} onValueChange={(val) => setUploadTab(val as 'upload' | 'library')}>
                  <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="upload">📤 Upload New</TabsTrigger>
                    <TabsTrigger value="library">📸 From Library</TabsTrigger>
                  </TabsList>

                  <TabsContent value="upload">
                    <ImageUpload
                      onImageSelect={handleImageSelect}
                      selectedImage={selectedImagePreview || undefined}
                      onImageRemove={handleImageRemove}
                    />
                  </TabsContent>

                  <TabsContent value="library">
                    {isLoadingLibrary ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                      </div>
                    ) : libraryPhotos.length === 0 ? (
                      <div className="text-center py-12">
                        <ImageIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No photos in library</h3>
                        <p className="text-gray-600 mb-6">
                          Upload your first photo to build your library
                        </p>
                        <Button onClick={() => setUploadTab('upload')} variant="outline">
                          <Upload className="mr-2 h-4 w-4" />
                          Upload a Photo
                        </Button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {libraryPhotos.map((photo) => (
                          <div
                            key={photo.id}
                            onClick={() => handleLibraryPhotoSelect(photo)}
                            className="cursor-pointer group relative aspect-square rounded-xl overflow-hidden bg-gray-100 hover:ring-2 hover:ring-blue-500 transition-all"
                          >
                            <Image
                              src={photo.fileUrl}
                              alt={photo.originalFilename}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-200"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
                              <span className="text-white font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                                Select
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
) : (
          /* Editing State - Optimized Layout */
          <div className="space-y-8">
            {/* Top Section - Photo Upload + Scene Selection Side by Side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left - Uploaded Photo */}
              <Card className="bg-white shadow-sm border border-gray-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Upload className="w-4 h-4 text-blue-600" />
                      </div>
                      <h2 className="text-lg font-semibold text-gray-900">Your Photo</h2>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleImageRemove}
                    >
                      Change Photo
                    </Button>
                  </div>
                  
                  <div className="relative aspect-square rounded-xl overflow-hidden bg-gray-100">
                    <Image 
                      src={selectedImagePreview} 
                      alt="Selected pet" 
                      fill
                      className="object-cover"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Right - Scene Selection / Processing / Result */}
              <Card className="bg-white shadow-sm border border-gray-200">
                <CardContent className="p-6">
                  {/* Dynamic Header */}
                  <div className="flex items-center space-x-2 mb-4">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      currentStep === 'result' ? 'bg-green-100' : 
                      currentStep === 'processing' ? 'bg-blue-100' : 'bg-purple-100'
                    }`}>
                      {currentStep === 'result' ? <Camera className="w-4 h-4 text-green-600" /> :
                       currentStep === 'processing' ? <Wand2 className="w-4 h-4 text-blue-600" /> :
                       <Palette className="w-4 h-4 text-purple-600" />}
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      {currentStep === 'result' ? 'Your Transformation' :
                       currentStep === 'processing' ? 'Processing...' : 'Choose Scene'}
                    </h2>
                  </div>
                  
                  {/* Scene Selection State */}
                  {(currentStep === 'filter') && (
                    <div className="space-y-6">
                      <FilterSelection
                        scenes={scenes}
                        selectedFilter={selectedFilter}
                        onFilterSelect={handleFilterSelect}
                        disabled={false}
                        isLoading={isLoadingScenes}
                      />

                      {/* Generate Button */}
                      {selectedFilter && selectedScene && (
                        <div className="pt-4 border-t border-gray-100">
                          <Button
                            onClick={handleProcess}
                            size="lg"
                            disabled={isProcessing}
                            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 text-base rounded-xl"
                          >
                            <Wand2 className="w-5 h-5 mr-2" />
                            Generate Magic ✨
                          </Button>
                          <p className="text-gray-500 text-sm mt-2 text-center">
                            Uses {selectedScene?.credit_cost} credit{selectedScene?.credit_cost !== 1 ? 's' : ''} • {userCredits || 0} available
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Processing State */}
                  {currentStep === 'processing' && (
                    <div className="aspect-square rounded-xl bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center border border-blue-100">
                      <ProcessingStatus
                        isProcessing={isProcessing}
                        filterName={selectedScene?.name}
                      />
                    </div>
                  )}

                  {/* Result State */}
                  {currentStep === 'result' && processedResult && (
                    <div className="space-y-4">
                      {/* Generated Image */}
                      <div className="relative aspect-square rounded-xl overflow-hidden bg-gray-100">
                        <Image 
                          src={processedResult.processedUrl} 
                          alt={`${processedResult.filterName} transformation`}
                          fill
                          className="object-cover"
                        />
                      </div>
                      
                      {/* Filter Name */}
                      <div className="text-center">
                        <h3 className="font-semibold text-gray-900">{processedResult.filterName}</h3>
                        <p className="text-sm text-gray-600">AI Transformation</p>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-col gap-3 pt-2">
                        <Button 
                          onClick={handleDownload}
                          size="lg"
                          disabled={isDownloading}
                          className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white"
                        >
                          {isDownloading ? (
                            <>
                              <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                              Downloading...
                            </>
                          ) : (
                            <>
                              <Download className="w-4 h-4 mr-2" />
                              Download Image
                            </>
                          )}
                        </Button>
                        <div className="grid grid-cols-2 gap-3">
                          <Button 
                            onClick={handleShare}
                            variant="outline"
                            size="sm"
                          >
                            Share
                          </Button>
                          <Button 
                            onClick={handleStartOver}
                            variant="outline"
                            size="sm"
                          >
                            New Image
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="fixed top-20 right-4 max-w-md z-50">
          <Card className="border-red-200 bg-red-50 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-start space-x-2">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-red-900">Error</h4>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

    </div>
  )
}