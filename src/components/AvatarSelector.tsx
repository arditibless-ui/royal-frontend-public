'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, X, Check } from 'lucide-react'

interface AvatarSelectorProps {
  isVisible: boolean
  onClose: () => void
  currentAvatar?: string
  currentAvatarUrl?: string
  onUpdate: (avatar: string, avatarUrl?: string) => void
}

export default function AvatarSelector({ 
  isVisible, 
  onClose, 
  currentAvatar = '👤',
  currentAvatarUrl,
  onUpdate 
}: AvatarSelectorProps) {
  const [selectedEmoji, setSelectedEmoji] = useState(currentAvatar)
  const [uploading, setUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState(currentAvatarUrl || '')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const emojis = [
    '👤', '😀', '😎', '🤠', '🧙', '🦸', '🤖', '👽', 
    '🐶', '🐱', '🦁', '🐯', '🐻', '🐼', '🐨', '🦊',
    '🎭', '🎨', '🎪', '🎯', '🎲', '🃏', '💎', '👑',
    '🔥', '⚡', '💫', '⭐', '🌟', '✨', '💥', '🌈'
  ]

  const handleEmojiSelect = (emoji: string) => {
    setSelectedEmoji(emoji)
    setPreviewUrl('')
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB')
      return
    }

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string)
      setSelectedEmoji('')
    }
    reader.readAsDataURL(file)
  }

  const handleUpload = async () => {
    const file = fileInputRef.current?.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('avatar', file)

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/avatar/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      })

      const data = await response.json()
      if (response.ok) {
        onUpdate('', data.avatarUrl)
        onClose()
      } else {
        alert(data.message || 'Failed to upload avatar')
      }
    } catch (error) {
      console.error('Upload error:', error)
      alert('Failed to upload avatar')
    } finally {
      setUploading(false)
    }
  }

  const handleSaveEmoji = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/avatar/emoji`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ emoji: selectedEmoji })
      })

      const data = await response.json()
      if (response.ok) {
        onUpdate(selectedEmoji, '')
        onClose()
      } else {
        alert(data.message || 'Failed to update avatar')
      }
    } catch (error) {
      console.error('Update error:', error)
      alert('Failed to update avatar')
    }
  }

  if (!isVisible) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100]"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4 flex items-center justify-between rounded-t-2xl">
            <h2 className="text-white text-xl font-bold flex items-center gap-2">
              <span>🎭</span> Choose Your Avatar
            </h2>
            <button
              onClick={onClose}
              className="text-white hover:text-red-300 transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Preview */}
            <div className="flex justify-center">
              <div className="relative">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-6xl border-4 border-white shadow-xl overflow-hidden">
                  {previewUrl ? (
                    <img src={previewUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span>{selectedEmoji}</span>
                  )}
                </div>
                {(previewUrl || selectedEmoji !== currentAvatar) && (
                  <div className="absolute -bottom-2 -right-2 bg-green-500 rounded-full p-2">
                    <Check size={20} className="text-white" />
                  </div>
                )}
              </div>
            </div>

            {/* Upload Section */}
            <div className="bg-gray-800 rounded-xl p-4">
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                <Upload size={20} />
                Upload Custom Avatar
              </h3>
              <div className="flex gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
                >
                  Choose File
                </button>
                {previewUrl && (
                  <button
                    onClick={handleUpload}
                    disabled={uploading}
                    className="px-6 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors disabled:opacity-50"
                  >
                    {uploading ? 'Uploading...' : 'Upload'}
                  </button>
                )}
              </div>
              <p className="text-gray-400 text-xs mt-2">Max 5MB • JPG, PNG, GIF</p>
            </div>

            {/* Emoji Grid */}
            <div className="bg-gray-800 rounded-xl p-4">
              <h3 className="text-white font-semibold mb-3">Or Choose an Emoji</h3>
              <div className="grid grid-cols-8 gap-2">
                {emojis.map((emoji) => (
                  <motion.button
                    key={emoji}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleEmojiSelect(emoji)}
                    className={`w-12 h-12 rounded-lg flex items-center justify-center text-3xl transition-all ${
                      selectedEmoji === emoji
                        ? 'bg-gradient-to-br from-purple-500 to-pink-500 scale-110'
                        : 'bg-gray-700 hover:bg-gray-600'
                    }`}
                  >
                    {emoji}
                  </motion.button>
                ))}
              </div>
              {selectedEmoji && !previewUrl && (
                <button
                  onClick={handleSaveEmoji}
                  className="w-full mt-4 px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors font-semibold"
                >
                  Save Emoji Avatar
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
