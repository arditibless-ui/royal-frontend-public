'use client'

import { useEffect, useState } from 'react'

interface CircularTimerProps {
  duration: number // Total duration in seconds
  timeRemaining: number // Current time remaining in seconds
  size?: number
  strokeWidth?: number
}

export default function CircularTimer({ 
  duration, 
  timeRemaining, 
  size = 60, 
  strokeWidth = 4 
}: CircularTimerProps) {
  const [progress, setProgress] = useState(100)
  const [colorClass, setColorClass] = useState('timer-green')
  const [isUrgent, setIsUrgent] = useState(false)

  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius

  useEffect(() => {
    const percentage = (timeRemaining / duration) * 100
    setProgress(percentage)

    // Change color based on time remaining
    if (percentage > 50) {
      setColorClass('timer-green')
      setIsUrgent(false)
    } else if (percentage > 25) {
      setColorClass('timer-yellow')
      setIsUrgent(false)
    } else {
      setColorClass('timer-red')
      // Only shake if time is still remaining (not 0)
      setIsUrgent(percentage <= 25 && timeRemaining > 0)
    }
  }, [timeRemaining, duration])

  const strokeDashoffset = circumference - (progress / 100) * circumference

  console.log('CircularTimer:', { timeRemaining, duration, progress, strokeDashoffset, circumference })

  return (
    <div 
      className={`circular-timer-container ${isUrgent ? 'timer-urgent' : ''}`}
      style={{ width: size, height: size }}
    >
      <svg 
        className="circular-timer-svg" 
        width={size} 
        height={size}
      >
        {/* Background circle */}
        <circle
          className="circular-timer-circle circular-timer-background"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          key={`timer-${timeRemaining}`}
          className={`circular-timer-circle circular-timer-progress ${colorClass}`}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{
            transition: 'stroke-dashoffset 1s linear'
          }}
        />
      </svg>
      {/* Time display */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`text-sm font-bold ${
          colorClass === 'timer-red' ? 'text-red-500' : 
          colorClass === 'timer-yellow' ? 'text-yellow-500' : 
          'text-green-500'
        }`}>
          {Math.ceil(timeRemaining)}
        </span>
      </div>
    </div>
  )
}
