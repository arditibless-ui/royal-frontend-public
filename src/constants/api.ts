// API URL configuration for different environments
// Force production backend URL if not in development
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 
  (typeof window !== 'undefined' && window.location.hostname === 'localhost' 
    ? 'http://localhost:5001' 
    : 'https://royal-poker-backend.onrender.com')

// Use mock API mode only when explicitly no backend URL available
export const USE_MOCK_API = !API_URL || API_URL === ''

console.log('API_URL configured as:', API_URL)
console.log('USE_MOCK_API:', USE_MOCK_API)
console.log('Environment:', process.env.NODE_ENV)