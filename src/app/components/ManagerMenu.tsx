'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Send, Coins, AlertCircle, CheckCircle, UserPlus, Users, Receipt, Plus, Settings, Trash2 } from 'lucide-react'
import { API_URL } from '../../constants/api'
import { soundManager } from '@/utils/sounds'

interface ManagerMenuProps {
  onClose: () => void
  managerName: string
}

export default function ManagerMenu({ onClose, managerName }: ManagerMenuProps) {
  const [activeTab, setActiveTab] = useState<'credits' | 'createUser' | 'createRoom' | 'manageRooms' | 'transactions'>('credits')
  const [managerRooms, setManagerRooms] = useState<any[]>([])
  const [loadingRooms, setLoadingRooms] = useState(false)
  const [username, setUsername] = useState('')
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  
  // Create user form state
  const [newUsername, setNewUsername] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newCredits, setNewCredits] = useState('1000')
  
  // Transaction history state
  const [transactions, setTransactions] = useState<any[]>([])
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  
  // Create room state
  const [roomName, setRoomName] = useState('')
  const [maxPlayers, setMaxPlayers] = useState('9')
  const [buyIn, setBuyIn] = useState('100')
  const [smallBlind, setSmallBlind] = useState('5')
  const [bigBlind, setBigBlind] = useState('10')
  const [isPrivate, setIsPrivate] = useState(false)
  const [gameMode, setGameMode] = useState<'cash' | 'tournament'>('cash')
  const [blindLevelDuration, setBlindLevelDuration] = useState('10')
  const [prizeStructure, setPrizeStructure] = useState({ first: '50', second: '30', third: '20' })
  
  const [notification, setNotification] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({ 
    show: false, 
    message: '',
    type: 'success'
  })
  
  const [deleteModal, setDeleteModal] = useState<{ show: boolean; roomId: string; roomCode: string }>({
    show: false,
    roomId: '',
    roomCode: ''
  })

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ show: true, message, type })
    setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 4000)
  }

  const fetchTransactions = async () => {
    try {
      const token = localStorage.getItem('token')
      let url = `${API_URL}/api/transactions/my-transactions?limit=50`
      if (startDate) {
        url += `&startDate=${startDate}`
      }
      if (endDate) {
        url += `&endDate=${endDate}`
      }
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setTransactions(data.transactions || [])
      }
    } catch (error) {
      console.error('Failed to fetch transactions:', error)
      setTransactions([])
    }
  }

  const fetchManagerRooms = async () => {
    setLoadingRooms(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/api/games/rooms`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      if (response.ok) {
        setManagerRooms(data.rooms || [])
      }
    } catch (error) {
      console.error('Fetch rooms error:', error)
    } finally {
      setLoadingRooms(false)
    }
  }

  const handleDeleteRoom = async (roomId: string, roomCode: string) => {
    setDeleteModal({ show: true, roomId, roomCode })
  }
  
  const confirmDeleteRoom = async () => {
    const { roomId, roomCode } = deleteModal
    setDeleteModal({ show: false, roomId: '', roomCode: '' })
    
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/api/games/rooms/${roomId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        showNotification(`Room ${roomCode} deleted successfully`, 'success')
        fetchManagerRooms()
      } else {
        const data = await response.json()
        showNotification(data.message || 'Failed to delete room', 'error')
      }
    } catch (error) {
      console.error('Delete room error:', error)
      showNotification('Failed to delete room', 'error')
    }
  }

  useEffect(() => {
    if (activeTab === 'transactions') {
      fetchTransactions()
    } else if (activeTab === 'manageRooms') {
      fetchManagerRooms()
    }
  }, [activeTab, startDate, endDate])

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newUsername.trim() || !newEmail.trim() || !newPassword.trim()) {
      showNotification('Please fill in all required fields', 'error')
      return
    }

    if (newPassword.length < 6) {
      showNotification('Password must be at least 6 characters', 'error')
      return
    }

    const creditAmount = parseInt(newCredits)
    if (isNaN(creditAmount) || creditAmount < 0) {
      showNotification('Please enter a valid credit amount', 'error')
      return
    }

    setLoading(true)

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/api/auth/create-player`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          username: newUsername.trim(), 
          email: newEmail.trim(),
          password: newPassword,
          credits: creditAmount 
        }),
      })

      const data = await response.json()

      if (response.ok) {
        showNotification(`✅ Player "${newUsername}" created successfully!`, 'success')
        setNewUsername('')
        setNewEmail('')
        setNewPassword('')
        setNewCredits('1000')
      } else {
        showNotification(data.message || 'Failed to create player', 'error')
      }
    } catch (error) {
      console.error('Create player error:', error)
      showNotification('Network error. Please check your connection.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!roomName.trim()) {
      showNotification('Please enter a room name', 'error')
      return
    }

    const maxPlayersNum = parseInt(maxPlayers)
    const buyInNum = parseInt(buyIn)
    const smallBlindNum = parseInt(smallBlind)
    const bigBlindNum = parseInt(bigBlind)

    if (isNaN(maxPlayersNum) || maxPlayersNum < 2 || maxPlayersNum > 9) {
      showNotification('Max players must be between 2 and 9', 'error')
      return
    }

    if (isNaN(buyInNum) || buyInNum < 1) {
      showNotification('Buy-in must be at least 1', 'error')
      return
    }

    if (isNaN(smallBlindNum) || isNaN(bigBlindNum) || smallBlindNum < 1 || bigBlindNum < 1) {
      showNotification('Blinds must be at least 1', 'error')
      return
    }

    if (bigBlindNum <= smallBlindNum) {
      showNotification('Big blind must be greater than small blind', 'error')
      return
    }

    // Validate tournament settings if tournament mode
    if (gameMode === 'tournament') {
      const duration = parseInt(blindLevelDuration)
      if (isNaN(duration) || duration < 1) {
        showNotification('Blind level duration must be at least 1 minute', 'error')
        return
      }

      const first = parseFloat(prizeStructure.first)
      const second = parseFloat(prizeStructure.second)
      const third = parseFloat(prizeStructure.third)
      
      if (isNaN(first) || isNaN(second) || isNaN(third)) {
        showNotification('Invalid prize structure percentages', 'error')
        return
      }

      const total = first + second + third
      if (Math.abs(total - 100) > 0.1) {
        showNotification('Prize structure must add up to 100%', 'error')
        return
      }
    }

    setLoading(true)

    try {
      const token = localStorage.getItem('token')
      
      const requestBody: any = {
        roomName: roomName.trim(),
        maxPlayers: maxPlayersNum,
        buyIn: buyInNum,
        smallBlind: smallBlindNum,
        bigBlind: bigBlindNum,
        isPrivate,
        gameMode
      }

      // Add tournament configuration if tournament mode
      if (gameMode === 'tournament') {
        requestBody.tournament = {
          blindLevelDuration: parseInt(blindLevelDuration),
          prizeStructure: [
            { position: 1, percentage: parseFloat(prizeStructure.first) },
            { position: 2, percentage: parseFloat(prizeStructure.second) },
            { position: 3, percentage: parseFloat(prizeStructure.third) }
          ]
        }
      }
      
      const response = await fetch(`${API_URL}/api/games/rooms`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      const data = await response.json()

      if (response.ok) {
        const roomCode = data.room?.roomCode || data.roomCode
        showNotification(`✅ ${gameMode === 'tournament' ? 'Tournament' : 'Cash game'} "${roomName}" created successfully! Code: ${roomCode}`, 'success')
        setRoomName('')
        setMaxPlayers('9')
        setBuyIn('100')
        setSmallBlind('5')
        setBigBlind('10')
        setIsPrivate(false)
        setGameMode('cash')
        setBlindLevelDuration('10')
        setPrizeStructure({ first: '50', second: '30', third: '20' })
      } else {
        showNotification(data.message || 'Failed to create room', 'error')
      }
    } catch (error) {
      console.error('Create room error:', error)
      showNotification('Network error. Please check your connection.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleSendCredits = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!username.trim()) {
      showNotification('Please enter a username', 'error')
      return
    }

    const creditAmount = parseInt(amount)
    if (isNaN(creditAmount) || creditAmount <= 0) {
      showNotification('Please enter a valid amount (positive number)', 'error')
      return
    }

    if (creditAmount > 1000000) {
      showNotification('Maximum amount is 1,000,000 credits', 'error')
      return
    }

    setLoading(true)

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/api/transactions/send-credits`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: username.trim(), amount: creditAmount }),
      })

      const data = await response.json()

      if (response.ok) {
        showNotification(`✅ Successfully sent ${creditAmount} credits to ${username}`, 'success')
        setUsername('')
        setAmount('')
        
        // Refresh the page after 2 seconds to update the manager's credit balance
        setTimeout(() => {
          window.location.reload()
        }, 2000)
      } else {
        showNotification(data.message || 'Failed to send credits', 'error')
      }
    } catch (error) {
      console.error('Send credits error:', error)
      showNotification('Network error. Please check your connection.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleDeductCredits = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!username.trim()) {
      showNotification('Please enter a username', 'error')
      return
    }

    const creditAmount = parseInt(amount)
    if (isNaN(creditAmount) || creditAmount <= 0) {
      showNotification('Please enter a valid amount (positive number)', 'error')
      return
    }

    if (creditAmount > 1000000) {
      showNotification('Maximum amount is 1,000,000 credits', 'error')
      return
    }

    setLoading(true)

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/api/transactions/deduct-credits`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: username.trim(), amount: creditAmount }),
      })

      const data = await response.json()

      if (response.ok) {
        showNotification(`✅ Successfully deducted ${creditAmount} credits from ${username}`, 'success')
        setUsername('')
        setAmount('')
        
        // Refresh the page after 2 seconds to update the manager's credit balance
        setTimeout(() => {
          window.location.reload()
        }, 2000)
      } else {
        showNotification(data.message || 'Failed to deduct credits', 'error')
      }
    } catch (error) {
      console.error('Deduct credits error:', error)
      showNotification('Network error. Please check your connection.', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-gradient-to-br from-purple-900 via-gray-900 to-black border-2 border-purple-500/50 rounded-xl sm:rounded-2xl shadow-2xl max-w-md w-full overflow-hidden my-4 max-h-[95vh] landscape:max-h-[92vh] overflow-y-auto"
      >
        {/* Header */}
                {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-4 sm:p-6 landscape:p-3 rounded-t-2xl relative overflow-hidden">
          <button
            onClick={() => {
              soundManager.playClick()
              onClose()
            }}
            onMouseEnter={() => soundManager.playHover()}
            className="absolute top-3 right-3 sm:top-4 sm:right-4 text-white/80 hover:text-white transition-colors"
          >
            <X size={20} className="sm:w-6 sm:h-6" />
          </button>
          
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-10 h-10 sm:w-14 sm:h-14 landscape:w-8 landscape:h-8 bg-white/20 rounded-full flex items-center justify-center">
              {activeTab === 'credits' ? (
                              <Coins className="w-5 h-5 sm:w-7 sm:h-7 landscape:w-5 landscape:h-5 text-yellow-300" />
              ) : activeTab === 'createUser' ? (
                <UserPlus size={20} className="sm:w-7 sm:h-7 text-green-300" />
              ) : activeTab === 'createRoom' ? (
                <Plus size={20} className="sm:w-7 sm:h-7 text-orange-300" />
              ) : (
                <Receipt size={20} className="sm:w-7 sm:h-7 text-blue-300" />
              )}
            </div>
            <div>
              <h2 className="text-lg sm:text-2xl landscape:text-base font-bold text-white">Manager Menu</h2>
              <p className="text-purple-100 text-xs sm:text-sm landscape:text-[10px]">
                {activeTab === 'credits' ? 'Send credits to players' : activeTab === 'createUser' ? 'Create new players' : activeTab === 'createRoom' ? 'Create new poker room' : 'Transaction history'}
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-black/40 border-b border-purple-500/30 flex">
          <button
            onClick={() => {
              soundManager.playClick()
              setActiveTab('credits')
            }}
            onMouseEnter={() => soundManager.playHover()}
            className={`flex-1 py-3 landscape:py-2 px-4 landscape:px-3 text-sm sm:text-base landscape:text-xs font-medium transition-all ${
              activeTab === 'credits'
                ? 'text-purple-300 border-b-2 border-purple-500 bg-purple-500/10'
                : 'text-gray-400 hover:text-gray-300 hover:bg-white/5'
            }`}
          >
            <div className="flex items-center justify-center gap-2 landscape:gap-1">
              <Coins size={18} className="landscape:w-4 landscape:h-4" />
              <span>Send Credits</span>
            </div>
          </button>
          <button
            onClick={() => {
              soundManager.playClick()
              setActiveTab('createUser')
            }}
            onMouseEnter={() => soundManager.playHover()}
            className={`flex-1 py-3 landscape:py-2 px-4 landscape:px-3 text-sm sm:text-base landscape:text-xs font-medium transition-all ${
              activeTab === 'createUser'
                ? 'text-green-300 border-b-2 border-green-500 bg-green-500/10'
                : 'text-gray-400 hover:text-gray-300 hover:bg-white/5'
            }`}
          >
            <div className="flex items-center justify-center gap-2 landscape:gap-1">
              <UserPlus size={18} className="landscape:w-4 landscape:h-4" />
              <span>Create Player</span>
            </div>
          </button>
          <button
            onClick={() => {
              soundManager.playClick()
              setActiveTab('createRoom')
            }}
            onMouseEnter={() => soundManager.playHover()}
            className={`flex-1 py-3 landscape:py-2 px-4 landscape:px-3 text-sm sm:text-base landscape:text-xs font-medium transition-all ${
              activeTab === 'createRoom'
                ? 'text-orange-300 border-b-2 border-orange-500 bg-orange-500/10'
                : 'text-gray-400 hover:text-gray-300 hover:bg-white/5'
            }`}
          >
            <div className="flex items-center justify-center gap-2 landscape:gap-1">
              <Plus size={18} className="landscape:w-4 landscape:h-4" />
              <span>Create Room</span>
            </div>
          </button>
          <button
            onClick={() => {
              soundManager.playClick()
              setActiveTab('manageRooms')
            }}
            onMouseEnter={() => soundManager.playHover()}
            className={`flex-1 py-3 landscape:py-2 px-4 landscape:px-3 text-sm sm:text-base landscape:text-xs font-medium transition-all ${
              activeTab === 'manageRooms'
                ? 'text-red-300 border-b-2 border-red-500 bg-red-500/10'
                : 'text-gray-400 hover:text-gray-300 hover:bg-white/5'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Settings size={18} />
              <span>Rooms</span>
            </div>
          </button>
          <button
            onClick={() => {
              soundManager.playClick()
              setActiveTab('transactions')
            }}
            onMouseEnter={() => soundManager.playHover()}
            className={`flex-1 py-3 landscape:py-2 px-4 landscape:px-3 text-sm sm:text-base landscape:text-xs font-medium transition-all ${
              activeTab === 'transactions'
                ? 'text-blue-300 border-b-2 border-blue-500 bg-blue-500/10'
                : 'text-gray-400 hover:text-gray-300 hover:bg-white/5'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Receipt size={18} />
              <span>History</span>
            </div>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 landscape:p-3">
          {activeTab === 'credits' ? (
            <form onSubmit={handleSendCredits} className="space-y-3 sm:space-y-5 landscape:space-y-2">
            {/* Username Input */}
            <div>
              <label className="block text-white text-xs sm:text-sm font-medium mb-1.5 sm:mb-2">
                Player Username <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter player's username"
                className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-black/40 border border-purple-500/30 rounded-lg text-white text-sm sm:text-base placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                disabled={loading}
              />
            </div>

            {/* Amount Input */}
            <div>
              <label className="block text-white text-xs sm:text-sm font-medium mb-1.5 sm:mb-2">
                Amount <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Coins size={18} className="sm:w-5 sm:h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-yellow-500" />
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount"
                  min="1"
                  max="1000000"
                  className="w-full pl-10 sm:pl-11 pr-3 sm:pr-4 py-2 sm:py-3 bg-black/40 border border-purple-500/30 rounded-lg text-white text-sm sm:text-base placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  disabled={loading}
                />
              </div>
              <p className="text-gray-400 text-[10px] sm:text-xs mt-1 sm:mt-1.5">Maximum: 1,000,000 credits</p>
            </div>

            {/* Quick Amount Buttons */}
            <div>
              <label className="block text-white text-xs sm:text-sm font-medium mb-1.5 sm:mb-2">
                Quick Select
              </label>
              <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                {[100, 500, 1000, 5000].map((quickAmount) => (
                  <motion.button
                    key={quickAmount}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={() => {
                      soundManager.playClick()
                      setAmount(quickAmount.toString())
                    }}
                    onMouseEnter={() => soundManager.playHover()}
                    disabled={loading}
                    className="py-1.5 sm:py-2 px-2 sm:px-3 bg-purple-600/20 border border-purple-500/30 rounded-lg text-purple-300 text-xs sm:text-sm font-medium hover:bg-purple-600/40 transition-all disabled:opacity-50"
                  >
                    {quickAmount}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 sm:p-4 flex gap-2 sm:gap-3">
              <AlertCircle size={18} className="sm:w-5 sm:h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-blue-300 text-xs sm:text-sm font-medium mb-0.5 sm:mb-1">Manager Privileges</p>
                <p className="text-blue-200/80 text-[10px] sm:text-xs">
                  As a manager, you can send or deduct credits from players you created. All transactions are logged and visible to administrators.
                </p>
              </div>
            </div>

            {/* Notification */}
            <AnimatePresence>
              {notification.show && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`p-3 sm:p-4 rounded-lg flex items-center gap-2 sm:gap-3 ${
                    notification.type === 'success' 
                      ? 'bg-green-500/20 border border-green-500/30' 
                      : 'bg-red-500/20 border border-red-500/30'
                  }`}
                >
                  {notification.type === 'success' ? (
                    <CheckCircle size={18} className="sm:w-5 sm:h-5 text-green-400 flex-shrink-0" />
                  ) : (
                    <AlertCircle size={18} className="sm:w-5 sm:h-5 text-red-400 flex-shrink-0" />
                  )}
                  <p className={`text-xs sm:text-sm ${
                    notification.type === 'success' ? 'text-green-300' : 'text-red-300'
                  }`}>
                    {notification.message}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={handleSendCredits}
                onMouseEnter={() => soundManager.playHover()}
                disabled={loading || !username.trim() || !amount}
                className="w-full py-2.5 sm:py-3.5 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white font-bold rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-2 border-white border-t-transparent"></div>
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <Send size={18} className="sm:w-5 sm:h-5" />
                    <span>Send</span>
                  </>
                )}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={handleDeductCredits}
                onMouseEnter={() => soundManager.playHover()}
                disabled={loading || !username.trim() || !amount}
                className="w-full py-2.5 sm:py-3.5 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-bold rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-2 border-white border-t-transparent"></div>
                    <span>Deducting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={18} className="sm:w-5 sm:h-5" />
                    <span>Deduct</span>
                  </>
                )}
              </motion.button>
            </div>
          </form>
        ) : activeTab === 'createUser' ? (
          /* Create Player Form */
          <form onSubmit={handleCreateUser} className="space-y-3 sm:space-y-5 landscape:space-y-2">
              {/* Username Input */}
              <div>
                <label className="block text-white text-xs sm:text-sm font-medium mb-1.5 sm:mb-2">
                  Username <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="Enter username"
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-black/40 border border-green-500/30 rounded-lg text-white text-sm sm:text-base placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  disabled={loading}
                />
              </div>

              {/* Email Input */}
              <div>
                <label className="block text-white text-xs sm:text-sm font-medium mb-1.5 sm:mb-2">
                  Email <span className="text-red-400">*</span>
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="Enter email address"
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-black/40 border border-green-500/30 rounded-lg text-white text-sm sm:text-base placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  disabled={loading}
                />
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-white text-xs sm:text-sm font-medium mb-1.5 sm:mb-2">
                  Password <span className="text-red-400">*</span>
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter password (min 6 characters)"
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-black/40 border border-green-500/30 rounded-lg text-white text-sm sm:text-base placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  disabled={loading}
                />
              </div>

              {/* Starting Credits Input */}
              <div>
                <label className="block text-white text-xs sm:text-sm font-medium mb-1.5 sm:mb-2">
                  Starting Credits
                </label>
                <div className="relative">
                  <Coins size={18} className="sm:w-5 sm:h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-yellow-500" />
                  <input
                    type="number"
                    value={newCredits}
                    onChange={(e) => setNewCredits(e.target.value)}
                    placeholder="Enter starting credits"
                    min="0"
                    className="w-full pl-10 sm:pl-11 pr-3 sm:pr-4 py-2 sm:py-3 bg-black/40 border border-green-500/30 rounded-lg text-white text-sm sm:text-base placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Info Box */}
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 sm:p-4 flex gap-2 sm:gap-3">
                <Users size={18} className="sm:w-5 sm:h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-green-300 text-xs sm:text-sm font-medium mb-0.5 sm:mb-1">Create New Player</p>
                  <p className="text-green-200/80 text-[10px] sm:text-xs">
                    Players you create will only see rooms in your manager lobby. They cannot access other manager's rooms.
                  </p>
                </div>
              </div>

              {/* Notification */}
              <AnimatePresence>
                {notification.show && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={`p-3 sm:p-4 rounded-lg flex items-center gap-2 sm:gap-3 ${
                      notification.type === 'success' 
                        ? 'bg-green-500/20 border border-green-500/30' 
                        : 'bg-red-500/20 border border-red-500/30'
                    }`}
                  >
                    {notification.type === 'success' ? (
                      <CheckCircle size={18} className="sm:w-5 sm:h-5 text-green-400 flex-shrink-0" />
                    ) : (
                      <AlertCircle size={18} className="sm:w-5 sm:h-5 text-red-400 flex-shrink-0" />
                    )}
                    <p className={`text-xs sm:text-sm ${
                      notification.type === 'success' ? 'text-green-300' : 'text-red-300'
                    }`}>
                      {notification.message}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                onMouseEnter={() => soundManager.playHover()}
                disabled={loading || !newUsername.trim() || !newEmail.trim() || !newPassword.trim()}
                className="w-full py-2.5 sm:py-3.5 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white font-bold rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-2 border-white border-t-transparent"></div>
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <UserPlus size={18} className="sm:w-5 sm:h-5" />
                    <span>Create Player</span>
                  </>
                )}
              </motion.button>
            </form>
        ) : activeTab === 'createRoom' ? (
          /* Create Room Form */
          <form onSubmit={handleCreateRoom} className="space-y-3 sm:space-y-5 landscape:space-y-2">
            {/* Room Name Input */}
            <div>
              <label className="block text-white text-xs sm:text-sm font-medium mb-1.5 sm:mb-2">
                Room Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="e.g., High Stakes Room"
                className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-black/40 border border-orange-500/30 rounded-lg text-white text-sm sm:text-base placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                disabled={loading}
              />
            </div>

            {/* Game Mode Toggle */}
            <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3 sm:p-4">
              <label className="block text-white text-xs sm:text-sm font-medium mb-2">
                Game Mode <span className="text-red-400">*</span>
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setGameMode('cash')}
                  onMouseEnter={() => soundManager.playHover()}
                  className={`flex-1 py-2 rounded-lg font-medium text-sm transition-all ${
                    gameMode === 'cash'
                      ? 'bg-orange-500 text-white shadow-lg'
                      : 'bg-black/40 text-gray-400 hover:bg-black/60'
                  }`}
                  disabled={loading}
                >
                  💵 Cash Game
                </button>
                <button
                  type="button"
                  onClick={() => setGameMode('tournament')}
                  onMouseEnter={() => soundManager.playHover()}
                  className={`flex-1 py-2 rounded-lg font-medium text-sm transition-all ${
                    gameMode === 'tournament'
                      ? 'bg-purple-500 text-white shadow-lg'
                      : 'bg-black/40 text-gray-400 hover:bg-black/60'
                  }`}
                  disabled={loading}
                >
                  🏆 Tournament
                </button>
              </div>
            </div>

            {/* Max Players Input */}
            <div>
              <label className="block text-white text-xs sm:text-sm font-medium mb-1.5 sm:mb-2">
                Max Players <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                value={maxPlayers}
                onChange={(e) => setMaxPlayers(e.target.value)}
                placeholder="2-9 players"
                min="2"
                max="9"
                className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-black/40 border border-orange-500/30 rounded-lg text-white text-sm sm:text-base placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                disabled={loading}
              />
            </div>

            {/* Buy-in Input */}
            <div>
              <label className="block text-white text-xs sm:text-sm font-medium mb-1.5 sm:mb-2">
                Buy-in Amount <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                value={buyIn}
                onChange={(e) => setBuyIn(e.target.value)}
                placeholder="Enter buy-in amount"
                min="1"
                className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-black/40 border border-orange-500/30 rounded-lg text-white text-sm sm:text-base placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                disabled={loading}
              />
            </div>

            {/* Blinds Row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-white text-xs sm:text-sm font-medium mb-1.5 sm:mb-2">
                  Small Blind <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  value={smallBlind}
                  onChange={(e) => setSmallBlind(e.target.value)}
                  placeholder="Small blind"
                  min="1"
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-black/40 border border-orange-500/30 rounded-lg text-white text-sm sm:text-base placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-white text-xs sm:text-sm font-medium mb-1.5 sm:mb-2">
                  Big Blind <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  value={bigBlind}
                  onChange={(e) => setBigBlind(e.target.value)}
                  placeholder="Big blind"
                  min="1"
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-black/40 border border-orange-500/30 rounded-lg text-white text-sm sm:text-base placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Tournament Settings (conditional) */}
            {gameMode === 'tournament' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3 bg-purple-500/10 border border-purple-500/30 rounded-lg p-3 sm:p-4"
              >
                <h3 className="text-white font-bold text-sm sm:text-base flex items-center gap-2">
                  🏆 Tournament Settings
                </h3>
                
                {/* Blind Level Duration */}
                <div>
                  <label className="block text-white text-xs sm:text-sm font-medium mb-1.5">
                    Blind Level Duration (minutes)
                  </label>
                  <input
                    type="number"
                    value={blindLevelDuration}
                    onChange={(e) => setBlindLevelDuration(e.target.value)}
                    placeholder="10"
                    min="1"
                    className="w-full px-3 py-2 bg-black/40 border border-purple-500/30 rounded-lg text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    disabled={loading}
                  />
                  <p className="text-purple-200/70 text-xs mt-1">
                    How long each blind level lasts before increasing
                  </p>
                </div>

                {/* Prize Structure */}
                <div>
                  <label className="block text-white text-xs sm:text-sm font-medium mb-2">
                    Prize Structure (%)
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <input
                        type="number"
                        value={prizeStructure.first}
                        onChange={(e) => setPrizeStructure({...prizeStructure, first: e.target.value})}
                        placeholder="50"
                        min="0"
                        max="100"
                        step="0.1"
                        className="w-full px-2 py-2 bg-black/40 border border-purple-500/30 rounded-lg text-white text-sm text-center focus:outline-none focus:ring-2 focus:ring-purple-500"
                        disabled={loading}
                      />
                      <p className="text-yellow-300 text-xs mt-1 text-center">🥇 1st</p>
                    </div>
                    <div>
                      <input
                        type="number"
                        value={prizeStructure.second}
                        onChange={(e) => setPrizeStructure({...prizeStructure, second: e.target.value})}
                        placeholder="30"
                        min="0"
                        max="100"
                        step="0.1"
                        className="w-full px-2 py-2 bg-black/40 border border-purple-500/30 rounded-lg text-white text-sm text-center focus:outline-none focus:ring-2 focus:ring-purple-500"
                        disabled={loading}
                      />
                      <p className="text-gray-300 text-xs mt-1 text-center">🥈 2nd</p>
                    </div>
                    <div>
                      <input
                        type="number"
                        value={prizeStructure.third}
                        onChange={(e) => setPrizeStructure({...prizeStructure, third: e.target.value})}
                        placeholder="20"
                        min="0"
                        max="100"
                        step="0.1"
                        className="w-full px-2 py-2 bg-black/40 border border-purple-500/30 rounded-lg text-white text-sm text-center focus:outline-none focus:ring-2 focus:ring-purple-500"
                        disabled={loading}
                      />
                      <p className="text-orange-300 text-xs mt-1 text-center">🥉 3rd</p>
                    </div>
                  </div>
                  <p className="text-purple-200/70 text-xs mt-2">
                    Total: {(parseFloat(prizeStructure.first || '0') + parseFloat(prizeStructure.second || '0') + parseFloat(prizeStructure.third || '0')).toFixed(1)}% (must equal 100%)
                  </p>
                </div>
              </motion.div>
            )}

            {/* Private Room Toggle */}
            <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3 sm:p-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPrivate}
                  onChange={(e) => setIsPrivate(e.target.checked)}
                  className="w-5 h-5 rounded border-orange-500/30 bg-black/40 text-orange-500 focus:ring-2 focus:ring-orange-500"
                  disabled={loading}
                />
                <div>
                  <span className="text-white text-sm sm:text-base font-medium">Private Room</span>
                  <p className="text-orange-200 text-xs mt-0.5">Players need room code to join</p>
                </div>
              </label>
            </div>

            {/* Info Box */}
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 sm:p-4">
              <p className="text-blue-300 text-xs sm:text-sm">
                <strong>Note:</strong> Rooms created by you will only be visible to players you've created. Other managers cannot see or access your rooms.
              </p>
            </div>

            {/* Notification */}
            <AnimatePresence>
              {notification.show && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`p-3 rounded-lg border ${
                    notification.type === 'success'
                      ? 'bg-green-500/10 border-green-500/30 text-green-300'
                      : 'bg-red-500/10 border-red-500/30 text-red-300'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {notification.type === 'success' ? (
                      <CheckCircle size={18} className="flex-shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
                    )}
                    <p className="text-xs sm:text-sm flex-1">
                      {notification.message}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              onMouseEnter={() => soundManager.playHover()}
              disabled={loading || !roomName.trim()}
              className="w-full py-2.5 sm:py-3.5 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white font-bold rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:h-5 border-2 border-white border-t-transparent"></div>
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <Plus size={18} className="sm:w-5 sm:h-5" />
                  <span>Create Room</span>
                </>
              )}
            </motion.button>
          </form>
          ) : activeTab === 'manageRooms' ? (
            /* Manage Rooms Tab */
            <div className="space-y-4">
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 sm:p-4 flex gap-2 sm:gap-3">
                <AlertCircle size={18} className="sm:w-5 sm:h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-red-300 text-xs sm:text-sm font-medium mb-0.5 sm:mb-1">Room Management</p>
                  <p className="text-red-200/80 text-[10px] sm:text-xs">
                    View and delete your created rooms. Deleting a room will remove all players from it.
                  </p>
                </div>
              </div>

              {/* Rooms List */}
              {loadingRooms ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-500 border-t-transparent"></div>
                </div>
              ) : managerRooms.length === 0 ? (
                <div className="bg-white/5 border border-white/10 rounded-lg p-8 text-center">
                  <Settings size={32} className="mx-auto text-gray-400 mb-3 opacity-50" />
                  <p className="text-gray-300 text-sm">No rooms found</p>
                  <p className="text-gray-500 text-xs mt-1">Create a room to get started</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {managerRooms.map((room) => (
                    <div
                      key={room._id}
                      className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-white font-semibold text-sm">{room.roomName || `Room ${room.code}`}</h3>
                            <span className="text-xs px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                              {room.code}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-gray-400">
                            <span className="flex items-center gap-1">
                              <Users size={14} />
                              {room.players?.length || 0}/{room.maxPlayers}
                            </span>
                            <span className="flex items-center gap-1">
                              <Coins size={14} />
                              Buy-in: ${room.buyIn}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-xs ${
                              room.status === 'playing' ? 'bg-green-500/20 text-green-300' :
                              room.status === 'ready' ? 'bg-yellow-500/20 text-yellow-300' :
                              'bg-gray-500/20 text-gray-300'
                            }`}>
                              {room.status}
                            </span>
                          </div>
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            soundManager.playClick()
                            handleDeleteRoom(room._id, room.code)
                          }}
                          onMouseEnter={() => soundManager.playHover()}
                          className="ml-4 p-2 bg-red-600/20 hover:bg-red-600/40 border border-red-500/30 rounded-lg text-red-400 transition-all"
                        >
                          <Trash2 size={18} />
                        </motion.button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : activeTab === 'transactions' ? (
            /* Transaction History Tab */
            <div className="space-y-4">
              {/* Date Filters */}
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 sm:p-4">
                <p className="text-blue-300 text-xs sm:text-sm font-medium mb-3">Filter by Date</p>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-blue-200 w-12">From:</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="flex-1 bg-black/40 border border-blue-500/30 rounded px-3 py-1.5 text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-blue-200 w-12">To:</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="flex-1 bg-black/40 border border-blue-500/30 rounded px-3 py-1.5 text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                      className="text-xs text-blue-400 hover:text-blue-300 underline text-left"
                    >
                      Clear Filters
                    </button>
                  )}
                </div>
              </div>

              {/* Transactions List */}
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-500 border-t-transparent"></div>
                </div>
              ) : transactions.length === 0 ? (
                <div className="bg-white/5 border border-white/10 rounded-lg p-8 text-center">
                  <Receipt size={32} className="mx-auto text-gray-400 mb-3 opacity-50" />
                  <p className="text-gray-300 text-sm">No transactions found</p>
                  <p className="text-gray-400 text-xs mt-1">Credit transfers will appear here</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[400px] landscape:max-h-[250px] overflow-y-auto">
                  {transactions.map((transaction: any) => (
                    <div key={transaction._id} className="bg-white/5 border border-white/10 rounded-lg p-3 sm:p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs text-gray-400">From:</span>
                            <span className="text-sm text-white font-medium">
                              {transaction.fromUser?.username || 'Unknown'}
                            </span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                              transaction.fromUser?.role === 'admin' 
                                ? 'bg-red-500/20 text-red-400' 
                                : 'bg-purple-500/20 text-purple-400'
                            }`}>
                              {transaction.fromUser?.role}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400">To:</span>
                            <span className="text-sm text-white font-medium">
                              {transaction.toUser?.username || 'Unknown'}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-green-400">
                            +${transaction.amount}
                          </div>
                          <div className="text-[10px] text-gray-400">
                            {new Date(transaction.createdAt).toLocaleDateString()}
                          </div>
                          <div className="text-[10px] text-gray-500">
                            {new Date(transaction.createdAt).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                      {transaction.description && (
                        <div className="text-xs text-gray-400 mt-2 pt-2 border-t border-white/5">
                          {transaction.description}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : null}
        </div>
      </motion.div>

      {/* Delete Room Confirmation Modal */}
      <AnimatePresence>
        {deleteModal.show && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => {
              soundManager.playClick()
              setDeleteModal({ show: false, roomId: '', roomCode: '' })
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl border-2 border-red-500/40 shadow-2xl w-full max-w-md landscape:max-w-lg"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-red-600 to-red-500 px-6 py-4 landscape:px-5 landscape:py-3 rounded-t-xl border-b border-red-400/30">
                <div className="flex items-center gap-3 landscape:gap-2">
                  <div className="p-2 landscape:p-1.5 bg-white/20 rounded-lg">
                    <AlertCircle className="text-white" size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl landscape:text-lg font-bold text-white">Delete Room</h3>
                    <p className="text-red-100 text-sm landscape:text-xs">This action cannot be undone</p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 landscape:p-4 space-y-4 landscape:space-y-3">
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 landscape:p-3">
                  <p className="text-white text-base landscape:text-sm mb-2 landscape:mb-1">
                    Are you sure you want to delete room:
                  </p>
                  <p className="text-2xl landscape:text-xl font-bold text-red-400">
                    {deleteModal.roomCode}
                  </p>
                </div>

                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 landscape:p-3">
                  <div className="flex items-start gap-3 landscape:gap-2">
                    <AlertCircle className="text-yellow-400 flex-shrink-0 mt-0.5" size={20} />
                    <div>
                      <p className="text-yellow-400 font-medium text-sm landscape:text-xs mb-1">Warning</p>
                      <p className="text-yellow-200 text-sm landscape:text-xs">
                        All players in this room will be disconnected and the room data will be permanently deleted.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 landscape:gap-2 pt-2">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      soundManager.playClick()
                      setDeleteModal({ show: false, roomId: '', roomCode: '' })
                    }}
                    onMouseEnter={() => soundManager.playHover()}
                    className="flex-1 px-4 py-3 landscape:py-2 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-all text-sm landscape:text-xs"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      soundManager.playClick()
                      confirmDeleteRoom()
                    }}
                    onMouseEnter={() => soundManager.playHover()}
                    className="flex-1 px-4 py-3 landscape:py-2 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-bold rounded-lg transition-all text-sm landscape:text-xs flex items-center justify-center gap-2"
                  >
                    <Trash2 size={16} />
                    Delete Room
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
