'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, TrendingUp, TrendingDown, Trophy, Target } from 'lucide-react'

interface PlayerStats {
  handsPlayed: number
  handsWon: number
  biggestWin: number
  biggestLoss: number
  totalWinnings: number
  vpip: number // Voluntarily Put In Pot %
  pfr: number // Pre-Flop Raise %
}

interface StatsDashboardProps {
  isVisible: boolean
  onClose: () => void
  playerName: string
}

export default function StatsDashboard({ isVisible, onClose, playerName }: StatsDashboardProps) {
  const [stats, setStats] = useState<PlayerStats>({
    handsPlayed: 0,
    handsWon: 0,
    biggestWin: 0,
    biggestLoss: 0,
    totalWinnings: 0,
    vpip: 0,
    pfr: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch stats from API
    const fetchStats = async () => {
      try {
        setLoading(true)
        const token = localStorage.getItem('token')
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
        
        const response = await fetch(`${API_URL}/api/users/statistics`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (response.ok) {
          const data = await response.json()
          console.log('📊 Statistics fetched:', data)
          
          // Map backend stats to frontend format
          setStats({
            handsPlayed: data.statistics?.handsPlayed || data.statistics?.totalGames || 0,
            handsWon: data.statistics?.wins || 0,
            biggestWin: data.statistics?.biggestWin?.amount || data.statistics?.biggestWin || 0,
            biggestLoss: data.statistics?.biggestLoss?.amount || data.statistics?.biggestLoss || 0,
            totalWinnings: data.statistics?.totalWinnings || 0,
            vpip: 0, // Not tracked yet
            pfr: 0   // Not tracked yet
          })
        } else {
          console.error('Failed to fetch statistics:', response.statusText)
        }
      } catch (error) {
        console.error('Error fetching statistics:', error)
      } finally {
        setLoading(false)
      }
    }

    if (isVisible) {
      fetchStats()
    }
  }, [isVisible])

  if (!isVisible) return null

  const winRate = stats.handsPlayed > 0 
    ? ((stats.handsWon / stats.handsPlayed) * 100).toFixed(1)
    : '0.0'

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto stats-panel-slide"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-yellow-600 to-yellow-500 px-6 py-4 flex items-center justify-between rounded-t-2xl">
            <div className="flex items-center gap-3">
              <Trophy className="w-6 h-6 text-white leaderboard-trophy" />
              <h2 className="text-white text-xl font-bold">Player Statistics</h2>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Stats Content */}
          <div className="p-6 space-y-6">
            {loading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
                <p className="text-gray-400 mt-4">Loading statistics...</p>
              </div>
            ) : (
              <>
            {/* Player Name */}
            <div className="text-center">
              <h3 className="text-2xl font-bold text-white mb-1">{playerName}</h3>
              <p className="text-gray-400 text-sm">Active Player</p>
            </div>

            {/* Main Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              {/* Hands Played */}
              <div className="bg-gray-800/50 rounded-xl p-4 stats-counter-increment">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-5 h-5 text-blue-400" />
                  <span className="text-gray-400 text-sm">Hands Played</span>
                </div>
                <div className="text-3xl font-bold text-white">{stats.handsPlayed}</div>
              </div>

              {/* Hands Won */}
              <div className="bg-gray-800/50 rounded-xl p-4 stats-counter-increment">
                <div className="flex items-center gap-2 mb-2">
                  <Trophy className="w-5 h-5 text-yellow-400" />
                  <span className="text-gray-400 text-sm">Hands Won</span>
                </div>
                <div className="text-3xl font-bold text-white">{stats.handsWon}</div>
              </div>

              {/* Win Rate */}
              <div className="bg-gray-800/50 rounded-xl p-4 stats-counter-increment">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                  <span className="text-gray-400 text-sm">Win Rate</span>
                </div>
                <div className="text-3xl font-bold text-green-400">{winRate}%</div>
              </div>

              {/* Total Winnings */}
              <div className="bg-gray-800/50 rounded-xl p-4 stats-counter-increment">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-yellow-400 text-lg">💰</span>
                  <span className="text-gray-400 text-sm">Total Winnings</span>
                </div>
                <div className={`text-3xl font-bold ${stats.totalWinnings >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  ${stats.totalWinnings >= 0 ? '+' : ''}{stats.totalWinnings}
                </div>
              </div>
            </div>

            {/* Secondary Stats */}
            <div className="space-y-3">
              <h4 className="text-white font-semibold mb-3">Detailed Statistics</h4>
              
              {/* Biggest Win */}
              <div className="flex items-center justify-between bg-gray-800/30 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-400" />
                  <span className="text-gray-300 text-sm">Biggest Win</span>
                </div>
                <span className="text-green-400 font-bold">${stats.biggestWin}</span>
              </div>

              {/* Biggest Loss */}
              <div className="flex items-center justify-between bg-gray-800/30 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-red-400" />
                  <span className="text-gray-300 text-sm">Biggest Loss</span>
                </div>
                <span className="text-red-400 font-bold">${stats.biggestLoss}</span>
              </div>

              {/* VPIP */}
              <div className="flex items-center justify-between bg-gray-800/30 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <span className="text-blue-400 text-sm">📊</span>
                  <span className="text-gray-300 text-sm">VPIP (Voluntarily Put $ In Pot)</span>
                </div>
                <span className="text-blue-400 font-bold">{stats.vpip.toFixed(1)}%</span>
              </div>

              {/* PFR */}
              <div className="flex items-center justify-between bg-gray-800/30 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <span className="text-purple-400 text-sm">📈</span>
                  <span className="text-gray-300 text-sm">PFR (Pre-Flop Raise %)</span>
                </div>
                <span className="text-purple-400 font-bold">{stats.pfr.toFixed(1)}%</span>
              </div>
            </div>
            </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
