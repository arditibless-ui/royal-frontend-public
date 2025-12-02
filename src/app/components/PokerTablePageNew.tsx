'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Users, Coins } from 'lucide-react'
import { API_URL } from '../../constants/api'
import { soundManager } from '../../utils/sounds'
import { io, Socket } from 'socket.io-client'

interface PokerTablePageProps {
  roomCode: string
  onBack: () => void
  isAdminView?: boolean
}

interface Player {
  id: string
  username: string
  chips: number
  cards?: string[]
  position: number
  currentBet: number
  isActive: boolean
  hasActed: boolean
  isBot?: boolean
}

interface GameState {
  round: string
  communityCards: string[]
  currentBet: number
  currentPlayer: number
  pot: number
  dealerPosition: number
  players: Player[]
  status: string
}

interface Room {
  _id: string
  code: string
  roomCode: string
  maxPlayers: number
  buyIn: number
  players: any[]
  status: string
  gameState?: GameState
}

export default function PokerTablePage({ roomCode, onBack, isAdminView = false }: PokerTablePageProps) {
  const [room, setRoom] = useState<Room | null>(null)
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [turnTimeRemaining, setTurnTimeRemaining] = useState(20)
  const [isMyTurn, setIsMyTurn] = useState(false)
  const [raiseAmount, setRaiseAmount] = useState('')
  
  const socketRef = useRef<Socket | null>(null)
  const turnTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Initialize user ID from token
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      setError('Not authenticated')
      setLoading(false)
      return
    }

    try {
      const base64Url = token.split('.')[1]
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
      const payload = JSON.parse(atob(base64))
      setCurrentUserId(payload.userId)
    } catch (error) {
      console.error('Failed to decode token:', error)
      setError('Authentication error')
      setLoading(false)
    }
  }, [])

  // Socket connection and room data
  useEffect(() => {
    if (!currentUserId) return

    const fetchRoom = async () => {
      try {
        const token = localStorage.getItem('token')
        const response = await fetch(`${API_URL}/api/games/rooms/${roomCode}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        
        if (response.ok) {
          const data = await response.json()
          setRoom(data.room)
          if (data.room.gameState) {
            setGameState(data.room.gameState)
          }
        } else {
          setError('Room not found')
        }
      } catch (error) {
        console.error('Fetch room error:', error)
        setError('Failed to load room')
      } finally {
        setLoading(false)
      }
    }

    fetchRoom()

    // Setup socket connection
    const token = localStorage.getItem('token')
    const socketUrl = API_URL.replace('/api', '')
    const socket = io(socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling']
    })

    socketRef.current = socket

    socket.on('connect', () => {
      console.log('✅ Socket connected')
      socket.emit('join-room', { roomCode })
    })

    socket.on('room-joined', (data) => {
      console.log('🏠 Room joined:', data)
      if (data.room) {
        setRoom(data.room)
        if (data.gameState) {
          setGameState(data.gameState)
        }
      }
    })

    socket.on('game-state-update', (newGameState: GameState) => {
      console.log('🎮 Game state update:', newGameState)
      setGameState(newGameState)
      
      // Check if it's current user's turn
      if (newGameState.players && newGameState.players[newGameState.currentPlayer]) {
        const currentPlayer = newGameState.players[newGameState.currentPlayer]
        const isMyTurnNow = currentPlayer.id === currentUserId
        setIsMyTurn(isMyTurnNow)
        
        if (isMyTurnNow) {
          // Start turn timer
          setTurnTimeRemaining(20)
          startTurnTimer()
        } else {
          stopTurnTimer()
        }
      }
    })

    socket.on('game-action-broadcast', (action) => {
      console.log('📢 Game action:', action)
      soundManager.playChipSound()
    })

    socket.on('player-joined', (data) => {
      console.log('👤 Player joined:', data.player.username)
    })

    socket.on('error', (error) => {
      console.error('❌ Socket error:', error)
      setError(error.message || 'Connection error')
    })

    return () => {
      stopTurnTimer()
      socket.disconnect()
    }
  }, [roomCode, currentUserId])

  // Turn timer
  const startTurnTimer = () => {
    stopTurnTimer()
    
    turnTimerRef.current = setInterval(() => {
      setTurnTimeRemaining((prev) => {
        if (prev <= 1) {
          // Time's up - auto fold
          handleAction('fold')
          stopTurnTimer()
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const stopTurnTimer = () => {
    if (turnTimerRef.current) {
      clearInterval(turnTimerRef.current)
      turnTimerRef.current = null
    }
  }

  // Game actions
  const handleAction = (action: string, amount?: number) => {
    if (!socketRef.current || !isMyTurn) return

    console.log(`🎲 Sending action:`, { roomCode, action, amount })
    soundManager.playClick()
    
    socketRef.current.emit('game-action', {
      roomCode,
      action,
      amount: amount || 0
    })

    stopTurnTimer()
    setIsMyTurn(false)
  }

  const handleFold = () => handleAction('fold')
  const handleCheck = () => handleAction('check')
  const handleCall = () => {
    const callAmount = gameState?.currentBet || 0
    handleAction('call', callAmount)
  }
  const handleRaise = () => {
    const amount = parseInt(raiseAmount)
    if (isNaN(amount) || amount <= 0) return
    handleAction('raise', amount)
    setRaiseAmount('')
  }
  const handleAllIn = () => {
    if (!gameState || !currentUserId) return
    const myPlayer = gameState.players.find(p => p.id === currentUserId)
    if (myPlayer) {
      handleAction('raise', myPlayer.chips)
    }
  }

  const getCardDisplay = (card: string) => {
    if (!card) return '🂠'
    const suit = card.slice(-1)
    const rank = card.slice(0, -1)
    
    const suitSymbols: { [key: string]: string } = {
      '♠': '♠️',
      '♥': '♥️',
      '♦': '♦️',
      '♣': '♣️'
    }
    
    return `${rank}${suitSymbols[suit] || suit}`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-green-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading game...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-green-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-xl mb-4">{error}</div>
          <button
            onClick={onBack}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-lg"
          >
            Back to Lobby
          </button>
        </div>
      </div>
    )
  }

  if (!room || !gameState) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-green-900 flex items-center justify-center">
        <div className="text-white text-xl">Waiting for game to start...</div>
      </div>
    )
  }

  const myPlayer = gameState.players.find(p => p.id === currentUserId)
  const currentTurnPlayer = gameState.players[gameState.currentPlayer]

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-green-900 p-4">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-4">
        <div className="flex items-center justify-between bg-black/40 backdrop-blur-md rounded-lg px-4 py-3">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-white hover:text-purple-300 transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Back</span>
          </button>
          
          <div className="text-center">
            <h1 className="text-white text-xl font-bold">Room {room.code}</h1>
            <p className="text-purple-300 text-sm">
              {gameState.round.toUpperCase()} - Pot: ${gameState.pot}
            </p>
          </div>

          <div className="flex items-center gap-4 text-white">
            <div className="flex items-center gap-2">
              <Users size={18} />
              <span>{gameState.players.filter(p => p.isActive).length}/{room.maxPlayers}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Game Area */}
      <div className="max-w-7xl mx-auto">
        <div className="relative bg-gradient-to-br from-green-700 to-green-900 rounded-3xl border-8 border-amber-900 shadow-2xl p-8">
          
          {/* Community Cards */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="bg-black/40 backdrop-blur-sm rounded-xl p-4 border-2 border-yellow-600">
              <div className="flex gap-2 mb-2">
                {gameState.communityCards.length > 0 ? (
                  gameState.communityCards.map((card, i) => (
                    <motion.div
                      key={i}
                      initial={{ scale: 0, rotateY: 180 }}
                      animate={{ scale: 1, rotateY: 0 }}
                      className="w-16 h-24 bg-white rounded-lg shadow-lg flex items-center justify-center text-3xl font-bold"
                    >
                      {getCardDisplay(card)}
                    </motion.div>
                  ))
                ) : (
                  <div className="text-white/50 text-sm">Community Cards</div>
                )}
              </div>
              <div className="text-center text-yellow-400 font-bold text-xl">
                POT: ${gameState.pot}
              </div>
            </div>
          </div>

          {/* Players */}
          <div className="relative h-[500px]">
            {gameState.players.map((player, index) => {
              const angle = (index / gameState.players.length) * 360
              const radius = 200
              const x = Math.cos((angle - 90) * (Math.PI / 180)) * radius
              const y = Math.sin((angle - 90) * (Math.PI / 180)) * radius
              
              const isCurrentTurn = gameState.currentPlayer === index
              const isDealer = gameState.dealerPosition === index
              
              return (
                <motion.div
                  key={player.id}
                  className="absolute"
                  style={{
                    left: `calc(50% + ${x}px)`,
                    top: `calc(50% + ${y}px)`,
                    transform: 'translate(-50%, -50%)'
                  }}
                >
                  <div className={`bg-gradient-to-br ${
                    isCurrentTurn ? 'from-yellow-600 to-yellow-800 ring-4 ring-yellow-400' :
                    player.isActive ? 'from-gray-800 to-gray-900' :
                    'from-red-900 to-red-950 opacity-50'
                  } rounded-xl p-3 min-w-[120px] border-2 ${
                    isCurrentTurn ? 'border-yellow-400' : 'border-gray-600'
                  }`}>
                    {isDealer && (
                      <div className="absolute -top-2 -right-2 bg-yellow-500 text-black w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs">
                        D
                      </div>
                    )}
                    
                    <div className="text-white font-bold text-sm mb-1">
                      {player.username}
                      {player.isBot && <span className="ml-1 text-xs text-yellow-400">🤖</span>}
                    </div>
                    
                    <div className="flex items-center gap-1 text-yellow-400 text-xs mb-2">
                      <Coins size={12} />
                      <span>${player.chips}</span>
                    </div>

                    {player.cards && player.id === currentUserId && (
                      <div className="flex gap-1">
                        {player.cards.map((card, i) => (
                          <div key={i} className="w-8 h-12 bg-white rounded text-xs flex items-center justify-center font-bold">
                            {getCardDisplay(card)}
                          </div>
                        ))}
                      </div>
                    )}

                    {player.currentBet > 0 && (
                      <div className="mt-1 text-xs text-center bg-blue-600 rounded px-2 py-0.5 text-white">
                        Bet: ${player.currentBet}
                      </div>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>

          {/* Turn Timer */}
          {isMyTurn && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-64">
              <div className="bg-black/60 backdrop-blur-sm rounded-lg p-3 border-2 border-yellow-500">
                <div className="text-center text-yellow-400 font-bold mb-2">
                  YOUR TURN - {turnTimeRemaining}s
                </div>
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full ${
                      turnTimeRemaining <= 5 ? 'bg-red-500' : 'bg-yellow-500'
                    }`}
                    initial={{ width: '100%' }}
                    animate={{
                      width: `${(turnTimeRemaining / 20) * 100}%`,
                      opacity: turnTimeRemaining <= 5 ? [1, 0.3, 1] : 1
                    }}
                    transition={{
                      width: { duration: 1, ease: 'linear' },
                      opacity: turnTimeRemaining <= 5 ? {
                        duration: 0.5,
                        repeat: Infinity,
                        ease: 'easeInOut'
                      } : {}
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {isMyTurn && myPlayer && (
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
              <div className="bg-black/90 backdrop-blur-md rounded-lg p-3 border border-purple-500">
                <div className="flex flex-col gap-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleFold}
                    className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded font-bold text-sm"
                  >
                    Fold
                  </motion.button>
                  
                  {gameState.currentBet === myPlayer.currentBet ? (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleCheck}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded font-bold text-sm"
                    >
                      Check
                    </motion.button>
                  ) : (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleCall}
                      className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded font-bold text-sm"
                    >
                      Call ${gameState.currentBet - myPlayer.currentBet}
                    </motion.button>
                  )}
                  
                  <div className="flex flex-col gap-1">
                    <input
                      type="number"
                      value={raiseAmount}
                      onChange={(e) => setRaiseAmount(e.target.value)}
                      placeholder="Amount"
                      className="px-3 py-1 bg-black/60 border border-orange-500/50 rounded text-white text-sm"
                      min={gameState.currentBet * 2}
                    />
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleRaise}
                      disabled={!raiseAmount}
                      className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded font-bold text-sm disabled:opacity-50"
                    >
                      Raise
                    </motion.button>
                  </div>
                  
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleAllIn}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded font-bold text-sm"
                  >
                    All-In ${myPlayer.chips}
                  </motion.button>
                </div>
              </div>
            </div>
          )}

          {/* Current Turn Indicator */}
          {!isMyTurn && currentTurnPlayer && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2">
              <div className="bg-black/60 backdrop-blur-sm rounded-lg px-4 py-2 border border-blue-500">
                <div className="text-blue-400 font-bold text-sm text-center">
                  {currentTurnPlayer.username}'s Turn
                  {currentTurnPlayer.isBot && ' 🤖'}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
