'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Smartphone, Monitor, X, Share2, MoreVertical, Download } from 'lucide-react'
import { useEffect, useState } from 'react'

interface InstallPWAModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function InstallPWAModal({ isOpen, onClose }: InstallPWAModalProps) {
  const [platform, setPlatform] = useState<'ios' | 'android' | 'desktop' | 'unknown'>('unknown')

  useEffect(() => {
    // Detect platform
    const userAgent = window.navigator.userAgent.toLowerCase()
    const isIOS = /iphone|ipad|ipod/.test(userAgent)
    const isAndroid = /android/.test(userAgent)
    const isDesktop = !isIOS && !isAndroid

    if (isIOS) setPlatform('ios')
    else if (isAndroid) setPlatform('android')
    else if (isDesktop) setPlatform('desktop')
  }, [])

  const getInstructions = () => {
    switch (platform) {
      case 'ios':
        return (
          <div className="space-y-4">
            <div className="flex items-start gap-3 bg-blue-500/10 p-4 rounded-lg border border-blue-500/30">
              <div className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-sm font-bold">1</div>
              <div>
                <p className="text-white font-semibold mb-1">Tap the Share button</p>
                <div className="flex items-center gap-2 text-blue-300 text-sm">
                  <Share2 size={20} className="text-blue-400" />
                  <span>At the bottom or top of Safari</span>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 bg-purple-500/10 p-4 rounded-lg border border-purple-500/30">
              <div className="bg-purple-500 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-sm font-bold">2</div>
              <div>
                <p className="text-white font-semibold mb-1">Scroll and tap "Add to Home Screen"</p>
                <div className="flex items-center gap-2 text-purple-300 text-sm">
                  <Smartphone size={20} className="text-purple-400" />
                  <span>In the share menu options</span>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 bg-green-500/10 p-4 rounded-lg border border-green-500/30">
              <div className="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-sm font-bold">3</div>
              <div>
                <p className="text-white font-semibold mb-1">Tap "Add" to confirm</p>
                <p className="text-green-300 text-sm">The app will appear on your home screen</p>
              </div>
            </div>
          </div>
        )

      case 'android':
        return (
          <div className="space-y-4">
            <div className="flex items-start gap-3 bg-blue-500/10 p-4 rounded-lg border border-blue-500/30">
              <div className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-sm font-bold">1</div>
              <div>
                <p className="text-white font-semibold mb-1">Tap the Menu button</p>
                <div className="flex items-center gap-2 text-blue-300 text-sm">
                  <MoreVertical size={20} className="text-blue-400" />
                  <span>Three dots at the top right</span>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 bg-purple-500/10 p-4 rounded-lg border border-purple-500/30">
              <div className="bg-purple-500 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-sm font-bold">2</div>
              <div>
                <p className="text-white font-semibold mb-1">Select "Add to Home Screen" or "Install App"</p>
                <div className="flex items-center gap-2 text-purple-300 text-sm">
                  <Download size={20} className="text-purple-400" />
                  <span>From the menu options</span>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 bg-green-500/10 p-4 rounded-lg border border-green-500/30">
              <div className="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-sm font-bold">3</div>
              <div>
                <p className="text-white font-semibold mb-1">Tap "Add" or "Install"</p>
                <p className="text-green-300 text-sm">The app will appear on your home screen</p>
              </div>
            </div>
          </div>
        )

      case 'desktop':
        return (
          <div className="space-y-4">
            <div className="flex items-start gap-3 bg-blue-500/10 p-4 rounded-lg border border-blue-500/30">
              <div className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-sm font-bold">1</div>
              <div>
                <p className="text-white font-semibold mb-1">Look for the Install button</p>
                <div className="flex items-center gap-2 text-blue-300 text-sm">
                  <Monitor size={20} className="text-blue-400" />
                  <span>In the address bar (Chrome/Edge)</span>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 bg-purple-500/10 p-4 rounded-lg border border-purple-500/30">
              <div className="bg-purple-500 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-sm font-bold">2</div>
              <div>
                <p className="text-white font-semibold mb-1">Click "Install"</p>
                <p className="text-purple-300 text-sm">Or use browser menu → "Install Royal Poker"</p>
              </div>
            </div>

            <div className="flex items-start gap-3 bg-green-500/10 p-4 rounded-lg border border-green-500/30">
              <div className="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-sm font-bold">3</div>
              <div>
                <p className="text-white font-semibold mb-1">Launch from desktop</p>
                <p className="text-green-300 text-sm">Desktop will now work without installation</p>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
          onClick={(e) => e.target === e.currentTarget && platform === 'desktop' && onClose()}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="bg-gradient-to-br from-slate-900 via-purple-900/50 to-slate-900 rounded-2xl p-6 max-w-lg w-full shadow-2xl border-2 border-purple-500/30 max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-gradient-to-br from-purple-500 to-blue-500 p-3 rounded-xl">
                    <Smartphone size={28} className="text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-white">Install App Required</h2>
                </div>
                <p className="text-gray-300 text-sm">
                  For the best full-screen poker experience, please install the app to your home screen.
                </p>
              </div>
              {platform === 'desktop' && (
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-white transition-colors p-2"
                >
                  <X size={24} />
                </button>
              )}
            </div>

            {/* Why Install Box */}
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-6">
              <h3 className="text-yellow-300 font-semibold mb-2 flex items-center gap-2">
                ⭐ Why Install?
              </h3>
              <ul className="text-yellow-100 text-sm space-y-1">
                <li>✓ Full-screen gameplay (no browser bars)</li>
                <li>✓ Better performance</li>
                <li>✓ Faster loading</li>
                <li>✓ Works offline</li>
                <li>✓ App-like experience</li>
              </ul>
            </div>

            {/* Platform-specific instructions */}
            <div className="mb-6">
              <h3 className="text-white font-semibold mb-4 text-lg">
                📱 Installation Steps:
              </h3>
              {getInstructions()}
            </div>

            {/* Note for mobile */}
            {platform !== 'desktop' && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                <p className="text-red-300 text-sm font-semibold">
                  ⚠️ Required for Mobile Devices
                </p>
                <p className="text-red-200 text-xs mt-1">
                  The poker game requires full-screen mode which is only available when installed to your home screen.
                </p>
              </div>
            )}

            {/* Desktop bypass option */}
            {platform === 'desktop' && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onClose}
                className="w-full mt-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all"
              >
                Continue Without Installing (Desktop Only)
              </motion.button>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
