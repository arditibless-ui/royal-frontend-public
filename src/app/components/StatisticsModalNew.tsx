'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { X, Trophy, TrendingDown, Award, DollarSign, Gamepad2, Calendar } from 'lucide-react'

interface UserStatistics {
  totalGames: number
  wins: number
  losses: number
  totalWinnings: number
  totalLosses: number
  biggestWin: {
    amount: number
    date: string
    roomCode: string
  }
  biggestLoss: {
    amount: number
    date: string
    roomCode: string
  }
}

interface StatisticsModalProps {
  isOpen: boolean
  onClose: () => void
  statistics: UserStatistics
  username: string
  isAdminView?: boolean
}

export default function StatisticsModalNew({
  isOpen,
  onClose,
  statistics,
  username,
  isAdminView = false
}: StatisticsModalProps) {
  const winRate = statistics.totalGames > 0 
    ? ((statistics.wins / statistics.totalGames) * 100).toFixed(1)
    : '0.0'
  
  const netProfit = statistics.totalWinnings - statistics.totalLosses

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
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
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal - Optimized for Landscape */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-2"
          >
            <motion.div className="w-full max-w-6xl max-h-[96vh] bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-xl shadow-2xl overflow-hidden flex flex-col border-2 border-yellow-500/30">
              
              {/* Header - Compact */}
              <div className="bg-gradient-to-r from-yellow-600 to-yellow-500 px-4 py-2 flex items-center justify-between border-b-2 border-yellow-400 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <Trophy size={16} className="text-yellow-100" />
                  <div>
                    <h2 className="text-base font-bold text-white">{username}&apos;s Stats</h2>
                    {isAdminView && (
                      <p className="text-[9px] text-yellow-100">Admin View</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="text-white hover:text-yellow-200 transition-colors p-1 hover:bg-white/10 rounded"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Content - Landscape Grid Layout */}
              <div className="flex-1 overflow-y-auto p-3">
                {/* Desktop: 2 rows, Mobile Landscape: optimized grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 h-full">
                  
                  {/* LEFT SIDE - Stats Overview */}
                  <div className="flex flex-col gap-3">
                    
                    {/* Quick Stats - 2x2 Grid */}
                    <div className="grid grid-cols-2 gap-2">
                      {/* Total Games */}
                      <motion.div
                        whileHover={{ scale: 1.03 }}
                        className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg p-3 border border-blue-400"
                      >
                        <Gamepad2 className="text-blue-200 mb-1" size={14} />
                        <div className="text-2xl font-bold text-white">{statistics.totalGames}</div>
                        <div className="text-blue-100 text-xs font-medium">Total Games</div>
                      </motion.div>

                      {/* Wins */}
                      <motion.div
                        whileHover={{ scale: 1.03 }}
                        className="bg-gradient-to-br from-green-600 to-green-700 rounded-lg p-3 border border-green-400"
                      >
                        <Trophy className="text-green-200 mb-1" size={14} />
                        <div className="text-2xl font-bold text-white">{statistics.wins}</div>
                        <div className="text-green-100 text-xs font-medium">Wins</div>
                      </motion.div>

                      {/* Losses */}
                      <motion.div
                        whileHover={{ scale: 1.03 }}
                        className="bg-gradient-to-br from-red-600 to-red-700 rounded-lg p-3 border border-red-400"
                      >
                        <TrendingDown className="text-red-200 mb-1" size={14} />
                        <div className="text-2xl font-bold text-white">{statistics.losses}</div>
                        <div className="text-red-100 text-xs font-medium">Losses</div>
                      </motion.div>

                      {/* Win Rate */}
                      <motion.div
                        whileHover={{ scale: 1.03 }}
                        className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-lg p-3 border border-purple-400"
                      >
                        <Award className="text-purple-200 mb-1" size={14} />
                        <div className="text-2xl font-bold text-white">{winRate}%</div>
                        <div className="text-purple-100 text-xs font-medium">Win Rate</div>
                      </motion.div>
                    </div>

                    {/* Financial Summary */}
                    <div className="bg-black/40 backdrop-blur-sm rounded-lg p-3 border border-emerald-500/50">
                      <h3 className="text-sm font-bold text-emerald-300 mb-2 flex items-center gap-2">
                        <DollarSign size={14} />
                        Financial Summary
                      </h3>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-400">Total Winnings:</span>
                          <span className="text-sm font-bold text-green-400">
                            ${statistics.totalWinnings.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-400">Total Losses:</span>
                          <span className="text-sm font-bold text-red-400">
                            ${statistics.totalLosses.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-gray-700">
                          <span className="text-xs font-medium text-gray-300">Net Profit:</span>
                          <span className={`text-base font-bold ${netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {netProfit >= 0 ? '+' : ''}{netProfit >= 0 ? '$' : '-$'}{Math.abs(netProfit).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* RIGHT SIDE - Records */}
                  <div className="flex flex-col gap-3">
                    
                    {/* Biggest Win */}
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className="bg-gradient-to-br from-green-900/60 to-green-800/60 backdrop-blur-sm rounded-lg p-3 border-2 border-green-500/50 flex-1"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div className="bg-green-600 p-2 rounded-lg">
                          <Trophy className="text-white" size={16} />
                        </div>
                        <div>
                          <div className="text-green-300 text-sm font-bold">Biggest Win</div>
                          <div className="text-green-400/70 text-[10px]">Your best performance</div>
                        </div>
                      </div>
                      <div className="text-3xl font-bold text-white mb-2">
                        ${statistics.biggestWin.amount.toLocaleString()}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-green-300">
                        <Calendar size={12} />
                        <span>{formatDate(statistics.biggestWin.date)}</span>
                        {statistics.biggestWin.roomCode && (
                          <>
                            <span>•</span>
                            <span className="font-mono font-bold">{statistics.biggestWin.roomCode}</span>
                          </>
                        )}
                      </div>
                    </motion.div>

                    {/* Biggest Loss */}
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className="bg-gradient-to-br from-red-900/60 to-red-800/60 backdrop-blur-sm rounded-lg p-3 border-2 border-red-500/50 flex-1"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div className="bg-red-600 p-2 rounded-lg">
                          <TrendingDown className="text-white" size={16} />
                        </div>
                        <div>
                          <div className="text-red-300 text-sm font-bold">Biggest Loss</div>
                          <div className="text-red-400/70 text-[10px]">Tough day at the table</div>
                        </div>
                      </div>
                      <div className="text-3xl font-bold text-white mb-2">
                        ${statistics.biggestLoss.amount.toLocaleString()}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-red-300">
                        <Calendar size={12} />
                        <span>{formatDate(statistics.biggestLoss.date)}</span>
                        {statistics.biggestLoss.roomCode && (
                          <>
                            <span>•</span>
                            <span className="font-mono font-bold">{statistics.biggestLoss.roomCode}</span>
                          </>
                        )}
                      </div>
                    </motion.div>
                  </div>
                </div>

                {/* Footer Message */}
                {!isAdminView && (
                  <div className="mt-3 text-center">
                    <p className="text-gray-400 text-xs">
                      Keep playing to improve your stats! 🎰
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
