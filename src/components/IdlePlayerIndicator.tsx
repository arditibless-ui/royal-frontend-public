'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, AlertTriangle } from 'lucide-react';

interface IdlePlayerIndicatorProps {
  playerId: string;
  isIdle?: boolean;
  showOverlay?: boolean;
}

export default function IdlePlayerIndicator({ 
  playerId, 
  isIdle = false,
  showOverlay = false 
}: IdlePlayerIndicatorProps) {
  if (!isIdle) return null;

  return (
    <>
      {/* Idle Badge on Avatar */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0 }}
        className="absolute -top-1 -right-1 bg-yellow-500 rounded-full p-1 shadow-lg z-10"
        title="Player is idle"
      >
        <Clock className="w-3 h-3 text-white" />
      </motion.div>

      {/* Pulsing Ring */}
      <motion.div
        className="absolute inset-0 rounded-full border-2 border-yellow-500"
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.5, 0.8, 0.5]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      {/* Dim Overlay */}
      {showOverlay && (
        <div className="absolute inset-0 bg-black/40 rounded-full" />
      )}
    </>
  );
}

interface IdleWarningModalProps {
  isOpen: boolean;
  timeRemaining: number;
  onClose: () => void;
}

export function IdleWarningModal({ isOpen, timeRemaining, onClose }: IdleWarningModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100]">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-gradient-to-br from-yellow-500 to-orange-500 p-1 rounded-xl max-w-md mx-4"
          >
            <div className="bg-[#1a1f2e] rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-yellow-500/20 p-3 rounded-full">
                  <AlertTriangle className="w-8 h-8 text-yellow-500" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-xl">Idle Warning</h3>
                  <p className="text-gray-400 text-sm">You will be kicked soon</p>
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-lg p-4 mb-4">
                <p className="text-white text-center mb-2">
                  You haven't made any actions recently
                </p>
                <div className="flex items-center justify-center gap-2">
                  <Clock className="w-5 h-5 text-yellow-500" />
                  <span className="text-yellow-500 font-bold text-2xl">
                    {timeRemaining}s
                  </span>
                </div>
                <p className="text-gray-400 text-sm text-center mt-2">
                  until you are kicked for inactivity
                </p>
              </div>

              <button
                onClick={onClose}
                className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-bold py-3 rounded-lg transition-all transform hover:scale-105"
              >
                I'm Here!
              </button>

              <p className="text-gray-500 text-xs text-center mt-3">
                Make any action to stay in the game
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

interface KickedModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function KickedForIdleModal({ isOpen, onClose }: KickedModalProps) {
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        onClose();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100]">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-gradient-to-br from-red-500 to-orange-500 p-1 rounded-xl max-w-md mx-4"
          >
            <div className="bg-[#1a1f2e] rounded-lg p-6 text-center">
              <div className="bg-red-500/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-10 h-10 text-red-500" />
              </div>

              <h3 className="text-white font-bold text-2xl mb-2">
                Kicked for Inactivity
              </h3>
              
              <p className="text-gray-300 mb-6">
                You were removed from the game due to inactivity
              </p>

              <button
                onClick={onClose}
                className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-bold py-3 px-8 rounded-lg transition-all transform hover:scale-105"
              >
                Return to Lobby
              </button>

              <p className="text-gray-500 text-xs mt-4">
                Redirecting in 5 seconds...
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
