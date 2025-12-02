'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, User, Lock, Image as ImageIcon, Upload, Trash2, Save } from 'lucide-react'
import { API_URL } from '../constants/api'

interface PlayerSettingsProps {
  isOpen: boolean
  onClose: () => void
  user: any
  onUserUpdate: (updatedUser: any) => void
}

const EMOJI_AVATARS = [
  '😀', '😎', '🤠', '🤓', '🤩', '🥳', '😇', '🤡',
  '👨', '👩', '🧔', '👴', '👵', '👶', '🤵', '👸',
  '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼',
  '🦁', '🐯', '🦄', '🐸', '🐵', '🐔', '🐧', '🦅'
]

const PRESET_AVATARS = [
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Max',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Sophie',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Tiger',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Jasper',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Leo',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Luna',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Charlie',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Bella',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Rocky',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Daisy',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Duke',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Molly',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Jack',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Lucy'
]

export default function PlayerSettings({ isOpen, onClose, user, onUserUpdate }: PlayerSettingsProps) {
  const [activeTab, setActiveTab] = useState<'avatar' | 'password'>('avatar')
  const [selectedEmoji, setSelectedEmoji] = useState(user?.avatar || '👤')
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.avatarUrl || null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{text: string, type: 'success' | 'error'} | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type })
    setTimeout(() => setMessage(null), 3000)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check file type
    if (!file.type.startsWith('image/')) {
      showMessage('Please select an image file', 'error')
      return
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showMessage('Image size must be less than 5MB', 'error')
      return
    }

    setAvatarFile(file)
    const reader = new FileReader()
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) {
      setAvatarFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleSaveAvatar = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')

      if (avatarFile) {
        // Upload custom avatar
        const formData = new FormData()
        formData.append('avatar', avatarFile)

        const response = await fetch(`${API_URL}/api/avatar/upload`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        })

        if (response.ok) {
          const data = await response.json()
          onUserUpdate({ ...user, avatarUrl: data.avatarUrl, avatar: null })
          showMessage('Avatar uploaded successfully!', 'success')
        } else {
          const error = await response.json()
          showMessage(error.message || 'Failed to upload avatar', 'error')
        }
      } else if (selectedPreset) {
        // Save preset avatar
        const response = await fetch(`${API_URL}/api/avatar/preset`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ avatarUrl: selectedPreset })
        })

        if (response.ok) {
          const data = await response.json()
          onUserUpdate({ ...user, avatarUrl: selectedPreset, avatar: null })
          showMessage('Avatar updated successfully!', 'success')
        } else {
          const error = await response.json()
          showMessage(error.message || 'Failed to update avatar', 'error')
        }
      } else if (selectedEmoji !== user?.avatar) {
        // Save emoji avatar
        const response = await fetch(`${API_URL}/api/avatar/emoji`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ emoji: selectedEmoji })
        })

        if (response.ok) {
          const data = await response.json()
          onUserUpdate({ ...user, avatar: selectedEmoji, avatarUrl: null })
          showMessage('Avatar updated successfully!', 'success')
        } else {
          const error = await response.json()
          showMessage(error.message || 'Failed to update avatar', 'error')
        }
      }
    } catch (error) {
      console.error('Save avatar error:', error)
      showMessage('Failed to save avatar', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAvatar = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/api/avatar`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        setAvatarPreview(null)
        setAvatarFile(null)
        setSelectedEmoji('👤')
        onUserUpdate({ ...user, avatar: '👤', avatarUrl: null })
        showMessage('Avatar deleted successfully!', 'success')
      } else {
        showMessage('Failed to delete avatar', 'error')
      }
    } catch (error) {
      console.error('Delete avatar error:', error)
      showMessage('Failed to delete avatar', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleChangePassword = async () => {
    // Validation
    if (!oldPassword || !newPassword || !confirmPassword) {
      showMessage('Please fill all password fields', 'error')
      return
    }

    if (newPassword.length < 6) {
      showMessage('New password must be at least 6 characters', 'error')
      return
    }

    if (newPassword !== confirmPassword) {
      showMessage('New passwords do not match', 'error')
      return
    }

    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/api/users/change-password`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ oldPassword, newPassword })
      })

      if (response.ok) {
        showMessage('Password changed successfully!', 'success')
        setOldPassword('')
        setNewPassword('')
        setConfirmPassword('')
      } else {
        const error = await response.json()
        showMessage(error.message || 'Failed to change password', 'error')
      }
    } catch (error) {
      console.error('Change password error:', error)
      showMessage('Failed to change password', 'error')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
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
          className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl border-2 border-purple-500/30 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <User className="w-6 h-6 text-white" />
              <h2 className="text-2xl font-bold text-white">Player Settings</h2>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-700">
            <button
              onClick={() => setActiveTab('avatar')}
              className={`flex-1 px-6 py-4 font-semibold transition-colors flex items-center justify-center gap-2 ${
                activeTab === 'avatar'
                  ? 'bg-purple-600/20 text-purple-400 border-b-2 border-purple-500'
                  : 'text-gray-400 hover:text-gray-300 hover:bg-gray-800/50'
              }`}
            >
              <ImageIcon className="w-5 h-5" />
              Avatar
            </button>
            <button
              onClick={() => setActiveTab('password')}
              className={`flex-1 px-6 py-4 font-semibold transition-colors flex items-center justify-center gap-2 ${
                activeTab === 'password'
                  ? 'bg-purple-600/20 text-purple-400 border-b-2 border-purple-500'
                  : 'text-gray-400 hover:text-gray-300 hover:bg-gray-800/50'
              }`}
            >
              <Lock className="w-5 h-5" />
              Password
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
            {activeTab === 'avatar' && (
              <div className="space-y-6">
                {/* Current Avatar Preview */}
                <div className="text-center">
                  <p className="text-gray-400 mb-3">Current Avatar</p>
                  <div className="inline-block p-4 bg-gray-800/50 rounded-xl border-2 border-gray-700">
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Avatar" className="w-24 h-24 rounded-full object-cover" />
                    ) : selectedPreset ? (
                      <img src={selectedPreset} alt="Avatar" className="w-24 h-24 rounded-full object-cover" />
                    ) : (
                      <span className="text-6xl">{selectedEmoji}</span>
                    )}
                  </div>
                </div>

                {/* Preset Avatars */}
                <div>
                  <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Choose an Avatar
                  </h3>
                  <div className="grid grid-cols-4 gap-3 mb-4">
                    {PRESET_AVATARS.map((avatarUrl, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setSelectedPreset(avatarUrl)
                          setAvatarPreview(null)
                          setAvatarFile(null)
                          setSelectedEmoji('👤')
                        }}
                        className={`aspect-square rounded-full p-1 transition-all hover:scale-110 ${
                          selectedPreset === avatarUrl
                            ? 'bg-purple-600/30 ring-2 ring-purple-500'
                            : 'bg-gray-800/50 hover:bg-gray-700/50'
                        }`}
                      >
                        <img src={avatarUrl} alt={`Avatar ${index + 1}`} className="w-full h-full rounded-full" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Upload Custom Avatar Button */}
                <div>
                  <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                    <Upload className="w-5 h-5" />
                    Upload Custom Avatar
                  </h3>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white px-6 py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-3 shadow-lg active:scale-95"
                  >
                    <Upload className="w-6 h-6" />
                    <span>Choose Image from Device</span>
                  </button>
                  <p className="text-gray-400 text-sm text-center mt-2">PNG, JPG, GIF up to 5MB</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>

                {/* Emoji Avatars */}
                <div>
                  <h3 className="text-white font-semibold mb-3">Or Choose an Emoji</h3>
                  <div className="grid grid-cols-6 gap-2">
                    {EMOJI_AVATARS.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => {
                          setSelectedEmoji(emoji)
                          setAvatarPreview(null)
                          setAvatarFile(null)
                          setSelectedPreset(null)
                        }}
                        className={`text-3xl p-3 rounded-lg transition-all hover:scale-110 ${
                          selectedEmoji === emoji && !avatarPreview && !selectedPreset
                            ? 'bg-purple-600/30 ring-2 ring-purple-500'
                            : 'bg-gray-800/50 hover:bg-gray-700/50'
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={handleSaveAvatar}
                    disabled={loading}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white px-6 py-3 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Save className="w-5 h-5" />
                    {loading ? 'Saving...' : 'Save Avatar'}
                  </button>
                  {(avatarPreview || user?.avatarUrl) && (
                    <button
                      onClick={handleDeleteAvatar}
                      disabled={loading}
                      className="bg-red-600 hover:bg-red-500 text-white px-6 py-3 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <Trash2 className="w-5 h-5" />
                      Delete
                    </button>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'password' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-gray-400 mb-2">Current Password</label>
                  <input
                    type="password"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Enter current password"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 mb-2">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Enter new password (min 6 characters)"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 mb-2">Confirm New Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Confirm new password"
                  />
                </div>

                <button
                  onClick={handleChangePassword}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white px-6 py-3 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Lock className="w-5 h-5" />
                  {loading ? 'Changing...' : 'Change Password'}
                </button>
              </div>
            )}
          </div>

          {/* Message Notification */}
          <AnimatePresence>
            {message && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className={`mx-6 mb-6 p-4 rounded-xl ${
                  message.type === 'success'
                    ? 'bg-green-500/20 border border-green-500/30 text-green-400'
                    : 'bg-red-500/20 border border-red-500/30 text-red-400'
                }`}
              >
                {message.text}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
