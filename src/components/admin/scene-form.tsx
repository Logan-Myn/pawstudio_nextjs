'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { X, Save, Loader2, Upload, Image as ImageIcon } from 'lucide-react'
import Image from 'next/image'

interface Scene {
  id: string
  name: string
  description: string
  category?: string | null
  creditCost: number
  isActive: boolean
  promptTemplate: string
  imageReference?: string | null
  createdAt?: string
}

interface SceneFormProps {
  scene?: Scene | null
  isOpen: boolean
  onClose: () => void
  onSave: (scene: Omit<Scene, 'id' | 'createdAt'>) => Promise<void>
}

export function SceneForm({ scene, isOpen, onClose, onSave }: SceneFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    creditCost: 1,
    isActive: true,
    promptTemplate: '',
    imageReference: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [uploadingImage, setUploadingImage] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Update form data when scene changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: scene?.name || '',
        description: scene?.description || '',
        category: scene?.category || '',
        creditCost: scene?.creditCost || 1,
        isActive: scene?.isActive ?? true,
        promptTemplate: scene?.promptTemplate || '',
        imageReference: scene?.imageReference || ''
      })
      setErrors({})
      setSelectedFile(null)
      setPreviewUrl(null)
    }
  }, [scene, isOpen])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Scene name is required'
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required'
    }

    if (!formData.promptTemplate.trim()) {
      newErrors.promptTemplate = 'Prompt template is required'
    }

    if (formData.creditCost < 0) {
      newErrors.creditCost = 'Credit cost must be non-negative'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    try {
      await onSave({
        name: formData.name.trim(),
        description: formData.description.trim(),
        category: formData.category.trim() || null,
        creditCost: formData.creditCost,
        isActive: formData.isActive,
        promptTemplate: formData.promptTemplate.trim(),
        imageReference: formData.imageReference.trim() || null
      })
      onClose()
    } catch (error) {
      console.error('Failed to save scene:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setErrors(prev => ({ ...prev, imageReference: 'Please select an image file' }))
      return
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, imageReference: 'Image must be less than 10MB' }))
      return
    }

    setSelectedFile(file)
    setErrors(prev => ({ ...prev, imageReference: '' }))

    // Create preview URL
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleImageUpload = async () => {
    if (!selectedFile) return

    setUploadingImage(true)
    try {
      const uploadFormData = new FormData()
      uploadFormData.append('image', selectedFile)

      const response = await fetch('/api/admin/scenes/upload', {
        method: 'POST',
        body: uploadFormData
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to upload image')
      }

      const data = await response.json()

      // Update form data with uploaded image URL
      setFormData(prev => ({ ...prev, imageReference: data.url }))
      setSelectedFile(null)
      setPreviewUrl(null)

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error) {
      console.error('Image upload error:', error)
      setErrors(prev => ({
        ...prev,
        imageReference: error instanceof Error ? error.message : 'Failed to upload image'
      }))
    } finally {
      setUploadingImage(false)
    }
  }

  const handleRemoveImage = () => {
    setFormData(prev => ({ ...prev, imageReference: '' }))
    setSelectedFile(null)
    setPreviewUrl(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>
            {scene ? 'Edit Scene' : 'Add New Scene'}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={isSubmitting}
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Scene Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Scene Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="e.g. Studio Portrait"
                disabled={isSubmitting}
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && (
                <p className="text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Describe what this scene produces..."
                rows={3}
                disabled={isSubmitting}
                className={errors.description ? 'border-red-500' : ''}
              />
              {errors.description && (
                <p className="text-sm text-red-600">{errors.description}</p>
              )}
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                placeholder="e.g. artistic, seasonal, professional"
                disabled={isSubmitting}
              />
              <p className="text-sm text-gray-500">
                Optional category to organize scenes (e.g., artistic, seasonal, professional)
              </p>
            </div>

            {/* Credit Cost */}
            <div className="space-y-2">
              <Label htmlFor="creditCost">Credit Cost</Label>
              <Input
                id="creditCost"
                type="number"
                min="0"
                step="1"
                value={formData.creditCost}
                onChange={(e) => handleInputChange('creditCost', parseInt(e.target.value) || 0)}
                disabled={isSubmitting}
                className={errors.creditCost ? 'border-red-500' : ''}
              />
              {errors.creditCost && (
                <p className="text-sm text-red-600">{errors.creditCost}</p>
              )}
            </div>

            {/* Prompt Template */}
            <div className="space-y-2">
              <Label htmlFor="promptTemplate">AI Prompt Template *</Label>
              <Textarea
                id="promptTemplate"
                value={formData.promptTemplate}
                onChange={(e) => handleInputChange('promptTemplate', e.target.value)}
                placeholder="Transform this pet photo into..."
                rows={4}
                disabled={isSubmitting}
                className={errors.promptTemplate ? 'border-red-500' : ''}
              />
              {errors.promptTemplate && (
                <p className="text-sm text-red-600">{errors.promptTemplate}</p>
              )}
              <p className="text-sm text-gray-500">
                This template will be used to generate AI prompts for image processing.
              </p>
            </div>

            {/* Image Reference Upload */}
            <div className="space-y-2">
              <Label htmlFor="imageReference">Reference Image</Label>

              {/* Show current image if exists */}
              {formData.imageReference && !previewUrl && (
                <div className="space-y-2">
                  <div className="relative w-full h-64 border-2 border-gray-300 rounded-lg overflow-hidden bg-gray-50">
                    <Image
                      src={formData.imageReference}
                      alt="Scene reference"
                      fill
                      className="object-contain"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500">Current reference image</p>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (fileInputRef.current) {
                            fileInputRef.current.click()
                          }
                        }}
                        disabled={isSubmitting || uploadingImage}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Replace
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={handleRemoveImage}
                        disabled={isSubmitting || uploadingImage}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Remove
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Show preview of selected file */}
              {previewUrl && (
                <div className="relative w-full h-64 border-2 border-blue-300 rounded-lg overflow-hidden bg-gray-50">
                  <Image
                    src={previewUrl}
                    alt="Preview"
                    fill
                    className="object-contain"
                  />
                  <div className="absolute bottom-2 right-2 flex gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setSelectedFile(null)
                        setPreviewUrl(null)
                        if (fileInputRef.current) fileInputRef.current.value = ''
                      }}
                      disabled={uploadingImage}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleImageUpload}
                      disabled={uploadingImage}
                    >
                      {uploadingImage ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Upload
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {/* File input - hidden but still accessible */}
              <input
                ref={fileInputRef}
                type="file"
                id="imageReference"
                accept="image/*"
                onChange={handleFileSelect}
                disabled={isSubmitting || uploadingImage}
                className="hidden"
              />

              {/* File upload area - only show when no image */}
              {!formData.imageReference && !previewUrl && (
                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                  <label
                    htmlFor="imageReference"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    <ImageIcon className="h-12 w-12 text-gray-400 mb-3" />
                    <span className="text-sm font-medium text-gray-700">
                      Click to upload image
                    </span>
                    <span className="text-xs text-gray-500 mt-1">
                      PNG, JPG or WEBP (max 10MB)
                    </span>
                  </label>
                </div>
              )}

              {errors.imageReference && (
                <p className="text-sm text-red-600">{errors.imageReference}</p>
              )}

              <p className="text-sm text-gray-500">
                Optional reference image to show users what this scene produces.
              </p>
            </div>

            {/* Active Status */}
            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => handleInputChange('isActive', checked)}
                disabled={isSubmitting}
              />
              <Label htmlFor="isActive">Active (visible to users)</Label>
            </div>

            {/* Actions */}
            <div className="flex space-x-3 pt-4">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center space-x-2"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                <span>{isSubmitting ? 'Saving...' : 'Save Scene'}</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}