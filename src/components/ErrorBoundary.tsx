'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { motion } from 'framer-motion'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Uncaught error:', error, errorInfo)
    }
  }

  private handleReload = () => {
    window.location.reload()
  }

  private handleGoHome = () => {
    window.location.href = '/'
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-green-900 via-green-800 to-emerald-900">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-black/60 backdrop-blur-xl rounded-3xl p-8 max-w-md w-full shadow-2xl border-2 border-red-500/50"
          >
            {/* Error Icon */}
            <div className="text-center mb-6">
              <motion.div
                animate={{ 
                  rotate: [0, -10, 10, -10, 10, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{ duration: 0.5 }}
                className="text-8xl mb-4"
              >
                😵
              </motion.div>
              <h2 className="text-3xl font-bold text-white mb-2">
                Oops! Something Went Wrong
              </h2>
              <p className="text-red-300 text-sm">
                The game encountered an unexpected error
              </p>
            </div>

            {/* Error Details (Development Only) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mb-6 p-4 bg-red-900/30 rounded-xl border border-red-500/30">
                <p className="text-xs text-red-200 font-mono break-all">
                  {this.state.error.message}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={this.handleReload}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold py-3 rounded-xl shadow-lg hover:from-green-500 hover:to-emerald-500 transition-all"
              >
                🔄 Reload Game
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={this.handleGoHome}
                className="w-full bg-gradient-to-r from-gray-600 to-gray-700 text-white font-bold py-3 rounded-xl shadow-lg hover:from-gray-500 hover:to-gray-600 transition-all"
              >
                🏠 Go to Lobby
              </motion.button>
            </div>

            {/* Help Text */}
            <p className="text-center text-gray-400 text-xs mt-6">
              If this problem persists, please contact support
            </p>
          </motion.div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
