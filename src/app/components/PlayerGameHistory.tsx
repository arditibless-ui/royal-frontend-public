'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Gamepad2, Trophy, TrendingUp, TrendingDown, Calendar, Clock } from 'lucide-react'
import { API_URL } from '../../constants/api'
import { soundManager } from '@/utils/sounds'

interface PlayerGameHistoryProps {
  isOpen: boolean
  onClose: () => void
}

export default function PlayerGameHistory({ isOpen, onClose }: PlayerGameHistoryProps) {
  const [games, setGames] = useState<any[]>([])
  const [summary, setSummary] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isOpen) {
      fetchGameHistory()
      soundManager.playMenuOpen()
    }
  }, [isOpen])

  const fetchGameHistory = async () => {
    if (!API_URL) return
    
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/api/history/games?limit=50`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setGames(data.games || [])
        setSummary(data.summary || null)
      }
    } catch (err) {
      console.error('Failed to fetch game history:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return `${hours}h ${remainingMinutes}m`
  }

  const handleClose = () => {
    soundManager.playMenuClose()
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-2 sm:inset-4 md:inset-8 lg:inset-16 z-50 overflow-hidden"
          >
            <div className="w-full h-full bg-gradient-to-br from-gray-900 via-purple-900/30 to-gray-900 rounded-xl sm:rounded-2xl border-2 border-purple-500/50 shadow-2xl flex flex-col">
              {/* Header */}
              <div className="flex justify-between items-center p-4 sm:p-6 border-b border-purple-500/30">
                <div className="flex items-center gap-3">
                  <Gamepad2 className="text-purple-400" size={28} />
                  <h2 className="text-xl sm:text-2xl font-bold text-white">My Game History</h2>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleClose}
                  onMouseEnter={() => soundManager.playHover()}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X size={28} />
                </motion.button>
              </div>

              {/* Summary Stats */}
              {summary && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 p-4 sm:p-6 bg-gradient-to-r from-purple-900/20 to-pink-900/20 border-b border-purple-500/30">
                  <div className="bg-white/5 rounded-lg p-3 sm:p-4 border border-white/10">
                    <p className="text-xs text-gray-400 mb-1">Total Games</p>
                    <p className="text-2xl font-bold text-white">{summary.totalGames}</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3 sm:p-4 border border-green-500/30">
                    <p className="text-xs text-gray-400 mb-1">Wins</p>
                    <div className="flex items-center gap-2">
                      <Trophy size={20} className="text-green-400" />
                      <p className="text-2xl font-bold text-green-400">{summary.totalWins}</p>
                    </div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3 sm:p-4 border border-red-500/30">
                    <p className="text-xs text-gray-400 mb-1">Losses</p>
                    <p className="text-2xl font-bold text-red-400">{summary.totalLosses}</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3 sm:p-4 border border-purple-500/30">
                    <p className="text-xs text-gray-400 mb-1">Net Profit</p>
                    <div className="flex items-center gap-1">
                      {summary.totalProfit >= 0 ? (
                        <TrendingUp size={18} className="text-green-400" />
                      ) : (
                        <TrendingDown size={18} className="text-red-400" />
                      )}
                      <p className={`text-2xl font-bold ${
                        summary.totalProfit >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {summary.totalProfit >= 0 ? '+' : ''}{summary.totalProfit}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Game List */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-4">
                    <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-400">Loading your game history...</p>
                  </div>
                ) : games.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-4">
                    <Gamepad2 size={64} className="text-gray-600" />
                    <p className="text-gray-400 text-lg">No games played yet</p>
                    <p className="text-gray-500 text-sm">Join a room to start playing!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {games.map((game: any, index: number) => (
                      <motion.div
                        key={game._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`bg-gradient-to-br ${
                          game.yourProfit > 0 
                            ? 'from-green-900/20 to-green-800/10 border-green-500/30' 
                            : game.yourProfit < 0 
                            ? 'from-red-900/20 to-red-800/10 border-red-500/30'
                            : 'from-gray-900/20 to-gray-800/10 border-gray-500/30'
                        } border rounded-lg p-4 hover:bg-white/5 transition-all`}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-bold text-white text-lg">{game.roomName}</h3>
                              {game.yourPosition === 1 && (
                                <Trophy size={20} className="text-yellow-400" />
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-400">
                              <span className="px-2 py-0.5 bg-white/10 rounded">
                                {game.roomCode}
                              </span>
                              <span>
                                {game.gameMode === 'tournament' ? '🏆 Tournament' : '💵 Cash Game'}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`font-bold text-2xl ${
                              game.yourProfit > 0 ? 'text-green-400' : game.yourProfit < 0 ? 'text-red-400' : 'text-gray-400'
                            }`}>
                              {game.yourProfit > 0 ? '+' : ''}{game.yourProfit}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {game.won ? '✅ Won' : game.lost ? '❌ Lost' : '➖ Break Even'}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3 mb-3">
                          <div className="bg-white/5 rounded p-2">
                            <p className="text-[10px] text-gray-400 mb-0.5">Position</p>
                            <p className="text-white font-bold">
                              {game.yourPosition}/{game.totalPlayers}
                              {game.yourPosition === 1 && ' 🥇'}
                              {game.yourPosition === 2 && ' 🥈'}
                              {game.yourPosition === 3 && ' 🥉'}
                            </p>
                          </div>
                          <div className="bg-white/5 rounded p-2">
                            <p className="text-[10px] text-gray-400 mb-0.5">Buy-in</p>
                            <p className="text-white font-bold">${game.buyIn}</p>
                          </div>
                          <div className="bg-white/5 rounded p-2">
                            <p className="text-[10px] text-gray-400 mb-0.5">Duration</p>
                            <p className="text-white font-bold">{formatDuration(game.duration)}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-xs text-gray-500 pt-2 border-t border-white/10">
                          <div className="flex items-center gap-1">
                            <Calendar size={12} />
                            <span>{formatDate(game.endedAt)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock size={12} />
                            <span>{formatTime(game.endedAt)}</span>
                          </div>
                          <div className="ml-auto">
                            <span className="text-gray-400">{game.handsPlayed} hands</span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
