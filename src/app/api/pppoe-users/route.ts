import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';

// GET /api/pppoe-users - Get all PPPoE users for the authenticated ISP owner
export async function GET(request: NextRequest) {
  try {
    const user = await auth(request);
    if (!user || user.role !== 'ISP_OWNER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const ispOwner = await db.ispOwner.findUnique({
      where: { userId: user.id }
    });

    if (!ispOwner) {
      return NextResponse.json({ error: 'ISP owner not found' }, { status: 404 });
    }

    const pppoeUsers = await db.pPPoEUser.findMany({
      where: {
        customer: {
          ispOwnerId: ispOwner.id
        }
      },
      include: {
        customer: true,
        router: true,
        plan: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(pppoeUsers);
  } catch (error) {
    console.error('Error fetching PPPoE users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/pppoe-users - Create a new PPPoE user
export async function POST(request: NextRequest) {
  try {
    const user = await auth(request);
    if (!user || user.role !== 'ISP_OWNER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const ispOwner = await db.ispOwner.findUnique({
      where: { userId: user.id }
    });

    if (!ispOwner) {
      return NextResponse.json({ error: 'ISP owner not found' }, { status: 404 });
    }

    const body = await request.json();
    const { username, password, customerId, routerId, planId, downloadSpeed, uploadSpeed, dataLimit, expiresAt } = body;

    if (!username || !password || !customerId || !routerId || !planId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify that the customer belongs to the ISP owner
    const customer = await db.customer.findFirst({
      where: {
        id: customerId,
        ispOwnerId: ispOwner.id
      }
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found or not authorized' }, { status: 404 });
    }

    // Verify that the router belongs to the ISP owner
    const router = await db.router.findFirst({
      where: {
        id: routerId,
        ispOwnerId: ispOwner.id
      }
    });

    if (!router) {
      return NextResponse.json({ error: 'Router not found or not authorized' }, { status: 404 });
    }

    // Verify that the plan belongs to the ISP owner
    const plan = await db.plan.findFirst({
      where: {
        id: planId,
        ispOwnerId: ispOwner.id
      }
    });

    if (!plan) {
      return NextResponse.json({ error: 'Plan not found or not authorized' }, { status: 404 });
    }

    const pppoeUser = await db.pPPoEUser.create({
      data: {
        username,
        password,
        customerId,
        routerId,
        planId,
        downloadSpeed: downloadSpeed || plan.speed,
        uploadSpeed: uploadSpeed || plan.speed,
        dataLimit: dataLimit || plan.dataLimit,
        expiresAt: expiresAt ? new Date(expiresAt) : null
      },
      include: {
        customer: true,
        router: true,
        plan: true
      }
    });

    return NextResponse.json(pppoeUser, { status: 201 });
  } catch (error) {
    console.error('Error creating PPPoE user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}