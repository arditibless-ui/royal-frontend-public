// Smart Poker Bot AI System

export interface Card {
  suit: string
  rank: string
}

export interface Player {
  _id: string
  username: string
  chips: number
  cards?: Card[]
  position: number
  status: string
  isBot?: boolean
  isReady?: boolean
  currentBet?: number
  folded?: boolean
}

export interface GameState {
  round: 'preflop' | 'flop' | 'turn' | 'river' | 'showdown'
  communityCards: Card[]
  currentBet: number
  currentPlayer: number
  pot: number
  dealerPosition: number
  smallBlind: number
  bigBlind: number
}

// Hand strength calculator (simplified)
function evaluateHandStrength(playerCards: Card[], communityCards: Card[]): number {
  const allCards = [...playerCards, ...communityCards]
  const ranks = allCards.map(c => c.rank)
  const suits = allCards.map(c => c.suit)
  
  // Count pairs, trips, etc.
  const rankCounts: { [key: string]: number } = {}
  ranks.forEach(rank => {
    rankCounts[rank] = (rankCounts[rank] || 0) + 1
  })
  
  const counts = Object.values(rankCounts).sort((a, b) => b - a)
  const hasFlush = suits.some(suit => suits.filter(s => s === suit).length >= 5)
  
  // Simplified scoring
  if (counts[0] === 4) return 8 // Four of a kind
  if (counts[0] === 3 && counts[1] === 2) return 7 // Full house
  if (hasFlush) return 6 // Flush
  if (counts[0] === 3) return 4 // Three of a kind
  if (counts[0] === 2 && counts[1] === 2) return 3 // Two pair
  if (counts[0] === 2) return 2 // One pair
  
  // High card value
  const highCardValues: { [key: string]: number } = {
    '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
    'J': 11, 'Q': 12, 'K': 13, 'A': 14
  }
  const maxCard = Math.max(...ranks.map(r => highCardValues[r] || 0))
  return maxCard / 14 // 0-1 range for high card
}

export class PokerBotAI {
  private personality: 'aggressive' | 'conservative' | 'balanced'
  
  constructor(personality: 'aggressive' | 'conservative' | 'balanced' = 'balanced') {
    this.personality = personality
  }
  
  // Decide bot action
  makeDecision(
    player: Player,
    gameState: GameState,
    players: Player[]
  ): { action: 'fold' | 'call' | 'raise' | 'check' | 'all-in', amount?: number } {
    
    if (!player.cards || player.cards.length < 2) {
      return { action: 'fold' }
    }
    
    const handStrength = evaluateHandStrength(player.cards, gameState.communityCards)
    const potOdds = gameState.pot > 0 ? gameState.currentBet / (gameState.pot + gameState.currentBet) : 0
    const chipRatio = player.chips / 1000 // Assuming starting chips = 1000
    const activePlayers = players.filter(p => !p.folded && p.status === 'active').length
    
    // Personality modifiers
    let aggressionFactor = 1.0
    let conservativeFactor = 1.0
    
    if (this.personality === 'aggressive') {
      aggressionFactor = 1.5
      conservativeFactor = 0.7
    } else if (this.personality === 'conservative') {
      aggressionFactor = 0.7
      conservativeFactor = 1.3
    }
    
    // Decision threshold
    const threshold = handStrength * aggressionFactor
    
    // Pre-flop strategy
    if (gameState.round === 'preflop') {
      const card1Value = this.getCardValue(player.cards[0].rank)
      const card2Value = this.getCardValue(player.cards[1].rank)
      const isPair = card1Value === card2Value
      const isHighCards = card1Value >= 11 && card2Value >= 11
      
      if (isPair || isHighCards) {
        if (Math.random() < 0.7 * aggressionFactor) {
          const raiseAmount = gameState.bigBlind * (2 + Math.floor(Math.random() * 3))
          return { action: 'raise', amount: Math.min(raiseAmount, player.chips) }
        }
        return { action: 'call' }
      }
      
      if (handStrength > 0.6 * conservativeFactor) {
        return { action: 'call' }
      }
      
      return { action: 'fold' }
    }
    
    // Post-flop strategy
    if (gameState.currentBet === 0) {
      // No bet to us
      if (handStrength > 0.7) {
        const betAmount = Math.floor(gameState.pot * (0.3 + Math.random() * 0.4))
        return { action: 'raise', amount: Math.min(betAmount, player.chips) }
      }
      return { action: 'check' }
    }
    
    // There's a bet to us
    const callCost = gameState.currentBet - (player.currentBet || 0)
    
    // Strong hand
    if (handStrength > 0.75 * conservativeFactor) {
      if (Math.random() < 0.6 * aggressionFactor) {
        const raiseAmount = gameState.currentBet * (2 + Math.floor(Math.random() * 2))
        return { action: 'raise', amount: Math.min(raiseAmount, player.chips) }
      }
      return { action: 'call' }
    }
    
    // Medium hand
    if (handStrength > 0.5 * conservativeFactor) {
      if (callCost < player.chips * 0.2) {
        return { action: 'call' }
      }
      if (Math.random() < 0.3) {
        return { action: 'call' }
      }
      return { action: 'fold' }
    }
    
    // Weak hand
    if (handStrength > 0.3 && callCost < player.chips * 0.1) {
      if (Math.random() < 0.4) {
        return { action: 'call' }
      }
    }
    
    // Bluff occasionally
    if (this.personality === 'aggressive' && Math.random() < 0.15 && activePlayers <= 3) {
      const bluffAmount = Math.floor(gameState.pot * 0.5)
      return { action: 'raise', amount: Math.min(bluffAmount, player.chips * 0.3) }
    }
    
    return { action: 'fold' }
  }
  
