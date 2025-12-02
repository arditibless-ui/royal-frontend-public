'use client'

import { motion } from 'framer-motion'

export default function LoadingSkeleton() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-green-900 via-green-800 to-emerald-900">
      <div className="relative w-full max-w-6xl aspect-[16/10]">
        {/* Loading Text */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-8 left-1/2 -translate-x-1/2 z-10"
        >
          <div className="bg-black/60 backdrop-blur-xl rounded-2xl px-8 py-4 border-2 border-yellow-500/50 shadow-2xl">
            <h2 className="text-2xl font-bold text-white text-center mb-2">
              Loading Poker Table...
            </h2>
            <div className="flex items-center justify-center gap-2">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-6 h-6 border-3 border-yellow-500 border-t-transparent rounded-full"
              />
              <p className="text-yellow-300 text-sm">Please wait</p>
            </div>
          </div>
        </motion.div>

        {/* Poker Table Skeleton */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-800/50 to-emerald-900/50 rounded-[50%] border-8 border-amber-900/50 shadow-2xl">
          {/* Table Center */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <motion.div
              animate={{ 
                opacity: [0.3, 0.6, 0.3],
                scale: [0.98, 1.02, 0.98]
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-40 h-24 bg-amber-900/30 rounded-2xl border-2 border-amber-700/50"
            />
          </div>

          {/* Player Position Skeletons (6 positions) */}
          {[0, 1, 2, 3, 4, 5].map((position) => {
            const angle = (position * 60) - 90 // Start from top, distribute evenly
            const radius = 45 // percentage from center
            const x = 50 + radius * Math.cos((angle * Math.PI) / 180)
            const y = 50 + radius * Math.sin((angle * Math.PI) / 180)
            
            return (
              <motion.div
                key={position}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ 
                  opacity: [0.4, 0.7, 0.4],
                  scale: [0.95, 1.05, 0.95]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  delay: position * 0.2
                }}
                style={{
                  position: 'absolute',
                  left: `${x}%`,
                  top: `${y}%`,
                  transform: 'translate(-50%, -50%)'
                }}
                className="flex flex-col items-center gap-2"
              >
                {/* Avatar Skeleton */}
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gray-700/50 border-4 border-gray-600/50" />
                
                {/* Name Skeleton */}
                <div className="w-20 h-6 bg-gray-700/50 rounded-lg" />
                
                {/* Chips Skeleton */}
                <div className="w-16 h-5 bg-gray-700/50 rounded-full" />
              </motion.div>
            )
          })}

          {/* Card Skeletons (Community Cards) */}
          <div className="absolute bottom-[35%] left-1/2 -translate-x-1/2 flex gap-2">
            {[0, 1, 2, 3, 4].map((card) => (
              <motion.div
                key={card}
                initial={{ opacity: 0, y: 20 }}
                animate={{ 
                  opacity: [0.3, 0.5, 0.3],
                  y: [0, -5, 0]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  delay: card * 0.1
                }}
                className="w-10 h-14 md:w-12 md:h-16 bg-white/20 rounded-lg border-2 border-white/30"
              />
            ))}
          </div>

          {/* Pot Skeleton */}
          <motion.div
            animate={{ 
              opacity: [0.4, 0.7, 0.4],
            }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="absolute top-[40%] left-1/2 -translate-x-1/2 bg-yellow-900/30 px-6 py-2 rounded-full border-2 border-yellow-700/50"
          >
            <div className="w-24 h-6 bg-yellow-700/50 rounded" />
          </motion.div>
        </div>

        {/* Animated Poker Chips */}
        <motion.div
          animate={{ 
            rotate: 360,
            scale: [1, 1.1, 1]
          }}
          transition={{ 
            rotate: { duration: 3, repeat: Infinity, ease: "linear" },
            scale: { duration: 2, repeat: Infinity }
          }}
          className="absolute top-4 right-4 text-6xl opacity-30"
        >
          🎰
        </motion.div>

        <motion.div
          animate={{ 
            rotate: -360,
            scale: [1, 1.1, 1]
          }}
          transition={{ 
            rotate: { duration: 4, repeat: Infinity, ease: "linear" },
            scale: { duration: 2, repeat: Infinity, delay: 0.5 }
          }}
          className="absolute bottom-4 left-4 text-6xl opacity-30"
        >
          🃏
        </motion.div>
      </div>
    </div>
  )
}
