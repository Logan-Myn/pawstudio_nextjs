export interface User {
  id: string
  email: string
  fullName: string
  createdAt: string
  credits: number
  role: 'user' | 'admin' | 'super_admin'
}

export interface FilterType {
  id: string
  name: string
  description: string
  creditCost: number
}

export interface CreditPackage {
  id: string
  name: string
  credits: number
  price: number
}

export interface ProcessedImage {
  id: string
  originalUrl: string
  processedUrl: string
  filterId: string
  filterName: string
  createdAt: string
  userId: string
}

export interface Transaction {
  id: string
  userId: string
  type: 'purchase' | 'usage'
  amount: number
  description: string
  createdAt: string
}

export const FILTER_TYPES: FilterType[] = [
  {
    id: 'studio_bw',
    name: 'Studio Black & White',
    description: 'Professional black and white studio portrait with dramatic lighting',
    creditCost: 1,
  },
  {
    id: 'painted_portrait',
    name: 'Classic Painted Portrait', 
    description: 'Oil painting style portrait with artistic brushstrokes',
    creditCost: 1,
  },
  {
    id: 'pop_art',
    name: 'Pop Art Vibrant',
    description: 'Colorful pop art style with bold graphics',
    creditCost: 1,
  },
  {
    id: 'seasonal_winter',
    name: 'Winter Wonderland',
    description: 'Magical winter themed portrait with snow effects',
    creditCost: 1,
  },
]

export const CREDIT_PACKAGES: CreditPackage[] = [
  { id: 'pack_5', name: '5 Credits', credits: 5, price: 99 },
  { id: 'pack_10', name: '10 Credits', credits: 10, price: 199 },
  { id: 'pack_25', name: '25 Credits', credits: 25, price: 399 },
  { id: 'pack_50', name: '50 Credits', credits: 50, price: 699 },
  { id: 'pack_100', name: '100 Credits', credits: 100, price: 999 },
]