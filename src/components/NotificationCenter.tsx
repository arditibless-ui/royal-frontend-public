'use client';

import React, { useState, useEffect } from 'react';
import { Bell, X, Check, CheckCheck, UserPlus, DollarSign, Gift, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { io, Socket } from 'socket.io-client';
import { soundManager } from '@/utils/sounds';

interface Notification {
  _id: string;
  type: 'info' | 'warning' | 'friend_request' | 'friend_accepted' | 'system' | 'credits' | 'transfer';
  title: string;
  message: string;
  data?: any;
  read: boolean;
  createdAt: Date;
}

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationCenter({ isOpen, onClose }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const socketRef = React.useRef<Socket | null>(null);

  useEffect(() => {
    fetchNotifications();
    
    // Connect to socket for real-time notifications
    const token = localStorage.getItem('token');
    if (token) {
      socketRef.current = io('http://localhost:5001', {
        auth: { token }
      });

      socketRef.current.on('notification', (notification: Notification) => {
        setNotifications(prev => [notification, ...prev]);
        setUnreadCount(prev => prev + 1);
        soundManager.playSuccess();
      });

      return () => {
        socketRef.current?.disconnect();
      };
    }
  }, []);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:3001/api/notifications', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications);
        setUnreadCount(data.notifications.filter((n: Notification) => !n.read).length);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:3001/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (res.ok) {
        setNotifications(prev => 
          prev.map(n => n._id === notificationId ? { ...n, read: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:3001/api/notifications/read-all', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:3001/api/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (res.ok) {
        const wasUnread = notifications.find(n => n._id === notificationId)?.read === false;
        setNotifications(prev => prev.filter(n => n._id !== notificationId));
        if (wasUnread) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      }
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'friend_request':
        return <UserPlus className="w-5 h-5" />;
      case 'friend_accepted':
        return <Check className="w-5 h-5" />;
      case 'credits':
      case 'transfer':
        return <DollarSign className="w-5 h-5" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5" />;
      case 'system':
        return <Gift className="w-5 h-5" />;
      default:
        return <Bell className="w-5 h-5" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'friend_request':
        return 'bg-blue-500/20 border-blue-500/50 text-blue-400';
      case 'friend_accepted':
        return 'bg-green-500/20 border-green-500/50 text-green-400';
      case 'credits':
      case 'transfer':
        return 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400';
      case 'warning':
        return 'bg-red-500/20 border-red-500/50 text-red-400';
      case 'system':
        return 'bg-purple-500/20 border-purple-500/50 text-purple-400';
      default:
        return 'bg-gray-500/20 border-gray-500/50 text-gray-400';
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return new Date(date).toLocaleDateString();
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

          {/* Notifications Modal - Same style as GameSettings */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            transition={{ type: "spring", duration: 0.4 }}
            className="fixed inset-2 landscape:inset-4 z-50 flex items-center justify-center"
          >
            <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl landscape:rounded-lg shadow-2xl border-2 border-blue-500/50 w-full max-w-md landscape:max-w-none landscape:w-auto landscape:min-w-[500px] max-h-[90vh] landscape:max-h-[92vh] flex flex-col">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 p-3 landscape:p-1.5 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-2 landscape:gap-1.5">
                  <div className="w-8 h-8 landscape:w-5 landscape:h-5 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                    <Bell className="w-5 h-5 landscape:w-3 landscape:h-3 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg landscape:text-[11px] font-bold text-white">Notifications</h2>
                    <p className="text-[10px] landscape:text-[7px] text-white/80">
                      {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 landscape:gap-1">
                  {unreadCount > 0 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        markAllAsRead();
                        soundManager.playClick();
                      }}
                      onMouseEnter={() => soundManager.playHover()}
                      className="px-2 py-1 landscape:px-1.5 landscape:py-0.5 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-all text-xs landscape:text-[8px] flex items-center gap-1"
                    >
                      <CheckCheck className="w-3 h-3 landscape:w-2 landscape:h-2" />
                      <span>Mark all read</span>
                    </button>
                  )}
                  <button
                    onClick={onClose}
                    onMouseEnter={() => soundManager.playHover()}
                    className="w-8 h-8 landscape:w-5 landscape:h-5 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
                  >
                    <X className="w-5 h-5 landscape:w-3 landscape:h-3 text-white" />
                  </button>
                </div>
              </div>

              {/* Notifications List */}
              <div className="flex-1 overflow-y-auto p-3 landscape:p-2 space-y-2 landscape:space-y-1">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full py-8 landscape:py-4 text-gray-400">
                    <Bell className="w-16 h-16 landscape:w-10 landscape:h-10 mb-4 landscape:mb-2 opacity-30" />
                    <p className="text-base landscape:text-xs">No notifications</p>
                    <p className="text-sm landscape:text-[9px] text-gray-500 mt-1">You're all caught up!</p>
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <motion.div
                      key={notification._id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className={`rounded-xl landscape:rounded-lg border-2 p-3 landscape:p-2 transition-all hover:scale-[1.02] ${
                        !notification.read 
                          ? 'bg-blue-500/10 border-blue-500/50 shadow-lg shadow-blue-500/20' 
                          : 'bg-white/5 border-white/10'
                      }`}
                    >
                      <div className="flex gap-3 landscape:gap-2">
                        {/* Icon */}
                        <div className={`w-10 h-10 landscape:w-8 landscape:h-8 rounded-full flex items-center justify-center border-2 flex-shrink-0 ${getNotificationColor(notification.type)}`}>
                          {getNotificationIcon(notification.type)}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="text-white font-semibold text-sm landscape:text-[10px]">
                              {notification.title}
                            </h4>
                            {!notification.read && (
                              <div className="w-2 h-2 landscape:w-1.5 landscape:h-1.5 bg-blue-500 rounded-full mt-1 flex-shrink-0 animate-pulse" />
                            )}
                          </div>
                          <p className="text-gray-300 text-sm landscape:text-[9px] mt-1 break-words">
                            {notification.message}
                          </p>
                          <div className="flex items-center justify-between mt-2 landscape:mt-1">
                            <span className="text-gray-500 text-xs landscape:text-[8px]">
                              {formatTime(notification.createdAt)}
                            </span>
                            <div className="flex gap-1">
                              {!notification.read && (
                                <button
                                  onClick={() => {
                                    markAsRead(notification._id);
                                    soundManager.playClick();
                                  }}
                                  onMouseEnter={() => soundManager.playHover()}
                                  className="px-2 py-1 landscape:px-1 landscape:py-0.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded text-xs landscape:text-[8px] transition-colors"
                                  title="Mark as read"
                                >
                                  <Check className="w-3 h-3 landscape:w-2.5 landscape:h-2.5" />
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  deleteNotification(notification._id);
                                  soundManager.playClick();
                                }}
                                onMouseEnter={() => soundManager.playHover()}
                                className="px-2 py-1 landscape:px-1 landscape:py-0.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded text-xs landscape:text-[8px] transition-colors"
                                title="Delete"
                              >
                                <X className="w-3 h-3 landscape:w-2.5 landscape:h-2.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
