import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { UserRole, RouterStatus } from '@/lib/db'
import { checkRouterOnline, createRouterOSClient } from '@/lib/routeros-client'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const router = await db.router.findUnique({
      where: { id: params.id },
      include: {
        ispOwner: {
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          }
        },
        pppoeUsers: {
          include: {
            customer: {
              include: {
                user: {
                  select: { id: true, name: true, email: true }
                }
              }
            },
            plan: true
          }
        }
      }
    })

    if (!router) {
      return NextResponse.json({ error: 'Router not found' }, { status: 404 })
    }

    // Check permissions
    if (session.user.role !== UserRole.SUPER_ADMIN && router.ispOwnerId !== session.user.tenantId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Check online status
    try {
      const isOnline = await checkRouterOnline(router)
      return NextResponse.json({
        ...router,
        actualStatus: isOnline ? RouterStatus.ONLINE : RouterStatus.OFFLINE
      })
    } catch (error) {
      return NextResponse.json({
        ...router,
        actualStatus: RouterStatus.OFFLINE
      })
    }
  } catch (error) {
    console.error('Error fetching router:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, ipAddress, port, username, password, location, model, firmware } = body

    const existingRouter = await db.router.findUnique({
      where: { id: params.id }
    })

    if (!existingRouter) {
      return NextResponse.json({ error: 'Router not found' }, { status: 404 })
    }

    // Check permissions
    if (session.user.role !== UserRole.SUPER_ADMIN && existingRouter.ispOwnerId !== session.user.tenantId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Check if new IP address conflicts with existing router
    if (ipAddress && ipAddress !== existingRouter.ipAddress) {
      const conflictingRouter = await db.router.findUnique({
        where: { ipAddress }
      })

      if (conflictingRouter) {
        return NextResponse.json({ error: 'Router with this IP address already exists' }, { status: 400 })
      }
    }

    // Check if router is online with new credentials
    let isOnline = false
    if (ipAddress || port || username || password) {
      const tempRouter = {
        ...existingRouter,
        ipAddress: ipAddress || existingRouter.ipAddress,
        port: port || existingRouter.port,
        username: username || existingRouter.username,
        password: password || existingRouter.password
      }

      isOnline = await checkRouterOnline(tempRouter as any)
    }

    // Update router
    const updatedRouter = await db.router.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(ipAddress && { ipAddress }),
        ...(port && { port }),
        ...(username && { username }),
        ...(password && { password }),
        ...(location !== undefined && { location }),
        ...(model !== undefined && { model }),
        ...(firmware !== undefined && { firmware }),
        status: isOnline ? RouterStatus.ONLINE : RouterStatus.OFFLINE,
        lastConnected: isOnline ? new Date() : existingRouter.lastConnected
      },
      include: {
        ispOwner: {
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          }
        }
      }
    })

    return NextResponse.json({
      ...updatedRouter,
      actualStatus: isOnline ? RouterStatus.ONLINE : RouterStatus.OFFLINE
    })
  } catch (error) {
    console.error('Error updating router:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const router = await db.router.findUnique({
      where: { id: params.id }
    })

    if (!router) {
      return NextResponse.json({ error: 'Router not found' }, { status: 404 })
    }

    // Check permissions
    if (session.user.role !== UserRole.SUPER_ADMIN && router.ispOwnerId !== session.user.tenantId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Check if router has PPPoE users
    const pppoeUsersCount = await db.pPPoEUser.count({
      where: { routerId: params.id }
    })

    if (pppoeUsersCount > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete router with active PPPoE users. Please remove or reassign users first.' 
      }, { status: 400 })
    }

    await db.router.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Router deleted successfully' })
  } catch (error) {
    console.error('Error deleting router:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action } = body

    const router = await db.router.findUnique({
      where: { id: params.id }
    })

    if (!router) {
      return NextResponse.json({ error: 'Router not found' }, { status: 404 })
    }

    // Check permissions
    if (session.user.role !== UserRole.SUPER_ADMIN && router.ispOwnerId !== session.user.tenantId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    switch (action) {
      case 'check_status':
        const isOnline = await checkRouterOnline(router)
        const updatedRouter = await db.router.update({
          where: { id: params.id },
          data: {
            status: isOnline ? RouterStatus.ONLINE : RouterStatus.OFFLINE,
            lastConnected: isOnline ? new Date() : router.lastConnected
          }
        })

        return NextResponse.json({
          ...updatedRouter,
          actualStatus: isOnline ? RouterStatus.ONLINE : RouterStatus.OFFLINE
        })

      case 'sync_pppoe':
        const pppoeUsers = await db.pPPoEUser.findMany({
          where: { routerId: params.id },
          include: {
            customer: true,
            plan: true
          }
        })

        const client = createRouterOSClient(router)
        const connected = await client.connect()
        
        if (!connected) {
          return NextResponse.json({ error: 'Failed to connect to router' }, { status: 500 })
        }

        try {
          const syncResult = await client.syncPPPoEUsers(router, pppoeUsers)
          await client.disconnect()
          
          if (syncResult) {
            return NextResponse.json({ message: 'PPPoE users synced successfully' })
          } else {
            return NextResponse.json({ error: 'Failed to sync PPPoE users' }, { status: 500 })
          }
        } catch (error) {
          await client.disconnect()
          return NextResponse.json({ error: 'Failed to sync PPPoE users' }, { status: 500 })
        }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Error in router action:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}