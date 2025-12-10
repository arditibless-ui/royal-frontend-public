'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, Trophy, Users, TrendingUp, TrendingDown } from 'lucide-react';

interface GameHistoryEntry {
  _id: string;
  roomCode: string;
  handNumber: number;
  pot: number;
  winner: {
    userId: string;
    username: string;
    winnings: number;
  };
  players: Array<{
    userId: string;
    username: string;
    finalChips: number;
    invested: number;
  }>;
  completedAt: string;
}

interface GameHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

export default function GameHistoryModal({ isOpen, onClose, userId }: GameHistoryModalProps) {
  const [history, setHistory] = useState<GameHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && userId) {
      fetchHistory();
    } else if (isOpen && !userId) {
      setError('User ID not available');
      setLoading(false);
    }
  }, [isOpen, userId]);

  const fetchHistory = async () => {
    if (!userId) {
      setError('User ID not available');
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!apiUrl) {
        throw new Error('API URL not configured');
      }
      
      const response = await fetch(`${apiUrl}/api/history/games`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch game history');
      }

      const data = await response.json();
      setHistory(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching game history:', err);
      setError(err instanceof Error ? err.message : 'Failed to load game history');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isWinner = (game: GameHistoryEntry) => {
    return game.winner.userId === userId;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 landscape:p-2"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-2xl max-h-[90vh] landscape:max-h-[85vh] bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 rounded-2xl shadow-2xl border border-purple-500/20 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 landscape:p-3 border-b border-purple-500/20">
              <div className="flex items-center gap-3 landscape:gap-2">
                <div className="p-2 landscape:p-1.5 bg-purple-500/20 rounded-lg landscape:rounded">
                  <Clock className="w-6 h-6 landscape:w-5 landscape:h-5 text-purple-400" />
                </div>
                <h2 className="text-2xl landscape:text-lg font-bold text-white">Game History</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 landscape:p-1.5 hover:bg-white/10 rounded-lg landscape:rounded transition-colors"
              >
                <X className="w-6 h-6 landscape:w-5 landscape:h-5 text-gray-400" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 landscape:p-3 custom-scrollbar">
              {loading ? (
                <div className="flex items-center justify-center h-40">
                  <div className="animate-spin rounded-full h-12 w-12 landscape:h-8 landscape:w-8 border-b-2 border-purple-500"></div>
                </div>
              ) : error ? (
                <div className="text-center text-red-400 p-8 landscape:p-4">
                  <p>{error}</p>
                </div>
              ) : history.length === 0 ? (
                <div className="text-center text-gray-400 p-8 landscape:p-4">
                  <Trophy className="w-16 h-16 landscape:w-12 landscape:h-12 mx-auto mb-4 landscape:mb-2 opacity-50" />
                  <p className="text-lg landscape:text-sm">No games played yet</p>
                  <p className="text-sm landscape:text-xs mt-2 landscape:mt-1">Your game history will appear here</p>
                </div>
              ) : (
                <div className="space-y-3 landscape:space-y-2">
                  {history.map((game) => {
                    const won = isWinner(game);
                    return (
                      <motion.div
                        key={game._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-4 landscape:p-2 rounded-xl landscape:rounded-lg border-2 ${
                          won
                            ? 'bg-green-500/10 border-green-500/30'
                            : 'bg-red-500/10 border-red-500/30'
                        } hover:scale-[1.02] transition-transform`}
                      >
                        <div className="flex items-center justify-between mb-3 landscape:mb-1.5">
                          <div className="flex items-center gap-2 landscape:gap-1.5">
                            {won ? (
                              <TrendingUp className="w-5 h-5 landscape:w-4 landscape:h-4 text-green-400" />
                            ) : (
                              <TrendingDown className="w-5 h-5 landscape:w-4 landscape:h-4 text-red-400" />
                            )}
                            <span className={`font-bold text-lg landscape:text-sm ${
                              won ? 'text-green-400' : 'text-red-400'
                            }`}>
                              {won ? 'WIN' : 'LOSS'}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 landscape:gap-2 text-sm landscape:text-xs text-gray-400">
                            <span className="flex items-center gap-1">
                              <Users className="w-4 h-4 landscape:w-3 landscape:h-3" />
                              {game.players.length}
                            </span>
                            <span>{formatDate(game.completedAt)}</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 landscape:gap-2 text-sm landscape:text-xs">
                          <div>
                            <p className="text-gray-400 mb-1 landscape:mb-0.5">Room Code</p>
                            <p className="text-white font-mono font-bold">{game.roomCode}</p>
                          </div>
                          <div>
                            <p className="text-gray-400 mb-1 landscape:mb-0.5">Pot</p>
                            <p className="text-yellow-400 font-bold">{game.pot} credits</p>
                          </div>
                          <div>
                            <p className="text-gray-400 mb-1 landscape:mb-0.5">Winner</p>
                            <p className="text-purple-400 font-semibold">{game.winner.username}</p>
                          </div>
                          <div>
                            <p className="text-gray-400 mb-1 landscape:mb-0.5">Winnings</p>
                            <p className="text-green-400 font-bold">+{game.winner.winnings}</p>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
