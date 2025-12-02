'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useEffect } from 'react'
import { soundManager } from '../utils/sounds'

interface CardBurnAnimationProps {
  isVisible: boolean
  dealerX: number
  dealerY: number
  onComplete?: () => void
}

export default function CardBurnAnimation({
  isVisible,
  dealerX,
  dealerY,
  onComplete
}: CardBurnAnimationProps) {
  useEffect(() => {
    if (isVisible) {
      soundManager.playCardDeal()
      
      const timer = setTimeout(() => {
        if (onComplete) onComplete()
      }, 800)
      
      return () => clearTimeout(timer)
    }
  }, [isVisible, onComplete])

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ 
            x: dealerX,
            y: dealerY,
            scale: 0.5,
            rotateZ: 0,
            opacity: 1
          }}
          animate={{
            x: [dealerX, dealerX + 100, dealerX + 150],
            y: [dealerY, dealerY, dealerY + 50],
            scale: [0.5, 0.8, 0.3],
            rotateZ: [0, 180, 360],
            opacity: [1, 0.8, 0]
          }}
          exit={{ opacity: 0 }}
          transition={{
            duration: 0.8,
            times: [0, 0.6, 1],
            ease: "easeOut"
          }}
          className="fixed pointer-events-none z-30"
        >
          {/* Burn card (face down) */}
          <div className="relative w-12 h-16 md:w-16 md:h-24 bg-gradient-to-br from-red-700 to-red-900 rounded-lg border-2 border-red-800 shadow-2xl landscape:w-10 landscape:h-14">
            {/* Card back pattern */}
            <div className="absolute inset-1 flex items-center justify-center">
              <div className="w-full h-full bg-red-800 rounded"
                style={{
                  backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 20px)'
                }}
              />
            </div>
            
            {/* Burn effect */}
            <motion.div
              animate={{
                scale: [1, 1.5, 2],
                opacity: [0.8, 0.4, 0]
              }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="absolute inset-0 rounded-lg bg-orange-500 blur-sm"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
