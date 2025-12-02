'use client'

import { motion } from 'framer-motion'
import { soundManager } from '../utils/sounds'
import { useEffect } from 'react'
import { getCardImagePath, getCardBackPath } from '../utils/cardMapper'
import Image from 'next/image'

interface EnhancedCardProps {
  suit: string
  rank: string
  isFlipping?: boolean
  dealingAnimation?: boolean
  fromX?: number
  fromY?: number
  targetX?: number
  targetY?: number
  delay?: number
  onDealComplete?: () => void
  faceDown?: boolean
}

export default function EnhancedCard({
  suit,
  rank,
  isFlipping = false,
  dealingAnimation = false,
  fromX = 0,
  fromY = 0,
  targetX = 0,
  targetY = 0,
  delay = 0,
  onDealComplete,
  faceDown = false
}: EnhancedCardProps) {
  const cardImagePath = faceDown ? getCardBackPath() : getCardImagePath(suit, rank)

  useEffect(() => {
    if (dealingAnimation) {
      // Play card dealing sound after delay
      setTimeout(() => {
        soundManager.playCardDeal()
      }, delay * 1000)

      // Play flip sound when card arrives
      setTimeout(() => {
        soundManager.playCardFlip()
      }, (delay + 0.6) * 1000)
    }
  }, [dealingAnimation, delay])

  if (dealingAnimation) {
    return (
      <motion.div
        className="relative"
        initial={{
          x: fromX,
          y: fromY,
          scale: 0.3,
          rotateY: 180,
          opacity: 0
        }}
        animate={{
          x: [fromX, fromX + (targetX - fromX) * 0.4, targetX],
          y: [fromY, fromY - 80, targetY],
          scale: [0.3, 1.1, 1],
          rotateY: [180, 90, 0],
          opacity: [0, 1, 1]
        }}
        transition={{
          duration: 0.8,
          delay: delay,
          times: [0, 0.5, 1],
          ease: [0.34, 1.56, 0.64, 1]
        }}
        onAnimationComplete={onDealComplete}
        style={{
          perspective: '1000px',
          transformStyle: 'preserve-3d'
        }}
      >
        <CardImage src={cardImagePath} alt={`${rank} of ${suit}`} />
      </motion.div>
    )
  }

  if (isFlipping) {
    return (
      <motion.div
        initial={{ rotateY: 180 }}
        animate={{ rotateY: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        style={{
          perspective: '1000px',
          transformStyle: 'preserve-3d'
        }}
      >
        <CardImage src={cardImagePath} alt={`${rank} of ${suit}`} />
      </motion.div>
    )
  }

  return <CardImage src={cardImagePath} alt={faceDown ? 'Card back' : `${rank} of ${suit}`} />
}

function CardImage({ src, alt }: { src: string; alt: string }) {
  return (
    <div 
      className="relative w-[56px] h-[80px] md:w-[80px] md:h-[112px] landscape:w-[48px] landscape:h-[68px]"
      style={{
        filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.4))',
      }}
    >
      <Image
        src={src}
        alt={alt}
        fill
        className="object-contain rounded-lg"
        sizes="(max-width: 768px) 56px, 80px"
        priority
        unoptimized // For faster loading in development
      />
      
      {/* Card shine effect overlay */}
      <div 
        className="absolute inset-0 rounded-lg pointer-events-none"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 50%, rgba(0,0,0,0.05) 100%)',
          mixBlendMode: 'overlay'
        }}
      />
    </div>
  )
}
