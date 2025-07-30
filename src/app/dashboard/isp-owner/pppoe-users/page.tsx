'use client'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import PPPoEUserList from '@/components/pppoe/PPPoEUserList'

export default function PPPoEUsersPage() {
  const [mounted, setMounted] = useState(false)
  const [session, setSession] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
    const loadSession = async () => {
      const sessionData = await getServerSession(authOptions)
      setSession(sessionData)
      
      if (!sessionData || sessionData.user.role !== 'ISP_OWNER') {
        router.push('/login')
      }
    }
    loadSession()
  }, [router])

  if (!mounted || !session) {
    return (
      <DashboardLayout title="PPPoE User Management" role="isp-owner" user={session?.user || {}}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="PPPoE User Management" role="isp-owner" user={session.user}>
      <PPPoEUserList ispOwnerId={session.user.tenantId} />
    </DashboardLayout>
  )
}