'use client'

import { motion } from 'framer-motion'

interface PremiumChipProps {
  value: number
  size?: 'small' | 'medium' | 'large'
  animated?: boolean
  stack?: boolean // Show as a stack of chips
}

export default function PremiumChip({ 
  value, 
  size = 'medium', 
  animated = false,
  stack = false 
}: PremiumChipProps) {
  
  // Get chip color based on value (casino standard denominations)
  const getChipStyle = (value: number) => {
    if (value >= 1000) {
      return {
        gradient: 'from-yellow-400 via-yellow-500 to-yellow-600',
        border: 'border-yellow-300',
        accent: '#FCD34D',
        stripe: '#FDE68A',
        label: 'bg-black/80'
      }
    } else if (value >= 500) {
      return {
        gradient: 'from-purple-500 via-purple-600 to-purple-700',
        border: 'border-purple-300',
        accent: '#A855F7',
        stripe: '#C084FC',
        label: 'bg-white/90 text-purple-900'
      }
    } else if (value >= 100) {
      return {
        gradient: 'from-gray-800 via-gray-900 to-black',
        border: 'border-gray-400',
        accent: '#6B7280',
        stripe: '#9CA3AF',
        label: 'bg-white/90 text-black'
      }
    } else if (value >= 50) {
      return {
        gradient: 'from-blue-500 via-blue-600 to-blue-700',
        border: 'border-blue-300',
        accent: '#3B82F6',
        stripe: '#93C5FD',
        label: 'bg-white/90 text-blue-900'
      }
    } else if (value >= 25) {
      return {
        gradient: 'from-green-500 via-green-600 to-green-700',
        border: 'border-green-300',
        accent: '#10B981',
        stripe: '#6EE7B7',
        label: 'bg-white/90 text-green-900'
      }
    } else if (value >= 10) {
      return {
        gradient: 'from-orange-500 via-orange-600 to-orange-700',
        border: 'border-orange-300',
        accent: '#F97316',
        stripe: '#FDBA74',
        label: 'bg-white/90 text-orange-900'
      }
    } else if (value >= 5) {
      return {
        gradient: 'from-red-500 via-red-600 to-red-700',
        border: 'border-red-300',
        accent: '#EF4444',
        stripe: '#FCA5A5',
        label: 'bg-white/90 text-red-900'
      }
    } else {
      return {
        gradient: 'from-gray-300 via-gray-400 to-gray-500',
        border: 'border-gray-200',
        accent: '#9CA3AF',
        stripe: '#D1D5DB',
        label: 'bg-gray-800 text-white'
      }
    }
  }

  const chipStyle = getChipStyle(value)
  
  const sizeClasses = {
    small: 'w-10 h-10',
    medium: 'w-14 h-14',
    large: 'w-20 h-20'
  }

  const fontSize = {
    small: 'text-xs',
    medium: 'text-sm',
    large: 'text-base'
  }

  const ChipComponent = animated ? motion.div : 'div'

  if (stack) {
    return (
      <div className="relative inline-block">
        {[0, 1, 2].map((index) => (
          <ChipComponent
            key={index}
            className={`${sizeClasses[size]} absolute`}
            style={{
              bottom: `${index * 3}px`,
              left: 0,
              zIndex: index
            }}
            {...(animated && {
              initial: { y: -20, opacity: 0 },
              animate: { y: 0, opacity: 1 },
              transition: { delay: index * 0.1 }
            })}
          >
            <SingleChip value={value} size={size} chipStyle={chipStyle} fontSize={fontSize} />
          </ChipComponent>
        ))}
        <div className={`${sizeClasses[size]}`} style={{ visibility: 'hidden' }} />
      </div>
    )
  }

  return (
    <ChipComponent
      className={`${sizeClasses[size]} inline-block`}
      {...(animated && {
        initial: { scale: 0, rotate: -180 },
        animate: { scale: 1, rotate: 0 },
        transition: { type: 'spring', stiffness: 200 }
      })}
    >
      <SingleChip value={value} size={size} chipStyle={chipStyle} fontSize={fontSize} />
    </ChipComponent>
  )
}

function SingleChip({ value, size, chipStyle, fontSize }: any) {
  return (
    <div 
      className={`relative w-full h-full rounded-full bg-gradient-to-br ${chipStyle.gradient} border-4 ${chipStyle.border} shadow-2xl flex items-center justify-center`}
      style={{
        boxShadow: `
          0 4px 6px rgba(0,0,0,0.4),
          0 2px 4px rgba(0,0,0,0.3),
          inset 0 2px 4px rgba(255,255,255,0.3),
          inset 0 -2px 4px rgba(0,0,0,0.3)
        `
      }}
    >
      {/* Outer ring decoration */}
      <div className="absolute inset-0 rounded-full overflow-hidden">
        {/* Casino stripes - 8 segments */}
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute w-full h-[15%] origin-center"
            style={{
              background: i % 2 === 0 ? chipStyle.stripe : 'transparent',
              transform: `rotate(${i * 45}deg)`,
              top: '50%',
              left: '50%',
              marginLeft: '-50%',
              marginTop: '-7.5%',
              opacity: 0.3
            }}
          />
        ))}
      </div>

      {/* Inner circle */}
      <div 
        className="absolute inset-[20%] rounded-full bg-gradient-to-br from-white/20 to-black/20"
        style={{
          border: `2px solid ${chipStyle.accent}`
        }}
      />

      {/* Value label */}
      <div 
        className={`relative z-10 ${chipStyle.label} px-2 py-0.5 rounded-full ${fontSize[size]} font-bold shadow-lg`}
      >
        {value >= 1000 ? `${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}K` : value}
      </div>

      {/* Shine effect */}
      <div 
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.5) 0%, transparent 40%, rgba(0,0,0,0.2) 100%)'
        }}
      />
    </div>
  )
}

/**
 * Chip Stack Component - Shows multiple chips stacked
 */
export function ChipStack({ 
  values,
  size = 'small'
}: { 
  values: number[]
  size?: 'small' | 'medium' | 'large'
}) {
  return (
    <div className="relative inline-flex items-end gap-0.5">
      {values.map((value, index) => (
        <PremiumChip
          key={`${value}-${index}`}
          value={value}
          size={size}
          animated
          stack={index < values.length - 1}
        />
      ))}
    </div>
  )
}
