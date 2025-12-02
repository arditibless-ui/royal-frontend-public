// API URL configuration for different environments
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 
  (typeof window !== 'undefined' && window.location.hostname === 'localhost' 
    ? 'http://localhost:5001' 
    : '')

// Use mock API mode when no backend URL is configured
export const USE_MOCK_API = !API_URL || API_URL === ''

console.log('API_URL configured as:', API_URL)
console.log('Environment:', process.env.NODE_ENV)