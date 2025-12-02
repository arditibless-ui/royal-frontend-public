'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Users, Coins, Eye, Settings } from 'lucide-react'
import { API_URL } from '../../constants/api'

interface PokerTableProps {
  roomCode: string
  onBack: () => void
}

interface Player {
  _id: string
  username: string
  chips: number
  cards?: Card[]
  position: number
  status: string
  isBot?: boolean
  isReady?: boolean
}

interface Card {
  suit: string
  rank: string
}

interface GameState {
  round: string
  communityCards: Card[]
  currentBet: number
  currentPlayer: number
  pot: number
}

interface Room {
  _id: string
  code: string
  maxPlayers: number
  buyIn: number
  players: Player[]
  status: string
  currentPot: number
  gameState?: GameState
}

export default function PokerTable({ roomCode, onBack }: PokerTableProps) {
  const [room, setRoom] = useState<Room | null>(null)
  const [loading, setLoading] = useState(true)
  const [windowSize, setWindowSize] = useState({ width: 1024, height: 768 })
  const [actionTimer, setActionTimer] = useState(20) // 20 second timer

  const fetchRoom = async () => {
    // Don't keep retrying if we already have error state with mock data
    if (room && !API_URL) {
      return
    }

    try {
      // If no API_URL, skip the fetch and use mock data immediately
      if (!API_URL || API_URL === '') {
        setRoom({
          _id: roomCode,
          code: roomCode,
          maxPlayers: 8,
          buyIn: 100,
          players: [
            { _id: '1', username: 'Bot1', chips: 1000, position: 0, status: 'active', isBot: true, isReady: true },
            { _id: '2', username: 'Bot2', chips: 1000, position: 2, status: 'active', isBot: true, isReady: true },
            { _id: '3', username: 'Bot3', chips: 1000, position: 4, status: 'active', isBot: true, isReady: true },
            { _id: '4', username: 'Bot4', chips: 1000, position: 6, status: 'active', isBot: true, isReady: true },
          ],
          status: 'waiting',
          currentPot: 0,
          gameState: {
            round: 'preflop',
            communityCards: [],
            currentBet: 0,
            currentPlayer: 0,
            pot: 0,
            dealer: 0,
            status: 'playing'
          }
        })
        setLoading(false)
        return
      }

      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/api/games/rooms/${roomCode}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('Room data received:', data) // Debug log
        // Sort players by position to match game logic indices
        if (data.room && data.room.players) {
          data.room.players.sort((a: Player, b: Player) => a.position - b.position)
        }
        setRoom(data.room)
      } else {
        console.error('Failed to fetch room:', response.status, response.statusText)
      }
    } catch (err) {
      console.error('Failed to fetch room:', err)
      // Mock room data for demo
      setRoom({
        _id: roomCode,
        code: roomCode,
        maxPlayers: 8,
        buyIn: 100,
        players: [
          { _id: '1', username: 'Bot1', chips: 1000, position: 0, status: 'active', isBot: true, isReady: true },
          { _id: '2', username: 'Bot2', chips: 1000, position: 2, status: 'active', isBot: true, isReady: true },
          { _id: '3', username: 'Bot3', chips: 1000, position: 4, status: 'active', isBot: true, isReady: true },
          { _id: '4', username: 'Bot4', chips: 1000, position: 6, status: 'active', isBot: true, isReady: true },
        ],
        status: 'waiting',
        currentPot: 0,
        gameState: {
          round: 'preflop',
          communityCards: [],
          currentBet: 0,
          currentPlayer: 0,
          pot: 0,
          dealer: 0,
          status: 'playing'
        }
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRoom()
    // Only set interval if we have an API_URL
    if (API_URL && API_URL !== '') {
      const interval = setInterval(fetchRoom, 2000)
      return () => clearInterval(interval)
    }
  }, [roomCode])

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight })
    }
    
    // Set initial size
    if (typeof window !== 'undefined') {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight })
      window.addEventListener('resize', handleResize)
    }
    
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', handleResize)
      }
    }
  }, [])

  const getCardDisplay = (card: Card) => {
    const suitSymbols: { [key: string]: string } = {
      'hearts': '♥',
      'diamonds': '♦',
      'clubs': '♣',
      'spades': '♠'
    }
    
    const suitColors: { [key: string]: string } = {
      'hearts': 'text-red-600',
      'diamonds': 'text-red-600',
      'clubs': 'text-gray-900',
      'spades': 'text-gray-900'
    }

    return (
      <div className="bg-white rounded-lg p-3 m-1 shadow-2xl min-w-[3.5rem] text-center border-4 border-gray-200 relative">
        <div className="absolute top-1 left-1 text-xs font-bold">{card.rank}</div>
        <div className="text-2xl font-bold mt-1">{card.rank}</div>
        <div className={`text-3xl ${suitColors[card.suit]}`}>
          {suitSymbols[card.suit]}
        </div>
        <div className="absolute bottom-1 right-1 text-xs font-bold transform rotate-180">{card.rank}</div>
      </div>
    )
  }

  const getPositionStyle = (position: number, totalPlayers: number) => {
    const isSmall = windowSize.width < 768
    const isMedium = windowSize.width >= 768 && windowSize.width < 1024
    
    // Responsive elliptical positioning
    const radiusX = isSmall ? 200 : isMedium ? 280 : 340
    const radiusY = isSmall ? 100 : isMedium ? 140 : 180
    
    // Elliptical arrangement with specific angles for 9-player table
    // Starting from top center (270° or -90°), going clockwise
    // Angle per player: 40° between each
    const angles = [-90, -50, -10, 30, 70, 90, 110, 150, 190]
    const angle = angles[position] || 0
    
    // Use 45% as vertical center to shift table down
    const verticalCenter = '45%'
    
    // Calculate position around elliptical table
    const angleRad = angle * (Math.PI / 180)
    const x = Math.cos(angleRad) * radiusX
    const y = Math.sin(angleRad) * radiusY
    
    // Player card dimensions
    const cardWidth = isSmall ? 6 : 8 // rem units for player card width
    const cardHeight = isSmall ? 3 : 4 // rem units for player card height
    
    return {
      left: `calc(50% + ${x}px - ${cardWidth/2}rem)`,
      top: `calc(${verticalCenter} + ${y}px - ${cardHeight/2}rem)`,
      position: 'absolute' as const,
    }
  }

  // Always render the same JSX structure to maintain hook order
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-800 via-green-700 to-green-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading poker table...</div>
      </div>
    )
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-800 via-green-700 to-green-900 flex items-center justify-center">
        <div className="text-white text-xl">Room not found</div>
      </div>
    )
  }

  return (
    <div 
      className="min-h-screen relative overflow-hidden"
      style={{
        backgroundImage: 'url(/images/green-background.png?v=2)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Header */}
      <div className="absolute top-6 left-6 right-6 z-10">
        <div className="flex justify-between items-center">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 bg-black/40 text-white rounded-lg hover:bg-black/60 transition-colors"
          >
            <ArrowLeft size={18} />
            Back
          </motion.button>

          <div className="flex items-center gap-4">
            <div className="bg-black/40 px-4 py-2 rounded-lg">
              <span className="text-white font-bold">Room: {room.code}</span>
            </div>
            <div className="bg-black/40 px-4 py-2 rounded-lg flex items-center gap-2">
              <Users size={16} className="text-white" />
              <span className="text-white">{room.players.length}/{room.maxPlayers}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Poker Table */}
      <div className="relative w-full h-screen flex items-center justify-center">
        {/* Poker Table Surface */}
        <div className="relative">
          {/* Poker Table - Premium Design with Felt and Wood Border */}
          <div 
            className="shadow-2xl relative rounded-[50%] border-[16px] md:border-[20px] lg:border-[24px]
                       w-[480px] h-[320px] md:w-[680px] md:h-[453px] lg:w-[940px] lg:h-[627px]"
            style={{
              background: 'radial-gradient(ellipse at center, #1a5f3a 0%, #0d3a23 70%, #082516 100%)',
              borderColor: '#3d2817',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), inset 0 2px 4px 0 rgba(255, 255, 255, 0.1), 0 0 0 4px #2a1a0f',
              borderImageSource: 'linear-gradient(135deg, #5c3d2e 0%, #3d2817 50%, #2a1a0f 100%)',
              borderImageSlice: 1
            }}
          >
            
            {/* Community Cards Area */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="text-center mb-4">
                {/* Pot Display with Poker Chips */}
                <div className="flex flex-col items-center gap-2 mb-4">
                  <div className="bg-black/70 backdrop-blur-sm px-6 py-3 rounded-full border-2 border-yellow-500/50 shadow-xl">
                    <div className="flex items-center gap-3">
                      <div className="flex -space-x-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-red-700 border-2 border-white shadow-lg" />
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 border-2 border-white shadow-lg" />
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-green-700 border-2 border-white shadow-lg" />
                      </div>
                      <div className="text-yellow-400 font-bold text-xl">
                        ${room.gameState?.pot || room.currentPot || 0}
                      </div>
                    </div>
                  </div>
                  <div className="text-white font-semibold text-sm bg-black/50 px-4 py-1 rounded-full">
                    {room.gameState?.round?.toUpperCase() || 'WAITING'}
                  </div>
                </div>
                <div className="flex justify-center">
                  {(room.gameState?.communityCards || []).map((card, index) => (
                    <motion.div
                      key={index}
                      initial={{ scale: 0, rotate: 180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ delay: index * 0.2 }}
                    >
                      {getCardDisplay(card)}
                    </motion.div>
                  ))}
                  {/* Empty card slots */}
                  {Array.from({ length: 5 - (room.gameState?.communityCards?.length || 0) }).map((_, index) => (
                    <div 
                      key={`empty-${index}`} 
                      className="w-[56px] h-[80px] m-1 shadow-lg opacity-20 rounded-lg border-2 border-dashed border-white/30"
                      style={{
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)'
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Current Bet Display */}
            {(room.gameState?.currentBet || 0) > 0 && (
              <div className="absolute top-1/4 left-1/2 transform -translate-x-1/2">
                <div className="bg-yellow-500 text-black px-3 py-1 rounded-full font-bold shadow-lg">
                  Current Bet: ${room.gameState?.currentBet || 0}
                </div>
              </div>
            )}
          </div>

          {/* Players Around Table */}
          {(room.players || []).map((player, index) => (
            <motion.div
              key={player._id}
              className="absolute"
              style={getPositionStyle(player.position, Math.max(room.maxPlayers || 6, room.players?.length || 1))}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className={`bg-black/60 backdrop-blur-sm rounded-xl p-3 border-2 min-w-[8rem] relative ${
                (room.gameState?.currentPlayer || 0) === index ? 'border-yellow-400 shadow-lg shadow-yellow-400/50' : 'border-white/20'
              }`}>
                {/* Action Timer for Current Player */}
                {(room.gameState?.currentPlayer || 0) === index && room.gameState && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="relative w-12 h-12">
                      <svg className="w-12 h-12 transform -rotate-90">
                        <circle
                          cx="24"
                          cy="24"
                          r="20"
                          stroke="rgba(255, 255, 255, 0.2)"
                          strokeWidth="3"
                          fill="none"
                        />
                        <circle
                          cx="24"
                          cy="24"
                          r="20"
                          stroke="#eab308"
                          strokeWidth="3"
                          fill="none"
                          strokeDasharray={`${2 * Math.PI * 20}`}
                          strokeDashoffset={`${2 * Math.PI * 20 * (1 - actionTimer / 20)}`}
                          className="transition-all duration-1000"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center text-white font-bold text-sm bg-black/80 rounded-full m-1">
                        {actionTimer}
                      </div>
                    </div>
                  </div>
                )}
                {/* Dealer Button */}
                {room.gameState?.dealer !== undefined && index === room.gameState.dealer && (
                  <div className="absolute -top-3 -right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center font-bold text-sm shadow-xl border-2 border-yellow-500 z-20 animate-pulse">
                    D
                  </div>
                )}
                {/* Small Blind Indicator */}
                {room.gameState?.dealer !== undefined && room.gameState.status === 'playing' && index === (room.gameState.dealer + 1) % (room.players?.length || 1) && (
                  <div className="absolute -top-3 -left-3 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-xl border-2 border-white z-20">
                    SB
                  </div>
                )}
                {/* Big Blind Indicator */}
                {room.gameState?.dealer !== undefined && room.gameState.status === 'playing' && index === (room.gameState.dealer + 2) % (room.players?.length || 1) && (
                  <div className="absolute -top-3 -left-3 w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-xl border-2 border-white z-20">
                    BB
                  </div>
                )}
                {/* Player Info */}
                <div className="text-center mb-2">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <span className="text-white font-bold text-sm">{player.username}</span>
                    {player.isBot && <span className="text-xs bg-blue-500 text-white px-1 rounded">BOT</span>}
                  </div>
                  <div className="flex items-center justify-center gap-1 text-yellow-400 text-sm">
                    <Coins size={14} />
                    <span className="font-bold">${player.chips}</span>
                  </div>
                </div>

                {/* Player Cards */}
                <div className="flex justify-center gap-1 mb-2">
                  {player.cards && player.cards.length > 0 ? (
                    player.cards.map((card, idx) => (
                      <div key={idx} className="w-[28px] h-[39px] bg-white rounded shadow-lg flex items-center justify-center text-xs font-bold">
                        {card.rank}{card.suit === 'hearts' || card.suit === 'diamonds' ? 
                          <span className="text-red-500">{card.suit === 'hearts' ? '♥' : '♦'}</span> : 
                          <span className="text-black">{card.suit === 'clubs' ? '♣' : '♠'}</span>
                        }
                      </div>
                    ))
                  ) : (
                    <>
                      <div 
                        className="w-[28px] h-[39px] m-0.5 shadow-lg rounded"
                        style={{
                          background: 'linear-gradient(135deg, #c41e3a 0%, #8b1a2e 100%)',
                          border: '1px solid #fff'
                        }}
                      />
                      <div 
                        className="w-[28px] h-[39px] m-0.5 shadow-lg rounded"
                        style={{
                          background: 'linear-gradient(135deg, #c41e3a 0%, #8b1a2e 100%)',
                          border: '1px solid #fff'
                        }}
                      />
                    </>
                  )}
                </div>

                {/* Player Status */}
                <div className="text-center space-y-1">
                  <span className={`text-xs px-2 py-1 rounded block ${
                    player.status === 'active' ? 'bg-green-500/20 text-green-400' :
                    player.status === 'folded' ? 'bg-red-500/20 text-red-400' :
                    'bg-gray-500/20 text-gray-400'
                  }`}>
                    {player.status}
                  </span>
                  {/* Current Bet Amount */}
                  {player.chips < 1000 && room.gameState && (
                    <div className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded">
                      Bet: ${1000 - player.chips}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Game Controls (if player is in game) */}
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 w-full max-w-2xl px-4">
          <div className="bg-gradient-to-b from-black/80 to-black/90 backdrop-blur-md rounded-2xl p-6 border-2 border-yellow-500/30 shadow-2xl">
            {/* Betting Slider Section */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-white font-semibold">Bet Amount:</span>
                <span className="text-yellow-400 font-bold text-xl">$0</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="1000" 
                defaultValue="0"
                className="w-full h-3 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                style={{
                  background: 'linear-gradient(to right, #eab308 0%, #eab308 0%, #374151 0%, #374151 100%)'
                }}
              />
              {/* Quick Bet Buttons */}
              <div className="flex gap-2 mt-2">
                <button className="flex-1 px-3 py-1 bg-gray-700 text-white text-sm rounded hover:bg-gray-600 transition-colors">
                  Min
                </button>
                <button className="flex-1 px-3 py-1 bg-gray-700 text-white text-sm rounded hover:bg-gray-600 transition-colors">
                  1/2 Pot
                </button>
                <button className="flex-1 px-3 py-1 bg-gray-700 text-white text-sm rounded hover:bg-gray-600 transition-colors">
                  Pot
                </button>
                <button className="flex-1 px-3 py-1 bg-gray-700 text-white text-sm rounded hover:bg-gray-600 transition-colors">
                  Max
                </button>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex-1 px-6 py-4 bg-gradient-to-b from-red-600 to-red-700 text-white font-bold rounded-xl hover:from-red-500 hover:to-red-600 transition-all shadow-lg border-2 border-red-400"
              >
                Fold
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex-1 px-6 py-4 bg-gradient-to-b from-blue-600 to-blue-700 text-white font-bold rounded-xl hover:from-blue-500 hover:to-blue-600 transition-all shadow-lg border-2 border-blue-400"
              >
                Check/Call ${room.gameState?.currentBet || 0}
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex-1 px-6 py-4 bg-gradient-to-b from-green-600 to-green-700 text-white font-bold rounded-xl hover:from-green-500 hover:to-green-600 transition-all shadow-lg border-2 border-green-400"
              >
                Raise
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-5 py-4 bg-gradient-to-b from-purple-600 to-purple-700 text-white font-bold rounded-xl hover:from-purple-500 hover:to-purple-600 transition-all shadow-lg border-2 border-purple-400"
              >
                All-In
              </motion.button>
            </div>
          </div>
        </div>

        {/* Observer Mode Indicator */}
        <div className="absolute top-20 right-6">
          <div className="bg-blue-600/80 backdrop-blur-sm px-4 py-2 rounded-lg border border-blue-400/50">
            <div className="flex items-center gap-2 text-white">
              <Eye size={18} />
              <span className="font-medium">Observer Mode</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}