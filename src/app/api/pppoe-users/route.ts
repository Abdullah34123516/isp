import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { UserRole, PPPoEStatus } from '@/lib/db'
import { createRouterOSClient, syncPPPoEUsers } from '@/lib/routeros-client'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(request.url)
    const routerId = url.searchParams.get('routerId')
    const customerId = url.searchParams.get('customerId')

    let pppoeUsers
    if (session.user.role === UserRole.SUPER_ADMIN) {
      // Super admin can see all PPPoE users
      pppoeUsers = await db.pPPoEUser.findMany({
        where: {
          ...(routerId && { routerId }),
          ...(customerId && { customerId })
        },
        include: {
          customer: {
            include: {
              user: {
                select: { id: true, name: true, email: true }
              }
            }
          },
          router: {
            include: {
              ispOwner: {
                include: {
                  user: {
                    select: { id: true, name: true, email: true }
                  }
                }
              }
            }
          },
          plan: true
        },
        orderBy: { createdAt: 'desc' }
      })
    } else if (session.user.role === UserRole.ISP_OWNER) {
      // ISP owner can only see their own PPPoE users
      pppoeUsers = await db.pPPoEUser.findMany({
        where: {
          router: {
            ispOwnerId: session.user.tenantId
          },
          ...(routerId && { routerId }),
          ...(customerId && { customerId })
        },
        include: {
          customer: {
            include: {
              user: {
                select: { id: true, name: true, email: true }
              }
            }
          },
          router: true,
          plan: true
        },
        orderBy: { createdAt: 'desc' }
      })
    } else if (session.user.role === UserRole.CUSTOMER) {
      // Customer can only see their own PPPoE users
      const customer = await db.customer.findUnique({
        where: { userId: session.user.id }
      })

      if (!customer) {
        return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
      }

      pppoeUsers = await db.pPPoEUser.findMany({
        where: {
          customerId: customer.id,
          ...(routerId && { routerId })
        },
        include: {
          customer: {
            include: {
              user: {
                select: { id: true, name: true, email: true }
              }
            }
          },
          router: true,
          plan: true
        },
        orderBy: { createdAt: 'desc' }
      })
    } else {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json(pppoeUsers)
  } catch (error) {
    console.error('Error fetching PPPoE users:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== UserRole.ISP_OWNER && session.user.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { username, password, customerId, routerId, planId, downloadSpeed, uploadSpeed, dataLimit, expiresAt } = body

    // Validate required fields
    if (!username || !password || !customerId || !routerId || !planId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check if username already exists
    const existingUser = await db.pPPoEUser.findUnique({
      where: { username }
    })

    if (existingUser) {
      return NextResponse.json({ error: 'PPPoE username already exists' }, { status: 400 })
    }

    // Verify customer exists and belongs to the same ISP owner
    const customer = await db.customer.findUnique({
      where: { id: customerId },
      include: {
        ispOwner: true
      }
    })

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    // Check permissions
    if (session.user.role === UserRole.ISP_OWNER && customer.ispOwnerId !== session.user.tenantId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Verify router exists and belongs to the same ISP owner
    const router = await db.router.findUnique({
      where: { id: routerId }
    })

    if (!router) {
      return NextResponse.json({ error: 'Router not found' }, { status: 404 })
    }

    // Check permissions
    if (session.user.role === UserRole.ISP_OWNER && router.ispOwnerId !== session.user.tenantId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Verify plan exists and belongs to the same ISP owner
    const plan = await db.plan.findUnique({
      where: { id: planId }
    })

    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
    }

    // Check permissions
    if (session.user.role === UserRole.ISP_OWNER && plan.ispOwnerId !== session.user.tenantId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Create PPPoE user
    const pppoeUser = await db.pPPoEUser.create({
      data: {
        username,
        password,
        customerId,
        routerId,
        planId,
        status: PPPoEStatus.ACTIVE,
        downloadSpeed: downloadSpeed || plan.speed,
        uploadSpeed: uploadSpeed || plan.speed,
        dataLimit: dataLimit || plan.dataLimit,
        expiresAt: expiresAt ? new Date(expiresAt) : null
      },
      include: {
        customer: {
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          }
        },
        router: true,
        plan: true
      }
    })

    // Sync with RouterOS
    try {
      const client = createRouterOSClient(router)
      const connected = await client.connect()
      
      if (connected) {
        await client.addPPPoESecret({
          name: username,
          password,
          service: 'pppoe',
          profile: 'default',
          'caller-id': '',
          disabled: false,
          'rate-limit': `${downloadSpeed || plan.speed}/${uploadSpeed || plan.speed}`,
          'limit-bytes-in': dataLimit ? parseDataLimit(dataLimit) : undefined,
          'limit-bytes-out': dataLimit ? parseDataLimit(dataLimit) : undefined,
          comment: `Customer: ${customer.user.name}`
        })
        await client.disconnect()
      }
    } catch (error) {
      console.error('Failed to sync PPPoE user with RouterOS:', error)
      // Don't fail the request if RouterOS sync fails
    }

    return NextResponse.json(pppoeUser)
  } catch (error) {
    console.error('Error creating PPPoE user:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Helper function to parse data limit string to bytes
function parseDataLimit(dataLimit: string): string {
  const units = {
    'B': 1,
    'KB': 1024,
    'MB': 1024 * 1024,
    'GB': 1024 * 1024 * 1024,
    'TB': 1024 * 1024 * 1024 * 1024
  }

  const match = dataLimit.match(/^(\d+(?:\.\d+)?)\s*(B|KB|MB|GB|TB)$/i)
  if (!match) return '0'

  const value = parseFloat(match[1])
  const unit = match[2].toUpperCase()
  
  return Math.floor(value * units[unit]).toString()
}