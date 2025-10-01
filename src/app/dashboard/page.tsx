'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuthStore } from '@/lib/store/auth'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Image as ImageIcon, Loader2 } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

const FILTERS = [
  { id: 'studio_portrait', name: 'Professional Studio', emoji: '🎭', category: 'professional' },
  { id: 'painted_portrait', name: 'Painted Portrait', emoji: '🎨', category: 'professional' },
  { id: 'pop_art', name: 'Pop Art', emoji: '✨', category: 'professional' },
  { id: 'seasonal_winter', name: 'Winter Wonderland', emoji: '❄️', category: 'seasonal' },
]

const CATEGORIES = [
  { id: 'all', name: 'All', emoji: '' },
  { id: 'professional', name: 'Professional', emoji: '✨' },
  { id: 'seasonal', name: 'Seasonal', emoji: '❄️' },
]

type Phase = 'selection' | 'loading' | 'result' | 'error'

export default function DashboardPage() {
  const { user, credits, setCredits } = useAuthStore()
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [phase, setPhase] = useState<Phase>('selection')
  const [resultImage, setResultImage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [activeTab, setActiveTab] = useState<'upload' | 'library'>('upload')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Extract first name from email
  const firstName = user?.name || user?.email?.split('@')[0]?.split('.')[0] || 'there'
  const capitalizedName = firstName.charAt(0).toUpperCase() + firstName.slice(1)

  // Filter scenes by category
  const filteredFilters = selectedCategory === 'all'
    ? FILTERS
    : FILTERS.filter(f => f.category === selectedCategory)

  useEffect(() => {
    if (phase === 'loading') {
      timerRef.current = setInterval(() => {
        setElapsedTime(prev => prev + 1)
      }, 1000)
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
      setElapsedTime(0)
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [phase])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setUploadedFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setUploadedImage(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith('image/')) {
      setUploadedFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setUploadedImage(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleGenerate = async () => {
    if (!uploadedFile || !selectedFilter) return

    setPhase('loading')
    setError(null)

    try {
      // Upload image
      const formData = new FormData()
      formData.append('image', uploadedFile)

      const uploadRes = await fetch('/api/images/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      })

      if (!uploadRes.ok) {
        throw new Error('Failed to upload image')
      }

      const uploadData = await uploadRes.json()

      // Process image
      const processRes = await fetch('/api/images/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          imageUrl: uploadData.url,
          filterId: selectedFilter,
        }),
      })

      if (!processRes.ok) {
        const errorData = await processRes.json()
        throw new Error(errorData.error || 'Failed to process image')
      }

      const processData = await processRes.json()

      // Update credits
      setCredits(credits - 1)

      setResultImage(processData.processedUrl)
      setPhase('result')
    } catch (err) {
      console.error('Generation error:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate image')
      setPhase('error')
    }
  }

  const handleCreateAnother = () => {
    setPhase('selection')
    setUploadedImage(null)
    setUploadedFile(null)
    setSelectedFilter(null)
    setResultImage(null)
    setError(null)
  }

  const handleDownload = () => {
    if (resultImage) {
      const link = document.createElement('a')
      link.href = resultImage
      link.download = `pawstudio-${Date.now()}.jpg`
      link.click()
    }
  }

  const isGenerateEnabled = uploadedImage && selectedFilter && credits > 0

  return (
    <div className="min-h-screen">
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-gray-800 via-orange-800 to-red-800">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-50/5 to-transparent"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="text-center text-white">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 text-white">
              Your studio awaits, {capitalizedName}
            </h1>
            <p className="text-xl sm:text-2xl text-orange-100 max-w-3xl mx-auto leading-relaxed">
              What masterpiece will you create today?
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Inline Generation Form */}
        <div className="mb-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column: Upload Area */}
            <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center">
                <svg className="w-6 h-6 mr-3 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                </svg>
                Select Your Pet Photo
              </h2>
              <p className="text-gray-600 mb-6">Upload a new photo or choose from your library</p>

              {/* Photo Source Tabs */}
              <div className="flex gap-2 mb-6">
                <button
                  onClick={() => setActiveTab('upload')}
                  className={`flex-1 px-4 py-2 rounded-xl font-medium text-sm shadow-sm transition-all ${
                    activeTab === 'upload'
                      ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white'
                      : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  Upload New
                </button>
                <button
                  onClick={() => setActiveTab('library')}
                  className={`flex-1 px-4 py-2 rounded-xl font-medium text-sm shadow-sm transition-all ${
                    activeTab === 'library'
                      ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white'
                      : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  From Library
                </button>
              </div>

              {/* Upload Tab Content */}
              {activeTab === 'upload' && (
                <div>
                  {!uploadedImage ? (
                    <div
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-orange-300 rounded-2xl p-8 text-center hover:border-orange-400 hover:bg-orange-50/50 transition-all duration-300 cursor-pointer"
                    >
                      <div className="mb-4">
                        <svg className="mx-auto w-16 h-16 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                        </svg>
                      </div>
                      <p className="text-lg font-semibold text-gray-900 mb-2">Drag & drop your photo here</p>
                      <p className="text-gray-500">or click to browse</p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileSelect}
                      />
                    </div>
                  ) : (
                    <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                      <img src={uploadedImage} alt="Preview" className="w-full h-80 object-cover rounded-2xl shadow-lg" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl flex flex-col justify-between p-6">
                        <div className="text-white">
                          <h3 className="font-semibold text-lg mb-1">{uploadedFile?.name}</h3>
                          <p className="text-white/70 text-sm">{uploadedFile ? (uploadedFile.size / 1024 / 1024).toFixed(2) + ' MB' : ''}</p>
                        </div>
                        <div className="flex justify-center">
                          <button type="button" className="bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-lg font-medium hover:bg-white/30 transition-colors">
                            📷 Change Photo
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Library Tab Content */}
              {activeTab === 'library' && (
                <div className="h-80 overflow-y-auto bg-gray-50 rounded-2xl p-4">
                  <div className="text-center py-12">
                    <div className="text-gray-400 text-4xl mb-4">📸</div>
                    <p className="text-gray-500 mb-4">No photos uploaded yet</p>
                    <p className="text-sm text-gray-400">Upload a photo using the "Upload New" tab</p>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Scene Selection / Loading / Result */}
            <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-200 w-full max-w-full overflow-hidden">
              {/* Scene Selection Phase */}
              {phase === 'selection' && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center">
                    <svg className="w-6 h-6 mr-3 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 4v10l4-3 4 3V8H7z"></path>
                    </svg>
                    Choose Your Scene
                  </h2>
                  <p className="text-gray-600 mb-6">Select the perfect backdrop for your pet's transformation</p>

                  {/* Category Tabs */}
                  <div className="mb-6 overflow-x-auto">
                    <div className="flex gap-2 pb-2">
                      {CATEGORIES.map((category) => (
                        <button
                          key={category.id}
                          onClick={() => setSelectedCategory(category.id)}
                          className={`px-4 py-2 rounded-xl font-medium text-sm whitespace-nowrap flex-shrink-0 transition-all ${
                            selectedCategory === category.id
                              ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-sm'
                              : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          {category.emoji && <span className="mr-2">{category.emoji}</span>}
                          {category.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Scene Gallery */}
                  <div className="h-80 overflow-y-auto bg-gray-50 rounded-2xl p-4">
                    <div className="grid grid-cols-2 gap-4">
                      {filteredFilters.map((filter) => (
                        <div
                          key={filter.id}
                          onClick={() => setSelectedFilter(filter.id)}
                          className={`cursor-pointer group ${selectedFilter === filter.id ? 'selected' : ''}`}
                        >
                          <div className="aspect-square bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 relative border border-gray-100">
                            <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center">
                              <div className="text-4xl">{filter.emoji}</div>
                            </div>

                            {/* Hover overlay */}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-all duration-200 flex items-end rounded-xl">
                              <div className="p-3 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                <div className="font-semibold text-sm">{filter.name}</div>
                              </div>
                            </div>

                            {/* Selection indicator */}
                            <div className={`absolute top-2 right-2 w-6 h-6 rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-white flex items-center justify-center text-sm font-bold shadow-lg transition-all duration-200 ${
                              selectedFilter === filter.id ? 'opacity-100 scale-100' : 'opacity-0 scale-0'
                            }`}>
                              ✓
                            </div>
                          </div>

                          {/* Scene name below */}
                          <div className="text-center mt-3">
                            <div className="text-sm font-medium text-gray-900 truncate">{filter.name}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Generate Button */}
                  <div className="mt-8">
                    {credits < 1 ? (
                      <>
                        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-4">
                          <div className="flex items-center text-red-800">
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                            </svg>
                            <span className="font-medium">Insufficient credits to generate image</span>
                          </div>
                        </div>
                        <Link href="/dashboard/credits">
                          <Button className="w-full bg-orange-600 text-white py-4 px-6 rounded-2xl font-bold text-lg hover:bg-orange-700 transition-colors">
                            🚀 Get Credits
                          </Button>
                        </Link>
                      </>
                    ) : (
                      <>
                        <Button
                          onClick={handleGenerate}
                          disabled={!isGenerateEnabled}
                          className="w-full bg-gradient-to-r from-orange-500 via-red-500 to-orange-600 text-white py-4 px-6 rounded-2xl font-bold text-lg shadow-xl hover:shadow-orange-500/25 transform hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:transform-none disabled:hover:shadow-xl"
                        >
                          <span className="flex items-center justify-center">
                            <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                            </svg>
                            Generate My Pet Photo
                          </span>
                        </Button>
                        <p className="text-center text-sm text-gray-500 mt-3">This usually takes 30-60 seconds</p>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Loading Phase */}
              {phase === 'loading' && (
                <div className="text-center py-8">
                  <div className="animate-spin w-16 h-16 border-4 border-orange-200 border-t-orange-600 rounded-full mx-auto mb-6"></div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Creating Your Magic ✨</h3>
                  <p className="text-gray-600 mb-6">Our AI is working hard to transform your pet photo...</p>

                  <div className="bg-gray-50 rounded-2xl p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-600">Processing time:</span>
                      <span className="text-sm font-mono text-gray-900">{elapsedTime}s</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-orange-500 to-red-500 h-2 rounded-full transition-all duration-1000"
                        style={{ width: `${Math.min((elapsedTime / 60) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>

                  <p className="text-xs text-gray-400 mt-4">Please don't close this page...</p>
                </div>
              )}

              {/* Result Phase */}
              {phase === 'result' && resultImage && (
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">🎉 Your Pet Photo is Ready!</h3>

                  <div className="mb-6">
                    <img src={resultImage} alt="Generated pet photo" className="rounded-2xl shadow-xl max-h-80 mx-auto" />
                  </div>

                  <div className="flex flex-col gap-3">
                    <Button
                      onClick={handleDownload}
                      className="bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 px-6 rounded-2xl font-semibold hover:from-orange-600 hover:to-red-600 transition-all duration-300"
                    >
                      📥 Download
                    </Button>
                    <Button
                      onClick={handleCreateAnother}
                      variant="outline"
                      className="bg-gray-100 text-gray-900 py-3 px-6 rounded-2xl font-semibold hover:bg-gray-200 transition-colors"
                    >
                      ✨ Create Another
                    </Button>
                  </div>
                </div>
              )}

              {/* Error Phase */}
              {phase === 'error' && (
                <div>
                  <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-4">
                    <div className="flex items-start">
                      <svg className="w-5 h-5 text-red-600 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                      <div>
                        <h3 className="font-semibold text-red-900 mb-1">Generation Failed</h3>
                        <div className="text-sm text-red-700">{error || 'Something went wrong with your generation.'}</div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-6">
                    <div className="flex items-center text-green-800">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                      <span className="text-sm">Your credit has been refunded automatically.</span>
                    </div>
                  </div>

                  <Button
                    onClick={handleCreateAnother}
                    className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 px-6 rounded-2xl font-semibold hover:from-orange-600 hover:to-red-600 transition-colors"
                  >
                    Try Again
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
