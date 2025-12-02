'use client'

import { motion, AnimatePresence } from 'framer-motion'

interface TurnArrowProps {
  isVisible: boolean
  targetX: number
  targetY: number
}

export default function TurnArrow({ isVisible, targetX, targetY }: TurnArrowProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ 
            opacity: 1, 
            y: [0, -10, 0]
          }}
          exit={{ opacity: 0 }}
          transition={{ 
            y: { duration: 1, repeat: Infinity, ease: "easeInOut" },
            opacity: { duration: 0.3 }
          }}
          className="absolute pointer-events-none landscape:scale-75"
          style={{
            left: targetX - 25,
            top: targetY - 100,
            zIndex: 50
          }}
        >
          {/* Arrow body */}
          <div className="relative">
            {/* Glow effect */}
            <div className="absolute inset-0 blur-lg bg-yellow-400 opacity-60 animate-pulse" />
            
            {/* Main arrow */}
            <svg width="50" height="80" viewBox="0 0 50 80" className="relative drop-shadow-2xl">
              {/* Arrow shaft */}
              <rect x="20" y="20" width="10" height="40" fill="#FCD34D" stroke="#F59E0B" strokeWidth="2" />
              
              {/* Arrow head */}
              <polygon points="25,0 0,25 15,25 15,30 35,30 35,25 50,25" fill="#FCD34D" stroke="#F59E0B" strokeWidth="2" />
              
              {/* Shine effect */}
              <line x1="22" y1="5" x2="22" y2="55" stroke="rgba(255,255,255,0.6)" strokeWidth="2" />
            </svg>

            {/* Text label */}
            <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
              <div className="bg-yellow-500 text-black px-3 py-1 rounded-full text-xs font-bold shadow-lg border-2 border-yellow-300 landscape:px-2 landscape:text-[10px]">
                YOUR TURN
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
