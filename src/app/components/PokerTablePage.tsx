'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Users, Coins, Eye, Settings, Play, Pause, Menu, MessageCircle, Send, BarChart3, Palette, History, Bell } from 'lucide-react'
import { API_URL } from '../../constants/api'
import { simulatePokerGame, type Player as AIPlayer, type GameState as AIGameState, type Card as AICard } from '../../services/pokerBotAI'
import { soundManager } from '../../utils/sounds'
import { io, Socket } from 'socket.io-client'
import ConfettiCelebration from '../../components/ConfettiCelebration'
import CircularTimer from '../../components/CircularTimer'
import TableThemeSelector from '../../components/TableThemeSelector'
import ChipAnimation from '../../components/ChipAnimation'
import DealerButton from '../../components/DealerButton'
import HandStrengthMeter from '../../components/HandStrengthMeter'
import PotOddsDisplay from '../../components/PotOddsDisplay'
import ActionHistory from '../../components/ActionHistory'
import FloatingChipsBackground from '../../components/FloatingChipsBackground'
import StatsDashboard from '../../components/StatsDashboard'
import GameHistoryModal from '../../components/GameHistoryModal'
import GameSettings from './GameSettings'
import { useSwipeGesture } from '../hooks/useSwipeGesture'
import PlayerSpotlight from '../../components/PlayerSpotlight'
import TurnArrow from '../../components/TurnArrow'
import AllInEffect from '../../components/AllInEffect'
import CardBurnAnimation from '../../components/CardBurnAnimation'
import FeltRipple from '../../components/FeltRipple'
import NotificationCenter from '../../components/NotificationCenter'
import IdlePlayerIndicator from '../../components/IdlePlayerIndicator'

interface PokerTablePageProps {
  roomCode: string
  onBack: () => void
  isAdminView?: boolean  // New prop to identify admin viewing mode
}

interface Player {
  _id: string
  username: string
  chips: number
  cards?: Card[]
  position: number
  status: string
  isReady?: boolean
  currentBet?: number
  folded?: boolean
  gameIndex?: number // Gameplay turn order index
  avatar?: string // Emoji avatar
  avatarUrl?: string // Uploaded image avatar URL
  isIdle?: boolean // Idle status
}

interface Card {
  suit: string
  rank: string
}

interface TableTheme {
  name: string
  displayName: string
  colors: {
    feltGradient: string
    chipColor: string
    borderColor: string
    accentColor: string
  }
  isPremium: boolean
}

interface SidePot {
  amount: number
  eligiblePlayers: string[]
  type: string
}

interface GameState {
  round: 'preflop' | 'flop' | 'turn' | 'river' | 'showdown' | 'waiting' | string
  communityCards: Card[]
  currentBet: number
  currentPlayer: number
  pot: number
  dealer?: number
  dealerPosition?: number
  smallBlind?: number
  bigBlind?: number
  status?: string
  sidePots?: SidePot[]
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

export default function PokerTablePage({ roomCode, onBack, isAdminView = false }: PokerTablePageProps) {
  
  const [room, setRoom] = useState<Room | null>(null)
  const [stableCardState, setStableCardState] = useState<{[playerId: string]: boolean}>({}) // Track which players should show cards
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [playerPerspective, setPlayerPerspective] = useState<number | null>(null)
  const [gameActions, setGameActions] = useState<string[]>([])
  const [showMenu, setShowMenu] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const [chatMessage, setChatMessage] = useState('')
  const socketRef = useRef<Socket | null>(null)
  const roomRef = useRef<Room | null>(null) // Store current room state to avoid closure issues
  const [chatMessages, setChatMessages] = useState<Array<{playerId: string, playerName: string, message: string, timestamp: number}>>([])
  const [activeBubbles, setActiveBubbles] = useState<Array<{playerId: string, playerName: string, message: string, timestamp: number}>>([])
  const [playerActions, setPlayerActions] = useState<{[key: number]: {action: string, timestamp: number}}>({})
  const [joinNotification, setJoinNotification] = useState<{playerName: string, timestamp: number} | null>(null)
  
  // Helper to update both room state and ref
  const updateRoom = (updater: (prev: Room | null) => Room | null) => {
    setRoom(prev => {
      const newRoom = updater(prev)
      roomRef.current = newRoom
      return newRoom
    })
  }
  const [lowCreditWarning, setLowCreditWarning] = useState<{show: boolean, playerId: string, playerName: string, countdown: number}>({
    show: false,
    playerId: '',
    playerName: '',
    countdown: 120
  })
  const [playersWaitingForCredits, setPlayersWaitingForCredits] = useState<Set<string>>(new Set())
  const [dealerAnimation, setDealerAnimation] = useState<{show: boolean, message: string}>({ show: false, message: '' })
  const [flyingCards, setFlyingCards] = useState<{[key: string]: {show: boolean, targetPosition: number}}>({})
  const [cardsDelivered, setCardsDelivered] = useState<{[playerName: string]: number}>({}) // Track how many cards each player has received
  const renderedCommunityCardsRef = useRef<Set<string>>(new Set()) // Track which community cards have been rendered (using ref to avoid re-renders)
  
  const [gameCountdown, setGameCountdown] = useState<{show: boolean, countdown: number, type: 'starting' | 'stopping' | 'next-round'}>({
    show: false,
    countdown: 0,
    type: 'starting'
  })
  const [centerNotification, setCenterNotification] = useState<{show: boolean, message: string, type: 'info' | 'warning' | 'success'}>({
    show: false,
    message: '',
    type: 'info'
  })
  const [currentTheme, setCurrentTheme] = useState<TableTheme>({
    name: 'classic',
    displayName: 'Classic Green',
    colors: {
      feltGradient: 'radial-gradient(ellipse at center, #1a5f3a 0%, #0d3a23 70%, #082516 100%)',
      chipColor: '#FFD700',
      borderColor: '#F59E0B',
      accentColor: '#10B981'
    },
    isPremium: false
  })
  const [showThemeSelector, setShowThemeSelector] = useState(false)
  
  // Animation control state to prevent duplicates
  const [animationStates, setAnimationStates] = useState<{
    countdownActive: boolean,
    dealingActive: boolean,
    lastCountdownId: string
  }>({
    countdownActive: false,
    dealingActive: false,
    lastCountdownId: ''
  })
  const [showRaiseSlider, setShowRaiseSlider] = useState(false)
  const [raiseAmount, setRaiseAmount] = useState(0)
  const [showLeaveConfirmation, setShowLeaveConfirmation] = useState(false)
  
  // Enhanced Features State
  const [showConfetti, setShowConfetti] = useState(false)
  const [chipAnimations, setChipAnimations] = useState<Array<{
    id: number
    fromX: number
    fromY: number
    toX: number
    toY: number
    amount: number
    isActive: boolean
  }>>([])
  const [dealerButtonPos, setDealerButtonPos] = useState({ x: 0, y: 0 })
  const [showHandStrength, setShowHandStrength] = useState(false)
  const [showPotOdds, setShowPotOdds] = useState(false)
  const [showActionHistory, setShowActionHistory] = useState(false)
  const [showSidePots, setShowSidePots] = useState(false)
  const [actionHistoryList, setActionHistoryList] = useState<Array<{
    id: number
    player: string
    action: string
    amount?: number
    timestamp: number
  }>>([])
  const [showStats, setShowStats] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [playerBalances, setPlayerBalances] = useState<Record<string, number>>({})
  const [creditAnimations, setCreditAnimations] = useState<Array<{
    id: string
    playerId: string
    amount: number
    x: number
    y: number
  }>>([])
  
  // Game Settings State
  const [gesturesEnabled, setGesturesEnabled] = useState(false)
  const [actionSoundsEnabled, setActionSoundsEnabled] = useState(true)
  const [backgroundMusicEnabled, setBackgroundMusicEnabled] = useState(false)
  
  // Swipe Gesture Tutorial State
  const [showGestureTutorial, setShowGestureTutorial] = useState(false)
  
  // Current user state
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [currentUserRole, setCurrentUserRole] = useState<'player' | 'manager' | 'admin'>('player')
  
  // Connection state for reconnection indicator
  const [socketConnected, setSocketConnected] = useState(true)
  const [reconnecting, setReconnecting] = useState(false)
  
  // Removed toggleBotPause function
  const placeholderForRemovedFunction = () => {
    setTimeout(() => {
      setCenterNotification(prev => ({ ...prev, show: false }))
    }, 2000)
  }
  
  // Load settings from localStorage on mount
  useEffect(() => {
    const savedGestures = localStorage.getItem('pokerGameGestures')
    const savedActionSounds = localStorage.getItem('pokerActionSounds')
    const savedMusic = localStorage.getItem('pokerBackgroundMusic')
    const seenGestureTutorial = localStorage.getItem('pokerGestureTutorialSeen')
    
    if (savedGestures !== null) setGesturesEnabled(JSON.parse(savedGestures))
    if (savedActionSounds !== null) {
      const enabled = JSON.parse(savedActionSounds)
      setActionSoundsEnabled(enabled)
      soundManager.setEnabled(enabled)
    }
    if (savedMusic !== null) {
      const enabled = JSON.parse(savedMusic)
      setBackgroundMusicEnabled(enabled)
      soundManager.setMusicEnabled(enabled)
      // Start game music when poker table loads
      if (enabled) {
        soundManager.playBackgroundMusic('game')
      }
    }
    
    // Get current user info
    const token = localStorage.getItem('token')
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        const extractedUserId = payload.userId || payload.id
        console.log('🔑 Token decoded - userId:', extractedUserId, 'Full payload:', payload)
        setCurrentUserId(extractedUserId)
        
        // Fetch user role
        fetch(`${API_URL}/api/users/profile`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        .then(res => res.json())
        .then(data => {
          console.log('👤 User profile fetched:', data.user?.role, 'userId:', data.user?._id)
          setCurrentUserRole(data.user?.role || 'player')
        })
        .catch(err => console.error('Failed to fetch user info:', err))
      } catch (err) {
        console.error('Failed to decode token:', err)
      }
    }
    
    // Cleanup music when leaving poker table
    return () => {
      soundManager.stopMusic()
    }
  }, [])
  
  // Show gesture tutorial when game starts and gestures are enabled (first time only)
  useEffect(() => {
    const seenTutorial = localStorage.getItem('pokerGestureTutorialSeen')
    
    if (gesturesEnabled && room?.status === 'playing' && !seenTutorial) {
      // Show tutorial 1 second after game starts
      const timer = setTimeout(() => {
        setShowGestureTutorial(true)
      }, 1000)
      
      return () => clearTimeout(timer)
    }
  }, [gesturesEnabled, room?.status])
  
  const dismissGestureTutorial = () => {
    setShowGestureTutorial(false)
    localStorage.setItem('pokerGestureTutorialSeen', 'true')
  }
  
  // New Turn Timer State
  const [turnTimer, setTurnTimer] = useState<{
    active: boolean,
    playerId: string,
    deadline: number,
    totalDuration: number
  }>({
    active: false,
    playerId: '',
    deadline: 0,
    totalDuration: 20000
  })

  // NEW ANIMATION STATES
  const [activePlayerSpotlight, setActivePlayerSpotlight] = useState<{
    show: boolean
    playerX: number
    playerY: number
    playerId: string
  }>({
    show: false,
    playerX: 0,
    playerY: 0,
    playerId: ''
  })
  
  const [allInEffect, setAllInEffect] = useState<{
    show: boolean
    playerName: string
    amount: number
  }>({
    show: false,
    playerName: '',
    amount: 0
  })
  
  const [cardBurn, setCardBurn] = useState<{
    show: boolean
    dealerX: number
    dealerY: number
  }>({
    show: false,
    dealerX: 0,
    dealerY: 0
  })
  
  const [feltRipple, setFeltRipple] = useState<{
    show: boolean
    centerX: number
    centerY: number
    color: string
  }>({
    show: false,
    centerX: 0,
    centerY: 0,
    color: 'rgba(251,191,36,0.3)'
  })
  
  // Visual timer state
  const [visualTimeLeft, setVisualTimeLeft] = useState(0);

  useEffect(() => {
    if (!turnTimer.active) {
      setVisualTimeLeft(0);
      return;
    }
    
    const updateTimer = () => {
      const now = Date.now();
      const remaining = Math.max(0, (turnTimer.deadline - now) / 1000);
      setVisualTimeLeft(remaining);
      
      if (remaining > 0) {
        requestAnimationFrame(updateTimer);
      }
    };
    
    const handle = requestAnimationFrame(updateTimer);
    return () => cancelAnimationFrame(handle);
  }, [turnTimer]);
  
  const creditCountdownRef = useRef<NodeJS.Timeout | null>(null)
  const previousPlayerCountRef = useRef<number>(0)
  const previousPlayerIdsRef = useRef<string[]>([])
  const gameIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const gameActiveRef = useRef(false) // Track if game has been initialized
  const gameCountdownRef = useRef<NodeJS.Timeout | null>(null)
  const playerWaitTimeRef = useRef<NodeJS.Timeout | null>(null)
  const lastPlayerCountChangeRef = useRef<number>(Date.now())
  // Removed turnTimerIntervalRef as we use requestAnimationFrame or simple state updates now

  // Clear game active state on mount if needed
  useEffect(() => {
    // Only clear if we don't have a room yet
    if (!room) {
      console.log('🔄 Component mounted - clearing any stale game state')
      gameActiveRef.current = false
      localStorage.removeItem(`game_active_${roomCode}`)
    }
  }, []) // Run once on mount

  const fetchRoom = async () => {
    // Don't fetch if game has been initialized - check both ref AND localStorage
    const isGameActive = gameActiveRef.current || localStorage.getItem(`game_active_${roomCode}`) === 'true'
    if (isGameActive) {
      console.log('⏸️ Skipping fetch - game is active')
      gameActiveRef.current = true // Sync ref with localStorage
      return
    }
    
    console.log('🔄 Fetching room data...')
    
    // Don't keep retrying if we already have error state with mock data
    if (room && !API_URL) {
      return
    }

    try {
      setError(null)
      
      // Use mock data for demo rooms or when no API_URL is configured
      if (!API_URL || API_URL === '' || roomCode === 'DEMO123' || roomCode === 'DEMO' || roomCode.startsWith('DEMO')) {
        const mockRoom = {
          _id: roomCode,
          code: roomCode,
          maxPlayers: 9,
          buyIn: 100,
          players: [
            { _id: '1', username: 'Player1', chips: 1000, position: 0, status: 'active', isReady: true },
            { _id: '2', username: 'Player2', chips: 1000, position: 1, status: 'active', isReady: true },
            { _id: '3', username: 'Player3', chips: 1000, position: 2, status: 'active', isReady: true },
            { _id: '4', username: 'Player4', chips: 1000, position: 3, status: 'active', isReady: true },
            { _id: '5', username: 'Player5', chips: 1000, position: 4, status: 'active', isReady: true },
            { _id: '6', username: 'Player6', chips: 1000, position: 5, status: 'active', isReady: true },
            { _id: '7', username: 'Player7', chips: 1000, position: 6, status: 'active', isReady: true },
            { _id: '8', username: 'Player8', chips: 1000, position: 7, status: 'active', isReady: true },
            { _id: '9', username: 'Player9', chips: 1000, position: 8, status: 'active', isReady: true },
          ],
          status: 'waiting',
          currentPot: 0
        }
        updateRoom(() => mockRoom)
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
        console.log('Room data received:', data)
        console.log('Players in room:', data.room?.players?.map((p: Player) => ({ id: p._id, name: p.username })))
        
        // Detect new player joins
        if (data.room && data.room.players) {
          const currentPlayerIds = data.room.players.map((p: Player) => p._id)
          const previousIds = previousPlayerIdsRef.current
          
          // Check if there's a new player (not just initial load)
          if (previousIds.length > 0 && currentPlayerIds.length > previousIds.length) {
            const newPlayerId = currentPlayerIds.find((id: string) => !previousIds.includes(id))
            if (newPlayerId) {
              const newPlayer = data.room.players.find((p: Player) => p._id === newPlayerId)
              if (newPlayer) {
                console.log('🔔 New player joined:', newPlayer.username)
                setJoinNotification({
                  playerName: newPlayer.username,
                  timestamp: Date.now()
                })
                
                // Auto-remove notification after 4 seconds
                setTimeout(() => {
                  setJoinNotification(null)
                }, 4000)
              }
            }
          }
          
          // Update refs for next comparison
          previousPlayerCountRef.current = data.room.players.length
          previousPlayerIdsRef.current = currentPlayerIds
        }
        
        updateRoom(() => data.room)
      } else {
        setError(`Failed to fetch room: ${response.status}`)
      }
    } catch (err) {
      console.error('Failed to fetch room:', err)
      
      // Don't reset room if game is already active
      const isGameActive = gameActiveRef.current || localStorage.getItem(`game_active_${roomCode}`) === 'true'
      if (isGameActive) {
        console.log('⏸️ Not resetting room - game is active')
        return
      }
      
      // Only provide mock room data for demo rooms or when API fails
      if (roomCode.startsWith('DEMO') || !API_URL || API_URL === '') {
        updateRoom(() => ({
          _id: roomCode,
          code: roomCode,
          maxPlayers: 9,
          buyIn: 100,
          players: [
            { _id: '1', username: 'Player1', chips: 1000, position: 0, status: 'active', isReady: true },
            { _id: '2', username: 'Player2', chips: 1000, position: 1, status: 'active', isReady: true },
            { _id: '3', username: 'Player3', chips: 1000, position: 2, status: 'active', isReady: true },
            { _id: '4', username: 'Player4', chips: 1000, position: 3, status: 'active', isReady: true },
            { _id: '5', username: 'Player5', chips: 1000, position: 4, status: 'active', isReady: true },
            { _id: '6', username: 'Player6', chips: 1000, position: 5, status: 'active', isReady: true },
            { _id: '7', username: 'Player7', chips: 1000, position: 6, status: 'active', isReady: true },
            { _id: '8', username: 'Player8', chips: 1000, position: 7, status: 'active', isReady: true },
            { _id: '9', username: 'Player9', chips: 1000, position: 8, status: 'active', isReady: true },
          ],
          status: 'waiting',
          currentPot: 0
        }))
      } else {
        // For real rooms, show error if API fails
        setError('Failed to connect to game server')
      }
    } finally {
      setLoading(false)
    }
  }

