'use client'

import { motion, AnimatePresence } from 'framer-motion'

interface PlayerSpotlightProps {
  isVisible: boolean
  playerX: number
  playerY: number
  isActivePlayer?: boolean
}

export default function PlayerSpotlight({
  isVisible,
  playerX,
  playerY,
  isActivePlayer = false
}: PlayerSpotlightProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Main spotlight glow */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ 
              opacity: isActivePlayer ? [0.4, 0.6, 0.4] : 0.3,
              scale: 1
            }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ 
              opacity: { duration: 2, repeat: Infinity, ease: "easeInOut" },
              scale: { duration: 0.5 }
            }}
            className="absolute rounded-full blur-3xl pointer-events-none landscape:blur-2xl"
            style={{
              left: playerX - 120,
              top: playerY - 120,
              width: '240px',
              height: '240px',
              background: isActivePlayer 
                ? 'radial-gradient(circle, rgba(251,191,36,0.6) 0%, rgba(251,191,36,0.3) 40%, transparent 70%)'
                : 'radial-gradient(circle, rgba(59,130,246,0.4) 0%, transparent 70%)',
              zIndex: 5
            }}
          />

          {/* Pulsing ring for active player */}
          {isActivePlayer && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ 
                opacity: [0, 0.8, 0],
                scale: [0.8, 1.5, 1.8]
              }}
              exit={{ opacity: 0 }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                ease: "easeOut"
              }}
              className="absolute rounded-full border-4 border-yellow-400 pointer-events-none landscape:border-2"
              style={{
                left: playerX - 60,
                top: playerY - 60,
                width: '120px',
                height: '120px',
                zIndex: 6
              }}
            />
          )}

          {/* Corner markers for active player */}
          {isActivePlayer && (
            <>
              {[0, 90, 180, 270].map((rotation, index) => (
                <motion.div
                  key={rotation}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 1, 0] }}
                  exit={{ opacity: 0 }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: index * 0.2
                  }}
                  className="absolute w-6 h-6 landscape:w-4 landscape:h-4"
                  style={{
                    left: playerX - 70,
                    top: playerY - 70,
                    transformOrigin: '70px 70px',
                    transform: `rotate(${rotation}deg)`,
                    zIndex: 7
                  }}
                >
                  <div className="w-full h-full border-t-4 border-l-4 border-yellow-400 rounded-tl-lg landscape:border-t-2 landscape:border-l-2" />
                </motion.div>
              ))}
            </>
          )}
        </>
      )}
    </AnimatePresence>
  )
}
