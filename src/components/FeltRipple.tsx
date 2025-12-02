'use client'

import { motion, AnimatePresence } from 'framer-motion'

interface FeltRippleProps {
  isVisible: boolean
  centerX: number
  centerY: number
  color?: string
}

export default function FeltRipple({
  isVisible,
  centerX,
  centerY,
  color = 'rgba(251,191,36,0.3)'
}: FeltRippleProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Multiple ripple waves */}
          {[0, 0.2, 0.4].map((delay, index) => (
            <motion.div
              key={index}
              initial={{ scale: 0, opacity: 0.6 }}
              animate={{ 
                scale: 2.5,
                opacity: 0
              }}
              exit={{ opacity: 0 }}
              transition={{
                duration: 1.5,
                delay: delay,
                ease: "easeOut"
              }}
              className="fixed rounded-full border-4 pointer-events-none landscape:border-2"
              style={{
                left: centerX - 100,
                top: centerY - 100,
                width: '200px',
                height: '200px',
                borderColor: color,
                zIndex: 4
              }}
            />
          ))}
          
          {/* Center flash */}
          <motion.div
            initial={{ scale: 0, opacity: 0.8 }}
            animate={{ 
              scale: 1.5,
              opacity: 0
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="fixed rounded-full pointer-events-none blur-xl"
            style={{
              left: centerX - 50,
              top: centerY - 50,
              width: '100px',
              height: '100px',
              backgroundColor: color,
              zIndex: 4
            }}
          />
        </>
      )}
    </AnimatePresence>
  )
}
