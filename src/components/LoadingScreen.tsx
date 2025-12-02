'use client'

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import Image from 'next/image'

interface LoadingScreenProps {
  onComplete?: () => void
  duration?: number // milliseconds
  message?: string
}

export default function LoadingScreen({ 
  onComplete, 
  duration = 3000,
  message = "Loading Game..."
}: LoadingScreenProps) {
  const [progress, setProgress] = useState(0)
  const [showContent, setShowContent] = useState(false)

  useEffect(() => {
    // Show content after initial animation
    const showTimer = setTimeout(() => setShowContent(true), 300)

    // Smooth progress animation
    const startTime = Date.now()
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime
      const newProgress = Math.min((elapsed / duration) * 100, 100)
      setProgress(newProgress)

      if (newProgress >= 100) {
        clearInterval(interval)
        setTimeout(() => {
          onComplete?.()
        }, 500)
      }
    }, 16) // ~60fps

    return () => {
      clearTimeout(showTimer)
      clearInterval(interval)
    }
  }, [duration, onComplete])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] flex items-center justify-center"
    >
      {/* Background Image */}
      <div className="absolute inset-0">
        <Image
          src="/backgrounds/poker-table-hd.png"
          alt="Background"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      </div>

      {/* Content */}
      {showContent && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="relative z-10 flex flex-col items-center gap-4 md:gap-8 px-4 md:px-6 
                     landscape:gap-3 landscape:py-4"
        >
          {/* Rotating Poker Chip */}
          <motion.div
            animate={{ 
              rotate: 360,
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              rotate: { duration: 2, repeat: Infinity, ease: "linear" },
              scale: { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
            }}
            className="relative w-24 h-24 md:w-40 md:h-40 
                       landscape:w-20 landscape:h-20"
          >
            {/* Outer ring */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-yellow-400 via-yellow-500 to-orange-500 shadow-2xl" />
            
            {/* Middle ring */}
            <div className="absolute inset-2 rounded-full bg-gradient-to-br from-gray-800 to-gray-900" />
            
            {/* Inner decorations */}
            <div className="absolute inset-4 rounded-full bg-gradient-to-br from-yellow-400 via-yellow-500 to-orange-500 flex items-center justify-center">
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="text-4xl md:text-5xl font-bold text-gray-900"
              >
                $
              </motion.div>
            </div>

            {/* Edge details (white dots) */}
            {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
              const isMobile = typeof window !== 'undefined' && window.innerWidth < 768
              const isLandscape = typeof window !== 'undefined' && window.innerWidth > window.innerHeight
              const distance = isLandscape && isMobile ? '-40px' : isMobile ? '-48px' : '-60px'
              
              return (
                <div
                  key={angle}
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: `translate(-50%, -50%) rotate(${angle}deg) translateY(${distance})`,
                  }}
                  className="w-2 h-2 md:w-4 md:h-4 landscape:w-2 landscape:h-2 rounded-full bg-white"
                />
              )
            })}
          </motion.div>

          {/* Loading Text */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-center"
          >
            <h2 className="text-2xl md:text-4xl font-bold text-white mb-1 md:mb-2 drop-shadow-lg
                           landscape:text-xl landscape:mb-1">
              {message}
            </h2>
            <p className="text-yellow-300 text-base md:text-xl font-medium
                          landscape:text-sm">
              {Math.round(progress)}%
            </p>
          </motion.div>

          {/* Loading Bar Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className="w-full max-w-md landscape:max-w-sm"
          >
            {/* Outer container with glow */}
            <div className="relative bg-gray-800/80 backdrop-blur-xl rounded-full p-1.5 md:p-2 shadow-2xl border-2 border-yellow-500/30
                            landscape:p-1">
              {/* Progress bar track */}
              <div className="relative h-6 md:h-10 bg-gray-900/90 rounded-full overflow-hidden
                              landscape:h-5">
                {/* Animated fill with poker chip pattern */}
                <motion.div
                  initial={{ width: '0%' }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-yellow-400 via-yellow-500 to-orange-500 rounded-full"
                  style={{
                    boxShadow: '0 0 20px rgba(251, 191, 36, 0.5)',
                  }}
                >
                  {/* Moving shine effect */}
                  <motion.div
                    animate={{ x: ['0%', '200%'] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                    style={{ width: '50%' }}
                  />

                  {/* Mini poker chips inside bar */}
                  <div className="absolute inset-0 flex items-center justify-end pr-1.5 md:pr-2
                                  landscape:pr-1">
                    {progress > 5 && (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-5 h-5 md:w-7 md:h-7 rounded-full bg-white flex items-center justify-center shadow-lg
                                   landscape:w-4 landscape:h-4"
                      >
                        <span className="text-yellow-500 font-bold text-[10px] md:text-sm
                                         landscape:text-[8px]">$</span>
                      </motion.div>
                    )}
                  </div>
                </motion.div>

                {/* Shimmer effect on track */}
                <motion.div
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-500/10 to-transparent"
                />
              </div>
            </div>

            {/* Loading stage text */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="text-center text-gray-300 text-xs md:text-base mt-2 md:mt-4
                         landscape:text-[10px] landscape:mt-1.5"
            >
              {progress < 30 && '🎴 Shuffling cards...'}
              {progress >= 30 && progress < 60 && '🎰 Preparing table...'}
              {progress >= 60 && progress < 90 && '💰 Counting chips...'}
              {progress >= 90 && '✨ Almost ready...'}
            </motion.p>
          </motion.div>

          {/* Floating poker symbols */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {['♠', '♥', '♦', '♣'].map((suit, i) => (
              <motion.div
                key={i}
                initial={{ y: '100vh', x: `${Math.random() * 100}%`, opacity: 0 }}
                animate={{ 
                  y: '-100vh',
                  opacity: [0, 0.3, 0],
                  rotate: 360
                }}
                transition={{
                  duration: 10 + Math.random() * 5,
                  repeat: Infinity,
                  delay: i * 2,
                  ease: "linear"
                }}
                className="absolute text-5xl md:text-8xl landscape:text-4xl"
                style={{
                  color: suit === '♥' || suit === '♦' ? '#ef4444' : '#fff',
                  textShadow: '0 0 20px rgba(0,0,0,0.5)'
                }}
              >
                {suit}
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}
