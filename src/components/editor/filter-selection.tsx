'use client'

import { Scene } from '@/types'
import { Check } from 'lucide-react'

interface FilterSelectionProps {
  scenes: Scene[]
  selectedFilter: string | null
  onFilterSelect: (filterId: string) => void
  disabled?: boolean
  isLoading?: boolean
}

export function FilterSelection({ scenes, selectedFilter, onFilterSelect, disabled, isLoading }: FilterSelectionProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (scenes.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No scenes available
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
      {scenes.map((scene) => {
        const isSelected = selectedFilter === String(scene.id)
        
        return (
          <div
            key={scene.id}
            className={`
              relative aspect-[4/3] rounded-xl overflow-hidden cursor-pointer transition-all duration-200 group
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg hover:-translate-y-1'}
              ${isSelected ? 'ring-3 ring-blue-500 shadow-lg' : 'shadow-sm'}
            `}
            onClick={() => !disabled && onFilterSelect(String(scene.id))}
          >
            <div className="w-full h-full relative bg-gradient-to-br from-slate-300 to-gray-400">
              {scene.preview_image ? (
                <img
                  src={scene.preview_image}
                  alt={scene.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-slate-200 via-gray-300 to-slate-400 flex items-center justify-center">
                  <span className="text-4xl">{getCategoryEmoji(scene.category || '')}</span>
                </div>
              )}

              {/* Overlay for better text readability */}
              <div className="absolute inset-0 bg-black/10 group-hover:bg-black/5 transition-colors" />

              {/* Scene name */}
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <div className="bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2">
                  <h4 className="font-semibold text-gray-900 text-sm">
                    {scene.name}
                  </h4>
                  <p className="text-xs text-gray-600 mt-0.5">
                    {scene.credit_cost} credit{scene.credit_cost !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              {/* Selection indicator */}
              {isSelected && (
                <div className="absolute top-3 right-3">
                  <div className="bg-blue-500 rounded-full p-1.5 shadow-md">
                    <Check className="h-3 w-3 text-white" />
                  </div>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function getCategoryEmoji(category: string): string {
  const emojiMap: Record<string, string> = {
    'professional': '✨',
    'seasonal': '❄️',
    'artistic': '🎨',
    'fun': '🎉',
  }
  return emojiMap[category] || '🎭'
}

