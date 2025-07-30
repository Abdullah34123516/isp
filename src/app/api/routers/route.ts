import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { UserRole, RouterStatus } from '@/lib/db'
import { checkRouterOnline } from '@/lib/routeros-client'
import { authenticate, authorize, AuthenticatedRequest } from '@/lib/middleware'

export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticate(request)
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const authRequest = authResult as AuthenticatedRequest
    const user = authRequest.user!

    const url = new URL(request.url)
    const ispOwnerId = url.searchParams.get('ispOwnerId')

    let routers
    if (user.role === UserRole.SUPER_ADMIN) {
      // Super admin can see all routers
      routers = await db.router.findMany({
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
        },
        orderBy: { createdAt: 'desc' }
      })
    } else if (user.role === UserRole.ISP_OWNER) {
      // ISP owner can only see their own routers
      routers = await db.router.findMany({
        where: { ispOwnerId: user.tenantId },
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
        },
        orderBy: { createdAt: 'desc' }
      })
    } else {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Check online status for each router
    const routersWithStatus = await Promise.all(
      routers.map(async (router) => {
        try {
          const isOnline = await checkRouterOnline(router)
          return {
            ...router,
            actualStatus: isOnline ? RouterStatus.ONLINE : RouterStatus.OFFLINE
          }
        } catch (error) {
          return {
            ...router,
            actualStatus: RouterStatus.OFFLINE
          }
        }
      })
    )

    return NextResponse.json(routersWithStatus)
  } catch (error) {
    console.error('Error fetching routers:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticate(request)
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const authRequest = authResult as AuthenticatedRequest
    const user = authRequest.user!

    const authCheck = authorize([UserRole.ISP_OWNER, UserRole.SUPER_ADMIN])(authRequest)
    if (authCheck) {
      return authCheck
    }

    const body = await request.json()
    const { name, ipAddress, port, username, password, location, model, firmware } = body

    // Validate required fields
    if (!name || !ipAddress || !port || !username || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check if router IP already exists
    const existingRouter = await db.router.findUnique({
      where: { ipAddress }
    })

    if (existingRouter) {
      return NextResponse.json({ error: 'Router with this IP address already exists' }, { status: 400 })
    }

    // Determine ISP owner ID
    const ispOwnerId = user.role === UserRole.ISP_OWNER ? user.tenantId : body.ispOwnerId

    if (!ispOwnerId) {
      return NextResponse.json({ error: 'ISP owner ID is required' }, { status: 400 })
    }

    // Check if router is online before adding
    const tempRouter = {
      id: 'temp',
      name,
      ipAddress,
      port,
      username,
      password,
      status: RouterStatus.OFFLINE,
      ispOwnerId,
      location,
      model,
      firmware,
      lastConnected: null,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const isOnline = await checkRouterOnline(tempRouter as any)

    // Create router in database
    const router = await db.router.create({
      data: {
        name,
        ipAddress,
        port,
        username,
        password,
        status: isOnline ? RouterStatus.ONLINE : RouterStatus.OFFLINE,
        ispOwnerId,
        location,
        model,
        firmware,
        lastConnected: isOnline ? new Date() : null
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
      ...router,
      actualStatus: isOnline ? RouterStatus.ONLINE : RouterStatus.OFFLINE
    })
  } catch (error) {
    console.error('Error creating router:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}