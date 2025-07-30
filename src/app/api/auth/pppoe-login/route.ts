import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { UserRole } from '@/lib/types'
import { verifyPassword, generateToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, password } = body

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 })
    }

    // Find PPPoE user by username
    const pppoeUser = await db.pPPoEUser.findUnique({
      where: { username },
      include: {
        customer: {
          include: {
            user: true,
            ispOwner: true
          }
        },
        router: true,
        plan: true
      }
    })

    if (!pppoeUser) {
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 })
    }

    // Check if PPPoE user is active
    if (pppoeUser.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Account is not active' }, { status: 401 })
    }

    // Check if PPPoE user is expired
    if (pppoeUser.expiresAt && new Date(pppoeUser.expiresAt) < new Date()) {
      return NextResponse.json({ error: 'Account has expired' }, { status: 401 })
    }

    // Verify PPPoE password
    const isPasswordValid = await verifyPassword(password, pppoeUser.password)
    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 })
    }

    // Check if customer user is active
    if (!pppoeUser.customer.user.isActive) {
      return NextResponse.json({ error: 'Customer account is disabled' }, { status: 401 })
    }

    // Generate JWT token
    const token = generateToken({
      userId: pppoeUser.customer.user.id,
      email: pppoeUser.customer.user.email,
      role: UserRole.CUSTOMER,
      tenantId: pppoeUser.customer.ispOwnerId
    })

    // Update last connected timestamp
    await db.pPPoEUser.update({
      where: { id: pppoeUser.id },
      data: { lastConnected: new Date() }
    })

    // Return user info and token
    return NextResponse.json({
      token,
      user: {
        id: pppoeUser.customer.user.id,
        email: pppoeUser.customer.user.email,
        name: pppoeUser.customer.user.name,
        role: UserRole.CUSTOMER,
        tenantId: pppoeUser.customer.ispOwnerId
      },
      customer: {
        id: pppoeUser.customer.id,
        name: pppoeUser.customer.name,
        email: pppoeUser.customer.email,
        phone: pppoeUser.customer.phone,
        address: pppoeUser.customer.address,
        status: pppoeUser.customer.status
      },
      pppoeUser: {
        id: pppoeUser.id,
        username: pppoeUser.username,
        status: pppoeUser.status,
        downloadSpeed: pppoeUser.downloadSpeed,
        uploadSpeed: pppoeUser.uploadSpeed,
        dataLimit: pppoeUser.dataLimit,
        expiresAt: pppoeUser.expiresAt,
        plan: pppoeUser.plan,
        router: {
          id: pppoeUser.router.id,
          name: pppoeUser.router.name,
          ipAddress: pppoeUser.router.ipAddress
        }
      }
    })

  } catch (error) {
    console.error('PPPoE login error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}