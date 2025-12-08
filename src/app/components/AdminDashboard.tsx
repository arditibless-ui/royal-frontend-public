'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { LogOut, Users, Settings, CreditCard, Eye, Ban, Check, X, Plus, Minus, Play, BarChart3, Edit, Receipt, Send, Palette } from 'lucide-react'
import PokerTablePage from './PokerTablePage'
import StatisticsModalNew from './StatisticsModalNew'
import { API_URL } from '../../constants/api'
import { mockAuth } from '../../services/mockApi'
import { soundManager } from '../../utils/sounds'

interface AdminDashboardProps {
  user: any
  onLogout: () => void
}

export default function AdminDashboard({ user, onLogout }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState('users')
  const [showMenu, setShowMenu] = useState(false)
  const [users, setUsers] = useState<any[]>([])
  const [rooms, setRooms] = useState<any[]>([])
  const [managers, setManagers] = useState<any[]>([])
  const [selectedManager, setSelectedManager] = useState<string>('all')
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [viewingRoom, setViewingRoom] = useState<string | null>(null)
  const [notification, setNotification] = useState<{ show: boolean; message: string; code?: string; type?: 'success' | 'error' }>({ 
    show: false, 
    message: '',
    type: 'success'
  })
  const [creditModal, setCreditModal] = useState<{ show: boolean; userId: string; username: string; action: 'add' | 'remove' }>({ 
    show: false, 
    userId: '', 
    username: '',
    action: 'add' 
  })
  const [potCalculator, setPotCalculator] = useState<{ roomId: string; percentage: number }>({ roomId: '', percentage: 1 })
  const [editingRoom, setEditingRoom] = useState<{ roomId: string; maxPlayers: number; buyIn: number } | null>(null)
  const [creditAmount, setCreditAmount] = useState('')
  const [statisticsModal, setStatisticsModal] = useState<{ show: boolean; userId: string; username: string; statistics: any }>({
    show: false,
    userId: '',
    username: '',
    statistics: null
  })
  const [createRoomModal, setCreateRoomModal] = useState(false)
  const [copied, setCopied] = useState(false)
  const [sendCreditsModal, setSendCreditsModal] = useState(false)
  const [sendCreditsUsername, setSendCreditsUsername] = useState('')
  const [sendCreditsAmount, setSendCreditsAmount] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [selectedTransactionManager, setSelectedTransactionManager] = useState('all')
  const [selectedRole, setSelectedRole] = useState('player')
  const [adminCutHistoryModal, setAdminCutHistoryModal] = useState<{ show: boolean; roomId: string; roomCode: string; history: any[] }>({
    show: false,
    roomId: '',
    roomCode: '',
    history: []
  })
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{ show: boolean; roomId: string; roomName: string }>({
    show: false,
    roomId: '',
    roomName: ''
  })
  const [roomConfig, setRoomConfig] = useState({
    roomName: '',
    maxPlayers: 6,
    buyIn: 100,
    isPrivate: false,
    password: ''
  })
  const [musicStarted, setMusicStarted] = useState(false)

  // Start lobby music when component mounts
  useEffect(() => {
    const startMusic = () => {
      if (!musicStarted) {
        soundManager.playBackgroundMusic('lobby');
        setMusicStarted(true);
      }
    };
    
    // Try to play immediately
    startMusic();
    
    // Also add listeners for user interaction
    const events = ['click', 'touchstart', 'keydown'];
    events.forEach(event => {
      document.addEventListener(event, startMusic, { once: true });
    });
    
    return () => {
      soundManager.stopMusic();
      events.forEach(event => {
        document.removeEventListener(event, startMusic);
      });
    }
  }, [])

  const handleLogout = () => {
    soundManager.playClick()
    localStorage.removeItem('token')
    onLogout()
  }

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/api/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      const data = await response.json()
      if (response.ok) {
        setUsers(data.users || [])
      }
    } catch (err) {
      console.error('Failed to fetch users (using mock data):', err)
      // Load from localStorage if backend is offline
      const storedUsers = JSON.parse(localStorage.getItem('mockUsers') || '[]')
      const defaultUsers = [
        { _id: 'admin123', username: 'admin', email: 'admin@poker.com', role: 'admin', credits: 10000, status: 'active' },
        { _id: 'user123', username: 'player1', email: 'player1@poker.com', role: 'user', credits: 1000, status: 'active' }
      ]
      setUsers([...defaultUsers, ...storedUsers])
    }
  }

  const fetchRooms = async () => {
    try {
      const token = localStorage.getItem('token')
      let url = `${API_URL}/api/games/rooms`
      
      // If a specific manager is selected, fetch their rooms
      if (selectedManager && selectedManager !== 'all') {
        url = `${API_URL}/api/games/rooms/by-manager/${selectedManager}`
      }
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setRooms(data.rooms || [])
      }
    } catch (err) {
      console.error('Failed to fetch rooms:', err)
    }
  }

  const fetchManagers = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/api/games/managers`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setManagers(data.managers || [])
      }
    } catch (err) {
      console.error('Failed to fetch managers:', err)
    }
  }

  const fetchTransactions = async () => {
    try {
      const token = localStorage.getItem('token')
      let url = `${API_URL}/api/transactions/history?limit=100`
      if (startDate) {
        url += `&startDate=${startDate}`
      }
      if (endDate) {
        url += `&endDate=${endDate}`
      }
      if (selectedTransactionManager && selectedTransactionManager !== 'all') {
        url += `&managerId=${selectedTransactionManager}`
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
    } catch (err) {
      console.error('Failed to fetch transactions:', err)
      setTransactions([])
    }
  }

  const updateUserCredits = async (userId: string, amount: number) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/api/users/${userId}/credits`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount }),
      })

      if (response.ok) {
        const data = await response.json()
        setNotification({ 
          show: true, 
          message: `${amount > 0 ? 'Added' : 'Removed'} ${Math.abs(amount)} credits ${amount > 0 ? 'to' : 'from'} ${data.user.username}` 
        })
        setTimeout(() => setNotification({ show: false, message: '' }), 3000)
        fetchUsers()
      }
    } catch (err) {
      console.error('Failed to update credits:', err)
      // Mock update - find the user to get their username
      const targetUser = users.find(u => u._id === userId)
      setUsers(prev => prev.map(u => 
        u._id === userId ? { ...u, credits: Math.max(0, u.credits + amount) } : u
      ))
      setNotification({ 
        show: true, 
        message: `${amount > 0 ? 'Added' : 'Removed'} ${Math.abs(amount)} credits ${amount > 0 ? 'to' : 'from'} ${targetUser?.username || 'user'}` 
      })
      setTimeout(() => setNotification({ show: false, message: '' }), 3000)
    }
  }

  const handleSendCredits = async () => {
    try {
      if (!sendCreditsUsername.trim()) {
        setNotification({ 
          show: true, 
          message: 'Please enter a username',
          type: 'error'
        })
        setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 3000)
        return
      }

      const creditAmount = parseInt(sendCreditsAmount)
      if (isNaN(creditAmount) || creditAmount <= 0) {
        setNotification({ 
          show: true, 
          message: 'Please enter a valid amount (positive number)',
          type: 'error'
        })
        setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 3000)
        return
      }

      setLoading(true)
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/api/transactions/send-credits`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: sendCreditsUsername.trim(), amount: creditAmount }),
      })

      const data = await response.json()

      if (response.ok) {
        setNotification({ 
          show: true, 
          message: `Successfully sent ${creditAmount} credits to ${sendCreditsUsername}`,
          type: 'success'
        })
        setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 3000)
        setSendCreditsModal(false)
        setSendCreditsUsername('')
        setSendCreditsAmount('')
        fetchUsers()
      } else {
        setNotification({ 
          show: true, 
          message: data.message || 'Failed to send credits',
          type: 'error'
        })
        setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 3000)
      }
    } catch (error) {
      console.error('Send credits error:', error)
      setNotification({ 
        show: true, 
        message: 'Network error. Please check your connection.',
        type: 'error'
      })
      setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 3000)
    } finally {
      setLoading(false)
    }
  }

  const toggleUserStatus = async (userId: string, action: 'ban' | 'unban') => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/api/users/${userId}/${action}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setNotification({ 
          show: true, 
          message: `User ${data.user.username} ${action === 'ban' ? 'banned' : 'unbanned'} successfully` 
        })
        setTimeout(() => setNotification({ show: false, message: '' }), 3000)
        fetchUsers()
      }
    } catch (err) {
      console.error(`Failed to ${action} user:`, err)
      // Mock update - find the user to get their username
      const targetUser = users.find(u => u._id === userId)
      setUsers(prev => prev.map(u => 
        u._id === userId ? { ...u, status: action === 'ban' ? 'inactive' : 'active' } : u
      ))
      setNotification({ 
        show: true, 
        message: `User ${targetUser?.username || 'user'} ${action === 'ban' ? 'banned' : 'unbanned'} successfully` 
      })
      setTimeout(() => setNotification({ show: false, message: '' }), 3000)
    }
  }

  const viewUserStatistics = async (userId: string, username: string) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/api/users/${userId}/statistics`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      const data = await response.json()
      if (response.ok) {
        setStatisticsModal({
          show: true,
          userId,
          username: data.username || username,
          statistics: data.statistics
        })
      } else {
        setNotification({ 
          show: true, 
          message: 'Failed to fetch user statistics',
          type: 'error'
        })
        setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 3000)
      }
    } catch (error) {
      console.error('View statistics error:', error)
      // Fallback mock data if API fails
      setStatisticsModal({
        show: true,
        userId,
        username,
        statistics: {
          totalGames: 0,
          wins: 0,
          losses: 0,
          biggestWin: { amount: 0, date: null, roomCode: null },
          biggestLoss: { amount: 0, date: null, roomCode: null },
          totalWinnings: 0,
          totalLosses: 0
        }
      })
    }
  }

  const createRoom = async () => {
    if (!roomConfig.roomName || roomConfig.roomName.trim() === '') {
      setNotification({ 
        show: true, 
        message: 'Please enter a room name',
        type: 'error'
      })
      setTimeout(() => setNotification({ show: false, message: '', type: 'error' }), 3000)
      return
    }

    if (roomConfig.isPrivate && (!roomConfig.password || roomConfig.password.trim() === '')) {
      setNotification({ 
        show: true, 
        message: 'Please enter a password for private room',
        type: 'error'
      })
      setTimeout(() => setNotification({ show: false, message: '', type: 'error' }), 3000)
      return
    }

    setLoading(true)
    setCreateRoomModal(false)

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/api/games/rooms`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomName: roomConfig.roomName.trim(),
          maxPlayers: roomConfig.maxPlayers,
          buyIn: roomConfig.buyIn,
          isPrivate: roomConfig.isPrivate,
          password: roomConfig.isPrivate ? roomConfig.password : null,
          smallBlind: Math.floor(roomConfig.buyIn * 0.05),
          bigBlind: Math.floor(roomConfig.buyIn * 0.1)
        }),
      })

      const data = await response.json()
      
      if (response.ok && data.room) {
        setRoomConfig({
          roomName: '',
          maxPlayers: 6,
          buyIn: 100,
          isPrivate: false,
          password: ''
        })
        
        await fetchRooms()
        
        setNotification({ 
          show: true, 
          message: 'Room successfully created!', 
          code: data.room.code || data.room.roomCode,
          type: 'success'
        })
        setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 5000)
      } else {
        setNotification({ 
          show: true, 
          message: data.message || 'Failed to create room',
          type: 'error'
        })
        setTimeout(() => setNotification({ show: false, message: '', type: 'error' }), 3000)
      }
    } catch (err) {
      setNotification({ 
        show: true, 
        message: 'Failed to create room',
        type: 'error'
      })
      setTimeout(() => setNotification({ show: false, message: '', type: 'error' }), 3000)
    } finally {
      setLoading(false)
    }
  }

  const deleteRoom = async (roomId: string) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/api/games/rooms/${roomId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        await fetchRooms()
        setDeleteConfirmModal({ show: false, roomId: '', roomName: '' })
        setNotification({ 
          show: true, 
          message: 'Room deleted successfully!',
          type: 'success'
        })
        setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 3000)
      } else {
        const data = await response.json()
        setDeleteConfirmModal({ show: false, roomId: '', roomName: '' })
        setNotification({ 
          show: true, 
          message: data.message || 'Failed to delete room',
          type: 'error'
        })
        setTimeout(() => setNotification({ show: false, message: '', type: 'error' }), 3000)
      }
    } catch (err) {
      setDeleteConfirmModal({ show: false, roomId: '', roomName: '' })
      setNotification({ 
        show: true, 
        message: 'Failed to delete room',
        type: 'error'
      })
      setTimeout(() => setNotification({ show: false, message: '', type: 'error' }), 3000)
    }
  }

  const applyAdminCut = async (roomId: string, roomCode: string) => {
    const percentage = potCalculator.roomId === roomId ? potCalculator.percentage : 1

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/api/games/rooms/${roomId}/admin-cut`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ percentage })
      })

      const data = await response.json()

      if (response.ok) {
        await fetchRooms()
        setNotification({ 
          show: true, 
          message: `Admin cut of ${percentage}% applied to room ${roomCode}!`,
          type: 'success'
        })
        setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 3000)
      } else {
        setNotification({ 
          show: true, 
          message: data.message || 'Failed to apply admin cut',
          type: 'error'
        })
        setTimeout(() => setNotification({ show: false, message: '', type: 'error' }), 3000)
      }
    } catch (err) {
      setNotification({ 
        show: true, 
        message: 'Failed to apply admin cut',
        type: 'error'
      })
      setTimeout(() => setNotification({ show: false, message: '', type: 'error' }), 3000)
    }
  }

  const viewAdminCutHistory = (room: any, roomCode: string) => {
    setAdminCutHistoryModal({
      show: true,
      roomId: room._id,
      roomCode: roomCode,
      history: room.adminCutHistory || []
    })
  }

  const updateRoomSettings = async (roomId: string, maxPlayers: number, buyIn: number) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/api/games/rooms/${roomId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ maxPlayers, buyIn })
      })

      if (response.ok) {
        await fetchRooms()
        setEditingRoom(null)
        setNotification({ 
          show: true, 
          message: 'Room settings updated successfully!',
          type: 'success'
        })
        setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 3000)
      } else {
        const data = await response.json()
        setNotification({ 
          show: true, 
          message: data.message || 'Failed to update room',
          type: 'error'
        })
        setTimeout(() => setNotification({ show: false, message: '', type: 'error' }), 3000)
      }
    } catch (err) {
      setNotification({ 
        show: true, 
        message: 'Failed to update room',
        type: 'error'
      })
      setTimeout(() => setNotification({ show: false, message: '', type: 'error' }), 3000)
    }
  }

  useEffect(() => {
    fetchUsers()
    fetchManagers()
    if (activeTab === 'transactions') {
      fetchTransactions()
    }
  }, [activeTab])

  useEffect(() => {
    // Fetch rooms when selectedManager changes or when on rooms tab
    if (activeTab === 'rooms') {
      fetchRooms()
    }
    if (activeTab === 'transactions') {
      fetchTransactions()
    }
  }, [selectedManager, activeTab, startDate, endDate, selectedTransactionManager])

  const tabs = [
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'rooms', label: 'Game Oversight', icon: Eye },
    { id: 'themes', label: 'Theme Management', icon: Palette },
    { id: 'transactions', label: 'Transaction History', icon: Receipt },
    { id: 'create-user', label: 'Create User', icon: Plus },
    { id: 'settings', label: 'System Settings', icon: Settings },
  ]

  return (
    <>
      {/* Success/Error Notification */}
      <AnimatePresence>
      {notification.show && (
        <motion.div
          initial={{ opacity: 0, y: -100, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -100, scale: 0.8 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[90vw] sm:w-[calc(100%-2rem)] max-w-md px-4 sm:px-0"
        >
          <motion.div 
            className={`rounded-2xl shadow-2xl border-2 p-6 backdrop-blur-lg ${
              notification.type === 'error' 
                ? 'bg-gradient-to-r from-red-600/95 via-red-500/95 to-red-600/95 border-red-400' 
                : 'bg-gradient-to-r from-green-600/95 via-emerald-500/95 to-green-600/95 border-green-400'
            } text-white`}
            animate={{ 
              boxShadow: notification.type === 'error' 
                ? ['0 0 20px rgba(239, 68, 68, 0.3)', '0 0 40px rgba(239, 68, 68, 0.5)', '0 0 20px rgba(239, 68, 68, 0.3)']
                : ['0 0 20px rgba(34, 197, 94, 0.3)', '0 0 40px rgba(34, 197, 94, 0.5)', '0 0 20px rgba(34, 197, 94, 0.3)']
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <div className="flex items-start gap-4">
              <motion.div 
                className="flex-shrink-0"
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 0.5, repeat: 2 }}
              >
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  {notification.type === 'error' ? (
                    <X size={24} className="text-white" />
                  ) : (
                    <Check size={24} className="text-white" />
                  )}
                </div>
              </motion.div>
              <div className="flex-1">
                <h3 className="font-bold text-lg mb-1">
                  {notification.type === 'error' ? '❌ Error!' : '✅ Success!'}
                </h3>
                <p className={`mb-3 ${notification.type === 'error' ? 'text-red-50' : 'text-green-50'}`}>
                  {notification.message}
                </p>
                {notification.code && (
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white/20 backdrop-blur-sm rounded-lg p-3 border border-white/30"
                  >
                    <p className="text-xs text-green-100 mb-1">Room Code</p>
                    <div className="flex items-center justify-between">
                      <p className="text-2xl font-bold tracking-wider">{notification.code}</p>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(notification.code!)
                          setCopied(true)
                          setTimeout(() => setCopied(false), 2000)
                        }}
                        className={`ml-2 px-3 py-1 ${
                          copied ? 'bg-white/40' : 'bg-white/20 hover:bg-white/30'
                        } rounded-lg transition-colors text-sm font-medium`}
                      >
                        {copied ? '✓ Copied!' : 'Copy'}
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
              <button
                onClick={() => setNotification({ show: false, message: '', type: 'success' })}
                className="flex-shrink-0 text-white/80 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>

      {/* Credit Management Modal */}
      {creditModal.show && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-2 sm:p-4"
          onClick={() => setCreditModal({ show: false, userId: '', username: '', action: 'add' })}
        >
          <motion.div 
            onClick={(e) => e.stopPropagation()} 
            className="max-w-md w-full"
            initial={{ y: 50 }}
            animate={{ y: 0 }}
          >
            <div className="bg-gradient-to-br from-gray-900 to-black border-2 border-yellow-500/50 rounded-xl sm:rounded-2xl shadow-2xl p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center ${
                    creditModal.action === 'add' ? 'bg-green-500/20' : 'bg-yellow-500/20'
                  }`}>
                    {creditModal.action === 'add' ? (
                      <Plus size={20} className="text-green-400" />
                    ) : (
                      <Minus size={20} className="text-yellow-400" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-base sm:text-lg text-white">
                      {creditModal.action === 'add' ? 'Add Credits' : 'Remove Credits'}
                    </h3>
                    <p className="text-gray-400 text-xs sm:text-sm">
                      {creditModal.username}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setCreditModal({ show: false, userId: '', username: '', action: 'add' })}
                  className="text-white/60 hover:text-white transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={(e) => {
                e.preventDefault()
                const amount = parseInt(creditAmount)
                
                // Security: Validate input on frontend
                if (isNaN(amount) || amount <= 0) {
                  setNotification({ 
                    show: true, 
                    message: 'Please enter a valid amount greater than 0' 
                  })
                  setTimeout(() => setNotification({ show: false, message: '' }), 3000)
                  return
                }

                // Security: Limit maximum credit change
                if (amount > 1000000) {
                  setNotification({ 
                    show: true, 
                    message: 'Maximum credit change is 1,000,000 per transaction' 
                  })
                  setTimeout(() => setNotification({ show: false, message: '' }), 3000)
                  return
                }
                
                const finalAmount = creditModal.action === 'add' ? amount : -amount
                updateUserCredits(creditModal.userId, finalAmount)
                setCreditModal({ show: false, userId: '', username: '', action: 'add' })
                setCreditAmount('')
              }}>
                <div className="mb-4 sm:mb-6">
                  <label className="block text-white text-xs sm:text-sm font-medium mb-2">
                    Amount <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-yellow-500" size={18} />
                    <input
                      type="number"
                      value={creditAmount}
                      onChange={(e) => setCreditAmount(e.target.value)}
                      min="1"
                      max="1000000"
                      required
                      autoFocus
                      className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-black/40 border border-white/20 rounded-lg text-white text-sm sm:text-base placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                      placeholder="Enter amount (max 1,000,000)"
                    />
                  </div>
                  <p className="text-gray-400 text-[10px] sm:text-xs mt-2">
                    {creditModal.action === 'add' 
                      ? 'Credits will be added to the user\'s account' 
                      : 'Credits will be deducted from the user\'s account'}
                  </p>
                </div>

                <div className="flex gap-2 sm:gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    className={`flex-1 py-2.5 sm:py-3 text-white text-sm sm:text-base font-bold rounded-lg transition-all duration-300 ${
                      creditModal.action === 'add'
                        ? 'bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400'
                        : 'bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400'
                    }`}
                  >
                    {creditModal.action === 'add' ? 'Add Credits' : 'Remove Credits'}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={() => {
                      setCreditModal({ show: false, userId: '', username: '', action: 'add' })
                      setCreditAmount('')
                    }}
                    className="px-4 sm:px-6 py-2.5 sm:py-3 bg-gray-700 text-white text-sm sm:text-base font-bold rounded-lg hover:bg-gray-600 transition-all duration-300"
                  >
                    Cancel
                  </motion.button>
                </div>
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Send Credits Modal */}
      {sendCreditsModal && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => setSendCreditsModal(false)}
        >
          <motion.div 
            onClick={(e) => e.stopPropagation()} 
            className="max-w-md w-full"
            initial={{ y: 50 }}
            animate={{ y: 0 }}
          >
            <div className="bg-gradient-to-br from-gray-900 to-black border-2 border-green-500/50 rounded-2xl shadow-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                    <Send size={20} className="text-green-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-white">Send Credits</h3>
                    <p className="text-gray-400 text-sm">Transfer credits to a player</p>
                  </div>
                </div>
                <button
                  onClick={() => setSendCreditsModal(false)}
                  className="text-white/60 hover:text-white transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Username <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={sendCreditsUsername}
                    onChange={(e) => setSendCreditsUsername(e.target.value)}
                    placeholder="Enter player's username"
                    className="w-full px-4 py-3 bg-black/40 border border-green-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Amount <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    value={sendCreditsAmount}
                    onChange={(e) => setSendCreditsAmount(e.target.value)}
                    placeholder="Enter amount"
                    min="1"
                    className="w-full px-4 py-3 bg-black/40 border border-green-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleSendCredits}
                    disabled={loading || !sendCreditsUsername.trim() || !sendCreditsAmount}
                    className="flex-1 py-3 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <Send size={18} />
                        <span>Send Credits</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSendCreditsModal(false)}
                    className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Create Room Modal */}
      {createRoomModal && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto"
          onClick={() => setCreateRoomModal(false)}
        >
          <motion.div 
            onClick={(e) => e.stopPropagation()} 
            className="max-w-md w-full my-4"
            initial={{ y: 50 }}
            animate={{ y: 0 }}
          >
            <div className="bg-gradient-to-br from-gray-900 to-black border-2 border-purple-500/50 rounded-xl sm:rounded-2xl shadow-2xl p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-500/20 rounded-full flex items-center justify-center">
                    <Plus size={20} className="text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base sm:text-lg text-white">Create New Room</h3>
                    <p className="text-gray-400 text-xs sm:text-sm">Configure room settings</p>
                  </div>
                </div>
                <button
                  onClick={() => setCreateRoomModal(false)}
                  className="text-white/60 hover:text-white transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={(e) => {
                e.preventDefault()
                createRoom()
              }} className="space-y-3 sm:space-y-4">
                {/* Room Name */}
                <div>
                  <label className="block text-white text-xs sm:text-sm font-medium mb-2">
                    Room Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={roomConfig.roomName}
                    onChange={(e) => setRoomConfig({ ...roomConfig, roomName: e.target.value })}
                    required
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-black/40 border border-white/20 rounded-lg text-white text-sm sm:text-base placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Enter room name"
                  />
                </div>

                {/* Max Players */}
                <div>
                  <label className="block text-white text-xs sm:text-sm font-medium mb-2">
                    Max Players <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={roomConfig.maxPlayers}
                    onChange={(e) => setRoomConfig({ ...roomConfig, maxPlayers: parseInt(e.target.value) })}
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-black/40 border border-white/20 rounded-lg text-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value={2}>2 Players</option>
                    <option value={4}>4 Players</option>
                    <option value={6}>6 Players</option>
                    <option value={8}>8 Players</option>
                    <option value={9}>9 Players (Full Table)</option>
                  </select>
                </div>

                {/* Buy-in */}
                <div>
                  <label className="block text-white text-xs sm:text-sm font-medium mb-2">
                    Buy-in Amount <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-yellow-500">$</span>
                    <input
                      type="number"
                      value={roomConfig.buyIn}
                      onChange={(e) => setRoomConfig({ ...roomConfig, buyIn: parseInt(e.target.value) || 0 })}
                      min="10"
                      max="10000"
                      required
                      className="w-full pl-8 pr-4 py-2.5 sm:py-3 bg-black/40 border border-white/20 rounded-lg text-white text-sm sm:text-base placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Enter buy-in amount"
                    />
                  </div>
                  <p className="text-gray-400 text-[10px] sm:text-xs mt-1">Minimum: $10 | Maximum: $10,000</p>
                </div>

                {/* Private Room Toggle */}
                <div className="border-t border-white/10 pt-3 sm:pt-4">
                  <label className="flex items-center justify-between cursor-pointer">
                    <div>
                      <span className="text-white text-xs sm:text-sm font-medium">Private Room</span>
                      <p className="text-gray-400 text-[10px] sm:text-xs mt-0.5">Require password to join</p>
                    </div>
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={roomConfig.isPrivate}
                        onChange={(e) => setRoomConfig({ ...roomConfig, isPrivate: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </div>
                  </label>
                </div>

                {/* Password (shown only if isPrivate is true) */}
                {roomConfig.isPrivate && (
                  <div>
                    <label className="block text-white text-xs sm:text-sm font-medium mb-2">
                      Room Password <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={roomConfig.password}
                      onChange={(e) => setRoomConfig({ ...roomConfig, password: e.target.value })}
                      required={roomConfig.isPrivate}
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-black/40 border border-white/20 rounded-lg text-white text-sm sm:text-base placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Enter room password"
                    />
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 sm:gap-3 pt-2 sm:pt-4">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-2.5 sm:py-3 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white text-sm sm:text-base font-bold rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Creating...' : 'Create Room'}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={() => setCreateRoomModal(false)}
                    className="px-4 sm:px-6 py-2.5 sm:py-3 bg-gray-700 text-white text-sm sm:text-base font-bold rounded-lg hover:bg-gray-600 transition-all duration-300"
                  >
                    Cancel
                  </motion.button>
                </div>
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Conditional rendering for poker table */}
      {viewingRoom ? (
        <div key={`poker-table-${viewingRoom}`}>
          <PokerTablePage roomCode={viewingRoom} onBack={() => setViewingRoom(null)} isAdminView={true} />
        </div>
      ) : (
        <div className="min-h-screen p-4">
      
      {/* Admin Dashboard Content - Fully Responsive */}
      <div className="min-h-[100dvh]">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-4 sm:mb-6 flex-wrap gap-3 sm:gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-1 sm:mb-2 truncate">Admin Dashboard</h1>
          <p className="text-green-200 text-xs sm:text-sm lg:text-base">System Administrator Panel</p>
        </div>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            soundManager.playClick()
            handleLogout()
          }}
          onMouseEnter={() => soundManager.playHover()}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500 transition-colors flex-shrink-0"
        >
          <LogOut size={18} />
          <span className="hidden sm:inline">Logout</span>
          <span className="sm:hidden">Exit</span>
        </motion.button>
      </div>

      {/* Tab Navigation */}
      {/* Desktop/Landscape: Show all buttons */}
      <div className="hidden landscape:flex md:flex gap-2 mb-6 md:mb-8 landscape:mb-3 overflow-x-auto">
        {tabs.map((tab) => {
          const IconComponent = tab.icon
          return (
            <motion.button
              key={tab.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                soundManager.playClick()
                setActiveTab(tab.id)
              }}
              onMouseEnter={() => soundManager.playHover()}
              className={`flex items-center gap-2 landscape:gap-1 px-4 landscape:px-3 py-3 landscape:py-2 rounded-lg font-medium text-sm landscape:text-xs transition-all whitespace-nowrap min-w-0 ${
                activeTab === tab.id
                  ? 'bg-yellow-600 text-black'
                  : 'bg-black/40 text-white hover:bg-black/60'
              }`}
            >
              <IconComponent size={16} className="md:w-5 md:h-5 landscape:w-4 landscape:h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
            </motion.button>
          )
        })}
      </div>

      {/* Mobile Portrait: Dropdown Menu */}
      <div className="portrait:block landscape:hidden md:hidden mb-6 relative">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className={`w-full flex items-center justify-between px-4 py-3 rounded-lg font-medium text-sm transition-all ${
            showMenu ? 'bg-yellow-600 text-black' : 'bg-black/40 text-white'
          }`}
        >
          <div className="flex items-center gap-2">
            {(() => {
              const currentTab = tabs.find(t => t.id === activeTab)
              const IconComponent = currentTab?.icon || Users
              return (
                <>
                  <IconComponent size={18} />
                  <span>{currentTab?.label || 'Menu'}</span>
                </>
              )
            })()}
          </div>
          <motion.div
            animate={{ rotate: showMenu ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            ▼
          </motion.div>
        </button>

        <AnimatePresence>
          {showMenu && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute left-0 right-0 top-full mt-2 bg-black/95 backdrop-blur-sm rounded-lg border border-white/20 shadow-2xl z-50 overflow-hidden"
            >
              {tabs.map((tab) => {
                const IconComponent = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      soundManager.playClick()
                      setActiveTab(tab.id)
                      setShowMenu(false)
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 font-medium text-sm transition-all ${
                      activeTab === tab.id
                        ? 'bg-yellow-600/20 text-yellow-400 border-l-4 border-yellow-600'
                        : 'text-white hover:bg-white/10'
                    }`}
                  >
                    <IconComponent size={18} />
                    <span>{tab.label}</span>
                  </button>
                )
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Tab Content */}
      <div className="bg-black/40 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-white/20 p-3 sm:p-6 landscape:p-2">
        {activeTab === 'users' && (
          <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-3">
              <div>
                <h3 className="text-lg sm:text-2xl font-bold text-white mb-2">User Management</h3>
                {/* Manager Filter */}
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-400">Filter by Manager:</label>
                  <select
                    value={selectedManager}
                    onChange={(e) => {
                      soundManager.playClick()
                      setSelectedManager(e.target.value)
                    }}
                    className="bg-black/40 border border-purple-500/30 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="all">All Users</option>
                    {managers.map((manager) => (
                      <option key={manager._id} value={manager._id}>
                        {manager.username}'s Players
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <button
                onClick={() => {
                  soundManager.playClick()
                  setSendCreditsModal(true)
                }}
                onMouseEnter={() => soundManager.playHover()}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500 transition-colors text-sm whitespace-nowrap"
              >
                <Send size={16} />
                <span>Send Credits</span>
              </button>
            </div>
            
            <div className="overflow-x-auto -mx-3 sm:mx-0">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className="border-b border-white/20">
                    <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-white text-xs sm:text-base font-medium">User</th>
                    <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-white text-xs sm:text-base font-medium hidden md:table-cell">Email</th>
                    <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-white text-xs sm:text-base font-medium">Role</th>
                    <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-white text-xs sm:text-base font-medium">Credits</th>
                    <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-white text-xs sm:text-base font-medium">Status</th>
                    <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-white text-xs sm:text-base font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users
                    .filter(userData => selectedManager === 'all' || userData.managerId === selectedManager || (selectedManager === 'all' && !userData.managerId))
                    .map((userData: any) => (
                    <tr key={userData._id} className="border-b border-white/10 hover:bg-white/5">
                      <td className="py-3 sm:py-4 px-2 sm:px-4">
                        <div className="text-white font-medium text-sm sm:text-base">{userData.username}</div>
                        <div className="text-gray-400 text-[10px] sm:text-sm md:hidden">{userData.email}</div>
                        <div className="text-gray-400 text-[10px] sm:text-xs hidden md:block">
                          ID: {userData._id.slice(-8)}
                          {userData.managerId && (
                            <span className="ml-2 text-purple-400">
                              (Manager: {managers.find(m => m._id === userData.managerId)?.username || 'Unknown'})
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 sm:py-4 px-2 sm:px-4 text-gray-300 text-sm hidden md:table-cell">{userData.email}</td>
                      <td className="py-3 sm:py-4 px-2 sm:px-4">
                        <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-[10px] sm:text-xs font-medium ${
                          userData.role === 'admin' 
                            ? 'bg-red-500/20 text-red-400' 
                            : userData.role === 'manager'
                            ? 'bg-purple-500/20 text-purple-400'
                            : 'bg-blue-500/20 text-blue-400'
                        }`}>
                          {userData.role}
                        </span>
                      </td>
                      <td className="py-3 sm:py-4 px-2 sm:px-4">
                        <div className="flex items-center gap-1 sm:gap-2">
                          <CreditCard className="text-yellow-500" size={14} />
                          <span className="text-white font-medium text-sm sm:text-base">{userData.credits}</span>
                        </div>
                      </td>
                      <td className="py-3 sm:py-4 px-2 sm:px-4">
                        <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-[10px] sm:text-xs font-medium ${
                          userData.status === 'active' 
                            ? 'bg-green-500/20 text-green-400' 
                            : 'bg-red-500/20 text-red-400'
                        }`}>
                          {userData.status}
                        </span>
                      </td>
                      <td className="py-3 sm:py-4 px-2 sm:px-4">
                        <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                          <button
                            onClick={() => {
                              soundManager.playClick()
                              setCreditModal({ 
                                show: true, 
                                userId: userData._id, 
                                username: userData.username,
                                action: 'add' 
                              })
                              setCreditAmount('')
                            }}
                            onMouseEnter={() => soundManager.playHover()}
                            className="p-1 sm:p-1.5 bg-green-600 text-white rounded hover:bg-green-500"
                            title="Add credits"
                          >
                            <Plus size={12} className="sm:w-[14px] sm:h-[14px]" />
                          </button>
                          <button
                            onClick={() => {
                              soundManager.playClick()
                              setCreditModal({ 
                                show: true, 
                                userId: userData._id, 
                                username: userData.username,
                                action: 'remove' 
                              })
                              setCreditAmount('')
                            }}
                            onMouseEnter={() => soundManager.playHover()}
                            className="p-1 sm:p-1.5 bg-yellow-600 text-white rounded hover:bg-yellow-500"
                            title="Remove credits"
                          >
                            <Minus size={12} className="sm:w-[14px] sm:h-[14px]" />
                          </button>
                          <button
                            onClick={() => {
                              soundManager.playClick()
                              viewUserStatistics(userData._id, userData.username)
                            }}
                            onMouseEnter={() => soundManager.playHover()}
                            className="p-1 sm:p-1.5 bg-purple-600 text-white rounded hover:bg-purple-500"
                            title="View statistics"
                          >
                            <BarChart3 size={12} className="sm:w-[14px] sm:h-[14px]" />
                          </button>
                          <button
                            onClick={() => {
                              soundManager.playClick()
                              toggleUserStatus(userData._id, userData.status === 'active' ? 'ban' : 'unban')
                            }}
                            onMouseEnter={() => soundManager.playHover()}
                            className={`p-1 sm:p-1.5 rounded ${
                              userData.status === 'active'
                                ? 'bg-red-600 hover:bg-red-500'
                                : 'bg-green-600 hover:bg-green-500'
                            } text-white`}
                            title={userData.status === 'active' ? 'Ban user' : 'Unban user'}
                          >
                            {userData.status === 'active' ? <Ban size={12} className="sm:w-[14px] sm:h-[14px]" /> : <Check size={12} className="sm:w-[14px] sm:h-[14px]" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'rooms' && (
          <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-3">
              <div>
                <h3 className="text-lg sm:text-2xl font-bold text-white mb-2">Game Room Oversight</h3>
                {/* Manager Selector */}
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-400">View Rooms:</label>
                  <select
                    value={selectedManager}
                    onChange={(e) => {
                      soundManager.playClick()
                      setSelectedManager(e.target.value)
                    }}
                    className="bg-black/40 border border-purple-500/30 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="all">All Rooms</option>
                    {managers.map((manager) => (
                      <option key={manager._id} value={manager._id}>
                        {manager.username}'s Rooms
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto flex-wrap">
                <button
                  onClick={() => {
                    soundManager.playClick()
                    setCreateRoomModal(true)
                  }}
                  onMouseEnter={() => soundManager.playHover()}
                  className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-500 transition-colors text-sm sm:text-base flex-1 sm:flex-none justify-center"
                >
                  <Plus size={16} className="sm:w-[18px] sm:h-[18px]" />
                  <span className="text-sm sm:text-base">Create Room</span>
                </button>
              </div>
            </div>
            
            {rooms.length === 0 ? (
              <div className="text-center py-8 sm:py-12 text-gray-400">
                <Eye size={32} className="sm:w-[48px] sm:h-[48px] mx-auto mb-3 sm:mb-4 opacity-50" />
                <p className="text-sm sm:text-base">No active game rooms</p>
                <p className="text-xs sm:text-sm mt-2">Create a bot room to see the poker table in action</p>
              </div>
            ) : (
              <div className="grid gap-3 sm:gap-4">
                {rooms.map((room: any) => {
                  const roomCode = room.code || room.roomCode || 'UNKNOWN'
                  console.log('Rendering room:', roomCode, room)
                  return (
                  <div key={room._id} className="bg-white/5 border border-white/10 rounded-lg sm:rounded-xl p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start mb-3 sm:mb-4 gap-2 sm:gap-0">
                      <div className="flex-1">
                        <h4 className="text-base sm:text-xl font-bold text-white mb-1">{room.roomName || `Room ${roomCode}`}</h4>
                        <p className="text-xs sm:text-sm text-gray-400 mb-2">Code: {roomCode}</p>
                        
                        {/* Room Settings - Editable */}
                        {editingRoom?.roomId === room._id ? (
                          <div className="flex flex-col gap-2 mt-2">
                            <div className="flex items-center gap-2">
                              <label className="text-xs text-gray-400 w-20">Max Players:</label>
                              <input
                                type="number"
                                min="2"
                                max="10"
                                value={editingRoom?.maxPlayers || room.maxPlayers}
                                onChange={(e) => editingRoom && setEditingRoom({ ...editingRoom, maxPlayers: Number(e.target.value) })}
                                className="bg-black/40 text-white px-2 py-1 rounded text-sm border border-white/20 w-20"
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <label className="text-xs text-gray-400 w-20">Buy-in:</label>
                              <div className="flex items-center gap-1">
                                <span className="text-white">$</span>
                                <input
                                  type="number"
                                  min="10"
                                  max="10000"
                                  value={editingRoom?.buyIn || room.buyIn}
                                  onChange={(e) => editingRoom && setEditingRoom({ ...editingRoom, buyIn: Number(e.target.value) })}
                                  className="bg-black/40 text-white px-2 py-1 rounded text-sm border border-white/20 w-24"
                                />
                              </div>
                            </div>
                            <div className="flex gap-2 mt-1">
                              <button
                                onClick={() => editingRoom && updateRoomSettings(room._id, editingRoom.maxPlayers, editingRoom.buyIn)}
                                className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-500"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingRoom(null)}
                                className="px-3 py-1 bg-gray-600 text-white rounded text-xs hover:bg-gray-500"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-300">
                            <span>Players: {room.players?.length || 0}/{room.maxPlayers}</span>
                            <span>Buy-in: ${room.buyIn}</span>
                            <span>Pot: ${room.currentPot || room.gameState?.pot || 0}</span>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => setEditingRoom({ roomId: room._id, maxPlayers: room.maxPlayers, buyIn: room.buyIn })}
                              className="flex items-center gap-1 px-2 sm:px-3 py-1.5 bg-purple-600/20 hover:bg-purple-600/40 rounded-lg text-purple-400 transition-colors border border-purple-500/30 text-xs"
                              title="Edit room settings"
                            >
                              <Edit size={14} className="sm:w-[16px] sm:h-[16px]" />
                              <span className="hidden sm:inline">Edit</span>
                            </motion.button>
                          </div>
                        )}
                      </div>
                      <span className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded text-xs sm:text-sm font-medium whitespace-nowrap ${
                        (room.players?.length || 0) >= 2 && (room.status === 'playing' || room.gameState?.status === 'playing') ? 'bg-green-500/20 text-green-400' : 
                        (room.players?.length || 0) >= 2 ? 'bg-yellow-500/20 text-yellow-400' : 
                        'bg-gray-500/20 text-gray-400'
                      }`}>
                        {(room.players?.length || 0) >= 2 && (room.status === 'playing' || room.gameState?.status === 'playing') ? 'Playing' : 
                         (room.players?.length || 0) >= 2 ? 'Ready' : 'Waiting'}
                      </span>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3">
                      <div className="flex-1 w-full">
                        {room.players && room.players.length > 0 && (
                          <div>
                            <h5 className="text-white font-medium mb-2 text-sm sm:text-base">Players:</h5>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                              {room.players.map((player: any, index: number) => (
                                <div key={index} className="bg-black/20 px-2 sm:px-3 py-1.5 sm:py-2 rounded text-xs sm:text-sm text-gray-300 flex items-center gap-1 flex-wrap">
                                  <span className="truncate">{player.username || `Player ${index + 1}`}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex flex-col gap-3 w-full sm:w-auto sm:ml-4">
                        {/* Admin Cut History Button */}
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => viewAdminCutHistory(room, roomCode)}
                          className="w-full px-3 py-2 bg-gradient-to-r from-yellow-600 to-orange-600 text-white rounded-lg text-xs font-medium hover:from-yellow-500 hover:to-orange-500 transition-all shadow-lg flex items-center justify-center gap-2"
                        >
                          <Receipt size={14} />
                          <span>Admin Cut History {room.adminCutHistory?.length > 0 ? `(${room.adminCutHistory.length})` : ''}</span>
                        </motion.button>

                        {/* Pot Calculator */}
                        <div className="bg-black/20 border border-purple-500/30 rounded-lg p-3">
                          <h5 className="text-white font-medium mb-2 text-xs">Admin Cut Calculator</h5>
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                              <label className="text-xs text-gray-300 whitespace-nowrap">Percentage:</label>
                              <select
                                value={potCalculator.roomId === room._id ? potCalculator.percentage : (room.adminCutPercentage || 1)}
                                onChange={(e) => setPotCalculator({ roomId: room._id, percentage: Number(e.target.value) })}
                                className="bg-black/40 text-white px-2 py-1 rounded text-xs border border-white/20 flex-1"
                              >
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(p => (
                                  <option key={p} value={p}>{p}%</option>
                                ))}
                              </select>
                            </div>
                            <div className="bg-green-500/10 border border-green-500/30 rounded px-2 py-1.5">
                              <span className="text-xs text-gray-300">Your cut: </span>
                              <span className="text-sm font-bold text-green-400">
                                ${((room.currentPot || room.gameState?.pot || 0) * (potCalculator.roomId === room._id ? potCalculator.percentage : (room.adminCutPercentage || 1)) / 100).toFixed(2)}
                              </span>
                            </div>
                            {room.adminCutPercentage > 0 && room.adminCutAppliedAt && (
                              <div className="text-xs text-gray-400 italic">
                                Applied: {room.adminCutPercentage}% on {new Date(room.adminCutAppliedAt).toLocaleDateString()}
                              </div>
                            )}
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => applyAdminCut(room._id, roomCode)}
                              className="w-full px-3 py-1.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded text-xs font-medium hover:from-purple-500 hover:to-pink-500 transition-all shadow-lg"
                            >
                              Apply Admin Cut
                            </motion.button>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-2">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                              console.log('View Table clicked for room:', roomCode, room)
                              setViewingRoom(roomCode)
                            }}
                            className="flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors text-sm sm:text-base w-full sm:w-auto shadow-lg"
                          >
                            <Play size={14} className="sm:w-[16px] sm:h-[16px]" />
                            View Table
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setDeleteConfirmModal({ show: true, roomId: room._id, roomName: room.roomName })}
                            className="flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500 transition-colors text-sm sm:text-base w-full sm:w-auto shadow-lg"
                          >
                            <X size={14} className="sm:w-[16px] sm:h-[16px]" />
                            Delete
                          </motion.button>
                        </div>
                      </div>
                    </div>
                  </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'create-user' && (
          <div>
            <h3 className="text-lg sm:text-2xl font-bold text-white mb-4 sm:mb-6">Create New User</h3>
            
            <div className="bg-white/5 border border-white/10 rounded-lg sm:rounded-xl p-4 sm:p-6 max-w-2xl">
              <form onSubmit={async (e) => {
                e.preventDefault()
                const formData = new FormData(e.currentTarget)
                const username = formData.get('username') as string
                const email = formData.get('email') as string
                const password = formData.get('password') as string
                const confirmPassword = formData.get('confirmPassword') as string
                const role = formData.get('role') as string
                const managerId = formData.get('managerId') as string
                const credits = parseInt(formData.get('credits') as string)

                if (password !== confirmPassword) {
                  setNotification({ 
                    show: true, 
                    message: 'Passwords do not match!' 
                  })
                  setTimeout(() => setNotification({ show: false, message: '' }), 3000)
                  return
                }

                if (role === 'player' && !managerId) {
                  setNotification({ 
                    show: true, 
                    message: 'Please select a manager for the player!' 
                  })
                  setTimeout(() => setNotification({ show: false, message: '' }), 3000)
                  return
                }

                try {
                  const token = localStorage.getItem('token')
                  const response = await fetch(`${API_URL}/api/auth/register`, {
                    method: 'POST',
                    headers: {
                      'Authorization': `Bearer ${token}`,
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ 
                      username, 
                      email, 
                      password, 
                      role, 
                      credits, 
                      managerId: role === 'player' ? managerId : null 
                    }),
                  })

                  const data = await response.json()

                  if (response.ok) {
                    setNotification({ 
                      show: true, 
                      message: `User ${username} created successfully!` 
                    })
                    setTimeout(() => setNotification({ show: false, message: '' }), 3000)
                    if (e.currentTarget) {
                      e.currentTarget.reset()
                      setSelectedRole('player')
                    }
                    fetchUsers()
                    setActiveTab('users') // Switch to users tab to see the new user
                  } else {
                    setNotification({ 
                      show: true, 
                      message: data.message || 'Failed to create user' 
                    })
                    setTimeout(() => setNotification({ show: false, message: '' }), 3000)
                  }
                } catch (err) {
                  console.error('Failed to create user (backend offline, using mock):', err)
                  
                  // Fallback to mock API when backend is not available
                  try {
                    // Add user directly to mock users list in frontend
                    const newUser = {
                      _id: `user_${Date.now()}`,
                      username,
                      email,
                      password, // In production this would be hashed
                      role: role || 'player',
                      credits,
                      status: 'active'
                    }
                    
                    // Store in localStorage for persistence across page refreshes
                    const storedUsers = JSON.parse(localStorage.getItem('mockUsers') || '[]')
                    storedUsers.push(newUser)
                    localStorage.setItem('mockUsers', JSON.stringify(storedUsers))
                    
                    setNotification({ 
                      show: true, 
                      message: `User ${username} created successfully! (Demo mode)`,
                      type: 'success'
                    })
                    setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 3000)
                    if (e.currentTarget) {
                      e.currentTarget.reset()
                      setSelectedRole('player')
                    }
                    
                    // Add to local users state
                    setUsers(prev => [...prev, { ...newUser, password: undefined }])
                    setActiveTab('users')
                  } catch (mockErr) {
                    console.error('Mock creation also failed:', mockErr)
                    setNotification({ 
                      show: true, 
                      message: 'Failed to create user. Please try again.',
                      type: 'error'
                    })
                    setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 3000)
                  }
                }
              }} className="space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-white text-xs sm:text-sm font-medium mb-1.5 sm:mb-2">
                    Username <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="username"
                    required
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-black/20 border border-white/20 rounded text-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    placeholder="Enter username"
                  />
                </div>

                <div>
                  <label className="block text-white text-xs sm:text-sm font-medium mb-1.5 sm:mb-2">
                    Email <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-black/20 border border-white/20 rounded text-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    placeholder="Enter email"
                  />
                </div>

                <div>
                  <label className="block text-white text-xs sm:text-sm font-medium mb-1.5 sm:mb-2">
                    Account Type <span className="text-red-400">*</span>
                  </label>
                  <select
                    name="role"
                    required
                    defaultValue="player"
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-black/20 border border-white/20 rounded text-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  >
                    <option value="player">Player</option>
                    <option value="manager">Manager</option>
                  </select>
                  <p className="text-xs text-gray-400 mt-1">
                    Managers can send credits to players
                  </p>
                </div>

                <div>
                  <label className={`block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 ${selectedRole === 'manager' ? 'text-gray-500' : 'text-white'}`}>
                    Assign to Manager {selectedRole === 'player' && <span className="text-red-400">*</span>}
                  </label>
                  <select
                    name="managerId"
                    required={selectedRole === 'player'}
                    disabled={selectedRole === 'manager'}
                    className={`w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-black/20 border border-white/20 rounded text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-yellow-500 ${
                      selectedRole === 'manager' ? 'opacity-50 cursor-not-allowed text-gray-500' : 'text-white'
                    }`}
                  >
                    <option value="">Select a manager</option>
                    {managers.map((manager) => (
                      <option key={manager._id} value={manager._id}>
                        {manager.username}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-400 mt-1">
                    {selectedRole === 'manager' 
                      ? 'Managers are not assigned to other managers' 
                      : 'Players will be created under the selected manager\'s domain'}
                  </p>
                </div>

                <div>
                  <label className="block text-white text-xs sm:text-sm font-medium mb-1.5 sm:mb-2">
                    Password <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="password"
                    name="password"
                    required
                    minLength={6}
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-black/20 border border-white/20 rounded text-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    placeholder="Enter password (min 6 characters)"
                  />
                </div>

                <div>
                  <label className="block text-white text-xs sm:text-sm font-medium mb-1.5 sm:mb-2">
                    Confirm Password <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    required
                    minLength={6}
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-black/20 border border-white/20 rounded text-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    placeholder="Confirm password"
                  />
                </div>

                <div>
                  <label className="block text-white text-xs sm:text-sm font-medium mb-1.5 sm:mb-2">
                    Initial Credits
                  </label>
                  <input
                    type="number"
                    name="credits"
                    defaultValue={1000}
                    min={0}
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-black/20 border border-white/20 rounded text-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    placeholder="Enter initial credits"
                  />
                </div>

                <div className="flex gap-2 sm:gap-4 pt-2 sm:pt-4">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    className="flex-1 py-2.5 sm:py-3 bg-gradient-to-r from-green-600 to-green-500 text-white font-bold rounded-lg hover:from-green-500 hover:to-green-400 transition-all duration-300 text-sm sm:text-base"
                  >
                    Create User
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="reset"
                    className="px-4 sm:px-6 py-2.5 sm:py-3 bg-gray-600 text-white font-bold rounded-lg hover:bg-gray-500 transition-all duration-300 text-sm sm:text-base"
                  >
                    Clear
                  </motion.button>
                </div>
              </form>
            </div>
          </div>
        )}

        {activeTab === 'themes' && (
          <div>
            <h3 className="text-lg sm:text-2xl font-bold text-white mb-4 sm:mb-6">Theme Management</h3>
            <p className="text-gray-400 mb-6">Assign custom table themes to players. Each player will see their assigned theme when joining any room.</p>
            
            <div className="grid gap-4">
              {users.filter(u => u.role === 'player').map((user) => (
                <motion.div
                  key={user._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-black/40 backdrop-blur-sm border border-purple-500/30 rounded-lg p-4"
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold">
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="text-white font-semibold">{user.username}</h4>
                        <p className="text-gray-400 text-sm">{user.email}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <select
                        value={user.preferredTheme || 'classic'}
                        onChange={async (e) => {
                          soundManager.playThemeChange()
                          const newTheme = e.target.value
                          try {
                            const token = localStorage.getItem('token')
                            const response = await fetch(`${API_URL}/api/themes/user/${user._id}`, {
                              method: 'PUT',
                              headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                              },
                              body: JSON.stringify({ theme: newTheme })
                            })
                            
                            if (response.ok) {
                              setNotification({
                                show: true,
                                message: `Theme updated for ${user.username}`,
                                type: 'success'
                              })
                              setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 3000)
                              fetchUsers() // Refresh users list
                            }
                          } catch (err) {
                            console.error('Theme update error:', err)
                            setNotification({
                              show: true,
                              message: 'Failed to update theme',
                              type: 'error'
                            })
                            setTimeout(() => setNotification({ show: false, message: '', type: 'error' }), 3000)
                          }
                        }}
                        onMouseEnter={() => soundManager.playHover()}
                        className="flex-1 sm:flex-none bg-black/60 border border-green-500/30 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500 cursor-pointer hover:border-green-500/60 transition-colors"
                      >
                        <option value="classic">🟢 Classic Green</option>
                        <option value="royal">👑 Royal Purple (Premium)</option>
                        <option value="neon">⚡ Neon Nights (Premium)</option>
                        <option value="dark">🌑 Dark Mode</option>
                        <option value="ocean">🌊 Ocean Blue (Premium)</option>
                        <option value="sunset">🌅 Sunset Orange (Premium)</option>
                      </select>
                      
                      <div className="px-3 py-2 bg-green-600/20 border border-green-500/30 rounded-lg text-green-400 text-sm whitespace-nowrap">
                        {user.preferredTheme === 'classic' && '🟢 Classic'}
                        {user.preferredTheme === 'royal' && '👑 Royal'}
                        {user.preferredTheme === 'neon' && '⚡ Neon'}
                        {user.preferredTheme === 'dark' && '🌑 Dark'}
                        {user.preferredTheme === 'ocean' && '🌊 Ocean'}
                        {user.preferredTheme === 'sunset' && '🌅 Sunset'}
                        {!user.preferredTheme && '🟢 Classic'}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
              
              {users.filter(u => u.role === 'player').length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <Palette size={48} className="mx-auto mb-4 opacity-50" />
                  <p>No players found</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'transactions' && (
          <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-3">
              <div>
                <h3 className="text-lg sm:text-2xl font-bold text-white mb-2">Transaction History</h3>
                {/* Manager Filter */}
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-400">Filter by Manager:</label>
                  <select
                    value={selectedTransactionManager}
                    onChange={(e) => {
                      soundManager.playClick()
                      setSelectedTransactionManager(e.target.value)
                    }}
                    className="bg-black/40 border border-purple-500/30 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="all">All Transactions</option>
                    {managers.map((manager) => (
                      <option key={manager._id} value={manager._id}>
                        {manager.username}'s Transactions
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Date Filters */}
            <div className="bg-white/5 border border-white/10 rounded-lg p-4 mb-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
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
                      setStartDate('')
                      setEndDate('')
                    }}
                    className="text-xs text-purple-400 hover:text-purple-300 underline"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            </div>
            
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
              </div>
            ) : transactions.length === 0 ? (
              <div className="bg-white/5 border border-white/10 rounded-lg sm:rounded-xl p-8 sm:p-12 text-center">
                <Receipt size={48} className="mx-auto text-gray-400 mb-4" />
                <p className="text-gray-300 text-base sm:text-lg">No transactions found</p>
                <p className="text-gray-400 text-xs sm:text-sm mt-2">Credit transfers will appear here</p>
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
                      {transactions.map((transaction: any, index: number) => (
                        <motion.tr
                          key={transaction._id || index}
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
                                transaction.fromUser?.role === 'admin' ? 'bg-red-500' :
                                transaction.fromUser?.role === 'manager' ? 'bg-purple-500' :
                                'bg-blue-500'
                              }`}></div>
                              <div>
                                <div className="text-xs sm:text-sm font-medium text-white">
                                  {transaction.fromUser?.username || 'Unknown'}
                                </div>
                                <div className="text-[10px] sm:text-xs text-gray-400 capitalize">
                                  {transaction.fromUser?.role || 'user'}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${
                                transaction.toUser?.role === 'admin' ? 'bg-red-500' :
                                transaction.toUser?.role === 'manager' ? 'bg-purple-500' :
                                'bg-blue-500'
                              }`}></div>
                              <div>
                                <div className="text-xs sm:text-sm font-medium text-white">
                                  {transaction.toUser?.username || 'Unknown'}
                                </div>
                                <div className="text-[10px] sm:text-xs text-gray-400 capitalize">
                                  {transaction.toUser?.role || 'user'}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                            <div className={`text-xs sm:text-sm font-bold ${
                              transaction.type === 'send' ? 'text-green-400' : 'text-red-400'
                            }`}>
                              {transaction.type === 'send' ? '+' : '-'}{transaction.amount.toLocaleString()}
                            </div>
                          </td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-[10px] sm:text-xs font-medium rounded-full ${
                              transaction.type === 'send' ? 'bg-green-500/20 text-green-400' :
                              transaction.type === 'remove' ? 'bg-red-500/20 text-red-400' :
                              'bg-yellow-500/20 text-yellow-400'
                            }`}>
                              {transaction.type}
                            </span>
                          </td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                            <div className="text-xs sm:text-sm text-gray-300">
                              {transaction.balanceAfter.toLocaleString()}
                            </div>
                            <div className="text-[10px] sm:text-xs text-gray-400">
                              (was {transaction.balanceBefore.toLocaleString()})
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {/* Summary Stats */}
                <div className="bg-black/40 px-4 sm:px-6 py-3 sm:py-4 border-t border-white/10">
                  <div className="flex flex-wrap gap-4 sm:gap-6 text-xs sm:text-sm">
                    <div>
                      <span className="text-gray-400">Total Transactions:</span>
                      <span className="ml-2 font-bold text-white">{transactions.length}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Total Sent:</span>
                      <span className="ml-2 font-bold text-green-400">
                        {transactions.filter((t: any) => t.type === 'send').reduce((sum: number, t: any) => sum + t.amount, 0).toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400">Total Removed:</span>
                      <span className="ml-2 font-bold text-red-400">
                        {transactions.filter((t: any) => t.type === 'remove').reduce((sum: number, t: any) => sum + t.amount, 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div>
            <h3 className="text-lg sm:text-2xl font-bold text-white mb-4 sm:mb-6">System Settings</h3>
            
            <div className="space-y-4 sm:space-y-6">
              <div className="bg-white/5 border border-white/10 rounded-lg sm:rounded-xl p-4 sm:p-6">
                <h4 className="text-base sm:text-lg font-bold text-white mb-3 sm:mb-4">Game Configuration</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-white text-xs sm:text-sm font-medium mb-1.5 sm:mb-2">Default Credits</label>
                    <input
                      type="number"
                      defaultValue={1000}
                      className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-black/20 border border-white/20 rounded text-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    />
                  </div>
                  <div>
                    <label className="block text-white text-xs sm:text-sm font-medium mb-1.5 sm:mb-2">Minimum Buy-in</label>
                    <input
                      type="number"
                      defaultValue={10}
                      className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-black/20 border border-white/20 rounded text-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    />
                  </div>
                </div>
              </div>
              
              <div className="bg-white/5 border border-white/10 rounded-lg sm:rounded-xl p-4 sm:p-6">
                <h4 className="text-base sm:text-lg font-bold text-white mb-3 sm:mb-4">Server Status</h4>
                <div className="grid grid-cols-3 gap-2 sm:gap-4">
                  <div className="text-center">
                    <div className="text-lg sm:text-2xl font-bold text-green-400">{users.length}</div>
                    <div className="text-gray-300 text-xs sm:text-sm">Total Users</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg sm:text-2xl font-bold text-yellow-400">{rooms.length}</div>
                    <div className="text-gray-300 text-xs sm:text-sm">Active Rooms</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg sm:text-2xl font-bold text-blue-400">
                      {rooms.reduce((sum: number, room: any) => sum + (room.players?.length || 0), 0)}
                    </div>
                    <div className="text-gray-300 text-xs sm:text-sm">Online Players</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      </div>
        </div>
      )}

      {/* Statistics Modal */}
      {statisticsModal.show && statisticsModal.statistics && (
        <StatisticsModalNew
          isOpen={statisticsModal.show}
          onClose={() => setStatisticsModal({ show: false, userId: '', username: '', statistics: null })}
          username={statisticsModal.username}
          statistics={statisticsModal.statistics}
          isAdminView={true}
        />
      )}

      {/* Admin Cut History Modal */}
      {adminCutHistoryModal.show && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-gradient-to-br from-gray-900 to-black border-2 border-purple-500/50 rounded-xl p-6 w-full max-w-3xl max-h-[80vh] overflow-y-auto shadow-2xl"
          >
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-2xl font-bold text-white">Admin Cut History</h3>
                <p className="text-gray-400 text-sm mt-1">Room: {adminCutHistoryModal.roomCode}</p>
              </div>
              <button
                onClick={() => setAdminCutHistoryModal({ show: false, roomId: '', roomCode: '', history: [] })}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {adminCutHistoryModal.history.length === 0 ? (
              <div className="text-center py-12">
                <Receipt size={48} className="mx-auto text-gray-600 mb-4" />
                <p className="text-gray-400">No admin cuts taken yet for this room</p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Summary Card */}
                <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-lg p-4 mb-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-400">Total Admin Cuts</p>
                      <p className="text-2xl font-bold text-green-400">{adminCutHistoryModal.history.length}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Total Earnings</p>
                      <p className="text-2xl font-bold text-green-400">
                        ${adminCutHistoryModal.history.reduce((sum, h) => sum + h.cutAmount, 0).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* History List */}
                {adminCutHistoryModal.history.slice().reverse().map((entry, index) => (
                  <div
                    key={index}
                    className="bg-black/40 border border-white/10 rounded-lg p-4 hover:border-purple-500/50 transition-all"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <Receipt size={16} className="text-purple-400" />
                        <span className="text-white font-medium">
                          Hand #{entry.handNumber || adminCutHistoryModal.history.length - index}
                        </span>
                      </div>
                      <span className="text-xs text-gray-400">
                        {new Date(entry.timestamp).toLocaleString()}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 mt-3">
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Pot Amount</p>
                        <p className="text-lg font-bold text-white">${entry.potAmount.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Percentage</p>
                        <p className="text-lg font-bold text-yellow-400">{entry.percentage}%</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Admin Cut</p>
                        <p className="text-lg font-bold text-green-400">${entry.cutAmount.toFixed(2)}</p>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-white/10">
                      <p className="text-xs text-gray-400">
                        Players received: <span className="text-white font-medium">${(entry.potAmount - entry.cutAmount).toFixed(2)}</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmModal.show && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-gradient-to-br from-red-900/90 to-black border-2 border-red-500/50 rounded-xl p-6 w-full max-w-md shadow-2xl"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
                <X size={24} className="text-red-400" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white">Delete Room</h3>
                <p className="text-gray-400 text-sm mt-1">This action cannot be undone</p>
              </div>
            </div>

            <div className="bg-black/40 border border-red-500/30 rounded-lg p-4 mb-6">
              <p className="text-white text-center">
                Are you sure you want to delete room <br />
                <span className="font-bold text-red-400 text-lg">{deleteConfirmModal.roomName}</span>?
              </p>
            </div>

            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setDeleteConfirmModal({ show: false, roomId: '', roomName: '' })}
                className="flex-1 px-4 py-3 bg-gray-600 hover:bg-gray-500 text-white rounded-lg font-medium transition-colors"
              >
                Cancel
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => deleteRoom(deleteConfirmModal.roomId)}
                className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-500 text-white rounded-lg font-medium transition-colors"
              >
                Delete Room
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </>
  )
}