'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useEffect } from 'react'
import { soundManager } from '../utils/sounds'

interface AllInEffectProps {
  isVisible: boolean
  playerName: string
  amount: number
  onComplete?: () => void
}

export default function AllInEffect({
  isVisible,
  playerName,
  amount,
  onComplete
}: AllInEffectProps) {
  useEffect(() => {
    if (isVisible) {
      soundManager.playAllIn()
      
      // Auto-complete after 2 seconds
      const timer = setTimeout(() => {
        if (onComplete) onComplete()
      }, 2000)
      
      return () => clearTimeout(timer)
    }
  }, [isVisible, onComplete])

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Screen shake effect (simulated with overlay movement) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: [0.3, 0, 0.3, 0],
              x: [0, -5, 5, -5, 5, 0],
              y: [0, 5, -5, 5, -5, 0]
            }}
            exit={{ opacity: 0 }}
            transition={{ 
              duration: 0.5,
              times: [0, 0.25, 0.5, 0.75, 1],
              ease: "easeInOut"
            }}
            className="fixed inset-0 bg-red-600 pointer-events-none z-[140]"
          />

          {/* Radial burst effect */}
          <motion.div
            initial={{ scale: 0, opacity: 1 }}
            animate={{ 
              scale: 3,
              opacity: 0
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-[141]"
          >
            <div 
              className="w-96 h-96 rounded-full landscape:w-64 landscape:h-64"
              style={{
                background: 'radial-gradient(circle, rgba(239,68,68,0.8) 0%, rgba(239,68,68,0.4) 40%, transparent 70%)',
                boxShadow: '0 0 100px rgba(239,68,68,0.8)'
              }}
            />
          </motion.div>

          {/* ALL IN text banner */}
          <motion.div
            initial={{ scale: 0, rotate: -180, opacity: 0 }}
            animate={{ 
              scale: [0, 1.2, 1],
              rotate: 0,
              opacity: 1
            }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ 
              type: "spring",
              stiffness: 200,
              damping: 15
            }}
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-[142]"
          >
            <div className="relative">
              {/* Glow background */}
              <div className="absolute inset-0 bg-red-600 blur-2xl opacity-60 animate-pulse" />
              
              {/* Main banner */}
              <div className="relative bg-gradient-to-r from-red-600 via-red-500 to-red-600 text-white px-12 py-6 rounded-2xl shadow-2xl border-4 border-red-400 landscape:px-8 landscape:py-4">
                <div className="text-center">
                  <div className="text-5xl font-black mb-2 tracking-wider landscape:text-3xl landscape:mb-1" 
                    style={{ textShadow: '0 4px 8px rgba(0,0,0,0.5), 0 0 20px rgba(255,255,255,0.5)' }}>
                    🎰 ALL IN! 🎰
                  </div>
                  <div className="text-2xl font-bold landscape:text-xl">{playerName}</div>
                  <div className="text-3xl font-black mt-2 text-yellow-300 landscape:text-2xl landscape:mt-1">
                    ${amount.toLocaleString()}
                  </div>
                </div>
                
                {/* Animated border sparkles */}
                {[0, 1, 2, 3].map((i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{
                      duration: 0.8,
                      repeat: Infinity,
                      delay: i * 0.2
                    }}
                    className="absolute w-4 h-4 bg-yellow-300 rounded-full landscape:w-3 landscape:h-3"
                    style={{
                      top: i % 2 === 0 ? '-8px' : 'auto',
                      bottom: i % 2 === 1 ? '-8px' : 'auto',
                      left: i < 2 ? '-8px' : 'auto',
                      right: i >= 2 ? '-8px' : 'auto'
                    }}
                  />
                ))}
              </div>
            </div>
          </motion.div>

          {/* Lightning bolts from corners */}
          {[
            { from: 'top-0 left-0', angle: 45 },
            { from: 'top-0 right-0', angle: -45 },
            { from: 'bottom-0 left-0', angle: -45 },
            { from: 'bottom-0 right-0', angle: 45 }
          ].map((pos, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ 
                opacity: [0, 1, 0],
                scale: [0, 1, 0]
              }}
              transition={{
                duration: 0.6,
                times: [0, 0.5, 1],
                delay: index * 0.1
              }}
              className={`fixed ${pos.from} w-32 h-32 landscape:w-24 landscape:h-24 pointer-events-none z-[141]`}
            >
              <div 
                className="w-full h-full text-yellow-300 text-6xl landscape:text-4xl flex items-center justify-center"
                style={{ transform: `rotate(${pos.angle}deg)` }}
              >
                ⚡
              </div>
            </motion.div>
          ))}
        </>
      )}
    </AnimatePresence>
  )
}
