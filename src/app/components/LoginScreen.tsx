'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Eye, EyeOff, User, Lock, ArrowLeft } from 'lucide-react'
import { mockAuth, shouldUseMockApi } from '../../services/mockApi'
import { API_URL } from '../../constants/api'
import { soundManager } from '@/utils/sounds'

interface LoginScreenProps {
  onNavigate: (screen: 'welcome' | 'login' | 'register' | 'dashboard' | 'admin') => void
  onLogin: (userData: any) => void
}

export default function LoginScreen({ onNavigate, onLogin }: LoginScreenProps) {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    // Play lobby music with user interaction handling
    const tryPlay = async () => {
      try {
        await soundManager.playBackgroundMusic('lobby');
      } catch (e) {
        console.log('Music will play on interaction');
      }
    };
    tryPlay();
    
    // Stop music when component unmounts
    return () => {
      soundManager.stopMusic();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Ensure music plays on user interaction
    soundManager.playBackgroundMusic('lobby');
    soundManager.playClick();
    
    setLoading(true)
    setError('')

    try {
      console.log('Attempting login with username:', formData.username)
      console.log('shouldUseMockApi:', shouldUseMockApi())
      
      // Use mock API if backend is not available
      if (shouldUseMockApi()) {
        console.log('Using mock API for login')
        const result = await mockAuth.login(formData.username, formData.password)
        
        if (result.success) {
          localStorage.setItem('token', result.token!)
          console.log('Mock API login successful, user:', result.user)
          onLogin(result.user)
        } else {
          setError(result.message || 'Login failed')
        }
        return
      }

      // Try backend API
      console.log('Attempting backend API login to:', `${API_URL}/api/auth/login`)
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()
      console.log('Backend response:', data)

      if (response.ok) {
        localStorage.setItem('token', data.token)
        console.log('Backend login successful, user role:', data.user?.role)
        onLogin(data.user)
      } else {
        setError(data.message || 'Login failed')
      }
    } catch (err) {
      console.error('Login error:', err)
      
      // Fallback to mock API if backend fails
      try {
        console.log('Backend failed, falling back to mock API')
        const result = await mockAuth.login(formData.username, formData.password)
        
        if (result.success) {
          localStorage.setItem('token', result.token!)
          console.log('Mock API login successful, user role:', result.user?.role)
          onLogin(result.user)
        } else {
          setError(result.message || 'Login failed')
        }
      } catch (mockErr) {
        setError('Network error. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen pt-[env(safe-area-inset-top)] landscape:pt-0 landscape:min-h-[100dvh] flex items-center justify-center p-4 landscape:p-2 landscape:py-3">
      {/* Background image - portrait for portrait, landscape for landscape - EXTENDS ABOVE NOTCH */}
      <div className="fixed inset-0 -top-[env(safe-area-inset-top)]">
        <div 
          className="absolute inset-0 bg-cover bg-center portrait:block landscape:hidden"
          style={{ backgroundImage: "url('/images/portrait.png')" }}
        />
        <div 
          className="absolute inset-0 bg-cover bg-center portrait:hidden landscape:block"
          style={{ backgroundImage: "url('/images/landscape.png')" }}
        />
      </div>
      
      {/* Background overlay */}
      <div className="absolute inset-0 bg-black/50" />
      
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md landscape:max-w-2xl"
      >
        {/* Back button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            soundManager.playButtonClick()
            onNavigate('welcome')
          }}
          onMouseEnter={() => soundManager.playHover()}
          className="mb-6 landscape:mb-2 flex items-center text-white hover:text-yellow-400 transition-colors text-sm landscape:text-xs"
        >
          <ArrowLeft size={20} className="mr-2 landscape:w-4 landscape:h-4" />
          Back to Welcome
        </motion.button>

        <div className="bg-black/60 backdrop-blur-sm rounded-2xl landscape:rounded-xl p-8 landscape:p-3 border border-white/20">
          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-3xl landscape:text-xl font-bold text-white text-center mb-8 landscape:mb-2"
          >
            Welcome Back
          </motion.h2>

          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 landscape:px-3 landscape:py-2 rounded-lg mb-6 landscape:mb-3 text-sm landscape:text-xs"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6 landscape:space-y-2">
            <div>
              <label className="block text-white text-sm landscape:text-xs font-medium mb-2 landscape:mb-1">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3 landscape:left-2 top-1/2 transform -translate-y-1/2 text-gray-400 landscape:w-4 landscape:h-4" size={20} />
                <input
                  type="text"
                  required
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full pl-10 landscape:pl-8 pr-4 landscape:pr-3 py-3 landscape:py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-sm landscape:text-xs"
                  placeholder="Enter your username"
                />
              </div>
            </div>

            <div>
              <label className="block text-white text-sm landscape:text-xs font-medium mb-2 landscape:mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 landscape:left-2 top-1/2 transform -translate-y-1/2 text-gray-400 landscape:w-4 landscape:h-4" size={20} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-10 landscape:pl-8 pr-12 landscape:pr-10 py-3 landscape:py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-sm landscape:text-xs"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => {
                    soundManager.playButtonClick()
                    setShowPassword(!showPassword)
                  }}
                  onMouseEnter={() => soundManager.playHover()}
                  className="absolute right-3 landscape:right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showPassword ? <EyeOff size={20} className="landscape:w-4 landscape:h-4" /> : <Eye size={20} className="landscape:w-4 landscape:h-4" />}
                </button>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              onMouseEnter={() => soundManager.playHover()}
              className="w-full py-3 landscape:py-2 bg-gradient-to-r from-yellow-600 to-yellow-500 text-black font-bold text-base landscape:text-sm rounded-lg hover:from-yellow-500 hover:to-yellow-400 transition-all duration-300 disabled:opacity-50 mt-4 landscape:mt-2"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </motion.button>

            {/* Forgot Password Link */}
            <div className="mt-4 landscape:mt-2 text-center">
              <a
                href="/forgot-password"
                onClick={(e) => {
                  e.preventDefault();
                  soundManager.playButtonClick();
                  window.location.href = '/forgot-password';
                }}
                onMouseEnter={() => soundManager.playHover()}
                className="text-yellow-400 hover:text-yellow-300 text-sm landscape:text-xs font-medium transition-colors duration-200 inline-flex items-center gap-1"
              >
                <span>🔑</span>
                <span>Forgot Password?</span>
              </a>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  )
}