'use client'

import { motion } from 'framer-motion'

interface DealerButtonProps {
  position: { x: number; y: number }
  isAnimating?: boolean
}

export default function DealerButton({ position, isAnimating = false }: DealerButtonProps) {
  return (
    <motion.div
      className={`dealer-button absolute ${isAnimating ? 'dealer-button-move' : 'dealer-button-pulse'}`}
      animate={{
        x: position.x,
        y: position.y
      }}
      transition={{
        duration: 1,
        ease: [0.68, -0.55, 0.265, 1.55]
      }}
      style={{
        width: '48px',
        height: '48px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50
      }}
    >
      <div className="text-black font-bold text-lg">D</div>
    </motion.div>
  )
}