  private getCardValue(rank: string): number {
    const values: { [key: string]: number } = {
      '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
      'J': 11, 'Q': 12, 'K': 13, 'A': 14
    }
    return values[rank] || 0
  }
}

// Simulate game progression
export function simulatePokerGame(players: Player[], gameState: GameState): {
  players: Player[]
  gameState: GameState
  actions: string[]
} {
  const actions: string[] = []
  const updatedPlayers = [...players]
  const updatedGameState = { ...gameState }
  
  // Create bots with different personalities
  const bots = [
    new PokerBotAI('aggressive'),
    new PokerBotAI('conservative'),
    new PokerBotAI('balanced'),
    new PokerBotAI('balanced')
  ]
  
  // Simulate one action
  const currentPlayerIndex = updatedPlayers.findIndex((_, i) => i === gameState.currentPlayer)
  if (currentPlayerIndex === -1) return { players: updatedPlayers, gameState: updatedGameState, actions }
  
  const currentPlayer = updatedPlayers[currentPlayerIndex]
  if (!currentPlayer || currentPlayer.folded) {
    // Move to next player
    updatedGameState.currentPlayer = (gameState.currentPlayer + 1) % players.length
    return { players: updatedPlayers, gameState: updatedGameState, actions }
  }
  
  const bot = bots[currentPlayerIndex % bots.length]
  const decision = bot.makeDecision(currentPlayer, gameState, updatedPlayers)
  
  // Apply decision
  switch (decision.action) {
    case 'fold':
      currentPlayer.folded = true
      currentPlayer.status = 'folded'
      actions.push(`${currentPlayer.username} folds`)
      break
      
    case 'check':
      actions.push(`${currentPlayer.username} checks`)
      break
      
    case 'call':
      const callAmount = gameState.currentBet - (currentPlayer.currentBet || 0)
      currentPlayer.chips -= callAmount
      currentPlayer.currentBet = gameState.currentBet
      updatedGameState.pot += callAmount
      actions.push(`${currentPlayer.username} calls ${callAmount}`)
      break
      
    case 'raise':
      const raiseAmount = decision.amount || gameState.bigBlind * 2
      currentPlayer.chips -= raiseAmount
      currentPlayer.currentBet = (currentPlayer.currentBet || 0) + raiseAmount
      updatedGameState.currentBet = currentPlayer.currentBet
      updatedGameState.pot += raiseAmount
      actions.push(`${currentPlayer.username} raises to ${raiseAmount}`)
      break
  }
  
  // Move to next player
  updatedGameState.currentPlayer = (gameState.currentPlayer + 1) % players.length
  
  return { players: updatedPlayers, gameState: updatedGameState, actions }
}
