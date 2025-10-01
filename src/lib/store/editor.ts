import { create } from 'zustand'
import { ProcessedImage } from '@/types'

interface EditorState {
  currentImage: string | null
  selectedFilter: string | null
  isProcessing: boolean
  processedImages: ProcessedImage[]
  setCurrentImage: (image: string | null) => void
  setSelectedFilter: (filter: string | null) => void
  setProcessing: (processing: boolean) => void
  addProcessedImage: (image: ProcessedImage) => void
  setProcessedImages: (images: ProcessedImage[]) => void
}

export const useEditorStore = create<EditorState>((set) => ({
  currentImage: null,
  selectedFilter: null,
  isProcessing: false,
  processedImages: [],
  setCurrentImage: (currentImage) => set({ currentImage }),
  setSelectedFilter: (selectedFilter) => set({ selectedFilter }),
  setProcessing: (isProcessing) => set({ isProcessing }),
  addProcessedImage: (image) => set((state) => ({ 
    processedImages: [image, ...state.processedImages] 
  })),
  setProcessedImages: (processedImages) => set({ processedImages }),
}))