import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';

interface RouteParams {
  params: { id: string };
}

// GET /api/routers/[id] - Get a specific router
export async function GET(request: NextRequest, { params }: RouteParams) {
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

    const router = await db.router.findFirst({
      where: {
        id: params.id,
        ispOwnerId: ispOwner.id
      },
      include: {
        pppoeUsers: {
          include: {
            customer: true,
            plan: true
          }
        }
      }
    });

    if (!router) {
      return NextResponse.json({ error: 'Router not found' }, { status: 404 });
    }

    return NextResponse.json(router);
  } catch (error) {
    console.error('Error fetching router:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/routers/[id] - Update a router
export async function PUT(request: NextRequest, { params }: RouteParams) {
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
    const { name, ipAddress, port, username, password, location, model, firmware, status } = body;

    // Verify the router belongs to the ISP owner
    const existingRouter = await db.router.findFirst({
      where: {
        id: params.id,
        ispOwnerId: ispOwner.id
      }
    });

    if (!existingRouter) {
      return NextResponse.json({ error: 'Router not found or not authorized' }, { status: 404 });
    }

    const updatedRouter = await db.router.update({
      where: { id: params.id },
      data: {
        name: name || existingRouter.name,
        ipAddress: ipAddress || existingRouter.ipAddress,
        port: port || existingRouter.port,
        username: username || existingRouter.username,
        password: password || existingRouter.password,
        location: location || existingRouter.location,
        model: model || existingRouter.model,
        firmware: firmware || existingRouter.firmware,
        status: status || existingRouter.status
      },
      include: {
        pppoeUsers: {
          include: {
            customer: true,
            plan: true
          }
        }
      }
    });

    return NextResponse.json(updatedRouter);
  } catch (error) {
    console.error('Error updating router:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/routers/[id] - Delete a router
export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

    // Verify the router belongs to the ISP owner
    const existingRouter = await db.router.findFirst({
      where: {
        id: params.id,
        ispOwnerId: ispOwner.id
      }
    });

    if (!existingRouter) {
      return NextResponse.json({ error: 'Router not found or not authorized' }, { status: 404 });
    }

    // Check if there are any PPPoE users associated with this router
    const pppoeUsersCount = await db.pPPoEUser.count({
      where: { routerId: params.id }
    });

    if (pppoeUsersCount > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete router with active PPPoE users' 
      }, { status: 400 });
    }

    await db.router.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ message: 'Router deleted successfully' });
  } catch (error) {
    console.error('Error deleting router:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}