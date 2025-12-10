'use client'

import { useEffect, useState, useRef } from 'react'
import { Coins } from 'lucide-react'

interface AnimatedChipCountProps {
  value: number
  className?: string
  iconSize?: number
  duration?: number // Animation duration in milliseconds
  isCurrentPlayer?: boolean
}

export default function AnimatedChipCount({ 
  value, 
  className = '', 
  iconSize = 16,
  duration = 600,
  isCurrentPlayer = false
}: AnimatedChipCountProps) {
  const [displayValue, setDisplayValue] = useState(value)
  const [isAnimating, setIsAnimating] = useState(false)
  const previousValueRef = useRef(value)
  const animationFrameRef = useRef<number>()
  const startTimeRef = useRef<number>()

  useEffect(() => {
    // If value changed, animate from previous to new value
    if (value !== previousValueRef.current) {
      setIsAnimating(true)
      const startValue = previousValueRef.current
      const endValue = value
      const difference = endValue - startValue

      // Cancel any existing animation
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }

      // Start animation
      const animate = (currentTime: number) => {
        if (!startTimeRef.current) {
          startTimeRef.current = currentTime
        }

        const elapsed = currentTime - startTimeRef.current
        const progress = Math.min(elapsed / duration, 1)

        // Easing function (ease-out cubic for smooth deceleration)
        const easeProgress = 1 - Math.pow(1 - progress, 3)

        // Calculate current display value
        const currentValue = startValue + (difference * easeProgress)
        setDisplayValue(Math.round(currentValue))

        if (progress < 1) {
          animationFrameRef.current = requestAnimationFrame(animate)
        } else {
          setDisplayValue(endValue)
          setIsAnimating(false)
          startTimeRef.current = undefined
          previousValueRef.current = endValue
        }
      }

      animationFrameRef.current = requestAnimationFrame(animate)

      // Cleanup
      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current)
        }
      }
    } else {
      previousValueRef.current = value
    }
  }, [value, duration])

  // Determine if chips increased or decreased for color flash effect
  const chipChange = value - previousValueRef.current
  const isIncrease = chipChange > 0
  const isDecrease = chipChange < 0

  return (
    <div className={`flex items-center justify-center gap-1.5 text-sm sm:text-base md:text-xl font-bold transition-all ${
      isCurrentPlayer
        ? 'text-yellow-300 drop-shadow-[0_0_8px_rgba(253,224,71,0.8)]'
        : 'text-yellow-400 drop-shadow-md'
    } ${className}`}>
      <Coins 
        size={iconSize} 
        className={`sm:w-[18px] sm:h-[18px] md:w-[22px] md:h-[22px] transition-all duration-300 ${
          isAnimating ? 'animate-pulse scale-110' : ''
        }`} 
      />
      <span className={`tracking-wide transition-all duration-200 ${
        isAnimating && isIncrease ? 'text-green-400 scale-105' : ''
      } ${
        isAnimating && isDecrease ? 'text-red-400 scale-95' : ''
      }`}>
        ${displayValue.toLocaleString()}
      </span>
      
      {/* Flash effect on chip change */}
      {isAnimating && (
        <span className={`absolute inset-0 pointer-events-none animate-ping ${
          isIncrease ? 'bg-green-400/20' : 'bg-red-400/20'
        } rounded-full`} style={{ animationDuration: '0.6s', animationIterationCount: 1 }} />
      )}
    </div>
  )
}
