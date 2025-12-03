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

interface Card {
  suit: string
  rank: string
}

interface Player {
  id: string
  username: string
  chips: number
  cards?: Card[]
  position: number
  currentBet: number
  isActive: boolean
  hasActed: boolean
  isBot?: boolean
  isFolded?: boolean
}

interface GameState {
  round: string
  communityCards: Card[]
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
  currentPot: number
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
  const isLeavingRef = useRef(false)

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
    console.log('🔌 Socket.IO URL from API_URL:', API_URL, '→', socketUrl);
    console.log('🔌 NEXT_PUBLIC_API_URL env:', process.env.NEXT_PUBLIC_API_URL);
    
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
      if (socket) {
        socket.disconnect()
      }
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

  // Handle leaving the game properly
  const handleLeaveGame = async () => {
    isLeavingRef.current = true
    stopTurnTimer()
    
    try {
      const token = localStorage.getItem('token')
      await fetch(`${API_URL}/api/games/leave/${roomCode}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
    } catch (error) {
      console.error('Error leaving room:', error)
    }
    
    if (socketRef.current) {
      socketRef.current.disconnect()
    }
    
    onBack()
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
    if (!gameState || !gameState.players || !currentUserId) return
    const myPlayer = gameState.players.find(p => p.id === currentUserId)
    if (myPlayer) {
      handleAction('raise', myPlayer.chips)
    }
  }

  const getCardDisplay = (card: Card | string) => {
    if (typeof card === 'string') {
      // Handle string format (e.g., "A♠")
      return (
        <div className="bg-white rounded-lg p-1 md:p-2 m-0.5 md:m-1 shadow-lg min-w-[2rem] md:min-w-[3rem] text-center border-2">
          <div className="text-sm md:text-lg font-bold">{card}</div>
        </div>
      )
    }

    const suitSymbols: { [key: string]: string } = {
      'hearts': '♥️',
      'diamonds': '♦️',
      'clubs': '♣️',
      'spades': '♠️'
    }
    
    const suitColors: { [key: string]: string } = {
      'hearts': 'text-red-500',
      'diamonds': 'text-red-500',
      'clubs': 'text-black',
      'spades': 'text-black'
    }

    return (
      <div className="bg-white rounded-lg p-1 md:p-2 m-0.5 md:m-1 shadow-lg min-w-[2rem] md:min-w-[3rem] text-center border-2">
        <div className="text-sm md:text-lg font-bold">{card.rank}</div>
        <div className={`text-lg md:text-xl ${suitColors[card.suit]}`}>
          {suitSymbols[card.suit]}
        </div>
      </div>
    )
  }

  const getPositionStyle = (position: number, totalPlayers: number) => {
    const maxPositions = 9
    const angle = (position / maxPositions) * 360
    const radius = window.innerWidth < 640 ? 180 : window.innerWidth < 768 ? 200 : 220
    const x = Math.cos((angle - 90) * (Math.PI / 180)) * radius
    const y = Math.sin((angle - 90) * (Math.PI / 180)) * radius
    
    return {
      left: `calc(50% + ${x}px)`,
      top: `calc(50% + ${y}px)`,
      transform: 'translate(-50%, -50%)',
      position: 'absolute' as const,
    }
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
            onClick={handleLeaveGame}
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

  if (!gameState.players || gameState.players.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-green-900 flex items-center justify-center">
        <div className="text-white text-xl">Setting up game...</div>
      </div>
    )
  }

  const myPlayer = gameState.players.find(p => p.id === currentUserId)
  const currentTurnPlayer = gameState.players[gameState.currentPlayer]

  return (
    <div className="poker-table-wrapper">
      <div 
        className="min-h-screen relative overflow-auto"
        style={{
          backgroundImage: 'url(/images/background.svg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        {/* Safe Area Border */}
        <div className="safe-area-border" />
        
        {/* Portrait Warning for Mobile */}
        <div className="portrait-warning hidden fixed inset-0 bg-green-900 flex-col items-center justify-center z-50 text-white p-6 text-center md:!hidden">
          <div className="text-6xl mb-4">📱</div>
          <h2 className="text-2xl font-bold mb-4">Please Rotate Your Device</h2>
          <p className="text-lg mb-6">
            Texas Hold'em Poker is best played in landscape mode for the optimal table experience.
          </p>
          <div className="text-4xl animate-pulse">🔄</div>
          <p className="text-sm mt-4 opacity-75">
            Turn your phone sideways to continue playing
          </p>
        </div>

        {/* Landscape Content */}
        <div className="landscape-content poker-table-container">
          {/* Header */}
          <div className="header-section absolute top-0 left-0 right-0 z-10">
            <div className="flex justify-between items-center gap-2 fluid-gap">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleLeaveGame}
                className="adaptive-button flex items-center gap-1 bg-black/40 text-white rounded-lg hover:bg-black/60 transition-colors"
              >
                <ArrowLeft size={14} className="sm:w-4 sm:h-4" />
                <span>Back</span>
              </motion.button>

              <div className="flex items-center gap-2 text-white text-sm">
                <Users size={16} />
                <span>{gameState.players.length}/{room.maxPlayers}</span>
              </div>
            </div>
          </div>

          {/* Main Table Area */}
          <div className="relative w-full h-screen flex items-center justify-center">
            {/* Poker Table Surface */}
            <div className="poker-table-surface relative px-4 md:px-0">
              {/* Table Border */}
              <div 
                className="w-[360px] h-[260px] sm:w-[520px] sm:h-[360px] md:w-[640px] md:h-[440px] shadow-2xl relative mx-auto"
                style={{
                  backgroundImage: 'url(/images/table-border.svg)',
                  backgroundSize: 'contain',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat'
                }}
              >
                {/* Table Felt */}
                <div 
                  className="absolute top-[4px] left-[4px] w-[352px] h-[252px] sm:w-[512px] sm:h-[352px] md:top-[8px] md:left-[8px] md:w-[624px] md:h-[424px]"
                  style={{
                    backgroundImage: 'url(/images/table-felt.svg)',
                    backgroundSize: 'contain',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat'
                  }}
                />
                
                {/* Community Cards & Pot */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full px-4">
                  {/* Pot Display */}
                  <div className="pot-display text-center mb-3">
                    <div className="inline-flex flex-col items-center bg-black/50 backdrop-blur-sm px-4 py-2 rounded-xl border-2 border-yellow-500/50 shadow-xl">
                      <div className="text-yellow-400 text-xs mb-1">POT</div>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-[24px] h-[24px]"
                          style={{
                            backgroundImage: 'url(/images/poker-chips.svg)',
                            backgroundSize: 'contain',
                            backgroundPosition: 'center',
                            backgroundRepeat: 'no-repeat'
                          }}
                        />
                        <span className="text-white font-bold text-3xl">
                          ${gameState.pot}
                        </span>
                        <div 
                          className="w-[24px] h-[24px]"
                          style={{
                            backgroundImage: 'url(/images/poker-chips.svg)',
                            backgroundSize: 'contain',
                            backgroundPosition: 'center',
                            backgroundRepeat: 'no-repeat'
                          }}
                        />
                      </div>
                      <div className="text-green-300 text-xs mt-1">
                        {gameState.round.toUpperCase()}
                      </div>
                    </div>
                  </div>
                  
                  {/* Community Cards */}
                  <div className="flex justify-center flex-wrap gap-1">
                    {gameState.communityCards.map((card, index) => (
                      <motion.div
                        key={index}
                        initial={{ scale: 0, rotateY: 180 }}
                        animate={{ scale: 1, rotateY: 0 }}
                        transition={{ delay: index * 0.2 }}
                        className="community-card"
                      >
                        {getCardDisplay(card)}
                      </motion.div>
                    ))}
                    {/* Empty card slots */}
                    {Array.from({ length: 5 - gameState.communityCards.length }).map((_, index) => (
                      <div 
                        key={`empty-${index}`} 
                        className="w-[56px] h-[80px] md:w-[80px] md:h-[112px] m-0.5 shadow-lg opacity-30 rounded-lg"
                        style={{
                          backgroundImage: 'url(/images/card-back.svg)',
                          backgroundSize: 'contain',
                          backgroundPosition: 'center',
                          backgroundRepeat: 'no-repeat'
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Players Around Table */}
              {gameState.players.map((player, index) => (
                <motion.div
                  key={player.id}
                  className="player-position absolute"
                  style={getPositionStyle(index, gameState.players.length)}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className={`bg-black/60 backdrop-blur-sm rounded-xl border-2 p-3 w-[8rem] transition-all ${
                    gameState.currentPlayer === index 
                      ? 'border-yellow-400 shadow-lg shadow-yellow-400/50' 
                      : 'border-white/20'
                  }`}>
                    {/* Dealer Button */}
                    {gameState.dealerPosition === index && (
                      <div className="absolute -top-2 -right-2 bg-yellow-500 text-black w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs">
                        D
                      </div>
                    )}
                    
                    {/* Player Info */}
                    <div className="text-center mb-2">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <span className="text-white font-bold text-sm truncate">{player.username}</span>
                        {player.isBot && <span className="text-xs bg-blue-500 text-white px-1 rounded">BOT</span>}
                      </div>
                      <div className="flex items-center justify-center gap-1 text-yellow-400 text-sm">
                        <Coins size={14} />
                        <span className="font-bold">${player.chips}</span>
                      </div>
                    </div>

                    {/* Player Cards */}
                    <div className="flex justify-center mb-2">
                      {player.id === currentUserId && player.cards && player.cards.length === 2 ? (
                        <>
                          {getCardDisplay(player.cards[0])}
                          {getCardDisplay(player.cards[1])}
                        </>
                      ) : player.cards && player.cards.length === 2 ? (
                        <>
                          <div 
                            className="w-[28px] h-[39px] m-0.5 shadow-lg rounded"
                            style={{
                              backgroundImage: 'url(/images/card-back.svg)',
                              backgroundSize: 'contain',
                              backgroundPosition: 'center',
                              backgroundRepeat: 'no-repeat'
                            }}
                          />
                          <div 
                            className="w-[28px] h-[39px] m-0.5 shadow-lg rounded"
                            style={{
                              backgroundImage: 'url(/images/card-back.svg)',
                              backgroundSize: 'contain',
                              backgroundPosition: 'center',
                              backgroundRepeat: 'no-repeat'
                            }}
                          />
                        </>
                      ) : (
                        <>
                          <div className="bg-gray-700/50 border-2 border-gray-600 rounded-lg p-1 m-0.5 shadow-lg min-w-[2rem] text-center opacity-30">
                            <div className="text-xs text-gray-400">—</div>
                          </div>
                          <div className="bg-gray-700/50 border-2 border-gray-600 rounded-lg p-1 m-0.5 shadow-lg min-w-[2rem] text-center opacity-30">
                            <div className="text-xs text-gray-400">—</div>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Player Status */}
                    {player.currentBet > 0 && (
                      <div className="text-center text-xs text-green-400">
                        Bet: ${player.currentBet}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Action Buttons - Right Side Vertical */}
            {isMyTurn && myPlayer && (
              <motion.div
                initial={{ x: 100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="fixed right-2 sm:right-3 top-[40%] -translate-y-1/2 z-50"
              >
                <div className="bg-black/95 backdrop-blur-md rounded-lg border border-purple-500/50 p-1.5 shadow-2xl">
                  <div className="flex flex-col gap-1">
                    <motion.button
                      whileHover={{ scale: 1.05, x: -3 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleFold}
                      className="px-2.5 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded font-bold text-[10px] transition-colors shadow-md min-w-[60px]"
                    >
                      Fold
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05, x: -3 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleCheck}
                      className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded font-bold text-[10px] transition-colors shadow-md min-w-[60px]"
                    >
                      Check
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05, x: -3 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleCall}
                      className="px-2.5 py-1.5 bg-green-600 hover:bg-green-500 text-white rounded font-bold text-[10px] transition-colors shadow-md min-w-[60px] whitespace-nowrap"
                    >
                      Call ${gameState.currentBet}
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05, x: -3 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleRaise}
                      className="px-2.5 py-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded font-bold text-[10px] transition-colors shadow-md min-w-[60px]"
                    >
                      Raise
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05, x: -3 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleAllIn}
                      className="px-2.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded font-bold text-[10px] transition-colors shadow-md min-w-[60px]"
                    >
                      All-In
                    </motion.button>
                  </div>
                  
                  {/* Turn Timer */}
                  {isMyTurn && (
                    <div className="mt-2 pt-2 border-t border-purple-500/30">
                      <div className="text-center text-white text-[9px] font-bold mb-1">
                        Your Turn: {turnTimeRemaining}s
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-1.5 overflow-hidden">
                        <motion.div
                          className={`h-full ${turnTimeRemaining <= 5 ? 'bg-red-500' : 'bg-yellow-500'}`}
                          animate={{
                            width: `${(turnTimeRemaining / 20) * 100}%`,
                            opacity: turnTimeRemaining <= 5 ? [1, 0.3, 1] : 1
                          }}
                          transition={{
                            width: { duration: 1, ease: 'linear' },
                            opacity: turnTimeRemaining <= 5 ? {
                              duration: 0.5,
                              repeat: Infinity
                            } : {}
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
