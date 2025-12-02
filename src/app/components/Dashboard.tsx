'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { LogOut, Plus, Users, Coins, Play, Copy, Check, BarChart3, Settings, History } from 'lucide-react'
import { API_URL } from '../../constants/api'
import { soundManager } from '@/utils/sounds'
import StatisticsModalNew from './StatisticsModalNew'
import ManagerMenu from './ManagerMenu'
import ManagerHistory from './ManagerHistory'
import PlayerGameHistory from './PlayerGameHistory'
import FriendsMenu from '../../components/FriendsMenu'
import PlayerSettings from '../../components/PlayerSettings'

interface DashboardProps {
  user: any
  onLogout: () => void
}

export default function Dashboard({ user, onLogout }: DashboardProps) {
  const [rooms, setRooms] = useState<any[]>([])
  const [joinCode, setJoinCode] = useState('')
  const [copiedCode, setCopiedCode] = useState('')
  const [joiningRoom, setJoiningRoom] = useState(false)
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null)
  const [cooldownRemaining, setCooldownRemaining] = useState<number>(0)
  const [offenseCount, setOffenseCount] = useState<number>(0)
  const [showStatistics, setShowStatistics] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [showGameHistory, setShowGameHistory] = useState(false)
  const [statistics, setStatistics] = useState<any>(null)
  const [showManagerMenu, setShowManagerMenu] = useState(false)
  const [activeRoomCode, setActiveRoomCode] = useState<string | null>(null)
  const [showPlayerSettings, setShowPlayerSettings] = useState(false)
  const [showFriendsMenu, setShowFriendsMenu] = useState(false)
  const [currentUser, setCurrentUser] = useState(user)

  useEffect(() => {
    // Start lobby music when dashboard mounts
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

  const handleLogout = () => {
    localStorage.removeItem('token')
    onLogout()
  }

  const checkActiveRoom = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/api/games/active-room`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setActiveRoomCode(data.roomCode || null)
      }
    } catch (error) {
      console.error('Error checking active room:', error)
    }
  }

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(''), 2000)
  }

  const joinRoom = async (code: string, buyIn?: number) => {
    // If resuming active room, skip checks and join directly
    if (activeRoomCode === code) {
      setNotification({
        message: `Resuming game ${code}...`,
        type: 'success'
      })
      setTimeout(() => {
        setNotification(null)
        window.location.href = `/poker/${code}`
      }, 1000)
      return
    }
    
    // Check if player has enough credits
    const playerCredits = user?.credits || 0
    const requiredBuyIn = buyIn || 0
    
    if (playerCredits < requiredBuyIn) {
      setNotification({
        message: `Insufficient credits! You need ${requiredBuyIn} credits to join this room. Current balance: ${playerCredits}`,
        type: 'error'
      })
      setTimeout(() => setNotification(null), 5000)
      return
    }
    
    // Check if on cooldown
    if (cooldownRemaining > 0) {
      setNotification({
        message: `Please wait ${cooldownRemaining} seconds before joining`,
        type: 'error'
      })
      setTimeout(() => setNotification(null), 3000)
      return
    }

    setJoiningRoom(true)
    
    // Request location permission
    if (!navigator.geolocation) {
      setNotification({
        message: 'Geolocation is not supported by your browser',
        type: 'error'
      })
      setTimeout(() => setNotification(null), 3000)
      setJoiningRoom(false)
      return
    }

    // Get user location
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        
        try {
          const token = localStorage.getItem('token')
          const response = await fetch(`${API_URL}/api/games/join/${code}`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ latitude, longitude })
          })

          const data = await response.json()
          if (response.ok) {
            // Show success notification
            setNotification({
              message: `Successfully joined ${code}!`,
              type: 'success'
            })
            
            // Auto-remove notification and redirect after 2 seconds
            setTimeout(() => {
              setNotification(null)
              window.location.href = `/poker/${code}`
            }, 2000)
          } else if (response.status === 403 && data.tooClose) {
            // Handle proximity error
            setNotification({
              message: data.message || 'Another player is too close to your location',
              type: 'error'
            })
            setTimeout(() => setNotification(null), 5000)
          } else if (response.status === 403 && data.cooldownRemaining) {
            // Handle cooldown error
            setCooldownRemaining(data.cooldownRemaining)
            setNotification({
              message: data.message || `You must wait ${data.cooldownRemaining} seconds before joining`,
              type: 'error'
            })
            setTimeout(() => setNotification(null), 4000)
          } else {
            setNotification({
              message: data.message || 'Failed to join room',
              type: 'error'
            })
            setTimeout(() => setNotification(null), 3000)
          }
        } catch (err) {
          console.error('Failed to join room:', err)
          setNotification({
            message: 'Failed to join room. Please try again.',
            type: 'error'
          })
          setTimeout(() => setNotification(null), 3000)
        } finally {
          setJoiningRoom(false)
        }
      },
      (error) => {
        // Location permission denied or error
        console.error('Geolocation error:', error)
        setNotification({
          message: 'Location access is required to join a room. Please enable location permissions and try again.',
          type: 'error'
        })
        setTimeout(() => setNotification(null), 5000)
        setJoiningRoom(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    )
  }

  const fetchRooms = async () => {
    try {
      const token = localStorage.getItem('token')
      
      // Check for active room
      await checkActiveRoom()
      const response = await fetch(`${API_URL}/api/games/rooms`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      const data = await response.json()
      if (response.ok) {
        setRooms(data.rooms || [])
      }
    } catch (err) {
      console.error('Failed to fetch rooms:', err)
      // Show empty state when backend is unavailable
      setRooms([])
    }
  }

  const checkPenaltyStatus = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/api/games/penalty-status`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      const data = await response.json()
      if (response.ok && data.hasPenalty) {
        setCooldownRemaining(data.cooldownRemaining)
        setOffenseCount(data.offenseCount || 0)
      } else {
        setCooldownRemaining(0)
        setOffenseCount(0)
      }
    } catch (err) {
      console.error('Failed to check penalty status:', err)
    }
  }

  const fetchStatistics = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/api/users/statistics`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      const data = await response.json()
      if (response.ok) {
        setStatistics(data.statistics)
      }
    } catch (err) {
      console.error('Failed to fetch statistics:', err)
      // Fallback mock data if API fails
      setStatistics({
        totalGames: 0,
        wins: 0,
        losses: 0,
        biggestWin: { amount: 0, date: null, roomCode: null },
        biggestLoss: { amount: 0, date: null, roomCode: null },
        totalWinnings: 0,
        totalLosses: 0
      })
    }
  }

  useEffect(() => {
    fetchRooms()
    checkPenaltyStatus()
    fetchStatistics()
    // Poll for room updates every 3 seconds
    const interval = setInterval(() => {
      fetchRooms()
      checkPenaltyStatus()
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  // Countdown timer for cooldown
  useEffect(() => {
    if (cooldownRemaining > 0) {
      const timer = setInterval(() => {
        setCooldownRemaining(prev => {
          if (prev <= 1) {
            clearInterval(timer)
            return 0
          }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [cooldownRemaining])

  return (
    <div className="min-h-screen landscape:min-h-[100dvh] p-3 sm:p-6 landscape:p-3">
      {/* Join Notification - Top Center */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.8 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none w-[90vw] sm:w-[calc(100%-2rem)] max-w-md px-4 sm:px-0"
          >
            <div className={`px-6 py-4 rounded-2xl shadow-2xl border-2 backdrop-blur-sm ${
              notification.type === 'success' 
                ? 'bg-gradient-to-r from-green-600 via-green-500 to-green-600 border-yellow-400 text-white' 
                : 'bg-gradient-to-r from-red-600 via-red-500 to-red-600 border-red-300 text-white'
            }`}>
              <div className="flex items-center gap-3">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 0.5, repeat: 2 }}
                  className="text-2xl"
                >
                  {notification.type === 'success' ? '✅' : '❌'}
                </motion.div>
                <div className="font-bold text-lg">
                  {notification.message}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col sm:flex-row landscape:flex-row justify-between items-start sm:items-center landscape:items-center mb-4 sm:mb-8 landscape:mb-2 gap-3 sm:gap-0 landscape:gap-2">
        <div>
          <h1 className="text-2xl sm:text-4xl landscape:text-xl font-bold text-white mb-1 sm:mb-2 landscape:mb-0.5">Player Lobby</h1>
          <p className="text-green-200 text-sm landscape:text-xs">Welcome back, {user?.username}!</p>
        </div>
        
        <div className="flex flex-wrap sm:flex-nowrap landscape:flex-wrap items-center gap-2 sm:gap-4 landscape:gap-1.5 w-full sm:w-auto landscape:max-w-[60vw]">
          <div className="bg-black/40 px-3 sm:px-4 landscape:px-2 py-1.5 sm:py-2 landscape:py-1 rounded-lg border border-yellow-500/30">
            <div className="flex items-center gap-1 sm:gap-2 landscape:gap-1 text-yellow-400">
              <Coins size={16} className="sm:w-5 sm:h-5 landscape:w-3.5 landscape:h-3.5" />
              <span className="font-bold text-sm sm:text-base landscape:text-xs">{user?.credits ?? 0}</span>
            </div>
          </div>

          {user?.role === 'manager' && (
            <>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  soundManager.playButtonClick()
                  setShowManagerMenu(true)
                }}
                onMouseEnter={() => soundManager.playHover()}
                className="flex items-center gap-1 sm:gap-2 landscape:gap-1 px-2 sm:px-4 landscape:px-2 py-1.5 sm:py-2 landscape:py-1 bg-gradient-to-r from-purple-600 to-purple-500 text-white text-xs sm:text-base landscape:text-[10px] rounded-lg hover:from-purple-500 hover:to-purple-400 transition-colors whitespace-nowrap"
              >
                <Settings size={14} className="sm:w-[18px] sm:h-[18px] landscape:w-3 landscape:h-3" />
                <span className="hidden sm:inline landscape:hidden">Manager Menu</span>
                <span className="sm:hidden landscape:inline">Manager</span>
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  soundManager.playButtonClick()
                  setShowHistory(true)
                }}
                onMouseEnter={() => soundManager.playHover()}
                className="flex items-center gap-1 sm:gap-2 landscape:gap-1 px-2 sm:px-4 landscape:px-2 py-1.5 sm:py-2 landscape:py-1 bg-gradient-to-r from-blue-600 to-blue-500 text-white text-xs sm:text-base landscape:text-[10px] rounded-lg hover:from-blue-500 hover:to-blue-400 transition-colors whitespace-nowrap"
              >
                <History size={14} className="sm:w-[18px] sm:h-[18px] landscape:w-3 landscape:h-3" />
                <span className="hidden sm:inline landscape:inline">History</span>
              </motion.button>
            </>
          )}

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              soundManager.playButtonClick()
              setShowStatistics(true)
            }}
            onMouseEnter={() => soundManager.playHover()}
            className="flex items-center gap-1 sm:gap-2 landscape:gap-1 px-2 sm:px-4 landscape:px-2 py-1.5 sm:py-2 landscape:py-1 bg-gradient-to-r from-purple-600 to-purple-500 text-white text-xs sm:text-base landscape:text-[10px] rounded-lg hover:from-purple-500 hover:to-purple-400 transition-colors whitespace-nowrap"
          >
            <BarChart3 size={14} className="sm:w-[18px] sm:h-[18px] landscape:w-3 landscape:h-3" />
            <span className="hidden sm:inline landscape:inline">Stats</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              soundManager.playButtonClick()
              setShowGameHistory(true)
            }}
            onMouseEnter={() => soundManager.playHover()}
            className="flex items-center gap-1 sm:gap-2 landscape:gap-1 px-2 sm:px-4 landscape:px-2 py-1.5 sm:py-2 landscape:py-1 bg-gradient-to-r from-green-600 to-green-500 text-white text-xs sm:text-base landscape:text-[10px] rounded-lg hover:from-green-500 hover:to-green-400 transition-colors whitespace-nowrap"
          >
            <History size={14} className="sm:w-[18px] sm:h-[18px] landscape:w-3 landscape:h-3" />
            <span className="hidden sm:inline landscape:hidden">Game History</span>
            <span className="sm:hidden landscape:inline">Games</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              soundManager.playButtonClick()
              setShowFriendsMenu(true)
            }}
            onMouseEnter={() => soundManager.playHover()}
            className="flex items-center gap-1 sm:gap-2 landscape:gap-1 px-2 sm:px-4 landscape:px-2 py-1.5 sm:py-2 landscape:py-1 bg-gradient-to-r from-blue-600 to-blue-500 text-white text-xs sm:text-base landscape:text-[10px] rounded-lg hover:from-blue-500 hover:to-blue-400 transition-colors whitespace-nowrap"
          >
            <Users size={14} className="sm:w-[18px] sm:h-[18px] landscape:w-3 landscape:h-3" />
            <span className="hidden sm:inline landscape:inline">Friends</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              soundManager.playButtonClick()
              setShowPlayerSettings(true)
            }}
            onMouseEnter={() => soundManager.playHover()}
            className="flex items-center gap-1 sm:gap-2 landscape:gap-1 px-2 sm:px-4 landscape:px-2 py-1.5 sm:py-2 landscape:py-1 bg-gradient-to-r from-blue-600 to-blue-500 text-white text-xs sm:text-base landscape:text-[10px] rounded-lg hover:from-blue-500 hover:to-blue-400 transition-colors whitespace-nowrap"
          >
            <Settings size={14} className="sm:w-[18px] sm:h-[18px] landscape:w-3 landscape:h-3" />
            <span className="hidden sm:inline landscape:inline">Settings</span>
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              soundManager.playButtonClick()
              handleLogout()
            }}
            onMouseEnter={() => soundManager.playHover()}
            className="flex items-center gap-1 sm:gap-2 landscape:gap-1 px-2 sm:px-4 landscape:px-2 py-1.5 sm:py-2 landscape:py-1 bg-red-600 text-white text-xs sm:text-base landscape:text-[10px] rounded-lg hover:bg-red-500 transition-colors whitespace-nowrap"
          >
            <LogOut size={14} className="sm:w-[18px] sm:h-[18px] landscape:w-3 landscape:h-3" />
            <span className="hidden sm:inline landscape:inline">Logout</span>
          </motion.button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-4 sm:mb-8">
        {/* Cooldown Warning Banner */}
        <AnimatePresence>
          {cooldownRemaining > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-4 bg-gradient-to-r from-red-600 to-orange-600 border-2 border-red-400 rounded-2xl p-4 shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-3xl">⏱️</div>
                  <div>
                    <div className="text-white font-bold text-lg">Room Join Cooldown Active</div>
                    <div className="text-red-100 text-sm">
                      You left a room recently. Wait before joining another.
                      {offenseCount > 1 && ` (${offenseCount} rapid exits detected)`}
                    </div>
                  </div>
                </div>
                <div className="bg-black/30 px-6 py-3 rounded-xl border-2 border-white/20">
                  <div className="text-white font-bold text-3xl text-center">{cooldownRemaining}</div>
                  <div className="text-white/80 text-xs text-center">seconds</div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-black/40 backdrop-blur-sm p-3 sm:p-6 rounded-xl sm:rounded-2xl border border-white/20"
        >
          <h3 className="text-lg sm:text-xl font-bold text-white mb-2 sm:mb-4">Join with Code</h3>
          <p className="text-gray-300 text-sm sm:text-base mb-3 sm:mb-4">Enter a room code to join a game</p>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="Enter 6-digit room code"
              className="flex-1 px-3 sm:px-4 py-2 sm:py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-yellow-500 text-center font-bold tracking-widest"
              maxLength={6}
            />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={joinCode.length !== 6 || joiningRoom || cooldownRemaining > 0}
              onClick={() => {
                soundManager.playButtonClick()
                joinRoom(joinCode)
              }}
              onMouseEnter={() => soundManager.playHover()}
              className="px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-yellow-600 to-yellow-500 text-black text-sm sm:text-base font-bold rounded-lg hover:from-yellow-500 hover:to-yellow-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {cooldownRemaining > 0 ? `Wait ${cooldownRemaining}s` : joiningRoom ? 'Joining...' : 'Join Game'}
            </motion.button>
          </div>
        </motion.div>
      </div>

      {/* Active Rooms */}
            <div className="bg-black/40 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-green-500/20 p-3 sm:p-6 landscape:p-3">
        <h3 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-6">Available Rooms</h3>
        
        {rooms.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Users size={48} className="mx-auto mb-4 opacity-50" />
            <p>No active rooms available</p>
            <p className="text-sm">Create a room or join with a code to start playing</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {rooms.map((room: any) => (
              <motion.div
                key={room._id}
                whileHover={{ scale: 1.01 }}
                className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-colors"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-lg font-bold text-white">{room.roomName || `Room ${room.roomCode}`}</h4>
                      <span className="text-sm text-gray-400">({room.roomCode})</span>
                      <button
                        onClick={() => {
                          soundManager.playButtonClick()
                          copyToClipboard(room.roomCode)
                        }}
                        onMouseEnter={() => soundManager.playHover()}
                        className="flex items-center gap-1 px-2 py-1 bg-white/10 rounded text-xs text-gray-300 hover:text-white transition-colors"
                      >
                        {copiedCode === room.roomCode ? <Check size={12} /> : <Copy size={12} />}
                        {copiedCode === room.roomCode ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-300">
                      <span className="flex items-center gap-1">
                        <Users size={16} />
                        {room.players?.length || 0}/{room.maxPlayers}
                      </span>
                      <span className="flex items-center gap-1">
                        <Coins size={16} />
                        Buy-in: {room.buyIn}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs ${
                        room.gameState?.status === 'waiting' ? 'bg-green-500/20 text-green-400' : 
                        room.gameState?.status === 'playing' ? 'bg-yellow-500/20 text-yellow-400' : 
                        'bg-gray-500/20 text-gray-400'
                      }`}>
                        {room.gameState?.status || 'waiting'}
                      </span>
                    </div>
                  </div>
                  
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    disabled={
                      activeRoomCode === room.roomCode ? false :
                      room.players?.length >= room.maxPlayers || joiningRoom || cooldownRemaining > 0 || (user?.credits || 0) < room.buyIn
                    }
                    onClick={() => {
                      soundManager.playButtonClick()
                      joinRoom(room.roomCode, room.buyIn)
                    }}
                    onMouseEnter={() => soundManager.playHover()}
                    className={`flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 ${
                      activeRoomCode === room.roomCode 
                        ? 'bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400' 
                        : 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400'
                    } text-white text-sm sm:text-base font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <Play size={16} />
                    {activeRoomCode === room.roomCode ? 'Resume Game' :
                     room.players?.length >= room.maxPlayers ? 'Room Full' : 
                     (user?.credits || 0) < room.buyIn ? 'Insufficient Credits' :
                     cooldownRemaining > 0 ? `Wait ${cooldownRemaining}s` : 
                     joiningRoom ? 'Joining...' : 'Join Game'}
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Statistics Modal */}
      {statistics && (
        <StatisticsModalNew
          isOpen={showStatistics}
          onClose={() => setShowStatistics(false)}
          username={user?.username || 'Player'}
          statistics={statistics}
        />
      )}

      {/* Manager Menu */}
      {showManagerMenu && (
        <ManagerMenu
          onClose={() => setShowManagerMenu(false)}
          managerName={user?.username || 'Manager'}
        />
      )}

      {/* Manager History */}
      {showHistory && user?._id && (
        <ManagerHistory
          isOpen={showHistory}
          onClose={() => setShowHistory(false)}
          managerId={user._id}
        />
      )}

      {/* Player Game History */}
      {showGameHistory && user?._id && (
        <PlayerGameHistory
          isOpen={showGameHistory}
          onClose={() => setShowGameHistory(false)}
          playerId={user._id}
        />
      )}

      {/* Player Settings */}
      <PlayerSettings
        isOpen={showPlayerSettings}
        onClose={() => setShowPlayerSettings(false)}
        user={currentUser}
        onUserUpdate={(updatedUser) => setCurrentUser(updatedUser)}
      />

      {/* Friends Menu */}
      {showFriendsMenu && (
        <FriendsMenu onClose={() => setShowFriendsMenu(false)} />
      )}
    </div>
  )
}