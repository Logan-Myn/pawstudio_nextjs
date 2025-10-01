import { create } from 'zustand'
import { User } from '@/types'

interface AuthState {
  user: User | null
  credits: number
  isLoading: boolean
  setUser: (user: User | null) => void
  setCredits: (credits: number) => void
  setLoading: (loading: boolean) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  credits: 0,
  isLoading: true,
  setUser: (user) => set({ user, credits: user?.credits || 0 }),
  setCredits: (credits) => set({ credits }),
  setLoading: (isLoading) => set({ isLoading }),
  logout: () => set({ user: null, credits: 0 }),
}))