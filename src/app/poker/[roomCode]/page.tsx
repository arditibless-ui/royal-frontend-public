'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import PokerTablePage from '../../components/PokerTablePage'
import { mockAuth, shouldUseMockApi } from '../../../services/mockApi'
import { API_URL } from '../../../constants/api'

export const dynamicParams = true

export default function PokerRoomPage() {
  const params = useParams()
  const router = useRouter()
  const roomCode = params.roomCode as string
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkUser = async () => {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/')
        return
      }

      try {
        // Use mock API if backend is not available
        if (shouldUseMockApi()) {
          const result = await mockAuth.verify()
          if (result.success && result.user) {
            setIsAdmin(result.user.role === 'admin')
          }
          setLoading(false)
          return
        }

        // Try backend API
        const response = await fetch(`${API_URL}/api/auth/verify`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })
        
        if (response.ok) {
          const userData = await response.json()
          setIsAdmin(userData.user?.role === 'admin')
        }
      } catch (err) {
        console.error('Failed to check user role:', err)
      }
      setLoading(false)
    }

    checkUser()
  }, [router])

  const handleBack = () => {
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-green-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  return <PokerTablePage roomCode={roomCode} onBack={handleBack} isAdminView={isAdmin} />
}
