import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticate, authorize } from '@/lib/middleware';
import { UserRole } from '@prisma/client';

// GET /api/routers - Get all routers for the authenticated ISP owner
export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticate(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const authError = authorize([UserRole.ISP_OWNER])(authResult);
    if (authError) {
      return authError;
    }

    const ispOwner = await db.ispOwner.findUnique({
      where: { userId: authResult.user.userId }
    });

    if (!ispOwner) {
      return NextResponse.json({ error: 'ISP owner not found' }, { status: 404 });
    }

    const routers = await db.router.findMany({
      where: { ispOwnerId: ispOwner.id },
      include: {
        pppoeUsers: {
          include: {
            customer: true,
            plan: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(routers);
  } catch (error) {
    console.error('Error fetching routers:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/routers - Create a new router
export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticate(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const authError = authorize([UserRole.ISP_OWNER])(authResult);
    if (authError) {
      return authError;
    }

    const ispOwner = await db.ispOwner.findUnique({
      where: { userId: authResult.user.userId }
    });

    if (!ispOwner) {
      return NextResponse.json({ error: 'ISP owner not found' }, { status: 404 });
    }

    const body = await request.json();
    const { name, ipAddress, port, username, password, location, model, firmware } = body;

    if (!name || !ipAddress || !port || !username || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const router = await db.router.create({
      data: {
        name,
        ipAddress,
        port,
        username,
        password,
        location,
        model,
        firmware,
        ispOwnerId: ispOwner.id
      }
    });

    return NextResponse.json(router, { status: 201 });
  } catch (error) {
    console.error('Error creating router:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}