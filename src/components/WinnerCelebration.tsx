'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { soundManager } from '../utils/sounds'

interface WinnerCelebrationProps {
  isVisible: boolean
  winnerName: string
  amount: number
  potX: number
  potY: number
  winnerX: number
  winnerY: number
  onComplete?: () => void
}

interface Confetti {
  id: number
  x: number
  y: number
  color: string
  rotation: number
  scale: number
}

export default function WinnerCelebration({
  isVisible,
  winnerName,
  amount,
  potX,
  potY,
  winnerX,
  winnerY,
  onComplete
}: WinnerCelebrationProps) {
  const [confetti, setConfetti] = useState<Confetti[]>([])
  const [showChips, setShowChips] = useState(false)

  useEffect(() => {
    if (!isVisible) {
      setConfetti([])
      setShowChips(false)
      return
    }

    // Play victory sound
    soundManager.playVictory()

    // Generate confetti particles
    const particles: Confetti[] = []
    const colors = ['#FFD700', '#FFA500', '#FF4500', '#00FF00', '#0000FF', '#FF00FF', '#FFFF00']
    
    for (let i = 0; i < 50; i++) {
      particles.push({
        id: i,
        x: potX + (Math.random() - 0.5) * 300,
        y: potY - Math.random() * 200,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        scale: 0.5 + Math.random() * 0.5
      })
    }
    
    setConfetti(particles)

    // Show chip collection animation after brief delay
    setTimeout(() => {
      setShowChips(true)
      soundManager.playChipCollect()
    }, 500)

    // Clear after animation
    const timer = setTimeout(() => {
      setConfetti([])
      setShowChips(false)
      if (onComplete) onComplete()
    }, 3000)

    return () => clearTimeout(timer)
  }, [isVisible, winnerName, amount, potX, potY, winnerX, winnerY, onComplete])

  return (
    <div className="fixed inset-0 pointer-events-none z-[150]">
      {/* Winner Banner */}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ scale: 0, y: -100, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ 
              type: "spring", 
              stiffness: 200, 
              damping: 15,
              delay: 0.2
            }}
            className="absolute top-[15%] left-1/2 transform -translate-x-1/2 landscape:top-[10%]"
          >
            <div className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 text-black px-8 py-4 rounded-2xl shadow-2xl border-4 border-yellow-300 landscape:px-6 landscape:py-3">
              <div className="text-center">
                <div className="text-3xl font-bold mb-2 landscape:text-2xl landscape:mb-1">🏆 WINNER! 🏆</div>
                <div className="text-2xl font-bold landscape:text-xl">{winnerName}</div>
                <div className="text-xl text-green-900 font-bold mt-2 landscape:text-lg landscape:mt-1">
                  +${amount.toLocaleString()}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confetti Particles */}
      <AnimatePresence>
        {confetti.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute w-3 h-3 landscape:w-2 landscape:h-2"
            initial={{
              x: potX,
              y: potY,
              scale: 0,
              opacity: 1,
              rotate: 0
            }}
            animate={{
              x: particle.x,
              y: particle.y + 300,
              scale: particle.scale,
              opacity: [1, 1, 0],
              rotate: particle.rotation + 720
            }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 2,
              ease: "easeOut"
            }}
            style={{
              backgroundColor: particle.color,
              borderRadius: '2px',
              boxShadow: `0 0 10px ${particle.color}`
            }}
          />
        ))}
      </AnimatePresence>

      {/* Chip Collection Animation */}
      <AnimatePresence>
        {showChips && (
          <>
            {Array.from({ length: 15 }).map((_, i) => (
              <motion.div
                key={`chip-${i}`}
                className="absolute rounded-full border-2 border-white/40"
                initial={{
                  x: potX + (Math.random() - 0.5) * 100,
                  y: potY + (Math.random() - 0.5) * 100,
                  scale: 1,
                  opacity: 1
                }}
                animate={{
                  x: [
                    potX + (Math.random() - 0.5) * 100,
                    winnerX + (Math.random() - 0.5) * 30,
                    winnerX
                  ],
                  y: [
                    potY + (Math.random() - 0.5) * 100,
                    winnerY - 80,
                    winnerY
                  ],
                  scale: [1, 1.2, 0.5],
                  opacity: [1, 1, 0]
                }}
                exit={{ opacity: 0 }}
                transition={{
                  duration: 1.2,
                  delay: i * 0.05,
                  times: [0, 0.6, 1],
                  ease: [0.34, 1.56, 0.64, 1]
                }}
                style={{
                  width: '24px',
                  height: '24px',
                  backgroundColor: ['#ef4444', '#3b82f6', '#10b981', '#a855f7', '#f59e0b'][i % 5],
                  boxShadow: '0 4px 8px rgba(0,0,0,0.4), inset 0 2px 4px rgba(255,255,255,0.4)'
                }}
              />
            ))}
            
            {/* Sparkle effect at winner */}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ 
                scale: [1, 2, 1],
                opacity: [1, 0.5, 0],
                rotate: [0, 180, 360]
              }}
              transition={{ 
                duration: 1.5,
                repeat: 2
              }}
              className="absolute"
              style={{
                left: winnerX - 40,
                top: winnerY - 40,
                width: '80px',
                height: '80px'
              }}
            >
              <div className="relative w-full h-full">
                <div className="absolute inset-0 rounded-full border-4 border-yellow-400 animate-ping" />
                <div className="absolute inset-0 rounded-full bg-yellow-400/30 blur-xl" />
                <div className="absolute inset-0 flex items-center justify-center text-4xl">⭐</div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Spotlight effect on winner */}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute rounded-full blur-3xl pointer-events-none landscape:blur-2xl"
            style={{
              left: winnerX - 150,
              top: winnerY - 150,
              width: '300px',
              height: '300px',
              background: 'radial-gradient(circle, rgba(255,215,0,0.6) 0%, transparent 70%)'
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
