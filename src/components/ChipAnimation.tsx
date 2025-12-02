'use client'

import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { soundManager } from '../utils/sounds'

interface ChipAnimationProps {
  fromX: number
  fromY: number
  toX: number
  toY: number
  amount: number
  isActive: boolean
  onComplete?: () => void
}

interface FlyingChip {
  id: number
  color: string
  delay: number
  value: number
}

export default function ChipAnimation({
  fromX,
  fromY,
  toX,
  toY,
  amount,
  isActive,
  onComplete
}: ChipAnimationProps) {
  const [chips, setChips] = useState<FlyingChip[]>([])
  const [showStackAnimation, setShowStackAnimation] = useState(false)
  const onCompleteRef = useRef(onComplete)

  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  useEffect(() => {
    if (!isActive) {
      setChips([])
      setShowStackAnimation(false)
      return
    }

    // Determine chip colors and values based on amount
    const chipData: { color: string; value: number }[] = []
    let remaining = amount

    // Purple chips ($500)
    while (remaining >= 500 && chipData.length < 10) {
      chipData.push({ color: '#a855f7', value: 500 })
      remaining -= 500
    }
    // Black chips ($100)
    while (remaining >= 100 && chipData.length < 10) {
      chipData.push({ color: '#1f2937', value: 100 })
      remaining -= 100
    }
    // Green chips ($25)
    while (remaining >= 25 && chipData.length < 10) {
      chipData.push({ color: '#10b981', value: 25 })
      remaining -= 25
    }
    // Blue chips ($10)
    while (remaining >= 10 && chipData.length < 10) {
      chipData.push({ color: '#3b82f6', value: 10 })
      remaining -= 10
    }
    // Red chips ($5)
    while (remaining >= 5 && chipData.length < 10) {
      chipData.push({ color: '#ef4444', value: 5 })
      remaining -= 5
    }
    // White chips ($1) for remainder
    while (remaining > 0 && chipData.length < 10) {
      chipData.push({ color: '#ffffff', value: Math.min(remaining, 1) })
      remaining -= Math.min(remaining, 1)
    }

    const flyingChips: FlyingChip[] = chipData.map((chip, i) => ({
      id: i,
      color: chip.color,
      value: chip.value,
      delay: i * 0.08 // Faster sequence
    }))

    setChips(flyingChips)

    // Play chip clink sound for first chip
    // DISABLED: Too many beeps for large amounts
    // setTimeout(() => {
    //   soundManager.playChipClink()
    // }, 100)

    // Play stacking sound when chips arrive
    // DISABLED: Too many beeps for large amounts
    setTimeout(() => {
      // soundManager.playChipStack()
      setShowStackAnimation(true)
    }, 800 + flyingChips.length * 80)

    // Clear after animation completes
    const timer = setTimeout(() => {
      setChips([])
      setShowStackAnimation(false)
      if (onCompleteRef.current) onCompleteRef.current()
    }, 1500)

    return () => clearTimeout(timer)
  }, [isActive, amount])

  return (
    <div className="fixed inset-0 pointer-events-none z-10">
      <AnimatePresence>
        {chips.map((chip, index) => (
          <motion.div
            key={chip.id}
            className="absolute rounded-full border-2 border-white/40 shadow-2xl"
            initial={{ 
              x: fromX, 
              y: fromY, 
              scale: 1,
              opacity: 1,
              rotateY: 0
            }}
            animate={{
              x: [fromX, fromX + (toX - fromX) * 0.3, toX],
              y: [fromY, fromY - 100, toY], // Arc trajectory
              scale: [1, 1.2, 0.8],
              opacity: [1, 1, 0.8],
              rotateY: [0, 720, 720], // 3D flip effect
            }}
            exit={{ opacity: 0, scale: 0 }}
            transition={{
              duration: 0.9,
              delay: chip.delay,
              times: [0, 0.5, 1],
              ease: [0.34, 1.56, 0.64, 1] // Bounce easing
            }}
            style={{
              width: '32px',
              height: '32px',
              backgroundColor: chip.color,
              boxShadow: `0 4px 8px rgba(0,0,0,0.4), inset 0 2px 4px rgba(255,255,255,0.4), 0 0 20px ${chip.color}60`,
              transform: 'translateZ(0)', // Enable 3D
              perspective: '1000px'
            }}
          >
            {/* Chip value label */}
            <div className="absolute inset-0 flex items-center justify-center text-white text-[8px] font-bold landscape:text-[6px]">
              ${chip.value}
            </div>
            {/* Chip shine effect */}
            <div 
              className="absolute inset-0 rounded-full"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.6) 0%, transparent 50%, rgba(0,0,0,0.3) 100%)'
              }}
            />
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Stack animation at destination */}
      <AnimatePresence>
        {showStackAnimation && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ 
              scale: [1, 1.3, 1],
              opacity: [1, 1, 0]
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="absolute pointer-events-none"
            style={{
              left: toX - 20,
              top: toY - 20,
              width: '40px',
              height: '40px'
            }}
          >
            <div className="relative w-full h-full">
              {/* Glow ring */}
              <div className="absolute inset-0 rounded-full border-4 border-yellow-400 animate-ping" />
              <div className="absolute inset-0 rounded-full bg-yellow-400/30 blur-xl" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
