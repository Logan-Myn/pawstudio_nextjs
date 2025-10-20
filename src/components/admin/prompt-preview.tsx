'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertCircle, Upload, Sparkles, CheckCircle, XCircle, Loader2, Archive } from 'lucide-react'

interface PromptTest {
  name: string
  category?: string
  prompt: string
}

interface PreviewResult extends PromptTest {
  success: boolean
  previewImage?: string
  error?: string
  selected?: boolean
}

const exampleJson = `[
  {
    "name": "Vintage Portrait",
    "category": "artistic",
    "prompt": "Transform this pet into a vintage sepia-toned portrait from the 1920s, with soft lighting and classic studio backdrop"
  },
  {
    "name": "Cyberpunk Style",
    "category": "futuristic",
    "prompt": "Convert this pet photo into a cyberpunk aesthetic with neon colors, holographic effects, and futuristic city background"
  }
]`

export function PromptPreview() {
  const [jsonInput, setJsonInput] = useState<string>(exampleJson)
  const [testImageInput, setTestImageInput] = useState<string>('')
  const [testImageFile, setTestImageFile] = useState<File | null>(null)
  const [testImagePreview, setTestImagePreview] = useState<string>('')
  const [processing, setProcessing] = useState(false)
  const [results, setResults] = useState<PreviewResult[]>([])
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [archiving, setArchiving] = useState<Set<number>>(new Set())

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setTestImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setTestImagePreview(reader.result as string)
        setTestImageInput('')
      }
      reader.readAsDataURL(file)
    }
  }

  const handleImageUrlChange = (url: string) => {
    setTestImageInput(url)
    if (url.startsWith('http://') || url.startsWith('https://')) {
      setTestImagePreview(url)
      setTestImageFile(null)
    }
  }

  const handleGeneratePreviews = async () => {
    setError(null)
    setResults([])

    // Validate JSON input
    let prompts: PromptTest[]
    try {
      prompts = JSON.parse(jsonInput)
      if (!Array.isArray(prompts)) {
        throw new Error('JSON must be an array of prompts')
      }
      if (prompts.length === 0) {
        throw new Error('At least one prompt is required')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid JSON format')
      return
    }

    // Validate test image
    if (!testImagePreview) {
      setError('Please upload a test image or provide an image URL')
      return
    }

    setProcessing(true)

    try {
      const response = await fetch('/api/admin/scenes/preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          testImage: testImagePreview,
          prompts: prompts,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate previews')
      }

      const data = await response.json()
      setResults(data.results.map((r: PreviewResult) => ({ ...r, selected: false })))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate previews')
    } finally {
      setProcessing(false)
    }
  }

  const toggleSelection = (index: number) => {
    setResults(prev => prev.map((r, i) =>
      i === index ? { ...r, selected: !r.selected } : r
    ))
  }

  const handleArchivePreview = async (index: number) => {
    const result = results[index]

    if (!result.success || !result.previewImage) {
      return
    }

    setArchiving(prev => new Set(prev).add(index))
    setError(null)

    try {
      const response = await fetch('/api/admin/scenes/preview/archive', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: result.name,
          category: result.category,
          prompt: result.prompt,
          previewImage: result.previewImage,
          testImageUrl: testImagePreview
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to archive preview')
      }

      alert(`"${result.name}" has been archived successfully!`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to archive preview')
    } finally {
      setArchiving(prev => {
        const newSet = new Set(prev)
        newSet.delete(index)
        return newSet
      })
    }
  }

  const handleAddToApp = async () => {
    const selectedResults = results.filter(r => r.selected && r.success)

    if (selectedResults.length === 0) {
      setError('Please select at least one successful prompt to add')
      return
    }

    setSaving(true)
    setError(null)

    try {
      const creationPromises = selectedResults.map(async result => {
        let imageReference = null

        // Upload preview image to B2 if available
        if (result.previewImage) {
          try {
            // Convert base64 to blob
            const base64Data = result.previewImage.split(',')[1]
            const byteCharacters = atob(base64Data)
            const byteNumbers = new Array(byteCharacters.length)
            for (let i = 0; i < byteCharacters.length; i++) {
              byteNumbers[i] = byteCharacters.charCodeAt(i)
            }
            const byteArray = new Uint8Array(byteNumbers)
            const blob = new Blob([byteArray], { type: 'image/jpeg' })

            // Create form data for upload
            const formData = new FormData()
            formData.append('image', blob, `${result.name.replace(/\s+/g, '-').toLowerCase()}-preview.jpg`)

            // Upload to B2
            const uploadResponse = await fetch('/api/admin/scenes/upload', {
              method: 'POST',
              body: formData,
            })

            if (uploadResponse.ok) {
              const uploadData = await uploadResponse.json()
              imageReference = uploadData.url
            } else {
              console.error(`Failed to upload preview image for ${result.name}`)
            }
          } catch (uploadError) {
            console.error(`Error uploading preview image for ${result.name}:`, uploadError)
          }
        }

        // Create scene with uploaded image reference
        const response = await fetch('/api/admin/scenes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: result.name,
            description: `AI-generated scene: ${result.name}`,
            category: result.category || null,
            promptTemplate: result.prompt,
            creditCost: 1,
            imageReference: imageReference,
            isActive: false,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || `Failed to create scene: ${result.name}`)
        }

        return response.json()
      })

      await Promise.all(creationPromises)

      alert(`Successfully added ${selectedResults.length} scene(s) to the app with preview images! They are set to inactive by default.`)

      // Clear selections
      setResults(prev => prev.map(r => ({ ...r, selected: false })))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add scenes')
    } finally {
      setSaving(false)
    }
  }

  const selectedCount = results.filter(r => r.selected && r.success).length

  return (
    <div className="space-y-6">
      {/* Instructions */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="space-y-2 text-sm text-blue-900">
              <p className="font-semibold">How to use this tool:</p>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>Upload a test image or provide an image URL (this will be used for all prompts)</li>
                <li>Paste your prompts in JSON format or edit the example below</li>
                <li>Click "Generate Previews" to test all prompts with the test image</li>
                <li>Review the generated previews and select the ones you want to add</li>
                <li>Click "Add Selected to App" to create new scenes (they will be inactive by default)</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test Image Upload */}
      <Card>
        <CardHeader>
          <CardTitle>Test Image</CardTitle>
          <CardDescription>
            Upload or provide a URL for the test image. This image will be processed with all prompts.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="image-upload">Upload Image</Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={processing}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="image-url">Or Image URL</Label>
              <Input
                id="image-url"
                type="text"
                placeholder="https://example.com/image.jpg"
                value={testImageInput}
                onChange={(e) => handleImageUrlChange(e.target.value)}
                disabled={processing}
              />
            </div>
          </div>
          {testImagePreview && (
            <div className="mt-4">
              <p className="text-sm text-gray-600 mb-2">Preview:</p>
              <div className="relative w-32 h-32 rounded-lg overflow-hidden border-2 border-gray-200">
                <img
                  src={testImagePreview}
                  alt="Test image preview"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* JSON Input */}
      <Card>
        <CardHeader>
          <CardTitle>Prompts (JSON)</CardTitle>
          <CardDescription>
            Paste your prompts in JSON format. Each prompt should have a name, optional category, and prompt text.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            placeholder={exampleJson}
            rows={12}
            className="font-mono text-sm"
            disabled={processing}
          />
          <Button
            onClick={handleGeneratePreviews}
            disabled={processing || !testImagePreview}
            size="lg"
            className="w-full"
          >
            {processing ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Generating Previews...
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5 mr-2" />
                Generate Previews
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-center space-x-2 py-4">
            <XCircle className="h-5 w-5 text-red-600" />
            <span className="text-red-800">{error}</span>
          </CardContent>
        </Card>
      )}

      {/* Results Grid */}
      {results.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">
              Preview Results ({results.filter(r => r.success).length} successful)
            </h2>
            {selectedCount > 0 && (
              <Button
                onClick={handleAddToApp}
                disabled={saving}
                size="lg"
                variant="default"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Upload className="h-5 w-5 mr-2" />
                    Add Selected to App ({selectedCount})
                  </>
                )}
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {results.map((result, index) => (
              <Card
                key={index}
                className={`relative ${
                  result.selected ? 'ring-2 ring-green-500 border-green-300' : ''
                } ${!result.success ? 'opacity-60' : ''}`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{result.name}</CardTitle>
                      <CardDescription className="text-xs mt-1">
                        {result.category || 'uncategorized'}
                      </CardDescription>
                    </div>
                    {result.success ? (
                      <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {result.success && result.previewImage ? (
                    <>
                      <div className="relative w-full aspect-square rounded-lg overflow-hidden border-2 border-gray-200">
                        <img
                          src={result.previewImage}
                          alt={`Preview for ${result.name}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`select-${index}`}
                            checked={result.selected || false}
                            onChange={() => toggleSelection(index)}
                            className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                          />
                          <Label htmlFor={`select-${index}`} className="cursor-pointer">
                            Select to add to app
                          </Label>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleArchivePreview(index)}
                          disabled={archiving.has(index)}
                          className="w-full"
                        >
                          {archiving.has(index) ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Archiving...
                            </>
                          ) : (
                            <>
                              <Archive className="h-4 w-4 mr-2" />
                              Save to Archive
                            </>
                          )}
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <p className="text-sm text-red-800">
                        {result.error || 'Processing failed'}
                      </p>
                    </div>
                  )}
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-gray-600">Prompt:</p>
                    <p className="text-xs text-gray-700 line-clamp-3">
                      {result.prompt}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
