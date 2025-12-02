'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Users, UserPlus, UserMinus, Send, Check, AlertCircle } from 'lucide-react'
import { API_URL } from '../constants/api'
import { soundManager } from '@/utils/sounds'

interface Friend {
  _id: string
  userId: {
    _id: string
    username: string
    avatar?: string
  }
  username: string
  addedAt: Date
  status: string
  online?: boolean
}

interface FriendRequest {
  _id: string
  fromUserId: string
  fromUsername: string
  sentAt: Date
}

interface FriendsMenuProps {
  onClose: () => void
}

export default function FriendsMenu({ onClose }: FriendsMenuProps) {
  const [friends, setFriends] = useState<Friend[]>([])
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([])
  const [activeTab, setActiveTab] = useState<'friends' | 'requests'>('friends')
  const [searchUsername, setSearchUsername] = useState('')
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchFriends()
    fetchFriendRequests()
  }, [])

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 3000)
  }

  const fetchFriends = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_URL}/api/users/friends`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (res.ok) {
        const data = await res.json()
        setFriends(data.friends || [])
      }
    } catch (error) {
      console.error('Failed to fetch friends:', error)
    }
  }

  const fetchFriendRequests = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_URL}/api/users/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (res.ok) {
        const data = await res.json()
        setFriendRequests(data.user?.friendRequests || [])
      }
    } catch (error) {
      console.error('Failed to fetch friend requests:', error)
    }
  }

  const sendFriendRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!searchUsername.trim()) {
      showNotification('Please enter a username', 'error')
      return
    }

    setLoading(true)

    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_URL}/api/users/friend-request`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username: searchUsername.trim() })
      })

      const data = await res.json()

      if (res.ok) {
        soundManager.playSuccess()
        showNotification(`Friend request sent to ${searchUsername}!`, 'success')
        setSearchUsername('')
      } else {
        soundManager.playError()
        showNotification(data.message || 'Failed to send friend request', 'error')
      }
    } catch (error) {
      soundManager.playError()
      showNotification('Network error. Please try again.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const acceptFriendRequest = async (requestId: string, username: string) => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_URL}/api/users/friend-request/${requestId}/accept`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (res.ok) {
        soundManager.playSuccess()
        showNotification(`You are now friends with ${username}!`, 'success')
        fetchFriends()
        fetchFriendRequests()
      }
    } catch (error) {
      showNotification('Failed to accept friend request', 'error')
    }
  }

  const rejectFriendRequest = async (requestId: string) => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_URL}/api/users/friend-request/${requestId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (res.ok) {
        soundManager.playClick()
        showNotification('Friend request rejected', 'success')
        fetchFriendRequests()
      }
    } catch (error) {
      showNotification('Failed to reject friend request', 'error')
    }
  }

  const removeFriend = async (friendId: string, username: string) => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_URL}/api/users/friends/${friendId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (res.ok) {
        soundManager.playClick()
        showNotification(`Removed ${username} from friends`, 'success')
        fetchFriends()
      }
    } catch (error) {
      showNotification('Failed to remove friend', 'error')
    }
  }

  const onlineFriends = friends.filter(f => f.online)
  const offlineFriends = friends.filter(f => !f.online)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-gradient-to-br from-[#1a1f2e] to-[#2d1b3d] border border-white/20 rounded-xl shadow-2xl w-full max-w-md max-h-[85vh] overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-bold text-xl sm:text-2xl flex items-center gap-2">
              <Users className="w-6 h-6" />
              Friends
            </h2>
            <button
              onClick={onClose}
              onMouseEnter={() => soundManager.playHover()}
              className="text-white/80 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => {
                soundManager.playClick()
                setActiveTab('friends')
              }}
              onMouseEnter={() => soundManager.playHover()}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'friends'
                  ? 'bg-white/20 text-white shadow-lg'
                  : 'text-white/60 hover:text-white/80 hover:bg-white/10'
              }`}
            >
              Friends ({friends.length})
            </button>
            <button
              onClick={() => {
                soundManager.playClick()
                setActiveTab('requests')
              }}
              onMouseEnter={() => soundManager.playHover()}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all relative ${
                activeTab === 'requests'
                  ? 'bg-white/20 text-white shadow-lg'
                  : 'text-white/60 hover:text-white/80 hover:bg-white/10'
              }`}
            >
              Requests
              {friendRequests.length > 0 && (
                <span className="ml-1 bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                  {friendRequests.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Add Friend Section */}
        <div className="p-4 sm:p-6 border-b border-white/10 bg-black/20">
          <form onSubmit={sendFriendRequest} className="space-y-3">
            <label className="block text-white text-sm font-medium">
              Add Friend by Username
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={searchUsername}
                onChange={(e) => setSearchUsername(e.target.value)}
                placeholder="Enter username..."
                className="flex-1 px-4 py-2 bg-black/40 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                disabled={loading}
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="submit"
                disabled={loading || !searchUsername.trim()}
                onMouseEnter={() => soundManager.playHover()}
                className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                ) : (
                  <>
                    <Send size={18} />
                    <span className="hidden sm:inline">Send</span>
                  </>
                )}
              </motion.button>
            </div>
          </form>

          {/* Notification */}
          <AnimatePresence>
            {notification && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`mt-3 p-3 rounded-lg border ${
                  notification.type === 'success'
                    ? 'bg-green-500/10 border-green-500/30 text-green-300'
                    : 'bg-red-500/10 border-red-500/30 text-red-300'
                }`}
              >
                <div className="flex items-start gap-2">
                  {notification.type === 'success' ? (
                    <Check size={18} className="flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
                  )}
                  <p className="text-sm">{notification.message}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Content */}
        <div className="max-h-[400px] overflow-y-auto">
          {activeTab === 'friends' ? (
            <div>
              {friends.length === 0 ? (
                <div className="p-8 text-center text-gray-400">
                  <Users className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p className="text-lg font-medium">No friends yet</p>
                  <p className="text-sm mt-2">Add friends using the search above!</p>
                </div>
              ) : (
                <div>
                  {/* Online Friends */}
                  {onlineFriends.length > 0 && (
                    <div>
                      <div className="px-4 sm:px-6 py-2 bg-green-500/10 border-b border-white/10">
                        <p className="text-green-400 text-xs font-semibold uppercase tracking-wide">
                          Online ({onlineFriends.length})
                        </p>
                      </div>
                      {onlineFriends.map((friend) => (
                        <div
                          key={friend._id}
                          className="px-4 sm:px-6 py-4 hover:bg-white/5 border-b border-white/10 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="relative">
                                <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center text-2xl">
                                  {friend.userId?.avatar || '👤'}
                                </div>
                                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-[#1a1f2e] rounded-full" />
                              </div>
                              <div>
                                <p className="text-white font-medium">{friend.username}</p>
                                <p className="text-green-400 text-sm">Online</p>
                              </div>
                            </div>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => removeFriend(friend.userId._id, friend.username)}
                              onMouseEnter={() => soundManager.playHover()}
                              className="text-red-400 hover:text-red-300 transition-colors p-2"
                              title="Remove friend"
                            >
                              <UserMinus className="w-5 h-5" />
                            </motion.button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Offline Friends */}
                  {offlineFriends.length > 0 && (
                    <div>
                      <div className="px-4 sm:px-6 py-2 bg-gray-500/10 border-b border-white/10">
                        <p className="text-gray-400 text-xs font-semibold uppercase tracking-wide">
                          Offline ({offlineFriends.length})
                        </p>
                      </div>
                      {offlineFriends.map((friend) => (
                        <div
                          key={friend._id}
                          className="px-4 sm:px-6 py-4 hover:bg-white/5 border-b border-white/10 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="relative">
                                <div className="w-12 h-12 bg-gray-500/20 rounded-full flex items-center justify-center text-2xl opacity-60">
                                  {friend.userId?.avatar || '👤'}
                                </div>
                                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-gray-500 border-2 border-[#1a1f2e] rounded-full" />
                              </div>
                              <div>
                                <p className="text-white/60 font-medium">{friend.username}</p>
                                <p className="text-gray-500 text-sm">Offline</p>
                              </div>
                            </div>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => removeFriend(friend.userId._id, friend.username)}
                              onMouseEnter={() => soundManager.playHover()}
                              className="text-red-400 hover:text-red-300 transition-colors p-2"
                              title="Remove friend"
                            >
                              <UserMinus className="w-5 h-5" />
                            </motion.button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div>
              {friendRequests.length === 0 ? (
                <div className="p-8 text-center text-gray-400">
                  <UserPlus className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p className="text-lg font-medium">No friend requests</p>
                  <p className="text-sm mt-2">You'll see requests here when someone adds you</p>
                </div>
              ) : (
                <div>
                  {friendRequests.map((request) => (
                    <div
                      key={request._id}
                      className="px-4 sm:px-6 py-4 hover:bg-white/5 border-b border-white/10 transition-colors"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center text-2xl">
                          👤
                        </div>
                        <div className="flex-1">
                          <p className="text-white font-medium">{request.fromUsername}</p>
                          <p className="text-gray-400 text-sm">
                            {new Date(request.sentAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => acceptFriendRequest(request._id, request.fromUsername)}
                          onMouseEnter={() => soundManager.playHover()}
                          className="flex-1 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2"
                        >
                          <Check className="w-4 h-4" />
                          Accept
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => rejectFriendRequest(request._id)}
                          onMouseEnter={() => soundManager.playHover()}
                          className="flex-1 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2"
                        >
                          <X className="w-4 h-4" />
                          Reject
                        </motion.button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}
