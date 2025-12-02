'use client'

import { useEffect, useState } from 'react'

interface FloatingChip {
  id: number
  left: string
  top: string
  size: number
  duration: number
  delay: number
  color: string
}

export default function FloatingChipsBackground() {
  const [chips, setChips] = useState<FloatingChip[]>([])

  useEffect(() => {
    // Only show on desktop/tablet, not on mobile landscape
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      return; // Don't render chips on mobile/small screens
    }

    const colors = ['#ef4444', '#3b82f6', '#10b981', '#1f2937', '#a855f7', '#fbbf24']
    const chipCount = 8 // Reduced from 15 to 8

    const generatedChips: FloatingChip[] = Array.from({ length: chipCount }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      size: 30 + Math.random() * 20,
      duration: 15 + Math.random() * 10,
      delay: Math.random() * 5,
      color: colors[Math.floor(Math.random() * colors.length)]
    }))

    setChips(generatedChips)
  }, [])

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
      {chips.map((chip) => (
        <div
          key={chip.id}
          className="floating-chip absolute rounded-full border-2 border-white/10"
          style={{
            left: chip.left,
            top: chip.top,
            width: `${chip.size}px`,
            height: `${chip.size}px`,
            backgroundColor: chip.color,
            animationDuration: `${chip.duration}s`,
            animationDelay: `${chip.delay}s`,
            boxShadow: '0 4px 8px rgba(0,0,0,0.2), inset 0 2px 4px rgba(255,255,255,0.1)'
          }}
        />
      ))}
    </div>
  )
}
