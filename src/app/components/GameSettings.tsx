'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { soundManager } from '@/utils/sounds';

interface GameSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  gesturesEnabled: boolean;
  setGesturesEnabled: (enabled: boolean) => void;
  actionSoundsEnabled: boolean;
  setActionSoundsEnabled: (enabled: boolean) => void;
  backgroundMusicEnabled: boolean;
  setBackgroundMusicEnabled: (enabled: boolean) => void;
  onOpenThemeSelector?: () => void;
  isAdmin?: boolean;
}

export default function GameSettings({
  isOpen,
  onClose,
  gesturesEnabled,
  setGesturesEnabled,
  actionSoundsEnabled,
  setActionSoundsEnabled,
  backgroundMusicEnabled,
  setBackgroundMusicEnabled,
  onOpenThemeSelector,
  isAdmin = false
}: GameSettingsProps) {

  const handleGesturesToggle = () => {
    const newValue = !gesturesEnabled;
    setGesturesEnabled(newValue);
    soundManager.playClick();
    
    // Save to localStorage
    localStorage.setItem('pokerGameGestures', JSON.stringify(newValue));
  };

  const handleActionSoundsToggle = () => {
    const newValue = !actionSoundsEnabled;
    setActionSoundsEnabled(newValue);
    soundManager.playClick();
    
    // Update soundManager
    soundManager.setEnabled(newValue);
    
    // Save to localStorage
    localStorage.setItem('pokerActionSounds', JSON.stringify(newValue));
  };

  const handleBackgroundMusicToggle = () => {
    const newValue = !backgroundMusicEnabled;
    setBackgroundMusicEnabled(newValue);
    soundManager.playClick();
    
    // Update soundManager
    soundManager.setMusicEnabled(newValue);
    
    // Save to localStorage
    localStorage.setItem('pokerBackgroundMusic', JSON.stringify(newValue));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
          />

          {/* Settings Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            transition={{ type: "spring", duration: 0.4 }}
            className="fixed inset-2 landscape:inset-4 z-50 flex items-center justify-center"
          >
            <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl landscape:rounded-lg shadow-2xl border-2 border-purple-500/50 w-full max-w-md landscape:max-w-none landscape:w-auto landscape:min-w-[500px] max-h-[90vh] landscape:max-h-[92vh] flex flex-col">
              {/* Header */}
              <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 p-3 landscape:p-1.5 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-2 landscape:gap-1.5">
                  <div className="w-8 h-8 landscape:w-5 landscape:h-5 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                    <span className="text-xl landscape:text-xs">⚙️</span>
                  </div>
                  <div>
                    <h2 className="text-lg landscape:text-[11px] font-bold text-white">Game Settings</h2>
                    <p className="text-[10px] landscape:text-[7px] text-white/80">Customize your experience</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  onMouseEnter={() => soundManager.playHover()}
                  className="w-7 h-7 landscape:w-5 landscape:h-5 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-all duration-200"
                >
                  <span className="text-white text-lg landscape:text-sm font-bold">×</span>
                </button>
              </div>

              {/* Content */}
              <div className="p-4 landscape:p-2 space-y-3 landscape:space-y-1.5 overflow-y-auto flex-1">
                
                {/* Action Gestures Setting */}
                <div className="bg-gray-800/50 rounded-lg landscape:rounded p-3 landscape:p-1.5 border border-gray-700/50">
                  <div className="flex items-start justify-between gap-2 landscape:gap-1.5">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 landscape:gap-1 mb-1 landscape:mb-0">
                        <span className="text-base landscape:text-[10px]">👆</span>
                        <h3 className="text-white font-semibold text-sm landscape:text-[9px]">Action Gestures</h3>
                      </div>
                      <p className="text-gray-400 text-xs landscape:text-[7px] landscape:leading-tight">
                        Enable swipe gestures for poker actions:
                      </p>
                      <ul className="text-gray-500 text-[10px] landscape:text-[6px] mt-1 landscape:mt-0 space-y-0 ml-4 landscape:ml-2 landscape:leading-tight">
                        <li>• Swipe Up → Fold</li>
                        <li>• Swipe Right → Call/Check</li>
                        <li>• Swipe Left → Raise</li>
                        <li>• Swipe Down on Chat → Dismiss</li>
                      </ul>
                    </div>
                    <button
                      onClick={handleGesturesToggle}
                      onMouseEnter={() => soundManager.playHover()}
                      className={`relative w-12 h-6 landscape:w-8 landscape:h-4 rounded-full transition-all duration-300 flex-shrink-0 ${
                        gesturesEnabled ? 'bg-green-500' : 'bg-gray-600'
                      }`}
                    >
                      <motion.div
                        animate={{ 
                          x: gesturesEnabled ? (window.innerHeight < window.innerWidth ? 16 : 24) : 2
                        }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        className="absolute top-0.5 landscape:top-0.5 w-5 h-5 landscape:w-3 landscape:h-3 bg-white rounded-full shadow-lg"
                      />
                    </button>
                  </div>
                </div>

                {/* Action Sounds Setting */}
                <div className="bg-gray-800/50 rounded-lg landscape:rounded p-3 landscape:p-1.5 border border-gray-700/50">
                  <div className="flex items-start justify-between gap-2 landscape:gap-1.5">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 landscape:gap-1 mb-1 landscape:mb-0">
                        <span className="text-base landscape:text-[10px]">🔊</span>
                        <h3 className="text-white font-semibold text-sm landscape:text-[9px]">Action Sounds</h3>
                      </div>
                      <p className="text-gray-400 text-xs landscape:text-[7px] landscape:leading-tight">
                        Play sound effects for button clicks, bets, folds, and other game actions.
                      </p>
                    </div>
                    <button
                      onClick={handleActionSoundsToggle}
                      onMouseEnter={() => soundManager.playHover()}
                      className={`relative w-12 h-6 landscape:w-8 landscape:h-4 rounded-full transition-all duration-300 flex-shrink-0 ${
                        actionSoundsEnabled ? 'bg-green-500' : 'bg-gray-600'
                      }`}
                    >
                      <motion.div
                        animate={{ 
                          x: actionSoundsEnabled ? (window.innerHeight < window.innerWidth ? 16 : 24) : 2
                        }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        className="absolute top-0.5 landscape:top-0.5 w-5 h-5 landscape:w-3 landscape:h-3 bg-white rounded-full shadow-lg"
                      />
                    </button>
                  </div>
                </div>

                {/* Background Music Setting */}
                <div className="bg-gray-800/50 rounded-lg landscape:rounded p-3 landscape:p-1.5 border border-gray-700/50">
                  <div className="flex items-start justify-between gap-2 landscape:gap-1.5">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 landscape:gap-1 mb-1 landscape:mb-0">
                        <span className="text-base landscape:text-[10px]">🎵</span>
                        <h3 className="text-white font-semibold text-sm landscape:text-[9px]">Background Music</h3>
                      </div>
                      <p className="text-gray-400 text-xs landscape:text-[7px] landscape:leading-tight">
                        Play ambient background music in lobby and during poker games.
                      </p>
                      <p className="text-green-500 text-[10px] landscape:text-[6px] mt-1 landscape:mt-0">
                        ✓ Lobby & Poker Table music available
                      </p>
                    </div>
                    <button
                      onClick={handleBackgroundMusicToggle}
                      onMouseEnter={() => soundManager.playHover()}
                      className={`relative w-12 h-6 landscape:w-8 landscape:h-4 rounded-full transition-all duration-300 flex-shrink-0 ${
                        backgroundMusicEnabled ? 'bg-green-500' : 'bg-gray-600'
                      }`}
                    >
                      <motion.div
                        animate={{ 
                          x: backgroundMusicEnabled ? (window.innerHeight < window.innerWidth ? 16 : 24) : 2
                        }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        className="absolute top-0.5 landscape:top-0.5 w-5 h-5 landscape:w-3 landscape:h-3 bg-white rounded-full shadow-lg"
                      />
                    </button>
                  </div>
                </div>

                {/* Table Theme Setting (Admin Only) */}
                {isAdmin && onOpenThemeSelector && (
                  <div className="bg-purple-900/30 rounded-lg landscape:rounded p-3 landscape:p-1.5 border border-purple-500/30">
                    <div className="flex items-start justify-between gap-2 landscape:gap-1.5">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 landscape:gap-1 mb-1 landscape:mb-0">
                          <span className="text-base landscape:text-[10px]">🎨</span>
                          <h3 className="text-white font-semibold text-sm landscape:text-[9px]">Table Theme</h3>
                          <span className="text-[8px] landscape:text-[6px] bg-purple-500 text-white px-1 py-0.5 rounded">ADMIN</span>
                        </div>
                        <p className="text-gray-400 text-xs landscape:text-[7px] landscape:leading-tight">
                          Change the poker table theme. Choose from Classic, Royal, Neon, and more.
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          soundManager.playClick()
                          onOpenThemeSelector()
                        }}
                        onMouseEnter={() => soundManager.playHover()}
                        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white px-3 py-2 landscape:px-2 landscape:py-1 rounded-lg landscape:rounded text-xs landscape:text-[8px] font-semibold transition-all flex-shrink-0"
                      >
                        Change
                      </button>
                    </div>
                  </div>
                )}

              </div>

              {/* Footer */}
              <div className="bg-gray-800/30 p-2 landscape:p-1 border-t border-gray-700/50 flex-shrink-0">
                <p className="text-center text-gray-500 text-[10px] landscape:text-[7px]">
                  Settings are saved automatically
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
