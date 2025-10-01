import axios from 'axios'
import { authClient } from './auth-client'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api'

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for Better-Auth session cookies
})

// API endpoints
export const authAPI = {
  register: (userData: { email: string; password: string; fullName: string }) =>
    api.post('/auth/register', userData),
  login: (credentials: { email: string; password: string }) =>
    api.post('/auth/login', credentials),
  getProfile: () => api.get('/auth/profile'),
}

export const imageAPI = {
  upload: (file: FormData) => api.post('/images/upload', file, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  process: (data: { imageUrl: string; filterId: string }) =>
    api.post('/images/process', data),
  getHistory: () => api.get('/images/history'),
}

export const creditAPI = {
  getBalance: () => api.get('/credits/balance'),
  purchaseCredits: (packageId: string) => api.post('/credits/purchase', { packageId }),
  getTransactions: () => api.get('/credits/transactions'),
}