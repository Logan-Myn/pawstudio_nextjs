'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Download, Share2, RotateCcw, Sparkles } from 'lucide-react'
import Image from 'next/image'
import { ProcessedImage } from '@/types'

interface ResultDisplayProps {
  result: ProcessedImage
  originalImage: string
  onStartOver: () => void
  onDownload: () => void
  onShare: () => void
}

export function ResultDisplay({ 
  result, 
  originalImage, 
  onStartOver, 
  onDownload, 
  onShare 
}: ResultDisplayProps) {
  return (
    <div className="space-y-6">
      {/* Success Message */}
      <Card className="border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <div className="bg-green-500 rounded-full p-2">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-green-900">Transformation Complete!</h3>
              <p className="text-sm text-green-700">
                Your pet photo has been transformed with the <strong>{result.filterName}</strong> filter
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Before/After Comparison */}
      <Card>
        <CardContent className="p-0">
          <div className="grid grid-cols-1 md:grid-cols-2">
            {/* Original */}
            <div className="p-4 space-y-3">
              <h4 className="font-medium text-gray-700 text-sm uppercase tracking-wide">
                Original
              </h4>
              <div className="aspect-square relative bg-gray-100 rounded-lg overflow-hidden">
                <Image
                  src={originalImage}
                  alt="Original pet photo"
                  fill
                  className="object-cover"
                />
              </div>
            </div>

            {/* Transformed */}
            <div className="p-4 space-y-3 bg-gradient-to-br from-purple-50 to-blue-50">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-purple-700 text-sm uppercase tracking-wide">
                  Transformed ✨
                </h4>
                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                  {result.filterName}
                </span>
              </div>
              <div className="aspect-square relative bg-gray-100 rounded-lg overflow-hidden ring-2 ring-purple-200">
                <Image
                  src={result.processedUrl}
                  alt={`Pet photo with ${result.filterName} filter`}
                  fill
                  className="object-cover"
                />
                
                {/* Sparkle overlay effect */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent pointer-events-none" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button 
          onClick={onDownload}
          size="lg"
          className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          <Download className="w-5 h-5 mr-2" />
          Download Image
        </Button>
        
        <Button 
          onClick={onShare}
          variant="outline"
          size="lg"
          className="flex-1"
        >
          <Share2 className="w-5 h-5 mr-2" />
          Share Result
        </Button>
        
        <Button 
          onClick={onStartOver}
          variant="outline"
          size="lg"
          className="sm:w-auto"
        >
          <RotateCcw className="w-5 h-5 mr-2" />
          Start Over
        </Button>
      </div>

      {/* Tips */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-start space-x-2">
            <Sparkles className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900 mb-1">Pro Tips</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Download in high resolution for printing</li>
                <li>• Share on social media with #PawStudioAI</li>
                <li>• Try different filters for various moods</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}