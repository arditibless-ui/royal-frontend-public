'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Receipt, TrendingUp, TrendingDown, DollarSign } from 'lucide-react'
import { API_URL } from '../../constants/api'
import { soundManager } from '@/utils/sounds'

interface ManagerHistoryProps {
  isOpen: boolean
  onClose: () => void
  managerId: string
}

export default function ManagerHistory({ isOpen, onClose, managerId }: ManagerHistoryProps) {
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [stats, setStats] = useState({
    totalSent: 0,
    totalReceived: 0,
    transactionCount: 0
  })

  useEffect(() => {
    if (isOpen) {
      fetchTransactions()
      soundManager.playMenuOpen()
    }
  }, [isOpen, managerId, startDate, endDate])

  const fetchTransactions = async () => {
    if (!API_URL) return
    
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      let url = `${API_URL}/api/history/transactions?limit=100`
      
      // Add date filters if set
      if (startDate) {
        url += `&startDate=${startDate}`
      }
      if (endDate) {
        url += `&endDate=${endDate}`
      }
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setTransactions(data.transactions || [])
        
        // Calculate stats
        const sent = data.transactions.filter((t: any) => t.fromUser?._id === managerId || t.fromUserId === managerId)
          .reduce((sum: number, t: any) => sum + t.amount, 0)
        const received = data.transactions.filter((t: any) => t.toUser?._id === managerId || t.toUserId === managerId)
          .reduce((sum: number, t: any) => sum + t.amount, 0)
        
        setStats({
          totalSent: sent,
          totalReceived: received,
          transactionCount: data.transactions.length
        })
      }
    } catch (err) {
      console.error('Failed to fetch transactions:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
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
            className="fixed inset-4 sm:inset-8 md:inset-16 lg:inset-24 z-50 overflow-hidden"
          >
            <div className="w-full h-full bg-gradient-to-br from-gray-900 via-purple-900/30 to-gray-900 rounded-2xl border-2 border-purple-500/50 shadow-2xl flex flex-col">
              {/* Header */}
              <div className="flex justify-between items-center p-4 sm:p-6 landscape:p-3 border-b border-purple-500/30">
                <div className="flex items-center gap-3 landscape:gap-2">
                  <Receipt className="text-purple-400 landscape:w-5 landscape:h-5" size={28} />
                  <h2 className="text-xl sm:text-2xl landscape:text-lg font-bold text-white">Transaction History</h2>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleClose}
                  onMouseEnter={() => soundManager.playHover()}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X size={28} className="landscape:w-5 landscape:h-5" />
                </motion.button>
              </div>

              {/* Date Filters */}
              <div className="bg-white/5 border border-white/10 rounded-lg p-4 landscape:p-2 mx-4 sm:mx-6 landscape:mx-3 my-4 landscape:my-2 flex flex-col sm:flex-row gap-3 landscape:gap-2 items-start sm:items-center">
                <label className="text-sm text-gray-300">Filter by Date:</label>
                <div className="flex flex-col sm:flex-row gap-3 flex-1">
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-400">From:</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="bg-black/40 border border-purple-500/30 rounded px-3 py-1.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-400">To:</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="bg-black/40 border border-purple-500/30 rounded px-3 py-1.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  {(startDate || endDate) && (
                    <button
                      onClick={() => {
                        soundManager.playClick()
                        setStartDate('')
                        setEndDate('')
                      }}
                      onMouseEnter={() => soundManager.playHover()}
                      className="text-xs text-purple-400 hover:text-purple-300 underline"
                    >
                      Clear Filters
                    </button>
                  )}
                </div>
              </div>

              {/* Transaction List */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 landscape:p-3 landscape:max-h-[calc(100vh-280px)]">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-4">
                    <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-400">Loading transactions...</p>
                  </div>
                ) : transactions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-4">
                    <Receipt size={64} className="text-gray-600" />
                    <p className="text-gray-400 text-lg">No transactions found</p>
                  </div>
                ) : (
                  <div className="bg-white/5 border border-white/10 rounded-lg sm:rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-black/40">
                          <tr>
                            <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Date/Time</th>
                            <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">From</th>
                            <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">To</th>
                            <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Amount</th>
                            <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Type</th>
                            <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Balance After</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/10">
                          {transactions.map((transaction: any, index: number) => {
                            const isSent = (transaction.fromUser?._id === managerId) || (transaction.fromUserId === managerId)
                            const fromUser = transaction.fromUser || { username: transaction.fromUsername, role: transaction.fromUserRole }
                            const toUser = transaction.toUser || { username: transaction.toUsername, role: transaction.toUserRole }

                            return (
                              <motion.tr
                                key={transaction._id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="hover:bg-white/5 transition-colors"
                              >
                                <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                                  <div className="text-xs sm:text-sm text-gray-300">
                                    {new Date(transaction.createdAt).toLocaleDateString()}
                                  </div>
                                  <div className="text-[10px] sm:text-xs text-gray-400">
                                    {new Date(transaction.createdAt).toLocaleTimeString()}
                                  </div>
                                </td>
                                <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                                  <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${
                                      fromUser.role === 'admin' ? 'bg-red-500' :
                                      fromUser.role === 'manager' ? 'bg-purple-500' :
                                      'bg-blue-500'
                                    }`}></div>
                                    <div>
                                      <div className="text-xs sm:text-sm font-medium text-white">
                                        {fromUser.username || 'Unknown'}
                                      </div>
                                      <div className="text-[10px] sm:text-xs text-gray-400 capitalize">
                                        {fromUser.role || 'user'}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                                  <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${
                                      toUser.role === 'admin' ? 'bg-red-500' :
                                      toUser.role === 'manager' ? 'bg-purple-500' :
                                      'bg-blue-500'
                                    }`}></div>
                                    <div>
                                      <div className="text-xs sm:text-sm font-medium text-white">
                                        {toUser.username || 'Unknown'}
                                      </div>
                                      <div className="text-[10px] sm:text-xs text-gray-400 capitalize">
                                        {toUser.role || 'user'}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                                  <div className={`text-xs sm:text-sm font-bold ${
                                    isSent ? 'text-red-400' : 'text-green-400'
                                  }`}>
                                    {isSent ? '-' : '+'}{transaction.amount.toLocaleString()}
                                  </div>
                                </td>
                                <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                                  <span className={`px-2 py-1 text-[10px] sm:text-xs font-medium rounded-full ${
                                    isSent ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'
                                  }`}>
                                    {isSent ? 'remove' : 'send'}
                                  </span>
                                </td>
                                <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                                  <div className="text-xs sm:text-sm font-bold text-white">
                                    {transaction.balanceAfter ? transaction.balanceAfter.toLocaleString() : '-'}
                                  </div>
                                  {transaction.balanceBefore !== undefined && (
                                    <div className="text-[10px] sm:text-xs text-gray-400">
                                      (was {transaction.balanceBefore.toLocaleString()})
                                    </div>
                                  )}
                                </td>
                              </motion.tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                    
                    {/* Summary Footer with Stats */}
                    <div className="bg-black/40 px-4 sm:px-6 landscape:px-3 py-3 landscape:py-2 border-t border-white/10">
                      <div className="flex flex-col sm:flex-row landscape:flex-row justify-between items-start sm:items-center landscape:items-center gap-3 landscape:gap-4">
                        <div className="flex items-center gap-2 landscape:gap-1.5">
                          <TrendingUp className="text-green-400 landscape:w-4 landscape:h-4" size={16} />
                          <span className="text-xs landscape:text-[10px] text-gray-400">Total Received:</span>
                          <span className="text-sm landscape:text-xs font-bold text-green-400">{stats.totalReceived.toLocaleString()} 💰</span>
                        </div>
                        <div className="flex items-center gap-2 landscape:gap-1.5">
                          <TrendingDown className="text-red-400 landscape:w-4 landscape:h-4" size={16} />
                          <span className="text-xs landscape:text-[10px] text-gray-400">Total Sent:</span>
                          <span className="text-sm landscape:text-xs font-bold text-red-400">{stats.totalSent.toLocaleString()} 💰</span>
                        </div>
                        <div className="flex items-center gap-2 landscape:gap-1.5">
                          <DollarSign className="text-purple-400 landscape:w-4 landscape:h-4" size={16} />
                          <span className="text-xs landscape:text-[10px] text-gray-400">Total Transactions:</span>
                          <span className="text-sm landscape:text-xs font-bold text-white">{stats.transactionCount}</span>
                        </div>
                      </div>
                    </div>
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