  const fetchTheme = async () => {
    if (!API_URL) return
    
    try {
      const token = localStorage.getItem('token')
      const userId = localStorage.getItem('userId') // Get current user ID
      
      if (!userId) return
      
      const response = await fetch(`${API_URL}/api/themes/user/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.theme) {
          // Map theme name to full theme object
          const themeMap: {[key: string]: TableTheme} = {
            'classic': {
              name: 'classic',
              displayName: 'Classic Green',
              colors: {
                feltGradient: 'radial-gradient(ellipse at center, #1a5f3a 0%, #0d3a23 70%, #082516 100%)',
                chipColor: '#FFD700',
                borderColor: '#F59E0B',
                accentColor: '#10B981'
              },
              isPremium: false
            },
            'royal': {
              name: 'royal',
              displayName: 'Royal Purple',
              colors: {
                feltGradient: 'radial-gradient(ellipse at center, #6b2d8c 0%, #4a1a5f 70%, #2d0f3a 100%)',
                chipColor: '#FFD700',
                borderColor: '#FFD700',
                accentColor: '#9333EA'
              },
              isPremium: true
            },
            'neon': {
              name: 'neon',
              displayName: 'Neon Nights',
              colors: {
                feltGradient: 'radial-gradient(ellipse at center, #1a1a3a 0%, #0f0f2a 70%, #05050f 100%)',
                chipColor: '#00FFFF',
                borderColor: '#00FFFF',
                accentColor: '#FF00FF'
              },
              isPremium: true
            },
            'dark': {
              name: 'dark',
              displayName: 'Dark Mode',
              colors: {
                feltGradient: 'radial-gradient(ellipse at center, #2a2a2a 0%, #1a1a1a 70%, #0a0a0a 100%)',
                chipColor: '#FFFFFF',
                borderColor: '#555555',
                accentColor: '#888888'
              },
              isPremium: false
            },
            'ocean': {
              name: 'ocean',
              displayName: 'Ocean Blue',
              colors: {
                feltGradient: 'radial-gradient(ellipse at center, #1a5a8a 0%, #0a3a5a 70%, #05202f 100%)',
                chipColor: '#4DD0E1',
                borderColor: '#4DD0E1',
                accentColor: '#0277BD'
              },
              isPremium: true
            },
            'sunset': {
              name: 'sunset',
              displayName: 'Sunset Orange',
              colors: {
                feltGradient: 'radial-gradient(ellipse at center, #8a4a1a 0%, #5a2a0a 70%, #2f1505 100%)',
                chipColor: '#FF6F00',
                borderColor: '#FF6F00',
                accentColor: '#F57C00'
              },
              isPremium: true
            }
          }
          
          if (themeMap[data.theme]) {
            setCurrentTheme(themeMap[data.theme])
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch theme:', err)
    }
  }

  const fetchPlayerBalances = async () => {
    if (!API_URL || !room) return
    
    try {
      const token = localStorage.getItem('token')
      const playerIds = room.players.map(p => p._id)
      
      // Fetch balances for all players in the room
      const balances: Record<string, number> = {}
      
      for (const playerId of playerIds) {
        try {
          const response = await fetch(`${API_URL}/api/users/${playerId}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })
          
          if (response.ok) {
            const data = await response.json()
            balances[playerId] = data.user?.credits || 0
          }
        } catch (err) {
          console.error(`Failed to fetch balance for player ${playerId}:`, err)
        }
      }
      
      setPlayerBalances(balances)
    } catch (err) {
      console.error('Failed to fetch player balances:', err)
    }
  }

  useEffect(() => {
    // Global error handler to prevent white screen crashes
    const handleError = (error: ErrorEvent) => {
      console.error('❌ GLOBAL ERROR CAUGHT:', error.error || error.message);
      console.error('Stack:', error.error?.stack);
      // Prevent default crash behavior
      error.preventDefault();
      return true;
    };
    
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('❌ UNHANDLED PROMISE REJECTION:', event.reason);
      event.preventDefault();
    };
    
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    
    // Add class to body to disable scrolling on poker table
    document.body.classList.add('poker-table-active');
    
    fetchRoom()
    fetchTheme()
    fetchPlayerBalances()
    
    // Start background music for poker game
    soundManager.playBackgroundMusic('game')
    
    // Socket.io connection for real-time updates
    const token = localStorage.getItem('token')
    const socketUrl = API_URL.replace('/api', '')
    
    console.log('🔌 [PokerTablePage] Socket.IO connecting...');
    console.log('  API_URL:', API_URL);
    console.log('  socketUrl:', socketUrl);
    console.log('  NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL);
    
    const socket = io(socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling']
    })
    
    socketRef.current = socket
    
    socket.on('connect', () => {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔌 Socket connected, joining room:', roomCode)
      }
      setSocketConnected(true)
      setReconnecting(false)
      // Clear any previous winner notification on fresh connection
      setCenterNotification({ show: false, message: '', type: 'info' })
      socket.emit('join-room', { roomCode })
    })
    
    socket.on('disconnect', () => {
      if (process.env.NODE_ENV === 'development') {
        console.log('❌ Socket disconnected')
      }
      setSocketConnected(false)
    })
    
    socket.on('reconnecting', () => {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 Socket reconnecting...')
      }
      setReconnecting(true)
    })
    
    socket.on('reconnect', () => {
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Socket reconnected')
      }
      setSocketConnected(true)
      setReconnecting(false)
      socket.emit('join-room', { roomCode })
    })
    
    socket.on('room-joined', (data) => {
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Joined room:', data)
      }
      updateRoom(() => data.room)
      
      // Clear any existing simulation when backend connected
      if (gameIntervalRef.current) {
        clearInterval(gameIntervalRef.current)
        gameIntervalRef.current = null
        console.log('🛑 Cleared simulation - backend room joined')
      }
    })
    
    // Listen for ready status changes
    socket.on('player-ready-changed', (data) => {
      console.log('🔔 Player ready status changed:', data)
      soundManager.playClick()
      
      // Update room state with new ready status
      setRoom(prev => {
        if (!prev) return prev
        return {
          ...prev,
          players: prev.players.map(p => 
            // Match by position since backend sends it, more reliable than ID comparison
            p.position === data.position
              ? { ...p, isReady: data.isReady }
              : p
          )
        }
      })
      
      // Show notification
      setCenterNotification({
        show: true,
        message: `${data.username} is ${data.isReady ? 'ready' : 'not ready'}!`,
        type: data.isReady ? 'success' : 'info'
      })
      
      setTimeout(() => {
        setCenterNotification({ show: false, message: '', type: 'info' })
      }, 2000)
    })
    
    // Listen for players joining the active game
    socket.on('players-activated', (data) => {
      console.log('🪑 Players activated:', data)
      soundManager.playSuccess()
      
      // Show notification
      setCenterNotification({
        show: true,
        message: data.message,
        type: 'success'
      })
      
      setTimeout(() => {
        setCenterNotification({ show: false, message: '', type: 'info' })
      }, 3000)
    })
    
    // Listen for sitting out notification (joined mid-game)
    socket.on('sitting-out-notification', (data) => {
      console.log('🪑 Sitting out:', data)
      soundManager.playClick()
      
      // Show notification
      setCenterNotification({
        show: true,
        message: data.message,
        type: 'info'
      })
      
      setTimeout(() => {
        setCenterNotification({ show: false, message: '', type: 'info' })
      }, 5000) // Longer duration for important info
    })
    
    // Listen for player-joined event to update room state
    socket.on('player-joined', async (data) => {
      console.log('👥 Player joined room:', data)
      soundManager.playSuccess()
      
      // Refetch room data to get updated player list
      try {
        const token = localStorage.getItem('token')
        const response = await fetch(`${API_URL}/api/games/rooms/${roomCode}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (response.ok) {
          const roomData = await response.json()
          console.log('🔄 Updated room data after player join:', roomData.room.players.length, 'players')
          updateRoom(() => roomData.room)
        }
      } catch (err) {
        console.error('Failed to fetch updated room data:', err)
      }
      
      // Show notification
      setCenterNotification({
        show: true,
        message: data.message || `${data.player?.username || 'A player'} joined!`,
        type: 'success'
      })
      
      setTimeout(() => {
        setCenterNotification({ show: false, message: '', type: 'info' })
      }, 3000)
    })
    
    // Listen for chat messages from other players
    socket.on('room-message', (data: { username: string, message: string, timestamp: Date }) => {
      console.log('💬 Chat message received:', data)
      
      // Find the player in the room to get their ID
      const player = room?.players.find(p => p.username === data.username)
      
      const formattedMessage = {
        playerId: player?._id || 'unknown',
        playerName: data.username,
        message: data.message,
        timestamp: typeof data.timestamp === 'string' ? new Date(data.timestamp).getTime() : Date.now()
      }
      
      // Add message to chat history
      setChatMessages(prev => [...prev, formattedMessage])
      
      // Show chat bubble for other players' messages (not own messages)
      if (data.username !== profile?.username) {
        const bubble = {
          ...formattedMessage,
          id: Date.now()
        }
        
        setActiveBubbles(prev => [...prev, bubble])
        
        // Auto-remove bubble after 5 seconds
        setTimeout(() => {
          setActiveBubbles(prev => prev.filter(b => b.id !== bubble.id))
        }, 5000)
      }
    })
    
    // Auto-start game when all players are ready
    socket.on('all-players-ready', (data) => {
      console.log('🎮 All players ready! Auto-starting game...', data)
      setCenterNotification({
        show: true,
        message: '✓ All ready! Starting...',
        type: 'info'
      })
      
      // Auto-start the game after a brief delay
      setTimeout(() => {
        console.log('🚀 Emitting start-game event')
        socket.emit('start-game', { roomCode })
        setCenterNotification({ show: false, message: '', type: 'info' })
      }, 1500)
    })
    
    socket.on('game-state-update', (data) => {
      try {
        console.log('🎮 Game state update FULL DATA:', JSON.stringify(data, null, 2))
      
      // Defensive check for undefined currentPlayer
      if (data.gameState?.currentPlayer === undefined || data.gameState?.currentPlayer === null) {
        console.error('⚠️ WARNING: currentPlayer is undefined! Game state is invalid.');
      }
      
      // TRIGGER PLAYER SPOTLIGHT AND TURN ARROW
      if (data.gameState?.currentPlayer !== undefined && data.players && typeof window !== 'undefined') {
        const activePlayer = data.players.find((p: any) => p.gameIndex === data.gameState.currentPlayer)
        if (activePlayer) {
          // Only update spotlight if player changed to prevent infinite re-renders
          setActivePlayerSpotlight(prev => {
            if (prev.playerId === activePlayer._id && prev.show) {
              return prev; // Same player, no update needed
            }
            
            const playerEl = document.querySelector(`[data-player-id="${activePlayer._id}"]`)
            const playerRect = playerEl?.getBoundingClientRect()
            
            if (playerRect) {
              return {
                show: true,
                playerX: playerRect.left + playerRect.width / 2,
                playerY: playerRect.top + playerRect.height / 2,
                playerId: activePlayer._id
              };
            }
            return prev;
          });
        }
      } else {
        // No active player, hide spotlight
        setActivePlayerSpotlight(prev => prev.show ? { ...prev, show: false } : prev)
      }
      
      // VISUAL RESET: When game status changes to 'waiting', clear all effects
      if (data.gameState?.status === 'waiting' && roomRef.current?.gameState?.status === 'playing') {
        console.log('🔄 Game ended - clearing all visual effects')
        
        // Clear all visual effects immediately when round ends
        setActivePlayerSpotlight({ show: false, playerX: 0, playerY: 0, playerId: null })
        setTurnTimer({ show: false, timeLeft: 20, playerId: null })
        setPlayerActions({})
        setActiveBubbles([])
        setFeltRipple({ show: false, centerX: 0, centerY: 0, color: 'rgba(251,191,36,0.3)' })
        setCardBurn({ show: false, dealerX: 0, dealerY: 0 })
        
        console.log('✅ Visual effects cleared after round end')
      }
      
      // TRIGGER FELT RIPPLE when pot changes
      if (data.gameState?.pot !== undefined && typeof window !== 'undefined') {
        const potChanged = roomRef.current?.gameState?.pot !== data.gameState.pot
        if (potChanged && data.gameState.pot > 0) {
          const potCenter = { x: window.innerWidth / 2, y: window.innerHeight / 2 }
          setFeltRipple({
            show: true,
            centerX: potCenter.x,
            centerY: potCenter.y,
            color: 'rgba(251,191,36,0.3)'
          })
          setTimeout(() => setFeltRipple(prev => ({ ...prev, show: false })), 1500)
        }
      }
      
      // TRIGGER CARD BURN before flop/turn/river
      if (data.gameState?.round && typeof window !== 'undefined') {
        const prevRound = roomRef.current?.gameState?.round
        const newRound = data.gameState.round
        
        // Burn card before flop, turn, or river
        if ((prevRound === 'preflop' && newRound === 'flop') ||
            (prevRound === 'flop' && newRound === 'turn') ||
            (prevRound === 'turn' && newRound === 'river')) {
          // Calculate dealer position (center of table for card burn)
          const dealerCenter = { x: window.innerWidth / 2, y: window.innerHeight / 2 - 100 }
          setCardBurn({
            show: true,
            dealerX: dealerCenter.x,
            dealerY: dealerCenter.y
          })
          setTimeout(() => setCardBurn(prev => ({ ...prev, show: false })), 800)
        }
      }
      
      updateRoom(prev => {
        if (!prev) return null;
        
        // Check if game state actually changed to prevent unnecessary re-renders
        const gameStateChanged = JSON.stringify(prev.gameState) !== JSON.stringify(data.gameState);
        const potChanged = prev.currentPot !== data.gameState?.pot;
        const playerCountChanged = prev.players?.length !== data.players?.length;
        
        // If nothing changed, don't trigger re-render
        if (!gameStateChanged && !potChanged && !playerCountChanged) {
          // Still check if individual player data changed
          const playersChanged = data.players?.some((newPlayer: any) => {
            const oldPlayer = prev.players.find(p => p._id === newPlayer._id);
            if (!oldPlayer) return true; // New player
            // Check if meaningful data changed
            return oldPlayer.chips !== newPlayer.chips || 
                   oldPlayer.bet !== newPlayer.bet ||
                   oldPlayer.folded !== newPlayer.folded ||
                   (newPlayer.cards && newPlayer.cards.length > 0 && 
                    JSON.stringify(oldPlayer.cards) !== JSON.stringify(newPlayer.cards));
          });
          
          if (!playersChanged) {
            return prev; // No changes, keep existing state
          }
        }
        
        // Create a map of OLD players for preserving state (keyed by _id for reliability)
        const oldPlayersMap = new Map();
        prev.players.forEach(p => {
          if (p._id) oldPlayersMap.set(p._id, p);
        });
        
        // Map over NEW players from backend to ensure list is in sync (adds/removes players correctly)
        const updatedPlayers = (data.players || []).map((newPlayer: any) => {
          const oldPlayer = oldPlayersMap.get(newPlayer._id);
          
          if (oldPlayer) {
            // Merge old and new data
            return {
              ...newPlayer,
              // Preserve cards if new update has no cards but old one did
              // This prevents flickering if backend sends a partial update or stripped cards momentarily
              // BUT we must allow clearing cards if the game state implies it (e.g. new round)
              cards: (newPlayer.cards && newPlayer.cards.length > 0) 
                ? newPlayer.cards 
                : (oldPlayer.cards || []),
              // Preserve isReady status since game-state-update doesn't include it
              isReady: oldPlayer.isReady ?? false,
              // Ensure folded status is explicitly set from new data
              folded: newPlayer.folded ?? oldPlayer.folded ?? false
            };
          }
          return newPlayer;
        });
        
        return {
          ...prev,
          gameState: data.gameState,
          players: updatedPlayers,
          currentPot: data.gameState.pot,
          status: data.gameState.status || prev.status // Sync room status with gameState status
        };
      });
      
      // If turn changed, we might want to reset timer, but we rely on 'turn-timer-started' event now
      } catch (error) {
        console.error('❌ ERROR in game-state-update handler:', error);
        console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      }
    })
    
    // New Turn Timer Listener
    socket.on('turn-timer-started', (data: { playerId: string, deadline: number, duration: number }) => {
      console.log('⏰ Turn timer started for:', data.playerId);
      setTurnTimer({
        active: true,
        playerId: data.playerId,
        deadline: data.deadline,
        totalDuration: data.duration
      });
    });

    // Clear timer on action
    socket.on('game-action-broadcast', (action) => {
      // If a player acted, clear the timer if it was for them
      if (action.type === 'player-action') {
        setTurnTimer(prev => {
          if (prev.active && (prev.playerId === action.playerId || prev.playerId === `bot_${action.position}`)) {
             return { ...prev, active: false };
          }
          return prev;
        });
      }
      
      console.log('📢 Game action:', action.type, action)
      
      // ========== GAME START COUNTDOWN (10 seconds before dealing cards) ==========
      if (action.type === 'game-start-countdown') {
        console.log(`⏳ COUNTDOWN: ${action.countdown} seconds`)
        
        // VISUAL RESET: When countdown starts (10 or 3 seconds), clear all previous round effects
        if (action.countdown === 10 || action.countdown === 3) {
          console.log(`🔄 VISUAL RESET: Clearing all round effects before ${action.countdown}s countdown`)
          
          // Clear all cards and animations
          setCardsDelivered({})
          setFlyingCards([])
          renderedCommunityCardsRef.current = new Set()
          
          // Clear player actions and notifications
          setPlayerActions({})
          setActiveBubbles([])
          setCenterNotification({ show: false, message: '', type: 'info' })
          
          // Clear dealer animation
          setDealerAnimation({ show: false, message: '' })
          
          // Clear confetti
          setShowConfetti(false)
          
          // Reset turn timer
          setTurnTimer({ show: false, timeLeft: 20, playerId: null })
          
          console.log('✅ Visual reset complete - ready for new round')
        }
        
        setGameCountdown({ 
          show: true, 
          countdown: action.countdown, 
          type: 'starting' 
        })
        
        // When countdown finishes, hide it
        if (action.countdown === 0) {
          setTimeout(() => {
            setGameCountdown({ show: false, countdown: 0, type: 'starting' })
          }, 500)
        }
        return
      }
      
      // ========== BLINDS POSTED ==========
      if (action.type === 'blinds-posted') {
        console.log('💰 Blinds posted')
        return
      }
      
      // ========== DEALER STARTS DEALING CARDS ==========
      if (action.type === 'dealer-dealing-start') {
        console.log('🎴 Dealer starting to deal cards')
        setDealerAnimation({ show: true, message: 'Dealing cards...' })
        setCardsDelivered({}) // Reset card tracking
        renderedCommunityCardsRef.current = new Set() // Reset community cards
        return
      }
      
      // ========== CARD FLYING TO PLAYER ==========
      if (action.type === 'card-dealing-to-player') {
        // Create unique card key using timestamp to prevent conflicts
        const cardKey = `${action.targetPlayer}-${action.cardNumber}-${Date.now()}`
        console.log(`🎴 Card ${action.cardNumber} → ${action.targetPlayer} (pos: ${action.playerPosition})`)
        
        // Track card immediately to prevent duplicate animations
        setCardsDelivered(prev => {
          const currentCount = prev[action.targetPlayer] || 0
          
          // Safety check: Don't deal more than 2 cards per player
          if (currentCount >= 2) {
            console.log(`⚠️ Player ${action.targetPlayer} already has 2 cards, skipping`)
            return prev
          }
          
          // Play card dealing sound
          soundManager.playCardDeal()
          
          // Show flying card animation
          setFlyingCards(prevCards => ({
            ...prevCards,
            [cardKey]: { show: true, targetPosition: action.playerPosition }
          }))
          
          // Hide card after animation completes (800ms)
          setTimeout(() => {
            setFlyingCards(prevCards => {
              const updated = { ...prevCards }
              delete updated[cardKey]
              return updated
            })
          }, 800)
          
          // Return updated count
          return {
            ...prev,
            [action.targetPlayer]: currentCount + 1
          }
        })
        return
      }
      
      // ========== ALL CARDS DEALT ==========
      if (action.type === 'dealer-dealing-complete') {
        console.log('✅ All cards dealt!')
        setTimeout(() => {
          setDealerAnimation({ show: false, message: '' })
        }, 1500)
        return
      }
      
      // Handle player actions (fold, call, raise, check)
      if (action.type === 'player-action') {
        console.log(`🎬 Processing player action: ${action.player} - ${action.action}`)
        
        // TRIGGER CHIP ANIMATIONS for call/raise actions
        if ((action.action === 'call' || action.action === 'raise') && action.amount > 0 && roomRef.current?.players && typeof window !== 'undefined') {
          const player = roomRef.current.players.find(p => p.username === action.player)
          if (player) {
            // Use requestAnimationFrame to ensure DOM is painted
            requestAnimationFrame(() => {
              // Try multiple selectors
              let playerEl = document.querySelector(`[data-player-id="${player._id}"]`)
              
              // Fallback: find by checking all player-position elements
              if (!playerEl) {
                const allPlayers = document.querySelectorAll('.player-position')
                console.log('🔍 Searching through', allPlayers.length, 'player elements')
                
                // Find the element by checking text content for username
                allPlayers.forEach((el) => {
                  if (el.textContent?.includes(player.username)) {
                    playerEl = el as HTMLElement
                    console.log('✅ Found player element by username:', player.username)
                  }
                })
              }
              
              const potEl = document.querySelector('[data-pot-area="true"]')
              
              console.log('💰 Chip animation check:', {
                player: player.username,
                playerId: player._id,
                playerEl: !!playerEl,
                potEl: !!potEl,
                totalPlayerDivs: document.querySelectorAll('.player-position').length,
                hasDataAttr: document.querySelectorAll('[data-player-id]').length
              })
              
              if (!playerEl || !potEl) {
                console.error('❌ Cannot find elements for chip animation')
                return
              }
              
              const playerRect = playerEl.getBoundingClientRect()
              const potRect = potEl.getBoundingClientRect()
              
              console.log('📍 Element positions:', {
                playerRect: { x: playerRect.left, y: playerRect.top },
                potRect: { x: potRect.left, y: potRect.top }
              })
              
              console.log('✅ Triggering chip animation from', player.username, 'amount:', action.amount)
              soundManager.playChipStack()
              
              setChipAnimations(prev => [...prev, {
                id: Date.now() + Math.random(),
                fromX: playerRect.left + playerRect.width / 2,
                fromY: playerRect.top + playerRect.height / 2,
                toX: potRect.left + potRect.width / 2,
                toY: potRect.top + potRect.height / 2,
                amount: action.amount,
                isActive: true
              }])
            })
          }
        }
        
        // TRIGGER ALL-IN EFFECT
        if (action.action === 'raise' && action.currentBet && roomRef.current?.players) {
          const player = roomRef.current.players.find(p => p.username === action.player)
          if (player && player.chips === 0) {
            setAllInEffect({
              show: true,
              playerName: action.player,
              amount: action.currentBet
            })
          }
        }
        
        let actionKey = -1
        const currentRoom = roomRef.current; // Use current room state, not stale closure
        
        // Try to find player by position first (most reliable)
        if (action.position !== undefined) {
          actionKey = action.position
          console.log(`🔍 Using provided position: ${action.position}`)
        }
        
        // Fallback to finding by username if position not provided
        if (actionKey === -1 && currentRoom?.players) {
          const player = currentRoom.players.find(p => p.username === action.player)
          if (player) {
            actionKey = player.position
            console.log(`🔍 Username match attempt: ${action.player} -> position ${actionKey}`)
          }
        }
        
        // Fallback to finding by playerId
        if (actionKey === -1 && action.playerId && currentRoom?.players) {
          const player = currentRoom.players.find(p => p._id === action.playerId)
          if (player) {
            actionKey = player.position
            console.log(`🔍 PlayerId match attempt: ${action.playerId} -> position ${actionKey}`)
          }
        }
        
        console.log(`🎯 Final mapping result: position ${actionKey} for action from ${action.player}`)
        
        if (actionKey !== -1) {
          // Format action display text
          let actionText = action.action
          if (action.amount > 0) {
            if (action.action === 'raise') {
              actionText = `raised to $${action.currentBet}`
            } else if (action.action === 'call') {
              actionText = `called $${action.amount}`
            } else {
              actionText = `${action.action} $${action.amount}`
            }
          }
          
          // Add to action history
          setActionHistoryList(prev => [...prev, {
            id: Date.now() + Math.random(),
            player: action.player,
            action: action.action,
            amount: action.amount,
            timestamp: Date.now()
          }])
          
          console.log(`🔥 SETTING PLAYER ACTION: position ${actionKey} -> "${actionText}"`)
          
          setPlayerActions(prev => {
            const newState = {
              ...prev,
              [actionKey]: {
                action: actionText,
                timestamp: Date.now()
              }
            }
            return newState
          })
          
          // Auto-hide after 1.5 seconds
          setTimeout(() => {
            setPlayerActions(prev => {
              const updated = { ...prev }
              delete updated[actionKey]
              return updated
            })
          }, 1500)
          
          // Play appropriate sound
          if (action.action === 'fold') {
            soundManager.playLose()
          } else if (action.action === 'raise') {
            soundManager.playChip()
          } else if (action.action === 'call') {
            soundManager.playChip()
          } else if (action.action === 'check') {
            soundManager.playClick()
          }
        } else {
          console.warn(`⚠️ Could not find player for action:`, action)
        }
      }
      
      // Handle player elimination
      if (action.type === 'player-eliminated') {
        console.log(`💸 Player eliminated: ${action.player}`)
        setCenterNotification({
          show: true,
          message: `💸 ${action.player} eliminated!\n${action.reason}`,
          type: 'warning'
        })
        
        setTimeout(() => {
          setCenterNotification({ show: false, message: '', type: 'info' })
        }, 3000)
      }
      
      // Handle winner notification with celebration
      if (action.type === 'game-winner' || action.type === 'showdown-complete') {
        // Extract winner info based on event type
        const isSingleWinner = action.type === 'game-winner'
        const winnerName = isSingleWinner ? action.winner : (action.winners?.[0]?.username || action.winners?.[0])
        const winAmount = isSingleWinner ? action.amount : (action.winners?.[0]?.amount || 0)
        const handName = isSingleWinner ? action.handName : (action.winners?.[0]?.handName || '')
        
        console.log(`🏆 Winner: ${winnerName} won $${winAmount}`)
        
        // Validate winner data
        if (!winnerName || winnerName === 'undefined') {
          console.error('⚠️ Invalid winner data received:', action)
          setCenterNotification({
            show: true,
            message: `⚠️ GAME ERROR\nInvalid winner data`,
            type: 'warning'
          })
          return
        }
        
        soundManager.playWin() // Victory sound
        
        // Trigger confetti celebration
        setShowConfetti(true)
        setTimeout(() => setShowConfetti(false), 3000)
        
        // TRIGGER POT COLLECTION CHIP ANIMATION
        if (typeof window !== 'undefined' && roomRef.current?.players && winAmount > 0) {
          const winner = roomRef.current.players.find(p => 
            p.username === winnerName || 
            (action.winners && action.winners.some((w: any) => 
              (typeof w === 'string' ? w : w.username) === p.username
            ))
          )
          if (winner) {
            const potEl = document.querySelector('[data-pot-area="true"]')
            const winnerEl = document.querySelector(`[data-player-id="${winner._id}"]`)
            const potRect = potEl?.getBoundingClientRect()
            const winnerRect = winnerEl?.getBoundingClientRect()
            
            console.log('💰 Pot collection animation check:', {
              winner: winner.username,
              potEl: !!potEl,
              winnerEl: !!winnerEl,
              potRect: potRect ? 'found' : 'missing',
              winnerRect: winnerRect ? 'found' : 'missing'
            })
            
            if (potRect && winnerRect) {
              console.log('✅ Triggering pot collection animation to', winner.username, 'amount:', winAmount)
              // soundManager.playChipCollect() // DISABLED: Play chip collect sound
              setChipAnimations(prev => [...prev, {
                id: Date.now() + Math.random(),
                fromX: potRect.left + potRect.width / 2,
                fromY: potRect.top + potRect.height / 2,
                toX: winnerRect.left + winnerRect.width / 2,
                toY: winnerRect.top + winnerRect.height / 2,
                amount: winAmount,
                isActive: true
              }])
            }
          }
        }
        
        // Add to action history
        setActionHistoryList(prev => [...prev, {
          id: Date.now(),
          player: winnerName,
          action: 'Won',
          amount: winAmount,
          timestamp: Date.now()
        }])
        
        // Hide any existing notifications first
        setGameCountdown({ show: false, countdown: 0, type: 'starting' })
        
        setCenterNotification({
          show: true,
          message: `🎉 CONGRATULATIONS! 🎉\n${winnerName}\nWINS $${winAmount}!${handName ? `\n${handName}` : ''}`,
          type: 'success'
        })
        
        // Hide after 5 seconds
        setTimeout(() => {
          setCenterNotification({ show: false, message: '', type: 'info' })
        }, 5000)
        return
      }
      
      // Handle new game countdown
      if (action.type === 'new-game-countdown') {
        console.log('⏳ New game countdown starting - this is for NEXT game after winner')
        
        // Hide winner notification immediately when starting countdown for NEXT game
        setCenterNotification({ show: false, message: '', type: 'info' })
        
        // Clear rendered community cards for the next game
        renderedCommunityCardsRef.current = new Set()
        // Reset card tracking for the new game
        setCardsDelivered({})
        setFlyingCards({})
        
        console.log('🧹 Cleared rendered community cards and card tracking for new game')
        
        // Use 'next-round' type to distinguish from first start
        setGameCountdown({ show: true, countdown: action.countdown, type: 'next-round' })
        
        // Update countdown every second
        let countdownValue = action.countdown
        const countdownInterval = setInterval(() => {
          countdownValue--
          if (countdownValue <= 0) {
            clearInterval(countdownInterval)
            setGameCountdown({ show: false, countdown: 0, type: 'next-round' })
          } else {
            setGameCountdown({ show: true, countdown: countdownValue, type: 'next-round' })
          }
        }, 1000)
      }
    })
    
    socket.on('theme-changed', (data) => {
      console.log('🎨 Theme changed:', data.theme)
      const themeMap: {[key: string]: TableTheme} = {
        'classic': {
          name: 'classic',
          displayName: 'Classic Green',
          colors: {
            feltGradient: 'radial-gradient(ellipse at center, #1a5f3a 0%, #0d3a23 70%, #082516 100%)',
            chipColor: '#FFD700',
            borderColor: '#F59E0B',
            accentColor: '#10B981'
          },
          isPremium: false
        },
        'royal': {
          name: 'royal',
          displayName: 'Royal Purple',
          colors: {
            feltGradient: 'radial-gradient(ellipse at center, #6b2d8c 0%, #4a1a5f 70%, #2d0f3a 100%)',
            chipColor: '#FFD700',
            borderColor: '#FFD700',
            accentColor: '#9333EA'
          },
          isPremium: true
        },
        'neon': {
          name: 'neon',
          displayName: 'Neon Nights',
          colors: {
            feltGradient: 'radial-gradient(ellipse at center, #1a1a3a 0%, #0f0f2a 70%, #05050f 100%)',
            chipColor: '#00FFFF',
            borderColor: '#00FFFF',
            accentColor: '#FF00FF'
          },
          isPremium: true
        },
        'dark': {
          name: 'dark',
          displayName: 'Dark Mode',
          colors: {
            feltGradient: 'radial-gradient(ellipse at center, #1f2937 0%, #111827 70%, #000000 100%)',
            chipColor: '#FFFFFF',
            borderColor: '#6B7280',
            accentColor: '#4B5563'
          },
          isPremium: false
        },
        'ocean': {
          name: 'ocean',
          displayName: 'Ocean Blue',
          colors: {
            feltGradient: 'radial-gradient(ellipse at center, #1e3a8a 0%, #1e40af 70%, #1e3a8a 100%)',
            chipColor: '#60A5FA',
            borderColor: '#3B82F6',
            accentColor: '#2563EB'
          },
          isPremium: true
        },
        'sunset': {
          name: 'sunset',
          displayName: 'Sunset Orange',
          colors: {
            feltGradient: 'radial-gradient(ellipse at center, #92400e 0%, #7c2d12 70%, #431407 100%)',
            chipColor: '#FB923C',
            borderColor: '#F97316',
            accentColor: '#F57C00'
          },
          isPremium: true
        }
      }
      
      if (themeMap[data.theme]) {
        setCurrentTheme(themeMap[data.theme])
        soundManager.playSuccess()
      }
    })
    
    socket.on('error', (error) => {
      console.error('❌ Socket error:', error)
    })

    socket.on('game-error', (data) => {
      console.error('❌ Game error:', data)
      setCenterNotification({
        show: true,
        message: data.message || 'An error occurred',
        type: 'warning'
      })
      setTimeout(() => {
        setCenterNotification({ show: false, message: '', type: 'info' })
      }, 3000)
    })

    // Idle detection events
    socket.on('idle-warning', (data) => {
      console.log('⚠️ Idle warning:', data)
      setCenterNotification({
        show: true,
        message: data.message,
        type: 'warning'
      })
    })

    socket.on('player-idle-warning', (data) => {
      console.log('⚠️ Player idle:', data)
      // Mark player as idle visually
      setRoom(prev => {
        if (!prev) return prev
        return {
          ...prev,
          players: prev.players.map(p => 
            p._id === data.playerId ? { ...p, isIdle: true } : p
          )
        }
      })
    })

    socket.on('kicked-for-idle', (data) => {
      console.log('❌ Kicked for idle:', data)
      alert(data.message)
      onBack()
    })

    socket.on('player-kicked', (data) => {
      console.log('ℹ️ Player kicked:', data)
      setCenterNotification({
        show: true,
        message: data.message,
        type: 'info'
      })
    })

    // Listen for real-time credit updates
    socket.on('credits-updated', (data: { userId: string, newBalance: number, change?: number }) => {
      console.log('💰 Credits updated:', data)
      
      const oldBalance = playerBalances[data.userId]
      const newBalance = data.newBalance
      const change = data.change || (oldBalance !== undefined ? newBalance - oldBalance : 0)
      
      // Update balance
      setPlayerBalances(prev => ({
        ...prev,
        [data.userId]: newBalance
      }))
      
      // Show animation if there's a change
      if (change !== 0) {
        const animId = `${data.userId}-${Date.now()}`
        setCreditAnimations(prev => [
          ...prev,
          {
            id: animId,
            playerId: data.userId,
            amount: change,
            x: 0,
            y: 0
          }
        ])
        
        // Auto-remove after animation
        setTimeout(() => {
          setCreditAnimations(prev => prev.filter(a => a.id !== animId))
        }, 1500)
      }
    })
    
    // Only set interval if we have an API_URL and not using demo room
    // DISABLE polling during active game to prevent overwriting socket data
    let interval: NodeJS.Timeout | null = null
    if (API_URL && API_URL !== '' && !roomCode.startsWith('DEMO')) {
      // Only poll when game is not active AND socket is not connected
      const checkAndPoll = () => {
        if (socketRef.current?.connected) {
          console.log('🔌 Skipping REST poll - socket connected')
          return
        }

        if (!room?.gameState || room.gameState.status !== 'playing') {
          fetchRoom()
        } else {
          console.log('🎮 Skipping REST poll - game active')
        }
      }
      
      interval = setInterval(checkAndPoll, 3000)
    }
    
    return () => {
      // Remove global error handlers
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      
      // Remove poker table active class to re-enable scrolling
      document.body.classList.remove('poker-table-active');
      
      if (interval) clearInterval(interval)
      if (socketRef.current) {
        // Remove all event listeners before disconnecting
        socketRef.current.off('connect')
        socketRef.current.off('room-joined')
        socketRef.current.off('game-state-update')
        socketRef.current.off('game-action-broadcast')
        socketRef.current.off('player-joined')
        socketRef.current.off('room-message')
        socketRef.current.off('player-left')
        socketRef.current.off('player-disconnected')
        socketRef.current.off('player-turn')
        socketRef.current.off('player-action')
        socketRef.current.off('round-complete')
        socketRef.current.off('game-winner')
        socketRef.current.off('player-eliminated')
        socketRef.current.off('low-credit-warning')
        socketRef.current.off('credit-timer-tick')
        socketRef.current.off('player-waiting-for-credits')
        socketRef.current.off('disconnect')
        socketRef.current.disconnect()
      }
      // Clean up countdown timer
      if (gameCountdownRef.current) {
        clearInterval(gameCountdownRef.current)
      }
    }
  }, [roomCode])

  // Auto-detect current user and set player perspective
  useEffect(() => {
    if (room && playerPerspective === null) {
      // Get current user from localStorage
      const token = localStorage.getItem('token')
      if (token) {
        // Decode JWT to get user ID (simple parsing, not validation)
        try {
          const payload = JSON.parse(atob(token.split('.')[1]))
          const userId = payload.userId || payload.id
          
          // Find player by ID to get their position
          console.log('🔍 Looking for userId:', userId, 'in players:', room.players.map(p => ({ id: p._id, username: p.username, pos: p.position })))
          const player = room.players.find(p => p._id === userId || p._id?.toString() === userId?.toString())
          if (player) {
            console.log('✅ Found player! Setting perspective to position', player.position, 'for', player.username)
            setPlayerPerspective(player.position)
          } else {
            console.log('❌ Player not found! userId:', userId, '- Cannot set perspective without matching player')
          }
        } catch (e) {
          console.error('Failed to decode token:', e)
        }
      }
    }
  }, [room, playerPerspective])

  // Comprehensive game state management for real player rooms (including bot test rooms)
  useEffect(() => {
    if (room && !isAdminView && !roomCode.startsWith('DEMO')) {
      const playerCount = room.players?.length || 0
      const hasEnoughPlayers = playerCount >= 2
      const gameNotStarted = room.status === 'waiting' || !room.gameState || !room.gameState.communityCards?.length
      const gameNotActive = !isPlaying && !gameActiveRef.current && !localStorage.getItem(`game_active_${roomCode}`)
      const gameIsActive = isPlaying || gameActiveRef.current || localStorage.getItem(`game_active_${roomCode}`) === 'true'

      // Clear any existing timers
      if (gameCountdownRef.current) {
        clearInterval(gameCountdownRef.current)
        gameCountdownRef.current = null
      }
      if (playerWaitTimeRef.current) {
        clearTimeout(playerWaitTimeRef.current)
        playerWaitTimeRef.current = null
      }

      // Case 1: Game is active but not enough players - stop the game
      // Only stop if we are NOT in a countdown for the next round (which implies a game is pending)
      if (gameIsActive && playerCount < 2 && !gameCountdown.show) {
        console.log('⏹️ Stopping game - not enough players')
        setIsPlaying(false)
        gameActiveRef.current = false
        localStorage.removeItem(`game_active_${roomCode}`)
        if (gameIntervalRef.current) {
          clearInterval(gameIntervalRef.current)
          gameIntervalRef.current = null
        }
        
        // Show stopping notification
        setCenterNotification({
          show: true,
          message: playerCount === 0 ? 'All players left the room' : 'Game stopped - Not enough players',
          type: 'warning'
        })
        
        // Hide notification after 3 seconds
        setTimeout(() => {
          setCenterNotification({ show: false, message: '', type: 'info' })
        }, 3000)
      }
      
      // Case 2: Enough players but game not started - backend will handle countdown
      else if (hasEnoughPlayers && gameNotStarted && gameNotActive) {
        console.log(`⏳ ${playerCount} players in room - backend will start countdown`)
        
        // Just show notification - backend handles the actual countdown
        setCenterNotification({
          show: true,
          message: `${playerCount} players ready - Game starting soon...`,
          type: 'info'
        })
        
        // Hide notification after 3 seconds
        setTimeout(() => {
          setCenterNotification({ show: false, message: '', type: 'info' })
        }, 3000)
      }
      
      // Case 3: Not enough players and game not started - show waiting message
      else if (!hasEnoughPlayers && gameNotStarted) {
        setCenterNotification({
          show: true,
          message: playerCount === 0 ? 'Waiting for players...' : `Need ${2 - playerCount} more player${2 - playerCount > 1 ? 's' : ''} to start`,
          type: 'info'
        })
        
        // Hide notification after 2 seconds
        setTimeout(() => {
          setCenterNotification({ show: false, message: '', type: 'info' })
        }, 2000)
      }
    }
  }, [room?.players?.length, room?.status, isAdminView, roomCode, isPlaying])

  // Monitor player credits and trigger countdown if too low
  const checkPlayerCredits = (minimumRequired: number = 10) => {
    if (!room) return

    room.players.forEach((player) => {
      // Check if player chips are below minimum and not already in waiting list
      if (player.chips < minimumRequired && !playersWaitingForCredits.has(player._id)) {
        console.log(`⚠️ Player ${player.username} has insufficient chips: ${player.chips} < ${minimumRequired}`)
        
        // Add to waiting list
        setPlayersWaitingForCredits(prev => new Set(prev).add(player._id))
        
        // Start countdown for this player
        startCreditCountdown(player._id, player.username)
      }
      // Check if player received credits and remove from waiting list
      else if (player.chips >= minimumRequired && playersWaitingForCredits.has(player._id)) {
        console.log(`✅ Player ${player.username} received credits: ${player.chips}`)
        cancelCreditCountdown(player._id)
      }
    })
  }

  // Start 120-second countdown for player
  const startCreditCountdown = (playerId: string, playerName: string) => {
    // Clear any existing countdown
    if (creditCountdownRef.current) {
      clearInterval(creditCountdownRef.current)
    }

    // Show warning notification
    setLowCreditWarning({
      show: true,
      playerId,
      playerName,
      countdown: 120
    })

    // Start countdown
    creditCountdownRef.current = setInterval(() => {
      setLowCreditWarning(prev => {
        const newCountdown = prev.countdown - 1
        
        if (newCountdown <= 0) {
          // Time's up - kick player
          kickPlayerFromRoom(playerId, playerName)
          return { show: false, playerId: '', playerName: '', countdown: 120 }
        }
        
        return { ...prev, countdown: newCountdown }
      })
    }, 1000)
  }

  // Cancel countdown when credits received
  const cancelCreditCountdown = (playerId: string) => {
    setPlayersWaitingForCredits(prev => {
      const newSet = new Set(prev)
      newSet.delete(playerId)
      return newSet
    })

    // Clear countdown if it's for this player
    if (lowCreditWarning.playerId === playerId) {
      if (creditCountdownRef.current) {
        clearInterval(creditCountdownRef.current)
        creditCountdownRef.current = null
      }
      setLowCreditWarning({ show: false, playerId: '', playerName: '', countdown: 120 })
    }
  }

  // Kick player from room
  const kickPlayerFromRoom = async (playerId: string, playerName: string) => {
    console.log(`🚪 Kicking player ${playerName} for insufficient credits`)
    
    if (creditCountdownRef.current) {
      clearInterval(creditCountdownRef.current)
      creditCountdownRef.current = null
    }

    try {
      const token = localStorage.getItem('token')
      await fetch(`${API_URL}/api/games/leave/${roomCode}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      // Show notification
      setGameActions(prev => [...prev, `${playerName} was removed (insufficient credits)`])
      
      // If it's the current user, go back to dashboard
      const currentToken = localStorage.getItem('token')
      if (currentToken) {
        const payload = JSON.parse(atob(currentToken.split('.')[1]))
        const userId = payload.userId || payload.id
        if (userId === playerId) {
          setTimeout(() => {
            onBack()
          }, 2000)
        }
      }
    } catch (error) {
      console.error('Failed to kick player:', error)
    }

    setPlayersWaitingForCredits(prev => {
      const newSet = new Set(prev)
      newSet.delete(playerId)
      return newSet
    })
  }

  // Clean up all timers on unmount
  useEffect(() => {
    return () => {
      if (creditCountdownRef.current) {
        clearInterval(creditCountdownRef.current)
      }
      if (gameCountdownRef.current) {
        clearInterval(gameCountdownRef.current)
      }
      if (playerWaitTimeRef.current) {
        clearTimeout(playerWaitTimeRef.current)
      }

    }
  }, [])

  // Monitor credits during gameplay - Check ALWAYS when room updates
  useEffect(() => {
    if (room) {
      checkPlayerCredits(10) // Minimum 10 chips required
    }
  }, [room]) // Removed isPlaying dependency to ensure checks happen even between rounds

  // Initialize game with cards
  const initializeGame = () => {
    if (!room) {
      console.error('❌ Cannot initialize game - no room data!')
      return
    }

    console.log('🎮 Initializing poker game with', room.players.length, 'players')
    console.log('👥 Player names:', room.players.map(p => p.username).join(', '))
    soundManager.playCardDeal() // Card dealing sound

    const suits = ['hearts', 'diamonds', 'clubs', 'spades']
    const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A']
    const deck: Card[] = []
    
    suits.forEach(suit => {
      ranks.forEach(rank => {
        deck.push({ suit, rank })
      })
    })

    // Shuffle deck
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]]
    }

    // Deal cards to players
    const updatedPlayers = room.players.map((player, index) => ({
      ...player,
      cards: [deck[index * 2], deck[index * 2 + 1]],
      currentBet: index === 1 ? 10 : index === 2 ? 20 : 0, // Blinds
      folded: false,
      status: 'active'
    }))

    const gameState: GameState = {
      round: roomCode.startsWith('DEMO') ? 'flop' : 'preflop', // Demo starts at flop for immediate action, real games start at preflop
      communityCards: roomCode.startsWith('DEMO') ? [deck[18], deck[19], deck[20]] : [], // Demo shows flop immediately, real games start empty
      currentBet: 20,
      currentPlayer: 3,
      pot: 30,
      dealerPosition: 0,
      smallBlind: 10,
      bigBlind: 20
    }

    console.log('🃏 Dealt community cards:', gameState.communityCards)
    console.log('👥 Players with cards:', updatedPlayers.map(p => ({ 
      name: p.username, 
      cards: p.cards, 
      hasCards: !!p.cards && p.cards.length === 2 
    })))

    // Mark game as active to prevent fetchRoom from resetting state
    gameActiveRef.current = true
    localStorage.setItem(`game_active_${roomCode}`, 'true')

    console.log('🔧 About to call setRoom with new game state...')
    setRoom({
      ...room,
      players: updatedPlayers,
      gameState,
      status: 'playing',
      currentPot: 30
    })

    const initialActions = roomCode.startsWith('DEMO') 
      ? ['Game started!', 'Bot1 posts small blind (10)', 'Bot2 posts big blind (20)', 'Dealing flop...']
      : ['Game started!', `${updatedPlayers[1]?.username} posts small blind (10)`, `${updatedPlayers[2]?.username} posts big blind (20)`, 'Cards dealt - Pre-flop betting begins']
    
    setGameActions(initialActions)
    
    console.log('✅ Game state updated. Players:', updatedPlayers.length, 'GameState round:', gameState.round)
    console.log('🎯 Dealer Position:', gameState.dealerPosition, 'SB:', (gameState.dealerPosition + 1) % updatedPlayers.length, 'BB:', (gameState.dealerPosition + 2) % updatedPlayers.length)
    console.log('✅ Game is now active, fetchRoom should be blocked')
    console.log('✅ setRoom called - React will re-render with new state')
  }

  // Start/stop game simulation
  const toggleGamePlay = () => {
    soundManager.playClick() // Click sound
    console.log('🔴 ========== START BUTTON CLICKED ==========')
    console.log('🎮 toggleGamePlay called. Current isPlaying:', isPlaying, 'Has gameState:', !!room?.gameState)
    console.log('📊 Room state:', room ? { 
      players: room.players.length, 
      playerNames: room.players.map(p => p.username),
      status: room.status,
      hasGameState: !!room.gameState 
    } : 'NO ROOM')
    console.log('🔴 =========================================')
    
    if (isPlaying) {
      if (gameIntervalRef.current) {
        clearInterval(gameIntervalRef.current)
        gameIntervalRef.current = null
      }
      setIsPlaying(false)
      console.log('⏸️ Game paused')
    } else {
      // Check if we need to initialize the game
      const needsInitialization = !room?.gameState || 
                                   !room.gameState.communityCards || 
                                   room.gameState.communityCards.length === 0 ||
                                   !room.players[0]?.cards ||
                                   room.players[0].cards.length === 0
      
      if (needsInitialization) {
        console.log('🆕 Game needs initialization - STARTING COUNTDOWN')
        
        // Check if we have enough players (2+)
        const playerCount = room?.players?.length || 0
        if (playerCount < 2) {
          setCenterNotification({
            show: true,
            message: 'Need at least 2 players to start the game',
            type: 'warning'
          })
          setTimeout(() => {
            setCenterNotification({ show: false, message: '', type: 'info' })
          }, 3000)
          return
        }
        
        // Backend will automatically start countdown when enough players join
        if (socketRef.current?.connected) {
          console.log('🌐 Backend connected - backend will handle countdown automatically')
        } else {
          console.log('⚠️ No backend connection - cannot start game')
        }
      } else {
        console.log('▶️ Resuming existing game')
        setIsPlaying(true)
        
        // Only run simulation if NOT connected to real backend
        if (!socketRef.current?.connected) {
          console.log('🤖 Starting simulation mode (no backend connection)')
          gameIntervalRef.current = setInterval(() => {
            simulateNextAction()
          }, 2000)
        } else {
          console.log('🌐 Backend connected - simulation disabled')
          // Ensure simulation is cleared if connected to backend
          if (gameIntervalRef.current) {
            clearInterval(gameIntervalRef.current)
            gameIntervalRef.current = null
            console.log('🛑 Cleared any existing simulation')
          }
        }
      }
    }
  }

  // Simulate next bot action
  const simulateNextAction = () => {
    // Don't simulate if connected to real backend
    if (socketRef.current?.connected) {
      console.log('🛑 Simulation disabled - backend connected')
      return
    }
    
    setRoom(currentRoom => {
      if (!currentRoom || !currentRoom.gameState) return currentRoom

      // Check if current player is waiting for credits - skip their turn
      const currentPlayerIndex = currentRoom.gameState.currentPlayer
      const currentPlayer = currentRoom.players[currentPlayerIndex]
      
      // Always wait for real players - no automatic actions
      if (currentPlayer) {
        console.log(`⏸️ Waiting for player ${currentPlayer.username}`)
        return currentRoom
      }
      
      if (currentPlayer && playersWaitingForCredits.has(currentPlayer._id)) {
        console.log(`⏭️ Skipping ${currentPlayer.username} - waiting for credits`)
        
        // Show skip action
        setGameActions(prev => [...prev.slice(-5), `${currentPlayer.username} was skipped (insufficient credits)`])
        
        // Add skip notification popup
        const skipActionKey = currentPlayer.position;
        setPlayerActions(prev => ({
          ...prev,
          [skipActionKey]: {
            action: 'skipped',
            timestamp: Date.now()
          }
        }))
        
        // Remove popup after 1.5 seconds
        setTimeout(() => {
          setPlayerActions(prev => {
            const newActions = { ...prev }
            delete newActions[skipActionKey]
            return newActions
          })
        }, 1500)
        
        // Move to next player
        const nextPlayerIndex = (currentPlayerIndex + 1) % currentRoom.players.length
        return {
          ...currentRoom,
          gameState: {
            ...currentRoom.gameState,
            currentPlayer: nextPlayerIndex
          }
        }
      }

      const result = simulatePokerGame(
        currentRoom.players as AIPlayer[],
        currentRoom.gameState as AIGameState
      )

      setGameActions(prev => [...prev.slice(-5), ...result.actions])

      // Track player actions for popup notifications
      result.actions.forEach(action => {
        console.log('🔔 Processing action:', action)
        
        // Parse action to extract player name and action type
        // Format: "PokerBot1 called 20" or "ChipMaster folded" or "CardShark raised to 40"
        // Match any player name followed by an action
        const match = action.match(/^([^\s]+)\s+(raised|called|folded|checked|went all-in|bets|calls|folds|checks|raises)/i)
        if (match) {
          const playerName = match[1]
          const actionType = match[2].toLowerCase()
          
          // Play appropriate sound for action
          if (actionType.includes('fold')) {
            soundManager.playLose()
          } else if (actionType.includes('raise') || actionType.includes('all-in')) {
            soundManager.playChip()
          } else if (actionType.includes('call') || actionType.includes('bet')) {
            soundManager.playChip()
          } else if (actionType.includes('check')) {
            soundManager.playClick()
          }
          
          console.log('✅ Matched action:', playerName, actionType)
          
          // Find player index by name
          const player = currentRoom.players.find(p => p.username === playerName)
          if (player) {
            const actionKey = player.position
            const actionTimestamp = Date.now()
            console.log('📍 Setting simulation action for player position:', actionKey, actionType)
            
            // Only show simulation actions if not connected to real backend
            if (!socketRef.current?.connected) {
              setPlayerActions(prev => ({
                ...prev,
                [actionKey]: {
                  action: actionType,
                  timestamp: actionTimestamp
                }
              }))
            }
            
            // Auto-remove after 1.5 seconds (increased from 1 second for better visibility)
            setTimeout(() => {
              setPlayerActions(prev => {
                const newActions = { ...prev }
                // Only remove if this is still the same action (by timestamp)
                if (newActions[actionKey]?.timestamp === actionTimestamp) {
                  delete newActions[actionKey]
                }
                return newActions
              })
            }, 1500)
          } else {
            console.log('⚠️ Player not found:', playerName)
          }
        } else {
          console.log('❌ No match for action:', action)
        }
      })

      return {
        ...currentRoom,
        players: result.players as Player[],
        gameState: result.gameState as GameState,
        currentPot: result.gameState.pot
      }
    })
  }

  // Helper function to check if it's the current player's turn
  const isMyTurn = () => {
    if (!room || !room.gameState || playerPerspective === null) return false
    const currentPlayer = room.players.find(p => p.position === playerPerspective)
    if (!currentPlayer) return false
    const myGameIndex = (currentPlayer as any).gameIndex
    return myGameIndex !== undefined && room.gameState.currentPlayer === myGameIndex
  }

  // Toggle ready status
  const toggleReady = () => {
    if (!socketRef.current || !roomCode) return
    
    console.log('🎮 Toggling ready status for room:', roomCode)
    soundManager.playClick()
    
    socketRef.current.emit('toggle-ready', { roomCode })
  }

  // Swipe Gesture Handlers for Poker Actions
  const gameAreaSwipeHandlers = useSwipeGesture({
    enabled: gesturesEnabled && room?.status === 'playing',
    threshold: 60,
    velocityThreshold: 0.4,
    onSwipeUp: () => {
      if (!isMyTurn()) return
      if (actionSoundsEnabled) soundManager.playLose()
      handleFold()
    },
    onSwipeRight: () => {
      if (!isMyTurn()) return
      if (actionSoundsEnabled) soundManager.playClick()
      // Try check first, then call
      const currentBet = room?.gameState?.currentBet || 0
      const myBet = room?.players.find(p => p.position === playerPerspective)?.currentBet || 0
      if (currentBet === 0 || myBet === currentBet) {
        handleCheck()
      } else {
        handleCall()
      }
    },
    onSwipeLeft: () => {
      if (!isMyTurn()) return
      if (actionSoundsEnabled) soundManager.playClick()
      handleRaise()
    }
  })


  // Player action handlers - for real players to make decisions
  const handlePlayerAction = (action: string, amount?: number) => {
    if (!room || !room.gameState || playerPerspective === null) {
      console.log('❌ Cannot perform action - invalid state')
      return
    }

    const currentPlayer = room.players.find(p => p.position === playerPerspective)
    if (!currentPlayer) {
      console.log('❌ Current player not found')
      return
    }

    // Check if it's actually this player's turn using gameIndex
    const myGameIndex = (currentPlayer as any).gameIndex
    if (myGameIndex === undefined || room.gameState.currentPlayer !== myGameIndex) {
      console.log('❌ Not your turn! Current:', room.gameState.currentPlayer, 'Your gameIndex:', myGameIndex)
      return
    }

    console.log(`🎮 Player action: ${action}`, amount)
    soundManager.playClick()

    // Send action through socket if connected
    if (socketRef.current) {
      const actionData = {
        roomCode: roomRef.current?.roomCode || roomCode,
        action,
        amount: amount || 0
      }
      console.log(`📤 Sending game-action to backend:`, actionData)
      socketRef.current.emit('game-action', actionData)
      console.log(`📤 game-action sent for ${action}`)
    } else {
      console.log('❌ No socket connection - cannot send action')
    }
  }

  const handleFold = () => {
    soundManager.playLose()
    handlePlayerAction('fold')
  }
  const handleCheck = () => {
    soundManager.playCheck()
    handlePlayerAction('check')
  }
  const handleCall = () => {
    soundManager.playChip()
    handlePlayerAction('call')
  }
  const handleRaise = () => {
    if (!room || !room.gameState || playerPerspective === null) return
    
    // If slider is already open, treat this as confirm (user double-clicked Raise)
    if (showRaiseSlider) {
      confirmRaise()
      return
    }
    
    const currentPlayer = room.players.find(p => p.position === playerPerspective)
    if (!currentPlayer) return

    const currentBet = room.gameState?.currentBet || 0
    const minRaiseIncrement = Math.max(20, currentBet * 0.5) // At least $20 or 50% of current bet
    const minRaise = Math.max(currentBet + minRaiseIncrement, 20)
    const maxRaise = currentPlayer.chips
    
    // Ensure min is never greater than max
    const actualMinRaise = Math.min(minRaise, maxRaise)
    const actualMaxRaise = Math.max(actualMinRaise, maxRaise)
    
    setRaiseAmount(actualMinRaise)
    soundManager.playModalOpen()
    setShowRaiseSlider(true)
  }
  const confirmRaise = () => {
    soundManager.playRaise()
    handlePlayerAction('raise', raiseAmount)
    setShowRaiseSlider(false)
  }
  const cancelRaise = () => {
    soundManager.playMenuClose()
    setShowRaiseSlider(false)
  }
  const handleAllIn = () => {
    soundManager.playAllIn()
    handlePlayerAction('all-in')
  }

  // Handle back button - show confirmation if game is active
  const handleBack = () => {
    soundManager.playClick() // Click sound
    const gameIsActive = isPlaying || gameActiveRef.current || localStorage.getItem(`game_active_${roomCode}`) === 'true'
    
    // Show confirmation dialog for normal players (not admin) and not demo rooms
    // Always show confirmation for normal players, regardless of game state
    if (!isAdminView && !roomCode.startsWith('DEMO')) {
      setShowLeaveConfirmation(true)
    } else {
      // Direct leave for admin/demo rooms only
      performLeave()
    }
  }

  // Actually perform the leave action
  const performLeave = async () => {
    setShowLeaveConfirmation(false)
    
    try {
      // Call leave endpoint
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/api/games/leave/${roomCode}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()
      
      if (response.ok && data.penalty) {
        console.log(`🚫 Leave penalty: ${data.penalty.cooldownSeconds}s (offense #${data.penalty.offenseCount})`)
      }
    } catch (err) {
      console.error('Failed to call leave endpoint:', err)
    } finally {
      // Always allow navigation back even if API call fails
      gameActiveRef.current = false
      localStorage.removeItem(`game_active_${roomCode}`)
      if (gameIntervalRef.current) {
        clearInterval(gameIntervalRef.current)
      }
      onBack()
    }
  }

  // Handle chat message send
  const handleSendMessage = () => {
    if (!chatMessage.trim() || !room) return
    
    let senderId = 'observer'
    let senderName = 'Observer'
    
    // First, try to get the player from current perspective
    if (playerPerspective !== null) {
      const perspectivePlayer = room.players.find(p => p.position === playerPerspective)
      if (perspectivePlayer) {
        senderId = perspectivePlayer._id
        senderName = perspectivePlayer.username
        console.log('💬 Using perspective player for chat:', { 
          position: playerPerspective,
          senderId, 
          senderName 
        })
      }
    }
    
    // If no perspective player found, try to match by logged-in username
    if (senderId === 'observer' && typeof window !== 'undefined') {
      try {
        const userData = localStorage.getItem('poker_user')
        if (userData) {
          const user = JSON.parse(userData)
          // Try to find player in room by username
          const playerInRoom = room.players.find(p => p.username === user.username)
          if (playerInRoom) {
            senderId = playerInRoom._id
            senderName = playerInRoom.username
            console.log('💬 Found player by username:', { senderId, senderName })
          } else {
            // Use logged-in user ID as fallback
            senderId = user._id || user.id
            senderName = user.username
            console.log('💬 Using logged-in user ID:', { senderId, senderName })
          }
        }
      } catch (e) {
        console.error('Error getting user data for chat:', e)
      }
    }
    
    console.log('💬 Final chat sender:', { senderId, senderName })
    
    const newMessage = {
      playerId: senderId,
      playerName: senderName,
      message: chatMessage.trim(),
      timestamp: Date.now()
    }
    
    // Send message via socket to all players in room
    if (socketRef.current && room) {
      socketRef.current.emit('send-message', {
        roomCode: room.code,
        message: chatMessage.trim()
      })
      console.log('💬 Chat message sent via socket:', chatMessage.trim())
    }
    
    // Add to chat history (permanent)
    setChatMessages(prev => [...prev, newMessage])
    
    // Add to active bubbles (temporary - 5 seconds)
    setActiveBubbles(prev => [...prev, newMessage])
    
    setChatMessage('')
    
    // Auto-remove speech bubble after 5 seconds (but keep in chat history)
    setTimeout(() => {
      setActiveBubbles(prev => prev.filter(msg => msg.timestamp !== newMessage.timestamp))
    }, 5000)
  }

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (gameIntervalRef.current) {
        clearInterval(gameIntervalRef.current)
      }
      if (gameCountdownRef.current) {
        clearInterval(gameCountdownRef.current)
      }
      if (playerWaitTimeRef.current) {
        clearTimeout(playerWaitTimeRef.current)
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
      <div className="bg-white rounded-lg p-2 md:p-3 m-0.5 md:m-1 shadow-2xl min-w-[2.5rem] md:min-w-[3.5rem] text-center border-4 border-gray-200 relative">
        <div className="absolute top-0.5 left-0.5 md:top-1 md:left-1 text-[8px] md:text-xs font-bold">{card.rank}</div>
        <div className="text-lg md:text-2xl font-bold mt-1">{card.rank}</div>
        <div className={`text-2xl md:text-3xl ${suitColors[card.suit]}`}>
          {suitSymbols[card.suit]}
        </div>
        <div className="absolute bottom-0.5 right-0.5 md:bottom-1 md:right-1 text-[8px] md:text-xs font-bold transform rotate-180">{card.rank}</div>
      </div>
    )
  }

  const getPositionStyle = (position: number, totalPlayers: number) => {
    // Safety check for invalid position
    if (position === undefined || position === null || isNaN(position)) {
      console.error('❌ Invalid position:', position);
      return { left: '50%', top: '50%', transform: 'translate(-50%, -50%)' };
    }
    
    // TRULY FROM SCRATCH - SIMPLE DIRECT POSITIONING
    const maxPositions = 9
    
    // Step 1: Calculate where this player sits relative to YOU
    let seatOffset = 0;
    if (playerPerspective !== null) {
      // How many seats clockwise from you? (0 = you, 1 = next player, etc.)
      seatOffset = (position - playerPerspective + maxPositions) % maxPositions;
    } else {
      seatOffset = position % maxPositions;
    }
    
    // Safety check for seatOffset
    if (seatOffset < 0 || seatOffset >= maxPositions) {
      console.error('❌ Invalid seatOffset:', seatOffset, 'from position:', position);
      seatOffset = Math.max(0, Math.min(seatOffset, maxPositions - 1));
    }
    
    // Step 2: Define the 9 visual angles going clockwise starting from YOUR position (bottom center)
    // seatOffset 0 = YOU at bottom center
    // seatOffset 1, 2, 3... = clockwise around table
    const clockwiseAngles = [
      270,  // 0 seats away = YOU (bottom center - closest to keyboard)
      150,  // 1 seat clockwise = top left (SWAPPED with 5)
      180,  // 2 seats clockwise = left top (SWAPPED with 6)
      210,  // 3 seats clockwise = left bottom (SWAPPED with 7)
      240,  // 4 seats clockwise = bottom left (SWAPPED with 8)
      300,  // 5 seats clockwise = bottom right (SWAPPED with 1)
      330,  // 6 seats clockwise = right bottom (SWAPPED with 2)
      0,    // 7 seats clockwise = right middle (SWAPPED with 3)
      30    // 8 seats clockwise = right top (SWAPPED with 4)
    ];
    
    const angle = clockwiseAngles[seatOffset];
    
    // Step 3: Calculate X,Y position using the angle
    
    // Step 3: Calculate X,Y position using the angle
    const isSmall = typeof window !== 'undefined' && window.innerWidth < 768
    const isMedium = typeof window !== 'undefined' && window.innerWidth >= 768 && window.innerWidth < 1024
    const isLandscape = typeof window !== 'undefined' && window.innerHeight < window.innerWidth
    const isMobileLandscape = isLandscape && window.innerWidth < 768
    
    // Table radii
    let radiusX = 450
    let radiusY = 300
    
    if (typeof window !== 'undefined') {
      if (isMobileLandscape) {
        radiusX = 380 / 2 + 60
        radiusY = 240 / 2 + 50
      } else if (isSmall) {
        radiusX = (window.innerWidth * 0.90) / 2 + 50
        radiusY = (window.innerHeight * 0.65) / 2 + 40
      } else if (isMedium) {
        radiusX = 900 / 2 + 80
        radiusY = 600 / 2 + 70
      } else {
        radiusX = window.innerWidth >= 1280 ? 1050 / 2 + 90 : 900 / 2 + 80
        radiusY = window.innerWidth >= 1280 ? 700 / 2 + 80 : 600 / 2 + 70
      }
    }
    
    const angleRad = angle * (Math.PI / 180)
    let x = Math.cos(angleRad) * radiusX
    let y = Math.sin(angleRad) * radiusY
    
    // Step 4: Special adjustment for YOU (seatOffset 0) - move closer to bottom
    if (seatOffset === 0) {
      x = Math.cos(angleRad) * radiusX * 0.50
      y = Math.sin(angleRad) * radiusY * 0.50
      // Mobile landscape
      if (isMobileLandscape) {
        y += 150
        x -= 25
      } 
      // Mobile portrait
      else if (isSmall) {
        y += 240
        x -= 30
      } 
      // Desktop/tablet
      else {
        y += 340
        x -= 30
      }
    }
    
    // Step 5: Minor position adjustments for better spacing
    if (seatOffset === 8) { // right top (SWAPPED with 4)
      x -= isMobileLandscape ? 80 : 110
      y -= isMobileLandscape ? 20 : 30
    }
    if (seatOffset === 1) { // top left (SWAPPED with 5)
      x += isMobileLandscape ? 90 : 120
      y -= isMobileLandscape ? 20 : 30
    }
    if (seatOffset === 5) { // bottom right (SWAPPED with 1)
      x -= isMobileLandscape ? 55 : 75
      y -= isMobileLandscape ? 15 : 20
    }
    if (seatOffset === 6) { // right bottom (SWAPPED with 2)
      y -= isMobileLandscape ? 70 : 100
    }
    if (seatOffset === 7) { // right middle (SWAPPED with 3)
      y += isMobileLandscape ? 10 : 15
    }
    if (seatOffset === 4) { // bottom left (SWAPPED with 8)
      x += isMobileLandscape ? 50 : 75
      y -= isMobileLandscape ? 15 : 20
    }
    if (seatOffset === 3) { // left bottom (SWAPPED with 7)
      y -= isMobileLandscape ? 70 : 100
    }
    if (seatOffset === 2) { // left top (SWAPPED with 6)
      y += isMobileLandscape ? 10 : 15
    }
    
    const cardWidth = isMobileLandscape ? 5 : (isSmall ? 6 : 8)
    const cardHeight = isMobileLandscape ? 2.5 : (isSmall ? 3 : 4)
    
    return {
      left: `calc(50% + ${x}px - ${cardWidth/2}rem)`,
      top: `calc(50% + ${y}px - ${cardHeight/2}rem)`,
      position: 'absolute' as const,
    }
  }

  return (
    <div className="poker-table-wrapper">
      {/* Enhanced Visual Components */}
      <ConfettiCelebration isActive={showConfetti} duration={3000} />
      
      {/* Chip Animations */}
      {chipAnimations.map(anim => (
        <ChipAnimation
          key={anim.id}
          fromX={anim.fromX}
          fromY={anim.fromY}
          toX={anim.toX}
          toY={anim.toY}
          amount={anim.amount}
          isActive={anim.isActive}
          onComplete={() => {
            setChipAnimations(prev => prev.filter(a => a.id !== anim.id))
          }}
        />
      ))}

      {/* MEDIUM PRIORITY ANIMATIONS */}
      <PlayerSpotlight
        isVisible={activePlayerSpotlight.show}
        playerX={activePlayerSpotlight.playerX}
        playerY={activePlayerSpotlight.playerY}
        isActivePlayer={room?.gameState?.currentPlayer !== undefined}
      />

      <TurnArrow
        isVisible={activePlayerSpotlight.show && room?.gameState?.currentPlayer !== undefined}
        targetX={activePlayerSpotlight.playerX}
        targetY={activePlayerSpotlight.playerY}
      />

      <AllInEffect
        isVisible={allInEffect.show}
        playerName={allInEffect.playerName}
        amount={allInEffect.amount}
        onComplete={() => setAllInEffect(prev => ({ ...prev, show: false }))}
      />

      <CardBurnAnimation
        isVisible={cardBurn.show}
        dealerX={cardBurn.dealerX}
        dealerY={cardBurn.dealerY}
        onComplete={() => setCardBurn(prev => ({ ...prev, show: false }))}
      />

      {/* LOW PRIORITY ANIMATIONS */}
      <FeltRipple
        isVisible={feltRipple.show}
        centerX={feltRipple.centerX}
        centerY={feltRipple.centerY}
        color={feltRipple.color}
      />
      
      {/* Hand Strength Meter */}
      {room && playerPerspective !== null && (
        <HandStrengthMeter
          playerCards={room.players.find(p => p.position === playerPerspective)?.cards || []}
          communityCards={room.gameState?.communityCards || []}
          isVisible={showHandStrength && !isAdminView}
        />
      )}
      
      {/* Statistics Dashboard */}
      <StatsDashboard
        isVisible={showStats}
        onClose={() => setShowStats(false)}
        playerName={room?.players.find(p => p.position === playerPerspective)?.username || 'Player'}
      />

      {/* Game History Modal */}
      <GameHistoryModal
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        userId={currentUserId || ''}
      />

      {/* Game Settings Modal */}
      <GameSettings
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        gesturesEnabled={gesturesEnabled}
        setGesturesEnabled={setGesturesEnabled}
        actionSoundsEnabled={actionSoundsEnabled}
        setActionSoundsEnabled={setActionSoundsEnabled}
        backgroundMusicEnabled={backgroundMusicEnabled}
        setBackgroundMusicEnabled={setBackgroundMusicEnabled}
        onOpenThemeSelector={() => {
          setShowThemeSelector(true)
          setShowSettings(false)
        }}
        isAdmin={currentUserRole === 'admin'}
      />

      {/* Notification Center Modal */}
      <NotificationCenter
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />
      
      {/* Swipe Gesture Tutorial Overlay */}
      <AnimatePresence>
        {showGestureTutorial && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-2"
            onClick={dismissGestureTutorial}
          >
            <motion.div
              initial={{ scale: 0.8, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 50 }}
              transition={{ type: "spring", damping: 20 }}
              className="bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 rounded-3xl p-4 mobile-landscape:p-3 max-w-md mobile-landscape:max-w-2xl mx-4 mobile-landscape:mx-2 shadow-2xl border-2 border-purple-500/50 max-h-[90vh] mobile-landscape:max-h-[85vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Title */}
              <div className="text-center mb-4 mobile-landscape:mb-2">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 0.5, repeat: 3 }}
                  className="text-4xl mobile-landscape:text-3xl mb-2 mobile-landscape:mb-1"
                >
                  👆
                </motion.div>
                <h2 className="text-2xl mobile-landscape:text-xl font-bold text-white mb-1 mobile-landscape:mb-0.5">
                  Swipe Gestures!
                </h2>
                <p className="text-purple-200 text-xs mobile-landscape:text-[10px]">
                  Control the game with simple swipes
                </p>
              </div>

              {/* Gesture Instructions */}
              <div className="space-y-2 mobile-landscape:space-y-1.5 mb-4 mobile-landscape:mb-2 mobile-landscape:flex mobile-landscape:gap-2">
                {/* Swipe Up - Fold */}
                <motion.div
                  initial={{ x: -50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="flex items-center gap-3 mobile-landscape:gap-2 bg-white/10 rounded-xl p-3 mobile-landscape:p-2 backdrop-blur-sm mobile-landscape:flex-1"
                >
                  <div className="text-3xl mobile-landscape:text-2xl">⬆️</div>️</div>
                  <div>
                    <div className="text-white font-bold text-sm mobile-landscape:text-xs">Swipe Up</div>
                    <div className="text-purple-200 text-xs mobile-landscape:text-[10px]">Fold hand</div>
                  </div>
                </motion.div>

                {/* Swipe Right - Call/Check */}
                <motion.div
                  initial={{ x: -50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="flex items-center gap-3 mobile-landscape:gap-2 bg-white/10 rounded-xl p-3 mobile-landscape:p-2 backdrop-blur-sm mobile-landscape:flex-1"
                >
                  <div className="text-3xl mobile-landscape:text-2xl">➡️</div>️</div>
                  <div>
                    <div className="text-white font-bold text-sm mobile-landscape:text-xs">Swipe Right</div>
                    <div className="text-purple-200 text-xs mobile-landscape:text-[10px]">Call/Check</div>
                  </div>
                </motion.div>

                {/* Swipe Left - Raise */}
                <motion.div
                  initial={{ x: -50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="flex items-center gap-3 mobile-landscape:gap-2 bg-white/10 rounded-xl p-3 mobile-landscape:p-2 backdrop-blur-sm mobile-landscape:flex-1"
                >
                  <div className="text-3xl mobile-landscape:text-2xl">⬅️</div>️</div>
                  <div>
                    <div className="text-white font-bold text-sm mobile-landscape:text-xs">Swipe Left</div>
                    <div className="text-purple-200 text-xs mobile-landscape:text-[10px]">Raise bet</div>
                  </div>
                </motion.div>
              </div>

              {/* Dismiss Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={dismissGestureTutorial}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-3 mobile-landscape:py-2 rounded-xl shadow-lg hover:shadow-xl transition-all text-sm mobile-landscape:text-xs"
              >
                Got it! Let's Play 🎮
              </motion.button>

              {/* Tip */}
              <p className="text-center text-purple-300 text-[10px] mobile-landscape:text-[9px] mt-2 mobile-landscape:mt-1">
                You can disable gestures in Settings ⚙️
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Table Theme Selector */}
      <TableThemeSelector
        isVisible={showThemeSelector}
        onClose={() => setShowThemeSelector(false)}
        currentTheme={currentTheme.name}
        isAdmin={currentUserRole === 'admin'}
        onThemeChange={(themeId) => {
          // Theme will be updated via socket event
          console.log('Theme change requested:', themeId)
        }}
        roomCode={roomCode}
      />
      
      <div 
        className="min-h-screen relative"
        style={{
          backgroundImage: 'url(/images/green-background.png?v=3)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        {/* Safe Area Border - Shows content boundaries */}
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

        {/* Game Countdown - Center Screen - Responsive */}
        <AnimatePresence>
          {gameCountdown.show && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="fixed inset-0 flex items-center justify-center z-[60] pointer-events-none px-4"
            >
              <div className="bg-gradient-to-br from-green-600/95 to-green-800/95 backdrop-blur-md border-2 sm:border-4 border-yellow-400 rounded-2xl sm:rounded-3xl shadow-2xl p-4 sm:p-6 md:p-8 text-center max-w-[90vw] mobile-landscape:max-w-[300px] mobile-landscape:max-h-[200px]">
                <motion.div
                  animate={{ 
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                  className="text-4xl sm:text-6xl md:text-8xl mb-2 sm:mb-3 md:mb-4 mobile-landscape:text-5xl mobile-landscape:mb-2"
                >
                  {gameCountdown.countdown}
                </motion.div>
                <h2 className="text-white text-sm sm:text-xl md:text-2xl font-bold mb-1 sm:mb-2 mobile-landscape:text-base mobile-landscape:mb-1">
                  {gameCountdown.type === 'starting' ? 'Game Starting In...' : 
                   gameCountdown.type === 'next-round' ? 'Next Round In...' : 
                   'Game Stopping In...'}
                </h2>
                <div className="flex items-center justify-center gap-1 sm:gap-2 text-yellow-300">
                  <span className="text-lg sm:text-2xl md:text-3xl mobile-landscape:text-xl">🎰</span>
                  <span className="text-xs sm:text-base md:text-lg font-semibold mobile-landscape:text-sm">Get Ready!</span>
                  <span className="text-lg sm:text-2xl md:text-3xl mobile-landscape:text-xl">🃏</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>



        {/* Center Notifications - Mobile Friendly - Smaller for Landscape */}
        <AnimatePresence>
          {centerNotification.show && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{ type: "spring", duration: 0.6 }}
              className="fixed inset-0 flex items-center justify-center z-[150] pointer-events-none px-4"
            >
              {centerNotification.type === 'success' && (
                <>
                  {/* Fireworks effect */}
                  {[...Array(8)].map((_, i) => (
                    <motion.div
                      key={`firework-${i}`}
                      className="absolute w-3 h-3 rounded-full"
                      style={{
                        background: ['#FFD700', '#FF6B6B', '#4ECDC4', '#95E1D3'][i % 4],
                        left: '50%',
                        top: '50%',
                      }}
                      animate={{
                        x: [0, Math.cos(i * Math.PI / 4) * 150],
                        y: [0, Math.sin(i * Math.PI / 4) * 150],
                        opacity: [1, 0],
                        scale: [1, 0]
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        repeatDelay: 0.5,
                        delay: i * 0.1
                      }}
                    />
                  ))}
                  {/* Stars effect */}
                  {[...Array(12)].map((_, i) => (
                    <motion.div
                      key={`star-${i}`}
                      className="absolute text-2xl"
                      style={{
                        left: `${20 + Math.random() * 60}%`,
                        top: `${20 + Math.random() * 60}%`,
                      }}
                      animate={{
                        scale: [0, 1.5, 0],
                        rotate: [0, 180, 360],
                        opacity: [0, 1, 0]
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        delay: i * 0.15
                      }}
                    >
                      ⭐
                    </motion.div>
                  ))}
                </>
              )}
              <div className={`backdrop-blur-md border-4 rounded-2xl sm:rounded-3xl shadow-2xl p-6 sm:p-8 text-center mobile-landscape:p-4 mobile-landscape:rounded-xl max-w-[90vw] mobile-landscape:max-w-[350px] relative overflow-hidden ${
                centerNotification.type === 'success' ? 'bg-gradient-to-br from-yellow-500/95 via-orange-500/95 to-red-500/95 border-yellow-300' :
                centerNotification.type === 'warning' ? 'bg-red-600/95 border-red-400' :
                'bg-blue-600/95 border-blue-400'
              }`}>
                {centerNotification.type === 'success' ? (
                  <div className="relative z-10">
                    <motion.div
                      animate={{ 
                        scale: [1, 1.1, 1],
                        rotate: [0, 5, -5, 0]
                      }}
                      transition={{ duration: 0.6, repeat: Infinity }}
                      className="text-5xl sm:text-7xl mb-3"
                    >
                      🏆
                    </motion.div>
                    <div className="text-yellow-200 text-xs sm:text-sm font-bold mb-2 tracking-widest">
                      🎉 CONGRATULATIONS! 🎉
                    </div>
                    {centerNotification.message.split('\n').map((line, i) => (
                      <p key={i} className={`text-white font-bold mb-1 ${
                        i === 0 ? 'text-base sm:text-2xl' :
                        i === 1 ? 'text-2xl sm:text-4xl text-yellow-300' :
                        i === 2 ? 'text-3xl sm:text-5xl text-green-300' :
                        'text-sm sm:text-xl text-yellow-200'
                      }`}>
                        {line}
                      </p>
                    ))}
                    <div className="mt-3 flex justify-center gap-2 text-2xl">
                      🎊 💰 🎊
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="text-2xl sm:text-4xl mb-2 sm:mb-3 mobile-landscape:text-xl mobile-landscape:mb-1">
                      {centerNotification.type === 'warning' ? '⚠️' : 'ℹ️'}
                    </div>
                    <div className="text-white text-base sm:text-lg font-bold mobile-landscape:text-sm">
                      {centerNotification.message}
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Leave Confirmation Dialog - Center Screen Mobile Adaptive */}
        <AnimatePresence>
          {showLeaveConfirmation && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[70] p-4"
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ type: "spring", duration: 0.3 }}
                className="bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-red-500 rounded-2xl shadow-2xl p-6 w-[90vw] max-w-md text-center"
              >
                <div className="text-5xl mb-4">🚪</div>
                <h3 className="text-white text-xl font-bold mb-3">Leave Room?</h3>
                <p className="text-gray-300 text-sm mb-6 leading-relaxed">
                  {isPlaying || gameActiveRef.current || localStorage.getItem(`game_active_${roomCode}`) === 'true'
                    ? 'You\'re in an active poker game. Leaving now will forfeit your hand and may result in penalties.'
                    : 'Are you sure you want to leave this room? This action cannot be undone.'}
                </p>
                <div className="flex gap-3 justify-center">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      soundManager.playClick()
                      setShowLeaveConfirmation(false)
                    }}
                    onMouseEnter={() => soundManager.playHover()}
                    className="px-6 py-3 bg-gray-600 hover:bg-gray-500 text-white rounded-xl font-semibold transition-colors min-w-[100px]"
                  >
                    Stay
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      soundManager.playClick()
                      performLeave()
                    }}
                    onMouseEnter={() => soundManager.playHover()}
                    className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-semibold transition-colors min-w-[100px]"
                  >
                    Leave
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Raise Slider - Mobile Responsive for Landscape */}
        <AnimatePresence>
          {showRaiseSlider && room && playerPerspective !== null && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[70] p-4"
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0, y: 50 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.8, opacity: 0, y: 50 }}
                transition={{ type: "spring", duration: 0.3 }}
                className="bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-orange-500 rounded-2xl shadow-2xl p-4 sm:p-6 w-[90vw] max-w-md"
              >
                <div className="text-center">
                  <div className="text-4xl mb-3">💰</div>
                  <h3 className="text-white text-lg sm:text-xl font-bold mb-2">Raise Amount</h3>
                  <div className="text-yellow-400 text-2xl sm:text-3xl font-bold mb-4">${raiseAmount}</div>
                  
                  {/* Slider */}
                  <div className="mb-6">
                    <input
                      type="range"
                      min={(() => {
                        const currentBet = room.gameState?.currentBet || 0
                        const minRaiseIncrement = Math.max(20, currentBet * 0.5)
                        const minRaise = Math.max(currentBet + minRaiseIncrement, 20)
                        const currentPlayer = room.players.find(p => p.position === playerPerspective)
                        const maxRaise = currentPlayer?.chips || 0
                        return Math.min(minRaise, maxRaise)
                      })()}
                      max={(() => {
                        const currentBet = room.gameState?.currentBet || 0
                        const minRaiseIncrement = Math.max(20, currentBet * 0.5)
                        const minRaise = Math.max(currentBet + minRaiseIncrement, 20)
                        const currentPlayer = room.players.find(p => p.position === playerPerspective)
                        const maxRaise = currentPlayer?.chips || 0
                        return Math.max(Math.min(minRaise, maxRaise), maxRaise)
                      })()}
                      value={raiseAmount}
                      onChange={(e) => setRaiseAmount(parseInt(e.target.value))}
                      className="w-full h-3 bg-gray-700 rounded-lg appearance-none cursor-pointer slider-thumb"
                      style={{
                        background: `linear-gradient(to right, #f97316 0%, #f97316 ${((raiseAmount - ((room.gameState?.currentBet || 0) * 2 || 20)) / ((room.players.find(p => p.position === playerPerspective)?.chips || 0) - ((room.gameState?.currentBet || 0) * 2 || 20))) * 100}%, #374151 ${((raiseAmount - ((room.gameState?.currentBet || 0) * 2 || 20)) / ((room.players.find(p => p.position === playerPerspective)?.chips || 0) - ((room.gameState?.currentBet || 0) * 2 || 20))) * 100}%, #374151 100%)`
                      }}
                    />
                    <div className="flex justify-between text-xs text-gray-400 mt-2">
                      <span>Min: ${(() => {
                        const currentBet = room.gameState?.currentBet || 0
                        const minRaiseIncrement = Math.max(20, currentBet * 0.5)
                        const minRaise = Math.max(currentBet + minRaiseIncrement, 20)
                        const currentPlayer = room.players.find(p => p.position === playerPerspective)
                        const maxRaise = currentPlayer?.chips || 0
                        return Math.min(minRaise, maxRaise)
                      })()}</span>
                      <span>Max: ${room.players.find(p => p.position === playerPerspective)?.chips || 0}</span>
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-3 justify-center">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        soundManager.playClick()
                        cancelRaise()
                      }}
                      className="px-5 py-2.5 bg-gray-600 hover:bg-gray-500 text-white rounded-xl font-semibold transition-colors min-w-[90px] text-sm sm:text-base"
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        soundManager.playClick()
                        confirmRaise()
                      }}
                      className="px-5 py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl font-semibold transition-colors min-w-[90px] text-sm sm:text-base"
                    >
                      Raise
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Low Credit Warning - Only show for the affected player */}
        <AnimatePresence>
        {lowCreditWarning.show && (() => {
          // Get current player from room data
          const currentPlayer = room?.players.find(p => p._id === lowCreditWarning.playerId)
          
          // Get current logged-in user ID from localStorage
          let currentUserId: string | null = null
          let currentUsername: string | null = null
          if (typeof window !== 'undefined') {
            try {
              const userData = localStorage.getItem('poker_user')
              if (userData) {
                const user = JSON.parse(userData)
                currentUserId = user._id
                currentUsername = user.username
              }
            } catch (e) {
              console.error('Error parsing user data:', e)
            }
          }
          
          // Check if current user is in the room as a player
          const isCurrentUserInRoom = room?.players.some(p => 
            p._id === currentUserId || p.username === currentUsername
          )
          
          // Only show if:
          // 1. The affected player matches the current user ID OR username
          // 2. OR if the current user is in the room and this is their notification
          const shouldShow = currentPlayer && (
            currentPlayer._id === currentUserId ||
            currentPlayer.username === currentUsername ||
            (isCurrentUserInRoom && currentPlayer._id === lowCreditWarning.playerId)
          )
          
          if (shouldShow) {
            return (
              <motion.div
                initial={{ opacity: 0, x: -300 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -300 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                className="fixed top-28 left-4 z-40 w-48 mobile-landscape:top-24 mobile-landscape:left-4 lg:top-32 lg:left-6 xl:w-56"
              >
                <div className="bg-gradient-to-br from-red-600/95 to-red-700/95 border-2 border-red-400 rounded-lg shadow-xl p-2 text-white backdrop-blur-sm">
                  <div className="flex items-center gap-1 mb-1">
                    <motion.span
                      animate={{ 
                        scale: [1, 1.1, 1],
                      }}
                      transition={{ duration: 0.6, repeat: Infinity }}
                      className="text-base"
                    >
                      ⚠️
                    </motion.span>
                    <h4 className="font-bold text-[11px]">Low Credits!</h4>
                  </div>
                  <p className="text-[9px] text-red-100 mb-1 leading-tight">
                    {currentPlayer._id === currentUserId 
                      ? 'You need more credits'
                      : `${lowCreditWarning.playerName} low on credits`}
                  </p>
                  <div className="bg-black/20 rounded p-1">
                    <div className="flex items-center justify-between text-[9px] mb-0.5">
                      <span>Time:</span>
                      <motion.span 
                        className="font-bold text-xs"
                        animate={{ 
                          color: lowCreditWarning.countdown <= 30 
                            ? ['#ffffff', '#ffcccc']
                            : '#ffffff'
                        }}
                        transition={{ duration: 0.8, repeat: lowCreditWarning.countdown <= 30 ? Infinity : 0 }}
                      >
                        {Math.floor(lowCreditWarning.countdown / 60)}:{String(lowCreditWarning.countdown % 60).padStart(2, '0')}
                      </motion.span>
                    </div>
                    <div className="w-full bg-black/30 rounded-full h-0.5">
                      <motion.div
                        className="bg-white h-0.5 rounded-full"
                        initial={{ width: '100%' }}
                        animate={{ width: `${(lowCreditWarning.countdown / 120) * 100}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          }
          return null
        })()}
        </AnimatePresence>

      {/* Landscape Content with Safe Area Border */}
      <div 
        className="landscape-content poker-table-container"
        {...gameAreaSwipeHandlers}
      >
        {/* Header with safe area padding */}
        <div className="header-section absolute top-0 left-0 right-0 z-10">
        <div className="flex justify-between items-start gap-1 sm:gap-2">
          <div className="flex flex-col gap-1 sm:gap-2">
            {/* Back and Settings Buttons Row */}
            <div className="flex items-center gap-1 sm:gap-2">
              {/* Back Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleBack}
                onMouseEnter={() => soundManager.playHover()}
                className="adaptive-button flex items-center gap-1 bg-black/40 text-white rounded-lg hover:bg-black/60 transition-colors"
              >
                <ArrowLeft size={14} className="sm:w-4 sm:h-4 md:w-[18px] md:h-[18px]" />
                <span className="hidden lg:inline">Back to Admin</span>
                <span className="lg:hidden">Back</span>
              </motion.button>

              {/* Settings Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  soundManager.playClick()
                  setShowSettings(true)
                }}
                onMouseEnter={() => soundManager.playHover()}
                className="adaptive-button flex items-center gap-1 bg-black/40 text-white rounded-lg hover:bg-black/60 transition-colors"
              >
                <Settings size={14} className="sm:w-4 sm:h-4 md:w-[18px] md:h-[18px]" />
                <span className="hidden lg:inline">Settings</span>
              </motion.button>

              {/* Notification Center */}
              <button
                onClick={() => {
                  soundManager.playClick();
                  setShowNotifications(true);
                }}
                onMouseEnter={() => soundManager.playHover()}
                className="relative p-2 rounded-full hover:bg-white/10 transition-colors"
              >
                <Bell className="w-6 h-6 text-white" />
              </button>
            </div>

            {/* View Mode Indicator - Moved under back button */}
            <div className="view-mode-indicator" style={{ maxWidth: '120px' }}>
              <div className={`backdrop-blur-sm rounded-md border shadow-lg ${
                playerPerspective !== null 
                  ? 'bg-purple-600/90 border-purple-400/50' 
                  : 'bg-blue-600/90 border-blue-400/50'
              }`} style={{ padding: '3px 6px' }}>
                <div className="flex flex-col items-start gap-0.5 text-white">
                  <div className="flex items-center gap-1">
                    <Eye size={10} />
                    <span className="font-medium text-[9px] whitespace-nowrap overflow-hidden text-ellipsis">
                      {(() => {
                        if (playerPerspective !== null && room && room.players) {
                          const player = room.players.find(p => p.position === playerPerspective)
                          if (player) return `${player.username}`
                        }
                        return 'Observer'
                      })()}
                    </span>
                  </div>
                  {/* Credit Balance Display */}
                  {playerPerspective !== null && room && room.players && (() => {
                    const player = room.players.find(p => p.position === playerPerspective)
                    if (player && playerBalances[player._id] !== undefined) {
                      return (
                        <div className="relative">
                          <div className="flex items-center gap-1 text-[8px] text-yellow-400 font-bold">
                            <Coins size={8} />
                            <span>${playerBalances[player._id].toLocaleString()}</span>
                          </div>
                          {/* Credit Change Animation */}
                          {creditAnimations
                            .filter(anim => anim.playerId === player._id)
                            .map(anim => (
                              <motion.div
                                key={anim.id}
                                initial={{ opacity: 1, y: 0 }}
                                animate={{ opacity: 0, y: -20 }}
                                transition={{ duration: 1.5 }}
                                className={`absolute left-0 top-0 font-bold text-[10px] whitespace-nowrap ${
                                  anim.amount > 0 ? 'text-green-400' : 'text-red-400'
                                }`}
                                onAnimationComplete={() => {
                                  setCreditAnimations(prev => prev.filter(a => a.id !== anim.id))
                                }}
                              >
                                {anim.amount > 0 ? '+' : ''}{anim.amount}
                              </motion.div>
                            ))
                          }
                        </div>
                      )
                    }
                    return null
                  })()}
                </div>
              </div>
            </div>

          </div>

          <div className="header-controls flex items-center gap-1 sm:gap-1.5 md:gap-4 flex-wrap justify-end">
            {/* Ready Button - For players waiting to start game */}
            {!isAdminView && playerPerspective !== null && room && room.status !== 'playing' && (() => {
              // Find current player by their position (most reliable)
              const currentPlayer = room.players.find(p => p.position === playerPerspective);
              const isReady = currentPlayer?.isReady || false;
              
              return (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleReady}
                onMouseEnter={() => soundManager.playHover()}
                className={`flex items-center gap-1 px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg transition-all text-sm sm:text-base font-semibold whitespace-nowrap ${
                  isReady
                    ? 'bg-green-600 hover:bg-green-500 text-white'
                    : 'bg-yellow-600 hover:bg-yellow-500 text-white animate-pulse'
                }`}
              >
                {isReady ? (
                  <>
                    <span className="text-lg">✓</span>
                    <span>Ready</span>
                  </>
                ) : (
                  <>
                    <span className="text-lg">⏳</span>
                    <span>Not Ready</span>
                  </>
                )}
              </motion.button>
              );
            })()}
            
            {/* Stats Button - For players only */}
            {!isAdminView && playerPerspective !== null && (
              <>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    soundManager.playClick()
                    setShowStats(true)
                  }}
                  onMouseEnter={() => soundManager.playHover()}
                  className="flex items-center gap-1 px-2 py-1.5 sm:px-3 sm:py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors text-xs sm:text-sm whitespace-nowrap"
                >
                  <BarChart3 size={14} className="sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Stats</span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    soundManager.playClick()
                    setShowHistory(true)
                  }}
                  onMouseEnter={() => soundManager.playHover()}
                  className="flex items-center gap-1 px-2 py-1.5 sm:px-3 sm:py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors text-xs sm:text-sm whitespace-nowrap"
                >
                  <History size={14} className="sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">History</span>
                </motion.button>
              </>
            )}
            


            {/* Menu Dropdown - Show only for admin */}
            {isAdminView && (
              <div className="relative">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowMenu(!showMenu)}
                  className="flex items-center gap-1 px-2 py-1 sm:px-2 sm:py-1.5 md:px-3 md:py-2 bg-black/40 text-white rounded-lg hover:bg-black/60 transition-colors"
                >
                  <Menu size={14} className="sm:w-4 sm:h-4" />
                </motion.button>

                {/* Dropdown Menu */}
                <AnimatePresence>
                  {showMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 top-full mt-1 bg-black/95 backdrop-blur-sm rounded-lg border border-white/20 p-2 min-w-[160px] shadow-2xl z-[100]"
                    >
                      {/* Player Perspective Selector */}
                      {room && room.players.length > 0 && (
                        <div className="mb-2">
                          <label className="text-white/60 text-[9px] block mb-1">View As:</label>
                          <select
                            value={playerPerspective ?? -1}
                            onChange={(e) => {
                              setPlayerPerspective(e.target.value === '-1' ? null : parseInt(e.target.value))
                              setShowMenu(false)
                            }}
                            className="w-full bg-black/40 text-white px-2 py-1 rounded text-[10px] cursor-pointer border border-white/20 hover:bg-black/60 transition-colors"
                          >
                            <option value="-1">Observer</option>
                            {room.players.map((player, index) => (
                              <option key={player._id} value={index}>
                                {player.username}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* Room Info */}
                      <div className="border-t border-white/10 pt-2 space-y-1">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-white/60">Room:</span>
                          <span className="text-white font-bold">{roomCode}</span>
                        </div>
                        {room && (
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="text-white/60">Players:</span>
                            <span className="text-white font-bold">{room.players?.length || 0}/{room.maxPlayers}</span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative w-full h-screen flex items-center justify-center">
        {loading && (
          <div className="text-white text-xl">Loading poker table...</div>
        )}

        {error && (
          <div className="text-center">
            <div className="text-red-400 text-xl mb-4">Error: {error}</div>
            <button
              onClick={fetchRoom}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500"
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && !room && (
          <div className="text-white text-xl">Room not found</div>
        )}

        {room && (
          <>
            {/* Poker Table Surface */}
            <div className="poker-table-surface relative w-full h-full flex items-center justify-center" style={{ background: 'transparent' }}>
              {/* Table 380x240 */}
              <div 
                className="relative mx-auto rounded-[50%]"
                style={{
                  width: typeof window !== 'undefined' 
                    ? (window.innerWidth >= 768 
                      ? (window.innerWidth >= 1280 ? '1050px' : '900px')
                      : (window.innerHeight < window.innerWidth ? '380px' : '90vw'))
                    : '900px',
                  height: typeof window !== 'undefined'
                    ? (window.innerWidth >= 768
                      ? (window.innerWidth >= 1280 ? '700px' : '600px')
                      : (window.innerHeight < window.innerWidth ? '240px' : '65vh'))
                    : '600px',
                  minHeight: '280px',
                  maxHeight: '650px',
                  maxWidth: '900px',
                  background: currentTheme?.colors?.feltGradient || 'radial-gradient(ellipse at center, #1a5f3a 0%, #0d3a23 70%, #082516 100%)',
                  boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.8), inset 0 2px 4px 0 rgba(255, 255, 255, 0.1)',
                  border: `3px solid ${currentTheme?.colors?.borderColor || '#F59E0B'}`
                }}
              >
                
                {/* Circular Timer Fixed at Top-Right Corner of Screen - REMOVED DUPLICATE */}
                
                {/* Dealer Component - Positioned between positions 6 and 7 at TOP of table */}
                <AnimatePresence>
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    className="absolute z-20"
                    style={{
                      left: '39%',
                      top: '-23%',
                      transform: 'translate(-50%, -50%)'
                    }}
                  >
                    <div className="relative">
                      {/* Dealer Avatar */}
                      <div className="w-40 h-40 sm:w-48 sm:h-48 flex items-center justify-center">
                        <img src="/images/dealer.png" alt="Dealer" className="w-full h-full object-contain" />
                      </div>
                      
                      {/* Dealer Label */}
                      <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                        <div className="bg-black/60 px-2 py-1 rounded text-white text-xs font-semibold">
                          Dealer
                        </div>
                      </div>
                      
                      {/* Dealer Animation */}
                      <AnimatePresence>
                        {dealerAnimation.show && (
                          <motion.div
                            initial={{ scale: 0, opacity: 0, y: -10 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0, opacity: 0, y: -10 }}
                            className="absolute -top-12 left-1/2 transform -translate-x-1/2 whitespace-nowrap"
                          >
                            <div className="bg-yellow-500 text-black px-3 py-1 rounded-lg font-semibold text-sm shadow-lg relative">
                              {dealerAnimation.message}
                              {/* Speech bubble arrow */}
                              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-yellow-500"></div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                      
                      {/* Card dealing animation effect */}
                      <AnimatePresence>
                        {dealerAnimation.show && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ 
                              scale: [0, 1.2, 1],
                              rotate: [0, 180, 360]
                            }}
                            exit={{ scale: 0 }}
                            transition={{ 
                              duration: 1.5,
                              repeat: 2,
                              ease: "easeInOut"
                            }}
                            className="absolute -top-2 -right-2 w-8 h-8 bg-red-600 rounded border-2 border-white shadow-lg flex items-center justify-center text-white text-xs font-bold"
                          >
                            🂠
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                </AnimatePresence>
                
                {/* Flying Cards Animation */}
                <AnimatePresence>
                  {Object.entries(flyingCards).map(([cardKey, cardData]) => {
                    if (!cardData.show) return null
                    
                    // Find the player with this position to get their actual visual position
                    const targetPosition = cardData.targetPosition
                    const player = room?.players?.find((p: any) => p.position === targetPosition)
                    
                    if (!player) {
                      console.warn(`⚠️ Could not find player at position ${targetPosition}`)
                      return null
                    }
                    
                    // Use the same positioning logic as player cards
                    const totalPlayers = room?.maxPlayers || 9
                    const myPosition = room?.players?.find((p: any) => p._id === currentUserId)?.position ?? 0
                    const seatOffset = (targetPosition - myPosition + totalPlayers) % totalPlayers
                    
                    // Same clockwise angles as getPositionStyle
                    const clockwiseAngles = [270, 150, 180, 210, 240, 300, 330, 0, 30]
                    const angle = clockwiseAngles[seatOffset] || 270
                    
                    // Calculate position with matching radius
                    const radius = 280
                    const targetX = Math.cos((angle - 90) * Math.PI / 180) * radius
                    const targetY = Math.sin((angle - 90) * Math.PI / 180) * radius
                    
                    // Dealer position (top center area)
                    const dealerX = -60
                    const dealerY = -230
                    
                    return (
                      <motion.div
                        key={cardKey}
                        initial={{ 
                          x: dealerX, 
                          y: dealerY,
                          scale: 0.5,
                          rotate: 0,
                          opacity: 0
                        }}
                        animate={{ 
                          x: targetX,
                          y: targetY,
                          scale: 1,
                          rotate: 360,
                          opacity: [0, 1, 1, 1]
                        }}
                        exit={{ 
                          scale: 0,
                          opacity: 0
                        }}
                        transition={{ 
                          duration: 0.8,
                          ease: "easeOut",
                          opacity: { times: [0, 0.2, 0.8, 1] }
                        }}
                        className="absolute z-30 w-10 h-14 rounded-lg border-2 border-white shadow-2xl flex items-center justify-center text-white text-lg font-bold"
                        style={{
                          left: '50%',
                          top: '50%',
                          transform: 'translate(-50%, -50%)',
                          background: 'linear-gradient(135deg, #dc143c 0%, #8b0000 50%, #dc143c 100%)'
                        }}
                      >
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-white/40 text-2xl font-bold">♠</div>
                        </div>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
                
                {/* Community Cards Area */}
                <div className="absolute top-[40%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full px-4">
                  {/* Ready Status Display - Show when game not started */}
                  {room.status !== 'playing' && room.players.length >= 1 && (
                    <div className="text-center mb-3">
                      <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex flex-col items-center bg-gradient-to-br from-yellow-600/90 to-orange-600/90 backdrop-blur-md px-6 py-3 rounded-xl border-2 border-yellow-400/50 shadow-2xl"
                      >
                        <div className="text-white text-sm font-semibold mb-1">
                          {(() => {
                            const readyCount = room.players.filter(p => p.isReady).length
                            const totalPlayers = room.players.length
                            const minPlayers = 2
                            
                            if (readyCount >= minPlayers && totalPlayers >= minPlayers) {
                              return '🎮 Ready to Start!'
                            } else if (totalPlayers < minPlayers) {
                              return `⏳ Waiting for Players (${totalPlayers}/${minPlayers})`
                            } else {
                              return `⏳ Waiting for Ready (${readyCount}/${totalPlayers})`
                            }
                          })()}
                        </div>
                        <div className="flex items-center gap-2">
                          {room.players.map((player, idx) => (
                            <div key={player._id || idx} className="flex flex-col items-center">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                player.isReady 
                                  ? 'bg-green-500 text-white' 
                                  : 'bg-gray-400 text-white animate-pulse'
                              }`}>
                                {player.isReady ? '✓' : '⏳'}
                              </div>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    </div>
                  )}
                  
                  {/* Pot Display - Enhanced with 3D Chips */}
                  <div className="pot-display text-center mb-1 sm:mb-2 md:mb-3 z-10 relative">
                    <div 
                      data-pot-area="true"
                      className="inline-flex flex-col items-center bg-black/70 backdrop-blur-md px-3 py-2 sm:px-6 sm:py-3 md:px-8 md:py-4 rounded-xl md:rounded-2xl border border-yellow-500/50 md:border-2 shadow-2xl"
                    >
                      <div className="text-yellow-400 text-[8px] sm:text-xs md:text-sm mb-1 font-semibold">POT</div>
                      <div className="flex items-center justify-center gap-1 sm:gap-3 md:gap-4 mb-1">
                        {/* 3D Chip Stack - Left side (hidden on very small screens) */}
                        <div className="hidden sm:flex -space-x-1 sm:-space-x-2 opacity-80">
                          <div className="w-3 h-3 sm:w-5 sm:h-5 md:w-7 md:h-7 rounded-full bg-gradient-to-br from-red-500 to-red-700 border border-white sm:border-2 shadow-lg" />
                          <div className="w-3 h-3 sm:w-5 sm:h-5 md:w-7 md:h-7 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 border border-white sm:border-2 shadow-lg" />
                          <div className="w-3 h-3 sm:w-5 sm:h-5 md:w-7 md:h-7 rounded-full bg-gradient-to-br from-green-500 to-green-700 border border-white sm:border-2 shadow-lg" />
                        </div>
                        <span className="text-yellow-400 font-bold text-base sm:text-2xl md:text-4xl px-1 whitespace-nowrap">
                          ${room.gameState?.pot || room.currentPot || 0}
                        </span>
                        {/* 3D Chip Stack - Right side (hidden on very small screens) */}
                        <div className="hidden sm:flex -space-x-1 sm:-space-x-2 opacity-80">
                          <div className="w-3 h-3 sm:w-5 sm:h-5 md:w-7 md:h-7 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 border border-white sm:border-2 shadow-lg" />
                          <div className="w-3 h-3 sm:w-5 sm:h-5 md:w-7 md:h-7 rounded-full bg-gradient-to-br from-yellow-500 to-yellow-700 border border-white sm:border-2 shadow-lg" />
                          <div className="w-3 h-3 sm:w-5 sm:h-5 md:w-7 md:h-7 rounded-full bg-gradient-to-br from-pink-500 to-pink-700 border border-white sm:border-2 shadow-lg" />
                        </div>
                      </div>
                      <div className="bg-black/50 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full">
                        <div className="text-white font-semibold text-[8px] sm:text-xs md:text-sm">
                          {room.gameState?.round?.toUpperCase() || 'WAITING'}
                        </div>
                      </div>
                    </div>

                  </div>
                  
                  <div className="flex justify-center flex-wrap gap-1">
                      <AnimatePresence mode="popLayout">
                        {(() => {
                          const communityCards = room.gameState?.communityCards || []
                          
                          // Only render cards if there are any to render
                          if (communityCards.length === 0) {
                            return null
                          }
                          
                          return communityCards.map((card, index) => {
                            const cardKey = `${card.suit}-${card.rank}`
                            const isNewCard = !renderedCommunityCardsRef.current.has(cardKey)
                            
                            // Add to rendered set (safe to do during render with ref)
                            if (isNewCard) {
                              renderedCommunityCardsRef.current.add(cardKey)
                            }
                            
                            return (
                              <motion.div
                                key={cardKey}
                                className="community-card"
                                initial={isNewCard ? { scale: 0, rotate: 180, opacity: 0 } : false}
                                animate={{ scale: 1, rotate: 0, opacity: 1 }}
                                exit={{ scale: 0, opacity: 0 }}
                                transition={{ 
                                  duration: 0.4,
                                  delay: isNewCard ? index * 0.15 : 0,
                                  ease: "easeOut"
                                }}
                                layout
                              >
                                {getCardDisplay(card)}
                              </motion.div>
                            )
                          })
                        })()}
                      </AnimatePresence>
                      {/* Empty card slots - Styled placeholders */}
                      {Array.from({ length: 5 - (room.gameState?.communityCards?.length || 0) }).map((_, index) => (
                        <div 
                          key={`empty-${index}`} 
                          className="w-[56px] h-[80px] md:w-[80px] md:h-[112px] m-0.5 md:m-1 shadow-lg opacity-20 rounded-lg border-2 border-dashed border-white/30"
                          style={{
                            background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)'
                          }}
                        />
                      ))}
                    </div>
                </div>
              </div>

              {/* Current Bet Display - Moved outside table for mobile visibility */}
              {(room.gameState?.currentBet || 0) > 0 && (
                <div className="current-bet-indicator absolute left-1/2 transform -translate-x-1/2 px-2 z-30" style={{ top: '20px' }}>
                  <div className="bg-yellow-500 text-black px-2 py-0.5 md:px-3 md:py-1 rounded-full font-bold shadow-lg text-xs md:text-sm whitespace-nowrap">
                    Current Bet: ${room.gameState?.currentBet || 0}
                  </div>
                </div>
              )}

              {/* Players Around Table */}
              {(room.players || [])
                .slice()
                .sort((a, b) => a.position - b.position)
                .map((player, index) => {
                // Use index as gameIndex since we sorted by position
                const gameIndex = index;
                // Use actual seat position for visual placement
                const seatPosition = player.position;
                
                // Determine dealer index safely (handle both dealer and dealerPosition for compatibility)
                const dealerIndex = room.gameState?.dealer ?? room.gameState?.dealerPosition;
                
                return (
                <motion.div
                  key={player._id}
                  className="player-position absolute"
                  data-player-id={player._id}
                  style={{
                    ...getPositionStyle(seatPosition, Math.max(room.maxPlayers || 6, room.players?.length || 1)),
                    zIndex: (playerActions[seatPosition] && Date.now() - playerActions[seatPosition].timestamp < 1500) ? 100 : 10
                  }}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ 
                    opacity: 1, 
                    scale: 1,
                    ...getPositionStyle(seatPosition, Math.max(room.maxPlayers || 6, room.players?.length || 1))
                  }}
                  transition={{ 
                    delay: gameIndex * 0.1,
                    duration: 0.5,
                    type: "spring",
                    stiffness: 100
                  }}
                >
                  <div 
                    className={`relative backdrop-blur-md rounded-2xl border-2 transition-all duration-300 shadow-2xl player-card-entrance ${
                      playerPerspective === seatPosition 
                        ? 'p-3 md:p-4 w-[9rem] md:w-[13rem] border-purple-500 bg-gradient-to-br from-purple-900/80 via-purple-800/60 to-purple-900/80 shadow-[0_0_40px_rgba(168,85,247,0.6)]' 
                        : (room.gameState?.currentPlayer !== undefined && gameIndex === room.gameState.currentPlayer)
                          ? 'p-2 md:p-3 w-[8.5rem] md:w-[9rem] border-yellow-400 bg-gradient-to-br from-yellow-900/70 via-amber-900/50 to-yellow-900/70 shadow-[0_0_30px_rgba(250,204,21,0.5)] animate-pulse' 
                          : 'p-2 md:p-3 w-[8.5rem] md:w-[9rem] border-white/30 bg-gradient-to-br from-slate-900/90 via-slate-800/70 to-slate-900/90'
                    }`}
                  >
                    
                    {/* Circular Timer for Active Player - Moved lower with vibration effect */}
                    
                    {/* Dealer Button - Top Right */}
                    {dealerIndex !== undefined && gameIndex === dealerIndex && (
                      <div className="absolute -top-3 -right-3 w-8 h-8 md:w-10 md:h-10 bg-white text-black rounded-full flex items-center justify-center font-bold text-sm md:text-base shadow-xl border-2 border-yellow-500 z-50 animate-pulse">
                        D
                      </div>
                    )}
                    {/* Small Blind Indicator - Top Left */}
                    {dealerIndex !== undefined && gameIndex === (dealerIndex + 1) % room.players.length && (
                      <div className="absolute -top-3 -left-3 w-8 h-8 md:w-10 md:h-10 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs md:text-sm font-bold shadow-xl border-2 border-white z-50">
                        SB
                      </div>
                    )}
                    {/* Big Blind Indicator - Top Left */}
                    {dealerIndex !== undefined && gameIndex === (dealerIndex + 2) % room.players.length && (
                      <div className="absolute -top-3 -left-3 w-8 h-8 md:w-10 md:h-10 bg-red-600 text-white rounded-full flex items-center justify-center text-xs md:text-sm font-bold shadow-xl border-2 border-white z-50">
                        BB
                      </div>
                    )}
                    {/* Player Info */}
                    <div className="text-center mb-1 md:mb-2">
                      {/* Enhanced Player Avatar with Human Silhouette */}
                      <div className="flex justify-center mb-2">
                        <div 
                          className="relative cursor-default transition-all duration-300 hover:scale-105"
                        >
                          {/* Avatar Container with Glow Effect */}
                          <div className={`w-14 h-14 md:w-16 md:h-16 rounded-full relative ${
                            playerPerspective === seatPosition 
                              ? 'ring-4 ring-purple-500 ring-offset-2 ring-offset-black/60 shadow-[0_0_30px_rgba(168,85,247,0.8)]' 
                              : (room.gameState?.currentPlayer !== undefined && gameIndex === room.gameState.currentPlayer)
                                ? 'ring-4 ring-yellow-400 ring-offset-2 ring-offset-black/60 shadow-[0_0_25px_rgba(250,204,21,0.7)] animate-pulse'
                                : 'ring-2 ring-white/20 shadow-lg'
                          }`}>
                            {/* Gradient Background */}
                            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500 via-purple-600 to-pink-600 animate-gradient" />
                            
                            {/* Avatar Content */}
                            <div className="relative w-full h-full rounded-full overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                              {player.avatarUrl ? (
                                <img 
                                  src={player.avatarUrl} 
                                  alt={player.username}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                /* Human Silhouette SVG */
                                <svg 
                                  className="w-8 h-8 md:w-10 md:h-10 text-white/90" 
                                  viewBox="0 0 24 24" 
                                  fill="currentColor"
                                >
                                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                                </svg>
                              )}
                              
                              {/* Online Status Indicator */}
                              <div className="absolute bottom-0 right-0 w-3 h-3 md:w-4 md:h-4 rounded-full border-2 border-black/60 bg-green-400 shadow-lg" />
                              
                              {/* Idle Overlay */}
                              {player.isIdle && (
                                <div className="absolute inset-0 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center">
                                  <span className="text-white text-xs font-bold">💤</span>
                                </div>
                              )}
                              
                              {/* Sitting Out Overlay (joined mid-game) */}
                              {(player as any).isSittingOut && (
                                <div className="absolute inset-0 bg-orange-600/80 backdrop-blur-sm rounded-full flex items-center justify-center">
                                  <span className="text-white text-xs font-bold">⏳</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Enhanced Username Display */}
                      <div className="flex items-center justify-center gap-1 mb-1.5 flex-wrap">
                        <span className={`font-bold text-sm sm:text-base md:text-lg truncate max-w-[90%] ${
                          playerPerspective === seatPosition 
                            ? 'text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-pink-300 to-purple-300 drop-shadow-lg' 
                            : 'text-white drop-shadow-md'
                        }`}>
                          {player.username}
                        </span>
                        
                        {/* Ready Status Indicator (only show when game not started) */}
                        {room.status !== 'playing' && (
                          <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                            player.isReady 
                              ? 'bg-green-500/80 text-white' 
                              : 'bg-yellow-500/80 text-white animate-pulse'
                          }`}>
                            {player.isReady ? '✓' : '⏳'}
                          </span>
                        )}
                        
                        {/* Sitting Out Badge (joined mid-game) */}
                        {(player as any).isSittingOut && room.status === 'playing' && (
                          <span className="text-xs px-1.5 py-0.5 rounded-full font-semibold bg-orange-500/80 text-white">
                            Sitting Out
                          </span>
                        )}
                      </div>
                      
                      {/* Enhanced Chips Display with Glow */}
                      <div className={`flex items-center justify-center gap-1.5 text-sm sm:text-base md:text-xl font-bold transition-all ${
                        playerPerspective === seatPosition
                          ? 'text-yellow-300 drop-shadow-[0_0_8px_rgba(253,224,71,0.8)]'
                          : 'text-yellow-400 drop-shadow-md'
                      }`}>
                        <Coins size={16} className="sm:w-[18px] sm:h-[18px] md:w-[22px] md:h-[22px] animate-pulse" />
                        <span className="tracking-wide">${player.chips.toLocaleString()}</span>
                      </div>

                      {/* Real-time Credit Balance Display */}
                      {playerBalances[player._id] !== undefined && (
                        <div className="text-xs text-green-400 font-semibold mt-0.5">
                          Balance: ${playerBalances[player._id].toLocaleString()}
                        </div>
                      )}
                    </div>

                    {/* Player Cards - Show based on perspective */}
                    <div className="flex justify-center mb-1 md:mb-2">
                      {(() => {
                        // Check if this is the current logged-in user's cards
                        const isMyCards = !isAdminView && currentUserId && (player._id === currentUserId || player._id?.toString() === currentUserId?.toString());
                        // For admin view, check if viewing from this player's perspective
                        const isMyPerspective = isAdminView && playerPerspective === seatPosition;
                        
                        // Simple card visibility: Show cards when game is actively playing and in a round
                        const isActiveRound = room.gameState?.status === 'playing' && 
                                            room.gameState?.round && 
                                            ['preflop', 'flop', 'turn', 'river', 'showdown'].includes(room.gameState.round);
                        
                        const shouldShowCards = isActiveRound;

                        if (player.folded) {
                          // Show folded cards
                          return (
                            <>
                              <div className="bg-gray-600 rounded p-0.5 md:p-1 m-0.5 shadow text-xs text-white text-center min-w-[1rem] md:min-w-[1.5rem] opacity-50">
                                ✕
                              </div>
                              <div className="bg-gray-600 rounded p-0.5 md:p-1 m-0.5 shadow text-xs text-white text-center min-w-[1rem] md:min-w-[1.5rem] opacity-50">
                                ✕
                              </div>
                            </>
                          );
                        } else if (shouldShowCards) {
                          // During active game rounds, show cards
                          if ((isMyCards || isMyPerspective) && player.cards && player.cards.length === 2) {
                            // Show actual cards for current user OR selected player perspective (admin)
                            return (
                              <>
                                {getCardDisplay(player.cards[0])}
                                {getCardDisplay(player.cards[1])}
                              </>
                            );
                          } else {
                            // Show red card backs for other players during gameplay
                            // OR for current player if cards haven't arrived yet but game is playing
                            return (
                              <>
                                <div 
                                  className="w-[40px] h-[56px] md:w-[56px] md:h-[80px] m-0.5 md:m-1 shadow-2xl rounded-lg border-2 border-white relative overflow-hidden"
                                  style={{ background: 'linear-gradient(135deg, #dc143c 0%, #8b0000 50%, #dc143c 100%)' }}
                                >
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="text-white/30 text-2xl font-bold">♠</div>
                                  </div>
                                </div>
                                <div 
                                  className="w-[40px] h-[56px] md:w-[56px] md:h-[80px] m-0.5 md:m-1 shadow-2xl rounded-lg border-2 border-white relative overflow-hidden"
                                  style={{ background: 'linear-gradient(135deg, #dc143c 0%, #8b0000 50%, #dc143c 100%)' }}
                                >
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="text-white/30 text-2xl font-bold">♠</div>
                                  </div>
                                </div>
                              </>
                            );
                          }
                        } else {
                          // Show empty card slots when waiting
                          return (
                            <>
                              <div className="bg-gray-700/50 border-2 border-gray-600 rounded-lg p-1 md:p-2 m-0.5 md:m-1 shadow-lg min-w-[2rem] md:min-w-[3rem] text-center opacity-30">
                                <div className="text-xs md:text-sm text-gray-400">—</div>
                              </div>
                              <div className="bg-gray-700/50 border-2 border-gray-600 rounded-lg p-1 md:p-2 m-0.5 md:m-1 shadow-lg min-w-[2rem] md:min-w-[3rem] text-center opacity-30">
                                <div className="text-xs md:text-sm text-gray-400">—</div>
                              </div>
                            </>
                          );
                        }
                      })()}
                    </div>

                    {/* Player Status */}
                    <div className="text-center">
                      <span className={`text-xs px-1 md:px-2 py-0.5 md:py-1 rounded ${
                        player.status === 'active' ? 'bg-green-500/20 text-green-400' :
                        player.status === 'folded' ? 'bg-red-500/20 text-red-400' :
                        'bg-gray-500/20 text-gray-400'
                      }`}>
                        {player.status}
                      </span>
                    </div>
                  </div>

                  {/* Action Notification Popup - Right side of player - BIGGER */}
                  <AnimatePresence>
                    {playerActions[seatPosition] && Date.now() - playerActions[seatPosition].timestamp < 1500 && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                        transition={{ duration: 0.3, type: "spring", stiffness: 200 }}
                        className="absolute -top-14 left-1/2 -translate-x-1/2 pointer-events-none z-[100]"
                      >
                        <div className={`px-6 py-3 rounded-xl font-bold text-lg shadow-2xl border-3 whitespace-nowrap ${
                          playerActions[seatPosition].action.toLowerCase().includes('skip') ? 'bg-gray-800 border-gray-300 text-white' :
                          playerActions[seatPosition].action.toLowerCase().includes('fold') ? 'bg-red-700 border-red-300 text-white' :
                          playerActions[seatPosition].action.toLowerCase().includes('raise') || playerActions[seatPosition].action.toLowerCase().includes('all-in') ? 'bg-orange-700 border-orange-300 text-white' :
                          playerActions[seatPosition].action.toLowerCase().includes('call') ? 'bg-green-700 border-green-300 text-white' :
                          'bg-blue-700 border-blue-300 text-white'
                        }`} style={{ 
                          filter: 'drop-shadow(0 8px 16px rgba(0, 0, 0, 0.8))'
                        }}>
                          🎯 {playerActions[seatPosition].action.toUpperCase()}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Chat Bubble - Above player - EXTRA LARGE with player color */}
                  <AnimatePresence>
                    {(() => {
                      // Find bubble that matches THIS specific player's _id
                      const bubble = activeBubbles.find(msg => {
                        const matches = msg.playerId && player._id && msg.playerId === player._id
                        // Debug log to see what's happening
                        if (activeBubbles.length > 0 && index === 0) {
                          console.log('🗨️ Chat bubble check:', {
                            playerName: player.username,
                            playerId: player._id,
                            bubblePlayerId: msg.playerId,
                            matches
                          })
                        }
                        return matches
                      })
                      
                      // Don't show bubble if no match or if player has no _id
                      if (!bubble || !player._id) return null
                      
                      // Get player color (same as chat)
                      const playerColors = [
                        'from-blue-600 to-blue-700 border-blue-400',      // Player 0
                        'from-green-600 to-green-700 border-green-400',   // Player 1
                        'from-yellow-600 to-yellow-700 border-yellow-400',// Player 2
                        'from-pink-600 to-pink-700 border-pink-400',      // Player 3
                        'from-purple-600 to-purple-700 border-purple-400',// Player 4
                        'from-orange-600 to-orange-700 border-orange-400',// Player 5
                        'from-cyan-600 to-cyan-700 border-cyan-400',      // Player 6
                        'from-red-600 to-red-700 border-red-400',         // Player 7
                        'from-indigo-600 to-indigo-700 border-indigo-400' // Player 8
                      ]
                      const colorClass = playerColors[index % playerColors.length]
                      
                      return (
                        <motion.div
                          key={bubble.timestamp}
                          initial={{ opacity: 0, y: 10, scale: 0.8 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -10, scale: 0.8 }}
                          transition={{ duration: 0.3 }}
                          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-40"
                          onTouchStart={(e) => {
                            if (!gesturesEnabled) return;
                            (e.currentTarget as any).touchStartY = e.touches[0].clientY;
                          }}
                          onTouchEnd={(e) => {
                            if (!gesturesEnabled) return;
                            const startY = (e.currentTarget as any).touchStartY;
                            const endY = e.changedTouches[0].clientY;
                            if (startY && endY - startY > 40) {
                              setActiveBubbles(prev => prev.filter(b => b.playerId !== player._id));
                            }
                          }}
                        >
                          <div className="relative">
                            <div className={`bg-gradient-to-br ${colorClass} text-white px-5 py-3 rounded-2xl shadow-2xl text-base sm:text-lg md:text-xl max-w-[220px] sm:max-w-[280px] md:max-w-[320px] border-2 backdrop-blur-sm`}>
                              <div className="font-bold flex items-center gap-1.5 mb-1.5">
                                <span className="text-base">♠</span>
                                <span className="truncate">{bubble.playerName}</span>
                                <span className="text-base">♥</span>
                              </div>
                              <div className="break-words font-medium leading-relaxed text-base sm:text-lg">{bubble.message}</div>
                              {gesturesEnabled && (
                                <div className="text-center text-xs text-white/60 mt-1">Swipe down to dismiss</div>
                              )}
                            </div>
                            {/* Tail pointing down - even bigger */}
                            <div className={`absolute bottom-0 left-1/2 transform translate-y-full -translate-x-1/2 w-0 h-0 border-l-[12px] border-r-[12px] border-t-[14px] border-transparent ${colorClass.split(' ')[1].replace('to-', 'border-t-')}`}></div>
                          </div>
                        </motion.div>
                      )
                    })()}
                  </AnimatePresence>
                </motion.div>
              );
            })}
            </div>

            {/* Player Action Controls - Vertical layout on RIGHT side */}
            {room && playerPerspective !== null && room.players.find(p => p.position === playerPerspective) && (
              <motion.div
                initial={{ x: 100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="fixed right-2 sm:right-3 top-[40%] sm:top-[38%] -translate-y-1/2 z-50"
              >
                <div className="bg-black/95 backdrop-blur-md rounded-md sm:rounded-lg border border-purple-500/50 p-1 sm:p-1.5 shadow-2xl">
                  {/* Turn Indicator */}
                  {room.gameState && isMyTurn() && (
                    <div className="mb-1 px-2 py-1 bg-green-500/20 border border-green-500 rounded text-green-400 text-[9px] sm:text-[10px] text-center font-bold animate-pulse">
                      YOUR TURN
                    </div>
                  )}
                  
                  {/* Pot Odds Display */}
                  {room.gameState && isMyTurn() && room.gameState.currentBet > 0 && (
                    <div className="mb-1">
                      <PotOddsDisplay 
                        potAmount={room.gameState.pot || 0}
                        callAmount={(room.gameState.currentBet || 0) - (room.players.find(p => p.position === playerPerspective)?.currentBet || 0)}
                        isVisible={true}
                      />
                    </div>
                  )}
                  
                  <div className="flex flex-col gap-0.5 sm:gap-1">
                    <motion.button
                      whileHover={{ scale: 1.05, x: -3 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleFold}
                      onMouseEnter={() => soundManager.playHover()}
                      disabled={!isMyTurn()}
                      className={`px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg font-bold text-[9px] sm:text-[10px] transition-all shadow-lg min-w-[50px] sm:min-w-[60px] border-2 ${
                        !isMyTurn() 
                          ? 'opacity-50 cursor-not-allowed bg-gray-600 border-gray-500' 
                          : 'bg-gradient-to-b from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 border-red-400 text-white'
                      }`}
                    >
                      Fold
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05, x: -3 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleCheck}
                      onMouseEnter={() => soundManager.playHover()}
                      disabled={
                        !isMyTurn() ||
                        (room.gameState.currentBet > 0 && room.players.find(p => p.position === playerPerspective)?.currentBet !== room.gameState.currentBet)
                      }
                      className={`px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg font-bold text-[9px] sm:text-[10px] transition-all shadow-lg min-w-[50px] sm:min-w-[60px] border-2 ${
                        (!isMyTurn() ||
                         (room.gameState.currentBet > 0 && room.players.find(p => p.position === playerPerspective)?.currentBet !== room.gameState.currentBet)) 
                          ? 'opacity-50 cursor-not-allowed bg-gray-600 border-gray-500' 
                          : 'bg-gradient-to-b from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 border-blue-400 text-white'
                      }`}
                    >
                      Check
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05, x: -3 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleCall}
                      onMouseEnter={() => soundManager.playHover()}
                      disabled={
                        !isMyTurn() ||
                        room.gameState.currentBet === 0 ||
                        room.players.find(p => p.position === playerPerspective)?.currentBet === room.gameState.currentBet
                      }
                      className={`px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg font-bold text-[9px] sm:text-[10px] transition-all shadow-lg min-w-[50px] sm:min-w-[60px] whitespace-nowrap border-2 ${
                        (!isMyTurn() ||
                         room.gameState.currentBet === 0 ||
                         room.players.find(p => p.position === playerPerspective)?.currentBet === room.gameState.currentBet) 
                          ? 'opacity-50 cursor-not-allowed bg-gray-600 border-gray-500' 
                          : 'bg-gradient-to-b from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 border-green-400 text-white'
                      }`}
                    >
                      Call ${((room?.gameState?.currentBet || 0) - (room?.players.find(p => p.position === playerPerspective)?.currentBet || 0)) || 0}
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05, x: -3 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleRaise}
                      onMouseEnter={() => soundManager.playHover()}
                      disabled={!isMyTurn()}
                      className={`px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg font-bold text-[9px] sm:text-[10px] transition-all shadow-lg min-w-[50px] sm:min-w-[60px] border-2 ${
                        !isMyTurn()
                          ? 'opacity-50 cursor-not-allowed bg-gray-600 border-gray-500' 
                          : 'bg-gradient-to-b from-orange-600 to-orange-700 hover:from-orange-500 hover:to-orange-600 border-orange-400 text-white'
                      }`}
                    >
                      Raise
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05, x: -3 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleAllIn}
                      onMouseEnter={() => soundManager.playHover()}
                      disabled={!isMyTurn()}
                      className={`px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg font-bold text-[9px] sm:text-[10px] transition-all shadow-lg min-w-[50px] sm:min-w-[60px] border-2 ${
                        !isMyTurn() 
                          ? 'opacity-50 cursor-not-allowed bg-gray-600 border-gray-500' 
                          : 'bg-gradient-to-b from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 border-purple-400 text-white'
                      }`}
                    >
                      All-In
                    </motion.button>
                  </div>
                  <div className="text-center text-[8px] sm:text-[9px] text-white/90 mt-1 sm:mt-1.5 border-t border-purple-500/30 pt-1 sm:pt-1.5">
                    {playerPerspective !== null && room.players.find(p => p.position === playerPerspective) ? (
                      <>
                        <div className="font-bold text-[8px] sm:text-[9px]">Your Turn</div>
                        <div className="text-[7px] sm:text-[8px]">{room.players.find(p => p.position === playerPerspective)?.chips || 0} chips</div>
                      </>
                    ) : (
                      <div className="text-white/50 text-[7px] sm:text-[8px]">Select player</div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Game Actions Log - HIDDEN, replaced by popup notifications */}
            {false && gameActions.length > 0 && (
              <div className="action-log absolute bottom-12 left-1 sm:bottom-14 sm:left-2 md:bottom-24 md:left-6 z-20 max-w-[120px] sm:max-w-[140px] md:max-w-xs">
                <div className="bg-black/60 backdrop-blur-sm px-1.5 py-1 sm:px-2 sm:py-1.5 md:px-3 md:py-2 rounded-md md:rounded-lg border border-white/20">
                  <div className="text-white text-[8px] sm:text-[9px] md:text-xs space-y-0.5 md:space-y-1">
                    <div className="font-bold text-yellow-400 mb-0.5 md:mb-1">Actions:</div>
                    <AnimatePresence>
                      {gameActions.slice(-3).map((action, index) => (
                        <motion.div
                          key={`${action}-${index}`}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0 }}
                          className="text-green-200 truncate"
                          title={action}
                        >
                          • {action}
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            )}

            {/* Side Pots Display - Above chat button on LEFT side */}
            <AnimatePresence>
              {room.gameState?.sidePots && room.gameState.sidePots.length > 0 && (
                <>
                  {/* Toggle Button */}
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      soundManager.playClick()
                      setShowSidePots(!showSidePots)
                    }}
                    onMouseEnter={() => soundManager.playHover()}
                    className="absolute bottom-20 left-2 sm:bottom-24 sm:left-3 lg:bottom-28 lg:left-6 z-30 bg-gradient-to-br from-orange-600 to-orange-700 hover:from-orange-500 hover:to-orange-600 text-white p-1.5 sm:p-2 rounded-lg shadow-xl border border-orange-400/50 transition-all"
                  >
                    <Coins size={14} className="sm:w-4 sm:h-4" />
                  </motion.button>

                  {/* Side Pots Panel */}
                  {showSidePots && (
                    <motion.div 
                      initial={{ opacity: 0, x: -150 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -150 }}
                      transition={{ type: "spring", stiffness: 200, damping: 20 }}
                      className="absolute bottom-20 left-12 sm:bottom-24 sm:left-14 lg:bottom-28 lg:left-16 z-30 flex flex-col gap-1 max-w-[100px] sm:max-w-[110px]"
                    >
                      {room.gameState.sidePots.map((sidePot, index) => (
                        <motion.div 
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="bg-gradient-to-br from-orange-600/95 to-orange-700/95 backdrop-blur-md px-1.5 py-1 rounded-md border border-orange-400/50 shadow-lg"
                        >
                          <div className="flex items-center gap-0.5 mb-0.5">
                            <div className="w-1 h-1 rounded-full bg-orange-300 animate-pulse" />
                            <div className="text-orange-100 text-[8px] font-bold">
                              {sidePot.type}
                            </div>
                          </div>
                          <div className="text-white font-bold text-xs">
                            ${sidePot.amount}
                          </div>
                          <div className="flex items-center gap-0.5 text-orange-200 text-[7px]">
                            <Users size={7} />
                            <span>
                              {sidePot.eligiblePlayers.length} eligible
                            </span>
                          </div>
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </>
              )}
            </AnimatePresence>

            {/* Chat Button - LEFT side */}
            <motion.button
              whileHover={{ scale: 1.1, rotate: 5 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                soundManager.playChatOpen()
                setShowChat(!showChat)
              }}
              onMouseEnter={() => soundManager.playHover()}
              className="absolute bottom-2 left-2 sm:bottom-3 sm:left-3 lg:bottom-6 lg:left-6 z-30 bg-gradient-to-br from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white p-2 sm:p-2.5 md:p-3 lg:p-4 rounded-full shadow-2xl border-2 border-yellow-400/50 transition-all"
            >
              <MessageCircle size={16} className="sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-7 lg:h-7" />
              {activeBubbles.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] font-bold rounded-full w-4 h-4 flex items-center justify-center border border-white">
                  {activeBubbles.length}
                </span>
              )}
            </motion.button>

            {/* Chat Panel - LEFT side */}
            <AnimatePresence>
              {showChat && (
                <motion.div
                  initial={{ opacity: 0, x: -20, scale: 0.9 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -20, scale: 0.9 }}
                  className="absolute bottom-14 left-2 sm:bottom-16 sm:left-3 lg:bottom-24 lg:left-6 z-30 bg-gradient-to-br from-gray-900 to-black border-2 border-green-500/50 backdrop-blur-sm rounded-xl shadow-2xl p-2 sm:p-3 lg:p-4 w-36 sm:w-40 md:w-44 lg:w-64 xl:w-72"
                >
                  <div className="flex items-center justify-between mb-2 pb-2 border-b border-green-500/30">
                    <h3 className="text-yellow-400 font-bold text-xs sm:text-sm flex items-center gap-1">
                      <span>♠</span> Chat <span>♣</span>
                    </h3>
                    <button
                      onClick={() => {
                        soundManager.playMenuClose()
                        setShowChat(false)
                      }}
                      onMouseEnter={() => soundManager.playHover()}
                      className="text-white/60 hover:text-red-400 text-sm font-bold transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                  
                  {/* Chat Messages History - Shorter height */}
                  <div className="mb-2 max-h-24 sm:max-h-32 md:max-h-40 lg:max-h-64 xl:max-h-80 overflow-y-auto space-y-1.5 scrollbar-thin scrollbar-thumb-green-600 scrollbar-track-gray-800">
                    {chatMessages.length === 0 ? (
                      <p className="text-white/40 text-[9px] sm:text-[10px] text-center py-2">No messages yet</p>
                    ) : (
                      chatMessages.map((msg, index) => {
                        // Get player index to determine color
                        const playerIndex = room?.players.findIndex(p => p._id === msg.playerId) ?? -1
                        const playerColors = [
                          'text-blue-400',    // Player 0
                          'text-green-400',   // Player 1
                          'text-yellow-400',  // Player 2
                          'text-pink-400',    // Player 3
                          'text-purple-400',  // Player 4
                          'text-orange-400',  // Player 5
                          'text-cyan-400',    // Player 6
                          'text-red-400',     // Player 7
                          'text-indigo-400'   // Player 8
                        ]
                        const playerColor = playerIndex >= 0 ? playerColors[playerIndex % playerColors.length] : 'text-gray-400'
                        
                        return (
                          <div key={index} className="bg-gradient-to-r from-green-900/40 to-black/60 rounded-lg px-2 py-1 border border-green-700/30">
                            <div className={`font-bold text-[9px] sm:text-[10px] flex items-center gap-1 ${playerColor}`}>
                              <span className="text-[7px]">♦</span>
                              {msg.playerName}:
                            </div>
                            <div className="text-white text-[9px] sm:text-[10px] break-words">{msg.message}</div>
                          </div>
                        )
                      })
                    )}
                  </div>
                  
                  {/* Input with send button inside */}
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      value={chatMessage}
                      onChange={(e) => setChatMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder="Type message..."
                      className="w-full bg-black/60 text-white px-3 pr-12 py-2.5 rounded-lg text-xs sm:text-sm border-2 border-green-600/50 focus:outline-none focus:border-green-400 placeholder-gray-500"
                      maxLength={50}
                    />
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={handleSendMessage}
                      className="absolute right-2 bg-gradient-to-br from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white p-2 rounded-lg transition-all shadow-lg"
                    >
                      <Send size={18} />
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Speech Bubbles now rendered inside each player component above */}

            {/* Circular Timer - Fixed at Top-Right Corner of Screen */}
            <AnimatePresence>
              {turnTimer.active && (() => {
                const progress = (visualTimeLeft / (turnTimer.totalDuration / 1000)) * 100;
                const circumference = 2 * Math.PI * 45; // radius = 45
                const strokeDashoffset = circumference - (progress / 100) * circumference;
                
                // Color based on time remaining
                const getStrokeColor = () => {
                  if (visualTimeLeft > 15) return '#22c55e'; // Green
                  if (visualTimeLeft > 10) return '#f97316'; // Orange
                  return '#dc2626'; // Red
                };
                
                const getGlowColor = () => {
                  if (visualTimeLeft > 15) return 'rgba(34, 197, 94, 0.6)';
                  if (visualTimeLeft > 10) return 'rgba(249, 115, 22, 0.6)';
                  return 'rgba(220, 38, 38, 0.6)';
                };
                
                return (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ 
                      scale: 1, 
                      opacity: 1,
                      x: (visualTimeLeft <= 5 && visualTimeLeft > 0) ? [-2, 2, -2, 2, 0] : 0,
                      y: (visualTimeLeft <= 5 && visualTimeLeft > 0) ? [-1, 1, -1, 1, 0] : 0
                    }}
                    exit={{ scale: 0, opacity: 0 }}
                    className="fixed top-16 right-4 mobile-landscape:top-12 mobile-landscape:right-2 z-40"
                    transition={{
                      scale: { duration: 0.3 },
                      opacity: { duration: 0.3 },
                      x: { duration: 0.3, repeat: (visualTimeLeft <= 5 && visualTimeLeft > 0) ? Infinity : 0, repeatType: "reverse" },
                      y: { duration: 0.3, repeat: (visualTimeLeft <= 5 && visualTimeLeft > 0) ? Infinity : 0, repeatType: "reverse" }
                    }}
                  >
                    <div className="relative w-16 h-16 sm:w-20 sm:h-20 mobile-landscape:w-14 mobile-landscape:h-14">
                      {/* Background circle */}
                      <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                        <circle
                          cx="50%"
                          cy="50%"
                          r="45"
                          fill="rgba(0, 0, 0, 0.8)"
                          stroke="rgba(255, 255, 255, 0.2)"
                          strokeWidth="3"
                        />
                        {/* Progress circle */}
                        <circle
                          cx="50%"
                          cy="50%"
                          r="45"
                          fill="none"
                          stroke={getStrokeColor()}
                          strokeWidth="4"
                          strokeDasharray={circumference}
                          strokeDashoffset={strokeDashoffset}
                          strokeLinecap="round"
                          style={{
                            transition: 'stroke-dashoffset 0.1s linear, stroke 0.3s ease',
                            filter: `drop-shadow(0 0 8px ${getGlowColor()})`
                          }}
                        />
                      </svg>
                      {/* Timer text */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-2xl sm:text-3xl font-bold text-white">{Math.ceil(visualTimeLeft)}</span>
                        <span className="text-[10px] sm:text-xs text-white/60">seconds</span>
                      </div>
                    </div>
                  </motion.div>
                );
              })()}
            </AnimatePresence>

            {/* Join Notification - Top Center */}
            <AnimatePresence>
              {joinNotification && (
                <motion.div
                  initial={{ opacity: 0, y: -50, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -50, scale: 0.8 }}
                  transition={{ type: "spring", duration: 0.5 }}
                  className="fixed top-16 sm:top-20 left-1/2 -translate-x-1/2 z-50 pointer-events-none w-[90vw] sm:w-[calc(100%-2rem)] max-w-md px-4 sm:px-0"
                >
                  <div className="bg-gradient-to-r from-green-600 via-green-500 to-green-600 text-white px-6 py-3 sm:px-8 sm:py-4 rounded-2xl shadow-2xl border-2 border-yellow-400 backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                      <motion.div
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{ duration: 0.5, repeat: 3 }}
                        className="text-2xl sm:text-3xl"
                      >
                        🎰
                      </motion.div>
                      <div>
                        <div className="font-bold text-lg sm:text-xl text-yellow-200">
                          {joinNotification.playerName} joined!
                        </div>
                        <div className="text-sm text-green-100">
                          Welcome to the table
                        </div>
                      </div>
                      <motion.div
                        animate={{ rotate: [0, -10, 10, 0] }}
                        transition={{ duration: 0.5, repeat: 3 }}
                        className="text-2xl sm:text-3xl"
                      >
                        🃏
                      </motion.div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Action History Panel */}
            <ActionHistory 
              actions={actionHistoryList} 
              isVisible={showActionHistory && !isAdminView}
              onToggle={() => setShowActionHistory(!showActionHistory)}
            />

            {/* Reconnection Indicator */}
            <AnimatePresence>
              {(!socketConnected || reconnecting) && (
                <motion.div
                  initial={{ opacity: 0, y: -50 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -50 }}
                  className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] bg-yellow-600 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3"
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    ⚡
                  </motion.div>
                  <span className="font-semibold">
                    {reconnecting ? 'Reconnecting...' : 'Connection Lost'}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>
      </div>
      </div>
    </div>
  )
}