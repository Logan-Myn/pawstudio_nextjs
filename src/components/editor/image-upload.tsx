'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Upload, X, RotateCw, Image as ImageIcon } from 'lucide-react'
import Image from 'next/image'

interface ImageUploadProps {
  onImageSelect: (file: File, preview: string) => void
  selectedImage?: string
  onImageRemove: () => void
}

export function ImageUpload({ onImageSelect, selectedImage, onImageRemove }: ImageUploadProps) {
  const [isDragActive, setIsDragActive] = useState(false)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file) {
      const preview = URL.createObjectURL(file)
      onImageSelect(file, preview)
    }
  }, [onImageSelect])

  const { getRootProps, getInputProps, open } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    maxFiles: 1,
    multiple: false,
    onDragEnter: () => setIsDragActive(true),
    onDragLeave: () => setIsDragActive(false),
    onDropAccepted: () => setIsDragActive(false),
    onDropRejected: () => setIsDragActive(false),
    noClick: !!selectedImage // Disable click when image is selected
  })

  if (selectedImage) {
    return (
      <Card className="relative overflow-hidden">
        <div className="aspect-square relative bg-gray-50">
          <Image
            src={selectedImage}
            alt="Selected pet photo"
            fill
            className="object-cover"
          />
          
          {/* Image overlay controls */}
          <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
            <div className="flex space-x-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={open}
                className="bg-white/20 hover:bg-white/30 text-white border-white/20"
              >
                <RotateCw className="h-4 w-4 mr-2" />
                Change Photo
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={onImageRemove}
                className="bg-red-500/80 hover:bg-red-500 text-white border-red-500/20"
              >
                <X className="h-4 w-4 mr-2" />
                Remove
              </Button>
            </div>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card 
      {...getRootProps()} 
      className={`
        border-2 border-dashed transition-all duration-200 cursor-pointer
        hover:border-blue-400 hover:bg-blue-50/50
        ${isDragActive ? 'border-blue-500 bg-blue-50 scale-102' : 'border-gray-300'}
      `}
    >
      <input {...getInputProps()} />
      <div className="p-12 text-center">
        <div className={`
          mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-colors
          ${isDragActive ? 'bg-blue-100' : 'bg-gray-100'}
        `}>
          {isDragActive ? (
            <Upload className="w-8 h-8 text-blue-600" />
          ) : (
            <ImageIcon className="w-8 h-8 text-gray-400" />
          )}
        </div>
        
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {isDragActive ? 'Drop your photo here' : 'Upload your pet photo'}
        </h3>
        
        <p className="text-gray-600 mb-6">
          {isDragActive 
            ? 'Release to upload' 
            : 'Drag and drop your image here, or click to browse'
          }
        </p>
        
        <Button 
          type="button" 
          variant="outline"
          className="pointer-events-none"
        >
          <Upload className="w-4 h-4 mr-2" />
          Choose File
        </Button>
        
        <p className="text-sm text-gray-500 mt-4">
          Supports: JPEG, PNG, WebP (Max 25MB)
        </p>
      </div>
    </Card>
  )
}