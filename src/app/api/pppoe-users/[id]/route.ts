import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { UserRole, PPPoEStatus } from '@/lib/db'
import { createRouterOSClient } from '@/lib/routeros-client'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const pppoeUser = await db.pPPoEUser.findUnique({
      where: { id: params.id },
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
      }
    })

    if (!pppoeUser) {
      return NextResponse.json({ error: 'PPPoE user not found' }, { status: 404 })
    }

    // Check permissions
    if (session.user.role === UserRole.SUPER_ADMIN) {
      // Super admin can access any PPPoE user
    } else if (session.user.role === UserRole.ISP_OWNER) {
      if (pppoeUser.router.ispOwnerId !== session.user.tenantId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    } else if (session.user.role === UserRole.CUSTOMER) {
      const customer = await db.customer.findUnique({
        where: { userId: session.user.id }
      })

      if (!customer || pppoeUser.customerId !== customer.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    } else {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json(pppoeUser)
  } catch (error) {
    console.error('Error fetching PPPoE user:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== UserRole.ISP_OWNER && session.user.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { username, password, status, downloadSpeed, uploadSpeed, dataLimit, expiresAt } = body

    const existingUser = await db.pPPoEUser.findUnique({
      where: { id: params.id },
      include: {
        customer: {
          include: {
            ispOwner: true
          }
        },
        router: true,
        plan: true
      }
    })

    if (!existingUser) {
      return NextResponse.json({ error: 'PPPoE user not found' }, { status: 404 })
    }

    // Check permissions
    if (session.user.role === UserRole.ISP_OWNER && existingUser.router.ispOwnerId !== session.user.tenantId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Check if new username conflicts with existing user
    if (username && username !== existingUser.username) {
      const conflictingUser = await db.pPPoEUser.findUnique({
        where: { username }
      })

      if (conflictingUser) {
        return NextResponse.json({ error: 'PPPoE username already exists' }, { status: 400 })
      }
    }

    // Update PPPoE user
    const updatedUser = await db.pPPoEUser.update({
      where: { id: params.id },
      data: {
        ...(username && { username }),
        ...(password && { password }),
        ...(status && { status }),
        ...(downloadSpeed !== undefined && { downloadSpeed }),
        ...(uploadSpeed !== undefined && { uploadSpeed }),
        ...(dataLimit !== undefined && { dataLimit }),
        ...(expiresAt !== undefined && { expiresAt: expiresAt ? new Date(expiresAt) : null })
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
      const client = createRouterOSClient(existingUser.router)
      const connected = await client.connect()
      
      if (connected) {
        await client.updatePPPoESecret(existingUser.username, {
          name: username || existingUser.username,
          password: password || existingUser.password,
          disabled: (status || existingUser.status) !== PPPoEStatus.ACTIVE,
          'rate-limit': `${downloadSpeed || existingUser.downloadSpeed}/${uploadSpeed || existingUser.uploadSpeed}`,
          'limit-bytes-in': dataLimit ? parseDataLimit(dataLimit) : undefined,
          'limit-bytes-out': dataLimit ? parseDataLimit(dataLimit) : undefined,
          comment: `Customer: ${existingUser.customer.user.name}`
        })
        await client.disconnect()
      }
    } catch (error) {
      console.error('Failed to sync PPPoE user update with RouterOS:', error)
      // Don't fail the request if RouterOS sync fails
    }

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error('Error updating PPPoE user:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== UserRole.ISP_OWNER && session.user.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const existingUser = await db.pPPoEUser.findUnique({
      where: { id: params.id },
      include: {
        router: true
      }
    })

    if (!existingUser) {
      return NextResponse.json({ error: 'PPPoE user not found' }, { status: 404 })
    }

    // Check permissions
    if (session.user.role === UserRole.ISP_OWNER && existingUser.router.ispOwnerId !== session.user.tenantId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Delete from RouterOS first
    try {
      const client = createRouterOSClient(existingUser.router)
      const connected = await client.connect()
      
      if (connected) {
        await client.deletePPPoESecret(existingUser.username)
        await client.disconnect()
      }
    } catch (error) {
      console.error('Failed to delete PPPoE user from RouterOS:', error)
      // Don't fail the request if RouterOS deletion fails
    }

    // Delete from database
    await db.pPPoEUser.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'PPPoE user deleted successfully' })
  } catch (error) {
    console.error('Error deleting PPPoE user:', error)
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