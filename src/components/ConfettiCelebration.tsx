'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface ConfettiCelebrationProps {
  isActive: boolean
  duration?: number
}

interface Confetti {
  id: number
  left: string
  color: string
  delay: number
  drift: number
}

export default function ConfettiCelebration({ isActive, duration = 3000 }: ConfettiCelebrationProps) {
  const [confetti, setConfetti] = useState<Confetti[]>([])

  useEffect(() => {
    if (!isActive) {
      setConfetti([])
      return
    }

    // Generate confetti particles
    const colors = ['#fbbf24', '#ef4444', '#3b82f6', '#10b981', '#a855f7', '#f97316']
    const particles: Confetti[] = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      color: colors[Math.floor(Math.random() * colors.length)],
      delay: Math.random() * 0.5,
      drift: (Math.random() - 0.5) * 200
    }))

    setConfetti(particles)

    const timer = setTimeout(() => {
      setConfetti([])
    }, duration)

    return () => clearTimeout(timer)
  }, [isActive, duration])

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999]" style={{ overflow: 'hidden' }}>
      <AnimatePresence>
        {confetti.map((particle) => (
          <motion.div
            key={particle.id}
            className="confetti-particle absolute"
            initial={{ y: -100, x: 0, rotate: 0, opacity: 1 }}
            animate={{
              y: window.innerHeight + 100,
              x: particle.drift,
              rotate: 1080,
              opacity: 0
            }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 3,
              delay: particle.delay,
              ease: "easeOut"
            }}
            style={{
              left: particle.left,
              top: 0,
              width: '10px',
              height: '10px',
              backgroundColor: particle.color,
              borderRadius: Math.random() > 0.5 ? '50%' : '0',
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}
