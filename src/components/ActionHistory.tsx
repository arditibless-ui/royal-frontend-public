'use client'

import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface ActionHistoryProps {
  actions: Array<{
    id: number
    player: string
    action: string
    amount?: number
    timestamp: number
  }>
  isVisible: boolean
  onToggle: () => void
}

export default function ActionHistory({ actions, isVisible, onToggle }: ActionHistoryProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [actions])

  const getActionColor = (action: string) => {
    switch (action.toLowerCase()) {
      case 'fold':
        return 'text-red-400'
      case 'raise':
      case 'all-in':
        return 'text-yellow-400'
      case 'call':
        return 'text-green-400'
      case 'check':
        return 'text-blue-400'
      default:
        return 'text-gray-400'
    }
  }

  const getActionIcon = (action: string) => {
    switch (action.toLowerCase()) {
      case 'fold':
        return '❌'
      case 'raise':
        return '⬆️'
      case 'call':
        return '☑️'
      case 'check':
        return '👌'
      case 'all-in':
        return '🔥'
      default:
        return '🎮'
    }
  }

  return (
    <>
      {/* Sliding Panel - Controlled by external History button */}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-4 top-24 bg-black/95 backdrop-blur-md rounded-lg shadow-2xl overflow-hidden z-[95] w-80 border border-gray-700"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-gray-800 to-gray-700 px-4 py-3 border-b border-gray-600 flex items-center justify-between">
              <h3 className="text-white font-semibold text-sm flex items-center gap-2">
                <span>📜</span> Action History
              </h3>
              <button
                onClick={onToggle}
                className="text-white hover:text-red-400 transition-colors text-xl leading-none"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Action List */}
            <div 
              ref={scrollRef}
              className="max-h-96 overflow-y-auto custom-scrollbar p-2 space-y-1"
              style={{
                scrollBehavior: 'smooth'
              }}
            >
              <AnimatePresence initial={false}>
                {actions.slice(-20).map((action) => (
                  <motion.div
                    key={action.id}
                    initial={{ x: -50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: 50, opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    className="action-timeline-entry bg-gray-800/50 rounded px-3 py-2 text-sm hover:bg-gray-700/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getActionIcon(action.action)}</span>
                        <span className="text-white font-medium">{action.player}</span>
                      </div>
                      <span className={`font-bold ${getActionColor(action.action)}`}>
                        {action.action.toUpperCase()}
                      </span>
                    </div>
                    {action.amount !== undefined && action.amount > 0 && (
                      <div className="text-yellow-300 text-xs mt-1 ml-7">
                        ${action.amount}
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {actions.length === 0 && (
                <div className="text-center text-gray-500 py-8">
                  <p className="text-sm">No actions yet</p>
                  <p className="text-xs mt-1">Actions will appear here</p>
                </div>
              )}
            </div>

            {/* Custom Scrollbar Styles */}
            <style jsx>{`
              .custom-scrollbar::-webkit-scrollbar {
                width: 6px;
              }
              .custom-scrollbar::-webkit-scrollbar-track {
                background: rgba(0, 0, 0, 0.2);
                border-radius: 3px;
              }
              .custom-scrollbar::-webkit-scrollbar-thumb {
                background: rgba(255, 255, 255, 0.3);
                border-radius: 3px;
              }
              .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                background: rgba(255, 255, 255, 0.5);
              }
            `}</style>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}