'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, Trophy, TrendingDown, Gamepad2, Award, Calendar, DollarSign } from 'lucide-react'

interface Statistics {
  totalGames: number
  wins: number
  losses: number
  biggestWin: { amount: number; date: string | null; roomCode: string | null }
  biggestLoss: { amount: number; date: string | null; roomCode: string | null }
  totalWinnings: number
  totalLosses: number
}

interface StatisticsModalProps {
  isOpen: boolean
  onClose: () => void
  username: string
  statistics: Statistics
  isAdminView?: boolean
}

export default function StatisticsModal({ 
  isOpen, 
  onClose, 
  username, 
  statistics,
  isAdminView = false 
}: StatisticsModalProps) {
  const winRate = statistics.totalGames > 0 
    ? ((statistics.wins / statistics.totalGames) * 100).toFixed(1) 
    : '0.0'
  
  const netProfit = statistics.totalWinnings - statistics.totalLosses

  const formatDate = (date: string | null) => {
    if (!date) return 'N/A'
    return new Date(date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    })
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
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-1 md:p-4"
            onClick={onClose}
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              className="bg-gradient-to-br from-gray-900 via-green-900/30 to-gray-900 border-2 border-yellow-500/50 rounded-lg md:rounded-xl shadow-2xl w-full max-w-[98vw] md:max-w-4xl max-h-[98vh] flex flex-col"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-yellow-600 to-yellow-500 px-3 py-1 md:px-6 md:py-4 flex items-center justify-between rounded-t-lg md:rounded-t-xl border-b-2 border-yellow-400 flex-shrink-0">
                <div className="flex items-center gap-2 md:gap-3">
                  <Trophy className="text-white" size={16} />
                  <div>
                    <h2 className="text-xs md:text-2xl font-bold text-white">
                      {username}'s Stats
                    </h2>
                    {isAdminView && (
                      <p className="text-yellow-100 text-[9px] md:text-sm">Admin View</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="text-white hover:text-red-300 transition-colors"
                >
                  <X size={18} className="md:w-[24px] md:h-[24px]" />
                </button>
              </div>

              {/* Content */}
              <div className="p-2 md:p-6 overflow-y-auto flex-1">
                {/* Overview Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 md:gap-4 mb-2 md:mb-6">
                  {/* Total Games */}
                  <motion.div
                    whileHover={{ scale: 1.05, y: -5 }}
                    className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg md:rounded-xl p-1.5 md:p-4 border-2 border-blue-400 shadow-lg"
                  >
                    <div className="flex items-center justify-between mb-0.5 md:mb-2">
                      <Gamepad2 className="text-blue-200" size={12} />
                      <div className="text-lg md:text-3xl font-bold text-white">
                        {statistics.totalGames}
                      </div>
                    </div>
                    <div className="text-blue-100 text-[9px] md:text-sm font-medium">Total Games</div>
                  </motion.div>

                  {/* Wins */}
                  <motion.div
                    whileHover={{ scale: 1.05, y: -5 }}
                    className="bg-gradient-to-br from-green-600 to-green-700 rounded-lg md:rounded-xl p-1.5 md:p-4 border-2 border-green-400 shadow-lg"
                  >
                    <div className="flex items-center justify-between mb-0.5 md:mb-2">
                      <Trophy className="text-green-200" size={12} />
                      <div className="text-lg md:text-3xl font-bold text-white">
                        {statistics.wins}
                      </div>
                    </div>
                    <div className="text-green-100 text-[9px] md:text-sm font-medium">Wins</div>
                  </motion.div>

                  {/* Losses */}
                  <motion.div
                    whileHover={{ scale: 1.05, y: -5 }}
                    className="bg-gradient-to-br from-red-600 to-red-700 rounded-lg md:rounded-xl p-1.5 md:p-4 border-2 border-red-400 shadow-lg"
                  >
                    <div className="flex items-center justify-between mb-0.5 md:mb-2">
                      <TrendingDown className="text-red-200" size={12} />
                      <div className="text-lg md:text-3xl font-bold text-white">
                        {statistics.losses}
                      </div>
                    </div>
                    <div className="text-red-100 text-[9px] md:text-sm font-medium">Losses</div>
                  </motion.div>

                  {/* Win Rate */}
                  <motion.div
                    whileHover={{ scale: 1.05, y: -5 }}
                    className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-lg md:rounded-xl p-1.5 md:p-4 border-2 border-purple-400 shadow-lg"
                  >
                    <div className="flex items-center justify-between mb-0.5 md:mb-2">
                      <Award className="text-purple-200" size={12} />
                      <div className="text-lg md:text-3xl font-bold text-white">
                        {winRate}%
                      </div>
                    </div>
                    <div className="text-purple-100 text-[9px] md:text-sm font-medium">Win Rate</div>
                  </motion.div>
                </div>

                {/* Financial Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 md:gap-4 mb-1 md:mb-6">
                  {/* Total Winnings */}
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="bg-black/40 backdrop-blur-sm rounded-md md:rounded-xl p-1.5 md:p-4 border border-green-500/50"
                  >
                    <div className="flex items-center gap-1 md:gap-3 mb-0.5 md:mb-2">
                      <DollarSign className="text-green-400" size={11} />
                      <div className="text-green-300 text-[8px] md:text-sm font-medium">Total Winnings</div>
                    </div>
                    <div className="text-sm md:text-2xl font-bold text-white">
                      ${statistics.totalWinnings.toLocaleString()}
                    </div>
                  </motion.div>

                  {/* Total Losses */}
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="bg-black/40 backdrop-blur-sm rounded-md md:rounded-xl p-1.5 md:p-4 border border-red-500/50"
                  >
                    <div className="flex items-center gap-1 md:gap-3 mb-0.5 md:mb-2">
                      <TrendingDown className="text-red-400" size={11} />
                      <div className="text-red-300 text-[8px] md:text-sm font-medium">Total Losses</div>
                    </div>
                    <div className="text-sm md:text-2xl font-bold text-white">
                      ${statistics.totalLosses.toLocaleString()}
                    </div>
                  </motion.div>

                  {/* Net Profit */}
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className={`bg-black/40 backdrop-blur-sm rounded-md md:rounded-xl p-1.5 md:p-4 border ${
                      netProfit >= 0 ? 'border-yellow-500/50' : 'border-orange-500/50'
                    }`}
                  >
                    <div className="flex items-center gap-1 md:gap-3 mb-0.5 md:mb-2">
                      <Award className={netProfit >= 0 ? 'text-yellow-400' : 'text-orange-400'} size={11} />
                      <div className={`text-[8px] md:text-sm font-medium ${netProfit >= 0 ? 'text-yellow-300' : 'text-orange-300'}`}>
                        Net Profit
                      </div>
                    </div>
                    <div className={`text-sm md:text-2xl font-bold ${netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {netProfit >= 0 ? '+' : ''}{netProfit >= 0 ? '$' : '-$'}{Math.abs(netProfit).toLocaleString()}
                    </div>
                  </motion.div>
                </div>

                {/* Records */}
                <div className="grid grid-cols-1 gap-1 md:gap-4">
                  {/* Biggest Win */}
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="bg-gradient-to-br from-green-900/40 to-green-800/40 backdrop-blur-sm rounded-md md:rounded-xl p-1.5 md:p-5 border border-green-500/50 shadow-lg"
                  >
                    <div className="flex items-center gap-1 md:gap-3 mb-0.5 md:mb-3">
                      <div className="bg-green-600 p-1 md:p-2 rounded-md">
                        <Trophy className="text-white" size={12} />
                      </div>
                      <div>
                        <div className="text-green-300 text-[8px] md:text-sm font-medium">Biggest Win</div>
                        <div className="text-[7px] md:text-xs text-green-400/70">Your best performance</div>
                      </div>
                    </div>
                    <div className="text-base md:text-3xl font-bold text-white mb-0.5 md:mb-2">
                      ${statistics.biggestWin.amount.toLocaleString()}
                    </div>
                    <div className="flex flex-wrap items-center gap-0.5 md:gap-2 text-[8px] md:text-sm text-green-300">
                      <Calendar size={9} />
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
                    className="bg-gradient-to-br from-red-900/40 to-red-800/40 backdrop-blur-sm rounded-md md:rounded-xl p-1.5 md:p-5 border border-red-500/50 shadow-lg"
                  >
                    <div className="flex items-center gap-1 md:gap-3 mb-0.5 md:mb-3">
                      <div className="bg-red-600 p-1 md:p-2 rounded-md">
                        <TrendingDown className="text-white" size={12} />
                      </div>
                      <div>
                        <div className="text-red-300 text-[8px] md:text-sm font-medium">Biggest Loss</div>
                        <div className="text-[7px] md:text-xs text-red-400/70">Tough day at the table</div>
                      </div>
                    </div>
                    <div className="text-base md:text-3xl font-bold text-white mb-0.5 md:mb-2">
                      ${statistics.biggestLoss.amount.toLocaleString()}
                    </div>
                    <div className="flex flex-wrap items-center gap-0.5 md:gap-2 text-[8px] md:text-sm text-red-300">
                      <Calendar size={9} />
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

                {/* Footer Message */}
                {!isAdminView && (
                  <div className="mt-1.5 md:mt-6 text-center">
                    <p className="text-gray-400 text-[10px] md:text-sm">
                      Keep playing to improve your stats! 🎰
                    </p>
                  </div>
                )}
              </div>

              {/* RIGHT COLUMN - Records */}
              <div className="statistics-right-column space-y-2 md:space-y-6">
                {/* Records */}
                <div className="statistics-records-grid grid grid-cols-1 gap-1 md:gap-4">
                  {/* Biggest Win */}
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="bg-gradient-to-br from-green-900/40 to-green-800/40 backdrop-blur-sm rounded-md md:rounded-xl p-1.5 md:p-5 border border-green-500/50 shadow-lg"
                  >
                    <div className="flex items-center gap-1 md:gap-3 mb-0.5 md:mb-3">
                      <div className="bg-green-600 p-1 md:p-2 rounded-md">
                        <Trophy className="text-white" size={12} />
                      </div>
                      <div>
                        <div className="text-green-300 text-[8px] md:text-sm font-medium">Biggest Win</div>
                        <div className="text-[7px] md:text-xs text-green-400/70">Your best performance</div>
                      </div>
                    </div>
                    <div className="text-base md:text-3xl font-bold text-white mb-0.5 md:mb-2">
                      ${statistics.biggestWin.amount.toLocaleString()}
                    </div>
                    <div className="flex flex-wrap items-center gap-0.5 md:gap-2 text-[8px] md:text-sm text-green-300">
                      <Calendar size={9} />
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
                    className="bg-gradient-to-br from-red-900/40 to-red-800/40 backdrop-blur-sm rounded-md md:rounded-xl p-1.5 md:p-5 border border-red-500/50 shadow-lg"
                  >
                    <div className="flex items-center gap-1 md:gap-3 mb-0.5 md:mb-3">
                      <div className="bg-red-600 p-1 md:p-2 rounded-md">
                        <TrendingDown className="text-white" size={12} />
                      </div>
                      <div>
                        <div className="text-red-300 text-[8px] md:text-sm font-medium">Biggest Loss</div>
                        <div className="text-[7px] md:text-xs text-red-400/70">Tough day at the table</div>
                      </div>
                    </div>
                    <div className="text-base md:text-3xl font-bold text-white mb-0.5 md:mb-2">
                      ${statistics.biggestLoss.amount.toLocaleString()}
                    </div>
                    <div className="flex flex-wrap items-center gap-0.5 md:gap-2 text-[8px] md:text-sm text-red-300">
                      <Calendar size={9} />
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

                {/* Footer Message */}
                {!isAdminView && (
                  <div className="mt-1.5 md:mt-6 text-center">
                    <p className="text-gray-400 text-[10px] md:text-sm">
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
