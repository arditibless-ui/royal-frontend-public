'use client'

import { motion } from 'framer-motion'
import { Spade, Heart, Diamond, Club, Crown } from 'lucide-react'
import { soundManager } from '../../utils/sounds'
import { useEffect } from 'react'

interface WelcomeScreenProps {
  onNavigate: (screen: 'welcome' | 'login' | 'register' | 'dashboard' | 'admin') => void
}

export default function WelcomeScreen({ onNavigate }: WelcomeScreenProps) {
  useEffect(() => {
    // Try to play immediately
    const tryPlay = async () => {
      try {
        await soundManager.playBackgroundMusic('lobby');
      } catch (e) {
        console.log('Music will play on interaction');
      }
    };
    tryPlay();
    
    // Stop music when component unmounts
    return () => {
      soundManager.stopMusic();
    };
  }, []);

  const handleEnterGame = () => {
    // Ensure music plays on user interaction
    soundManager.playBackgroundMusic('lobby');
    soundManager.playClick();
    onNavigate('login');
  };

  return (
    <div className="relative min-h-screen pt-[env(safe-area-inset-top)] landscape:pt-0 flex items-center justify-center overflow-hidden">
      {/* Background image - portrait for portrait, landscape for landscape - EXTENDS ABOVE NOTCH */}
      <div className="fixed inset-0 -top-[env(safe-area-inset-top)]">
        <div 
          className="absolute inset-0 bg-cover bg-center portrait:block landscape:hidden"
          style={{ backgroundImage: "url('/images/portrait.png')" }}
        />
        <div 
          className="absolute inset-0 bg-cover bg-center portrait:hidden landscape:block"
          style={{ backgroundImage: "url('/images/landscape.png')" }}
        />
      </div>
      
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-20">
        <motion.div
          className="absolute top-1/4 left-1/4 text-green-300"
          animate={{ rotate: 360, scale: [1, 1.2, 1] }}
          transition={{ duration: 8, repeat: Infinity }}
        >
          <Spade size={60} className="landscape:w-8 landscape:h-8" />
        </motion.div>
        <motion.div
          className="absolute top-1/3 right-1/4 text-red-300"
          animate={{ rotate: -360, scale: [1, 1.1, 1] }}
          transition={{ duration: 6, repeat: Infinity }}
        >
          <Heart size={50} className="landscape:w-7 landscape:h-7" />
        </motion.div>
        <motion.div
          className="absolute bottom-1/3 left-1/3 text-red-300"
          animate={{ rotate: 360, scale: [1, 1.3, 1] }}
          transition={{ duration: 10, repeat: Infinity }}
        >
          <Diamond size={45} className="landscape:w-6 landscape:h-6" />
        </motion.div>
        <motion.div
          className="absolute bottom-1/4 right-1/3 text-green-300"
          animate={{ rotate: -360, scale: [1, 1.15, 1] }}
          transition={{ duration: 7, repeat: Infinity }}
        >
          <Club size={55} className="landscape:w-7 landscape:h-7" />
        </motion.div>
      </div>

      {/* Main content */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="relative z-10 text-center px-8 py-12 landscape:px-6 landscape:py-4 bg-black/40 backdrop-blur-sm rounded-3xl landscape:rounded-2xl border border-white/20 max-w-lg landscape:max-w-2xl mx-4"
      >
        {/* Royal Logo */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.2, duration: 0.8, type: "spring" }}
          className="flex justify-center mb-3 landscape:mb-2"
        >
          <div className="relative">
            {/* Crown with shine effect */}
            <div className="relative overflow-hidden rounded-full p-4">
              <Crown 
                size={80} 
                className="text-yellow-400 landscape:w-16 landscape:h-16 drop-shadow-[0_0_15px_rgba(251,191,36,0.5)] relative z-10" 
                strokeWidth={1.5}
                fill="currentColor"
              />
              {/* Moving shine overlay - circular */}
              <motion.div
                animate={{
                  rotate: [0, 360]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "linear"
                }}
                className="absolute inset-0 z-20 pointer-events-none"
              >
                <div className="absolute top-0 left-1/2 w-full h-1/2 bg-gradient-to-b from-white/40 via-white/10 to-transparent transform -translate-x-1/2 origin-bottom blur-sm" />
              </motion.div>
            </div>
            {/* Glowing pulse background */}
            <motion.div
              animate={{ 
                opacity: [0.5, 1, 0.5],
                scale: [1, 1.1, 1]
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 blur-xl bg-yellow-400/30 rounded-full"
            />
          </div>
        </motion.div>

        <motion.h1
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="text-6xl landscape:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-200 mb-2 landscape:mb-1 font-serif tracking-wider"
        >
          ROYAL
        </motion.h1>
        <motion.h2
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="text-2xl landscape:text-lg font-semibold text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-200 mb-4 landscape:mb-2 tracking-wide"
        >
          Texas Hold'em Poker
        </motion.h2>
        
        <motion.p
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="text-xl landscape:text-base text-green-100 mb-8 landscape:mb-4 font-light"
        >
          The Ultimate Poker Experience
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.8 }}
          className="space-y-4 landscape:space-y-2"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleEnterGame}
            onMouseEnter={() => soundManager.playHover()}
            className="w-full py-4 landscape:py-2 px-8 landscape:px-6 bg-gradient-to-r from-yellow-600 to-yellow-500 text-black font-bold text-lg landscape:text-base rounded-full shadow-2xl hover:from-yellow-500 hover:to-yellow-400 transition-all duration-300"
          >
            Enter Game
          </motion.button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.8 }}
          className="mt-8 landscape:mt-4 text-green-200 text-sm landscape:text-xs landscape:space-y-0.5"
        >
          <p>• Real-time multiplayer poker</p>
          <p>• Private rooms with unique codes</p>
          <p>• Premium gaming experience</p>
        </motion.div>
      </motion.div>
    </div>
  )
}