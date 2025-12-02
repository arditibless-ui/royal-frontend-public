'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, UserPlus, UserMinus, Check, X, User as UserIcon, Gamepad2 } from 'lucide-react';

interface Friend {
  _id: string;
  userId: {
    _id: string;
    username: string;
    avatar?: string;
    currentRoom?: string;
  };
  username: string;
  addedAt: Date;
  status: string;
  online?: boolean;
}

interface FriendRequest {
  _id: string;
  fromUserId: string;
  fromUsername: string;
  sentAt: Date;
}

export default function FriendsPanel() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'friends' | 'requests'>('friends');

  useEffect(() => {
    fetchFriends();
    fetchFriendRequests();
    
    // Refresh every 30 seconds
    const interval = setInterval(() => {
      fetchFriends();
      fetchFriendRequests();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchFriends = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:3001/api/users/friends', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (res.ok) {
        const data = await res.json();
        setFriends(data.friends);
      }
    } catch (error) {
      console.error('Failed to fetch friends:', error);
    }
  };

  const fetchFriendRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:3001/api/users/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (res.ok) {
        const data = await res.json();
        setFriendRequests(data.user.friendRequests || []);
      }
    } catch (error) {
      console.error('Failed to fetch friend requests:', error);
    }
  };

  const acceptFriendRequest = async (requestId: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:3001/api/users/friend-request/${requestId}/accept`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (res.ok) {
        fetchFriends();
        fetchFriendRequests();
      }
    } catch (error) {
      console.error('Failed to accept friend request:', error);
    }
  };

  const rejectFriendRequest = async (requestId: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:3001/api/users/friend-request/${requestId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (res.ok) {
        fetchFriendRequests();
      }
    } catch (error) {
      console.error('Failed to reject friend request:', error);
    }
  };

  const removeFriend = async (friendId: string) => {
    if (!confirm('Remove this friend?')) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:3001/api/users/friends/${friendId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (res.ok) {
        fetchFriends();
      }
    } catch (error) {
      console.error('Failed to remove friend:', error);
    }
  };

  const onlineFriends = friends.filter(f => f.online);
  const offlineFriends = friends.filter(f => !f.online);

  return (
    <div className="fixed right-4 bottom-4 z-40">
      {/* Collapsed Button */}
      <AnimatePresence>
        {!isExpanded && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            onClick={() => setIsExpanded(true)}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-full p-4 shadow-2xl transition-all relative"
          >
            <Users className="w-6 h-6" />
            {friendRequests.length > 0 && (
              <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                {friendRequests.length}
              </div>
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Expanded Panel */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="bg-[#1a1f2e] border border-white/20 rounded-xl shadow-2xl w-80 max-h-[600px] overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-bold text-lg flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Friends
                </h3>
                <button
                  onClick={() => setIsExpanded(false)}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => setActiveTab('friends')}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'friends'
                      ? 'bg-white/20 text-white'
                      : 'text-white/60 hover:text-white/80'
                  }`}
                >
                  Friends ({friends.length})
                </button>
                <button
                  onClick={() => setActiveTab('requests')}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-sm font-medium transition-colors relative ${
                    activeTab === 'requests'
                      ? 'bg-white/20 text-white'
                      : 'text-white/60 hover:text-white/80'
                  }`}
                >
                  Requests
                  {friendRequests.length > 0 && (
                    <span className="ml-1 bg-red-500 text-white text-xs rounded-full px-1.5">
                      {friendRequests.length}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="max-h-[480px] overflow-y-auto">
              {activeTab === 'friends' ? (
                <div>
                  {friends.length === 0 ? (
                    <div className="p-8 text-center text-gray-400">
                      <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p>No friends yet</p>
                      <p className="text-xs mt-1">Add friends from the game lobby</p>
                    </div>
                  ) : (
                    <div>
                      {/* Online Friends */}
                      {onlineFriends.length > 0 && (
                        <div>
                          <div className="px-4 py-2 bg-green-500/10 border-b border-white/10">
                            <p className="text-green-400 text-xs font-semibold uppercase">
                              Online ({onlineFriends.length})
                            </p>
                          </div>
                          {onlineFriends.map((friend) => (
                            <div key={friend._id} className="px-4 py-3 hover:bg-white/5 border-b border-white/10 transition-colors">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="relative">
                                    {friend.userId?.avatar ? (
                                      <img src={friend.userId.avatar} alt={friend.username} className="w-10 h-10 rounded-full" />
                                    ) : (
                                      <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                                        <UserIcon className="w-6 h-6 text-green-400" />
                                      </div>
                                    )}
                                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-[#1a1f2e] rounded-full" />
                                  </div>
                                  <div>
                                    <p className="text-white font-medium text-sm">{friend.username}</p>
                                    <p className="text-green-400 text-xs flex items-center gap-1">
                                      <Gamepad2 className="w-3 h-3" />
                                      In game
                                    </p>
                                  </div>
                                </div>
                                <button
                                  onClick={() => removeFriend(friend.userId._id)}
                                  className="text-red-400 hover:text-red-300 transition-colors"
                                  title="Remove friend"
                                >
                                  <UserMinus className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Offline Friends */}
                      {offlineFriends.length > 0 && (
                        <div>
                          <div className="px-4 py-2 bg-gray-500/10 border-b border-white/10">
                            <p className="text-gray-400 text-xs font-semibold uppercase">
                              Offline ({offlineFriends.length})
                            </p>
                          </div>
                          {offlineFriends.map((friend) => (
                            <div key={friend._id} className="px-4 py-3 hover:bg-white/5 border-b border-white/10 transition-colors">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="relative">
                                    {friend.userId?.avatar ? (
                                      <img src={friend.userId.avatar} alt={friend.username} className="w-10 h-10 rounded-full opacity-60" />
                                    ) : (
                                      <div className="w-10 h-10 bg-gray-500/20 rounded-full flex items-center justify-center">
                                        <UserIcon className="w-6 h-6 text-gray-400" />
                                      </div>
                                    )}
                                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-gray-500 border-2 border-[#1a1f2e] rounded-full" />
                                  </div>
                                  <div>
                                    <p className="text-white/60 font-medium text-sm">{friend.username}</p>
                                    <p className="text-gray-500 text-xs">Offline</p>
                                  </div>
                                </div>
                                <button
                                  onClick={() => removeFriend(friend.userId._id)}
                                  className="text-red-400 hover:text-red-300 transition-colors"
                                  title="Remove friend"
                                >
                                  <UserMinus className="w-4 h-4" />
                                </button>
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
                      <UserPlus className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p>No friend requests</p>
                    </div>
                  ) : (
                    <div>
                      {friendRequests.map((request) => (
                        <div key={request._id} className="px-4 py-3 hover:bg-white/5 border-b border-white/10 transition-colors">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                              <UserIcon className="w-6 h-6 text-blue-400" />
                            </div>
                            <div>
                              <p className="text-white font-medium text-sm">{request.fromUsername}</p>
                              <p className="text-gray-400 text-xs">
                                {new Date(request.sentAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => acceptFriendRequest(request._id)}
                              className="flex-1 bg-green-600 hover:bg-green-700 text-white py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1"
                            >
                              <Check className="w-4 h-4" />
                              Accept
                            </button>
                            <button
                              onClick={() => rejectFriendRequest(request._id)}
                              className="flex-1 bg-red-600 hover:bg-red-700 text-white py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1"
                            >
                              <X className="w-4 h-4" />
                              Reject
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
