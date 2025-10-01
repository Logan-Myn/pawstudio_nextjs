'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { X, Save, Loader2 } from 'lucide-react'

interface Scene {
  id: string
  name: string
  description: string
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
    name: scene?.name || '',
    description: scene?.description || '',
    creditCost: scene?.creditCost || 1,
    isActive: scene?.isActive ?? true,
    promptTemplate: scene?.promptTemplate || '',
    imageReference: scene?.imageReference || ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

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

            {/* Image Reference */}
            <div className="space-y-2">
              <Label htmlFor="imageReference">Image Reference (URL)</Label>
              <Input
                id="imageReference"
                type="url"
                value={formData.imageReference}
                onChange={(e) => handleInputChange('imageReference', e.target.value)}
                placeholder="https://example.com/reference-image.jpg"
                disabled={isSubmitting}
              />
              <p className="text-sm text-gray-500">
                Optional reference image URL to show users what this scene produces.
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