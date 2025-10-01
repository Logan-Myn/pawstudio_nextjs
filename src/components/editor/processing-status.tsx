'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Loader2, Sparkles, Brain } from 'lucide-react'
import { useEffect, useState } from 'react'

interface ProcessingStatusProps {
  isProcessing: boolean
  filterName?: string
}

const processingSteps = [
  { label: 'Uploading image...', duration: 1000 },
  { label: 'Analyzing pet features...', duration: 2000 },
  { label: 'Applying AI filter...', duration: 3000 },
  { label: 'Enhancing details...', duration: 2000 },
  { label: 'Finalizing result...', duration: 1000 },
]

export function ProcessingStatus({ isProcessing, filterName }: ProcessingStatusProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (!isProcessing) {
      setCurrentStep(0)
      setProgress(0)
      return
    }

    let stepIndex = 0
    let totalTime = 0
    const totalDuration = processingSteps.reduce((sum, step) => sum + step.duration, 0)

    const stepTimer = () => {
      if (stepIndex < processingSteps.length) {
        setCurrentStep(stepIndex)
        
        const stepDuration = processingSteps[stepIndex].duration
        const startTime = totalTime
        const endTime = totalTime + stepDuration
        
        // Animate progress within the step
        const progressTimer = setInterval(() => {
          const elapsed = Date.now() - startTime
          const stepProgress = Math.min(elapsed / stepDuration, 1)
          const overallProgress = ((startTime + elapsed) / totalDuration) * 100
          
          setProgress(Math.min(overallProgress, 100))
          
          if (stepProgress >= 1) {
            clearInterval(progressTimer)
            totalTime = endTime
            stepIndex++
            setTimeout(stepTimer, 100)
          }
        }, 50)
      }
    }

    stepTimer()
  }, [isProcessing])

  if (!isProcessing) return null

  return (
    <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50">
      <CardContent className="p-6">
        <div className="text-center space-y-4">
          {/* AI Brain Animation */}
          <div className="relative mx-auto w-16 h-16">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full animate-pulse opacity-20"></div>
            <div className="absolute inset-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
              <Brain className="w-8 h-8 text-white animate-bounce" />
            </div>
            <Sparkles className="absolute -top-1 -right-1 w-4 h-4 text-yellow-500 animate-spin" />
          </div>
          
          {/* Processing Title */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              AI is working its magic ✨
            </h3>
            <p className="text-sm text-gray-600">
              Applying <span className="font-medium text-purple-600">{filterName}</span> filter to your pet photo
            </p>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-gray-500">
              {Math.round(progress)}% complete
            </p>
          </div>

          {/* Current Step */}
          <div className="bg-white/60 rounded-lg p-3">
            <div className="flex items-center justify-center space-x-2">
              <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
              <span className="text-sm font-medium text-gray-700">
                {processingSteps[currentStep]?.label || 'Processing...'}
              </span>
            </div>
          </div>

          {/* Fun Fact */}
          <div className="text-xs text-gray-500 bg-white/40 rounded-lg p-2">
            💡 <strong>Did you know?</strong> Our AI analyzes over 1,000 facial features to create the perfect transformation while keeping your pet recognizable!
          </div>
        </div>
      </CardContent>
    </Card>
  )
}