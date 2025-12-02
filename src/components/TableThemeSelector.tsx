'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, Lock, Check } from 'lucide-react'
import { API_URL } from '../constants/api'

interface Theme {
  id: string
  name: string
  description: string
  colors: {
    felt: string
    feltGradient: string
    border: string
    chipColors: string[]
  }
  premium: boolean
}

interface TableThemeSelectorProps {
  isVisible: boolean
  onClose: () => void
  currentTheme: string
  isAdmin: boolean
  onThemeChange: (themeId: string) => void
  roomCode: string
}

export default function TableThemeSelector({ 
  isVisible, 
  onClose, 
  currentTheme,
  isAdmin,
  onThemeChange,
  roomCode
}: TableThemeSelectorProps) {
  
  const handleThemeActivation = async (themeId: string) => {
    if (!isAdmin || currentTheme === themeId) return
    
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/api/themes/room/${roomCode}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ themeName: themeId })
      })
      
      if (response.ok) {
        onThemeChange(themeId)
      } else {
        console.error('Failed to update theme')
      }
    } catch (err) {
      console.error('Error updating theme:', err)
    }
  }
  
  const themes: Theme[] = [
    {
      id: 'classic',
      name: 'Classic Green',
      description: 'Traditional poker table',
      colors: {
        felt: '#1a5f3a',
        feltGradient: 'radial-gradient(ellipse at center, #1a5f3a 0%, #0d3a23 70%, #082516 100%)',
        border: '#8b4513',
        chipColors: ['#ff4444', '#4444ff', '#44ff44', '#ffff44', '#ff44ff']
      },
      premium: false
    },
    {
      id: 'royal',
      name: 'Royal Purple',
      description: 'Luxurious premium table',
      colors: {
        felt: '#4a1a5f',
        feltGradient: 'radial-gradient(ellipse at center, #6b2d8c 0%, #4a1a5f 70%, #2d0f3a 100%)',
        border: '#ffd700',
        chipColors: ['#ffd700', '#c0c0c0', '#cd7f32', '#ffffff', '#000000']
      },
      premium: true
    },
    {
      id: 'neon',
      name: 'Neon Nights',
      description: 'Futuristic glow effect',
      colors: {
        felt: '#0a0a1a',
        feltGradient: 'radial-gradient(ellipse at center, #1a1a3a 0%, #0f0f2a 70%, #05050f 100%)',
        border: '#00ffff',
        chipColors: ['#ff00ff', '#00ffff', '#ffff00', '#00ff00', '#ff0066']
      },
      premium: true
    },
    {
      id: 'dark',
      name: 'Dark Mode',
      description: 'Sleek black table',
      colors: {
        felt: '#1a1a1a',
        feltGradient: 'radial-gradient(ellipse at center, #2a2a2a 0%, #1a1a1a 70%, #0a0a0a 100%)',
        border: '#555555',
        chipColors: ['#ff5555', '#5555ff', '#55ff55', '#ffff55', '#ff55ff']
      },
      premium: false
    },
    {
      id: 'ocean',
      name: 'Ocean Blue',
      description: 'Calming ocean theme',
      colors: {
        felt: '#0a3a5a',
        feltGradient: 'radial-gradient(ellipse at center, #1a5a8a 0%, #0a3a5a 70%, #05202f 100%)',
        border: '#4dd0e1',
        chipColors: ['#00acc1', '#0277bd', '#01579b', '#80deea', '#006064']
      },
      premium: true
    },
    {
      id: 'sunset',
      name: 'Sunset Orange',
      description: 'Warm sunset colors',
      colors: {
        felt: '#5a2a0a',
        feltGradient: 'radial-gradient(ellipse at center, #8a4a1a 0%, #5a2a0a 70%, #2f1505 100%)',
        border: '#ff6f00',
        chipColors: ['#ff6f00', '#ff3d00', '#ffd54f', '#ffb300', '#f57c00']
      },
      premium: true
    }
  ]

  if (!isVisible) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100]"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-gray-900 rounded-2xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 to-teal-600 px-6 py-4 flex items-center justify-between rounded-t-2xl sticky top-0 z-10">
            <div>
              <h2 className="text-white text-xl font-bold flex items-center gap-2">
                <span>🎨</span> Table Themes
              </h2>
              {!isAdmin && (
                <p className="text-white/80 text-sm mt-1">Admin can change table theme</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-red-300 transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* Themes Grid */}
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            {themes.map((theme) => (
              <motion.div
                key={theme.id}
                whileHover={{ scale: 1.02 }}
                className={`relative rounded-xl overflow-hidden border-2 transition-all ${
                  currentTheme === theme.id
                    ? 'border-yellow-400 shadow-lg shadow-yellow-400/50'
                    : 'border-gray-700 hover:border-gray-500'
                }`}
              >
                {/* Preview */}
                <div
                  className="h-32 relative"
                  style={{ background: theme.colors.feltGradient }}
                >
                  {/* Chips preview */}
                  <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1">
                    {theme.colors.chipColors.slice(0, 5).map((color, idx) => (
                      <div
                        key={idx}
                        className="w-6 h-6 rounded-full border-2 border-white shadow-lg"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>

                  {/* Premium badge */}
                  {theme.premium && (
                    <div className="absolute top-2 right-2 bg-yellow-500 text-black px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                      <span>👑</span> Premium
                    </div>
                  )}

                  {/* Selected badge */}
                  {currentTheme === theme.id && (
                    <div className="absolute top-2 left-2 bg-green-500 rounded-full p-1">
                      <Check size={16} className="text-white" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="bg-gray-800 p-4">
                  <h3 className="text-white font-semibold text-lg flex items-center justify-between">
                    {theme.name}
                    {!isAdmin && theme.premium && <Lock size={16} className="text-yellow-400" />}
                  </h3>
                  <p className="text-gray-400 text-sm mt-1">{theme.description}</p>

                  {/* Button */}
                  {isAdmin ? (
                    <button
                      onClick={() => handleThemeActivation(theme.id)}
                      disabled={currentTheme === theme.id}
                      className={`w-full mt-3 px-4 py-2 rounded-lg font-semibold transition-all ${
                        currentTheme === theme.id
                          ? 'bg-green-600 text-white cursor-default'
                          : 'bg-blue-600 hover:bg-blue-500 text-white'
                      }`}
                    >
                      {currentTheme === theme.id ? 'Active Theme' : 'Activate Theme'}
                    </button>
                  ) : (
                    <div className="mt-3 text-center text-gray-500 text-sm">
                      {currentTheme === theme.id ? '✓ Currently Active' : 'Admin only'}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
