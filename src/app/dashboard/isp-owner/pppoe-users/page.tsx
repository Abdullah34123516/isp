'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import PPPoEUserList from '@/components/pppoe/PPPoEUserList'

export default function PPPoEUsersPage() {
  const [mounted, setMounted] = useState(false)
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
    
    // Get user data from localStorage
    const userData = localStorage.getItem('user')
    if (userData) {
      const parsedUser = JSON.parse(userData)
      setUser(parsedUser)
      
      if (parsedUser.role !== 'ISP_OWNER') {
        router.push('/login')
      }
    } else {
      router.push('/login')
    }
  }, [router])

  if (!mounted || !user) {
    return (
      <DashboardLayout title="PPPoE User Management" role="isp-owner" user={user || {}}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="PPPoE User Management" role="isp-owner" user={user}>
      <PPPoEUserList ispOwnerId={user.tenantId} />
    </DashboardLayout>
  )
}