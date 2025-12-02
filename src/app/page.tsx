'use client'

import { useState, useEffect } from 'react'
import WelcomeScreen from './components/WelcomeScreen'
import LoginScreen from './components/LoginScreen'
import RegisterScreen from './components/RegisterScreen'
import Dashboard from './components/Dashboard'
import AdminDashboard from './components/AdminDashboard'
import { mockAuth, shouldUseMockApi } from '../services/mockApi'
import { API_URL } from '../constants/api'
import { soundManager } from '../utils/sounds'

export default function Home() {
  const [currentScreen, setCurrentScreen] = useState<'welcome' | 'login' | 'register' | 'dashboard' | 'admin'>('welcome')
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Start menu music when page loads
  useEffect(() => {
    soundManager.playBackgroundMusic('menu')
    
    return () => {
      soundManager.stopMusic()
    }
  }, [])

  // Check for existing authentication on page load
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token')
      if (token) {
        try {
          // Use mock API if backend is not available
          if (shouldUseMockApi()) {
            const result = await mockAuth.verify()
            
            if (result.success) {
              setUser(result.user)
              setCurrentScreen(result.user.role === 'admin' ? 'admin' : 'dashboard')
            } else {
              localStorage.removeItem('token')
            }
            setLoading(false)
            return
          }

          // Try backend API
          const response = await fetch(`${API_URL}/api/auth/verify`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          })
          
          if (response.ok) {
            const userData = await response.json()
            setUser(userData.user)
            setCurrentScreen(userData.user.role === 'admin' ? 'admin' : 'dashboard')
          } else {
            localStorage.removeItem('token')
          }
        } catch (err) {
          console.error('Auth check failed:', err)
          
          // Fallback to mock API
          try {
            const result = await mockAuth.verify()
            
            if (result.success) {
              setUser(result.user)
              setCurrentScreen(result.user.role === 'admin' ? 'admin' : 'dashboard')
            } else {
              localStorage.removeItem('token')
            }
          } catch (mockErr) {
            localStorage.removeItem('token')
          }
        }
      }
      setLoading(false)
    }

    checkAuth()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-800 via-green-700 to-green-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-800 via-green-700 to-green-900">
      {currentScreen === 'welcome' && (
        <WelcomeScreen onNavigate={setCurrentScreen} />
      )}
      {currentScreen === 'login' && (
        <LoginScreen 
          onNavigate={setCurrentScreen} 
          onLogin={(userData) => {
            console.log('User logged in with role:', userData?.role)
            setUser(userData)
            setCurrentScreen(userData.role === 'admin' ? 'admin' : 'dashboard')
          }} 
        />
      )}
      {currentScreen === 'register' && (
        <RegisterScreen 
          onNavigate={setCurrentScreen}
          onRegister={(userData) => {
            setUser(userData)
            setCurrentScreen('dashboard')
          }}
        />
      )}
      {currentScreen === 'dashboard' && user && (
        <Dashboard user={user} onLogout={() => {
          setUser(null)
          setCurrentScreen('welcome')
        }} />
      )}
      {currentScreen === 'admin' && user && (
        <AdminDashboard user={user} onLogout={() => {
          setUser(null)
          setCurrentScreen('welcome')
        }} />
      )}
    </div>
  )
}
