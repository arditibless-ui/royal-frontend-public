'use client'

import { motion } from 'framer-motion'

interface PotOddsDisplayProps {
  potAmount: number
  callAmount: number
  isVisible: boolean
}

export default function PotOddsDisplay({ potAmount, callAmount, isVisible }: PotOddsDisplayProps) {
  if (!isVisible || callAmount <= 0) return null

  const potOdds = ((callAmount / (potAmount + callAmount)) * 100).toFixed(1)
  const potOddsRatio = `${(potAmount / callAmount).toFixed(1)}:1`

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="pot-odds-display absolute top-full mt-2 left-1/2 transform -translate-x-1/2 bg-black/90 backdrop-blur-md rounded-lg px-4 py-2 min-w-[180px] z-[80]"
    >
      <div className="text-center">
        <div className="text-yellow-400 text-xs font-semibold mb-1">Pot Odds</div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-300">Percentage:</span>
          <span className="text-green-400 font-bold">{potOdds}%</span>
        </div>
        <div className="flex items-center justify-between text-sm mt-1">
          <span className="text-gray-300">Ratio:</span>
          <span className="text-blue-400 font-bold">{potOddsRatio}</span>
        </div>
      </div>
    </motion.div>
  )
}
