'use client'

import { FILTER_TYPES } from '@/types'
import { Check } from 'lucide-react'

interface FilterSelectionProps {
  selectedFilter: string | null
  onFilterSelect: (filterId: string) => void
  disabled?: boolean
}

export function FilterSelection({ selectedFilter, onFilterSelect, disabled }: FilterSelectionProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
      {FILTER_TYPES.map((filter) => {
        const isSelected = selectedFilter === filter.id
        
        return (
          <div
            key={filter.id}
            className={`
              relative aspect-[4/3] rounded-xl overflow-hidden cursor-pointer transition-all duration-200 group
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg hover:-translate-y-1'}
              ${isSelected ? 'ring-3 ring-blue-500 shadow-lg' : 'shadow-sm'}
            `}
            onClick={() => !disabled && onFilterSelect(filter.id)}
          >
            <div className={`w-full h-full ${getFilterBackground(filter.id)} relative`}>
              {/* Overlay for better text readability */}
              <div className="absolute inset-0 bg-black/10 group-hover:bg-black/5 transition-colors" />
              
              {/* Filter name */}
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <div className="bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2">
                  <h4 className="font-semibold text-gray-900 text-sm">
                    {filter.name}
                  </h4>
                  <p className="text-xs text-gray-600 mt-0.5">
                    {filter.creditCost} credit{filter.creditCost !== 1 ? 's' : ''}
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

function getFilterBackground(filterId: string): string {
  const backgrounds: Record<string, string> = {
    'studio_bw': 'bg-gradient-to-br from-slate-200 via-gray-300 to-slate-400',
    'painted_portrait': 'bg-gradient-to-br from-amber-200 via-orange-300 to-red-400',
    'pop_art': 'bg-gradient-to-br from-pink-300 via-purple-400 to-blue-400',
    'seasonal_winter': 'bg-gradient-to-br from-blue-200 via-cyan-300 to-teal-400',
  }
  return backgrounds[filterId] || 'bg-gradient-to-br from-slate-300 to-gray-400'
}

