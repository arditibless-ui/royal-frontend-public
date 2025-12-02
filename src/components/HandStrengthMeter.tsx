'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

interface HandStrengthMeterProps {
  playerCards: Array<{suit: string, rank: string}>
  communityCards: Array<{suit: string, rank: string}>
  isVisible: boolean
}

export default function HandStrengthMeter({ 
  playerCards, 
  communityCards, 
  isVisible 
}: HandStrengthMeterProps) {
  const [strength, setStrength] = useState(0)
  const [handDescription, setHandDescription] = useState('Waiting for cards...')
  const [winProbability, setWinProbability] = useState(0)

  useEffect(() => {
    if (!playerCards || playerCards.length < 2 || !isVisible) {
      setStrength(0)
      setHandDescription('Waiting for cards...')
      setWinProbability(0)
      return
    }

    // Simple hand strength calculation (simplified for demo)
    const calculateStrength = () => {
      const allCards = [...playerCards, ...communityCards]
      
      if (allCards.length < 2) {
        return { strength: 0, desc: 'Waiting for cards...', prob: 0 }
      }

      // Check for pairs, high cards, etc.
      const ranks = allCards.map(c => c.rank)
      const suits = allCards.map(c => c.suit)
      
      // Pair detection
      const rankCounts: {[key: string]: number} = {}
      ranks.forEach(r => {
        rankCounts[r] = (rankCounts[r] || 0) + 1
      })
      
      const hasPair = Object.values(rankCounts).some(count => count >= 2)
      const hasThreeKind = Object.values(rankCounts).some(count => count >= 3)
      const hasFourKind = Object.values(rankCounts).some(count => count >= 4)
      
      // Flush detection
      const suitCounts: {[key: string]: number} = {}
      suits.forEach(s => {
        suitCounts[s] = (suitCounts[s] || 0) + 1
      })
      const hasFlush = Object.values(suitCounts).some(count => count >= 5)
      
      // High card value
      const rankValues: {[key: string]: number} = {
        '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
        '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14
      }
      const highCard = Math.max(...ranks.map(r => rankValues[r] || 0))
      
      let strength = 0
      let desc = ''
      let prob = 0
      
      if (hasFourKind) {
        strength = 95
        desc = 'Four of a Kind!'
        prob = 98
      } else if (hasFlush) {
        strength = 85
        desc = 'Flush!'
        prob = 88
      } else if (hasThreeKind) {
        strength = 70
        desc = 'Three of a Kind'
        prob = 75
      } else if (hasPair) {
        strength = 50
        desc = 'Pair'
        prob = 55
      } else {
        strength = Math.min((highCard / 14) * 40, 40)
        desc = `High Card: ${ranks.find(r => rankValues[r] === highCard)}`
        prob = Math.min((highCard / 14) * 50, 50)
      }
      
      return { strength, desc, prob }
    }

    const result = calculateStrength()
    setStrength(result.strength)
    setHandDescription(result.desc)
    setWinProbability(result.prob)
  }, [playerCards, communityCards, isVisible])

  if (!isVisible) return null

  const strengthColor = 
    strength >= 80 ? 'bg-green-500' :
    strength >= 60 ? 'bg-yellow-500' :
    strength >= 40 ? 'bg-orange-500' :
    'bg-red-500'

  return (
    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/80 backdrop-blur-md rounded-lg p-3 min-w-[250px] z-[90]">
      <div className="text-white text-xs font-semibold mb-2">Hand Strength</div>
      
      {/* Strength Bar */}
      <div className="h-4 bg-gray-700 rounded-full overflow-hidden mb-2">
        <motion.div
          className={`h-full ${strengthColor} hand-strength-bar`}
          initial={{ width: 0 }}
          animate={{ width: `${strength}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
      
      {/* Hand Description */}
      <div className="text-white text-sm mb-1">{handDescription}</div>
      
      {/* Win Probability */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-400">Win Probability:</span>
        <motion.span 
          className="text-green-400 font-bold probability-tick"
          key={winProbability}
        >
          {winProbability.toFixed(0)}%
        </motion.span>
      </div>
    </div>
  )
}
