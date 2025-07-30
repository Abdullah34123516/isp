import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';

interface RouteParams {
  params: { id: string };
}

// GET /api/pppoe-users/[id] - Get a specific PPPoE user
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

    const pppoeUser = await db.pPPoEUser.findFirst({
      where: {
        id: params.id,
        customer: {
          ispOwnerId: ispOwner.id
        }
      },
      include: {
        customer: true,
        router: true,
        plan: true
      }
    });

    if (!pppoeUser) {
      return NextResponse.json({ error: 'PPPoE user not found' }, { status: 404 });
    }

    return NextResponse.json(pppoeUser);
  } catch (error) {
    console.error('Error fetching PPPoE user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/pppoe-users/[id] - Update a PPPoE user
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
    const { status, downloadSpeed, uploadSpeed, dataLimit, expiresAt } = body;

    // Verify the PPPoE user belongs to the ISP owner
    const existingUser = await db.pPPoEUser.findFirst({
      where: {
        id: params.id,
        customer: {
          ispOwnerId: ispOwner.id
        }
      }
    });

    if (!existingUser) {
      return NextResponse.json({ error: 'PPPoE user not found or not authorized' }, { status: 404 });
    }

    const updatedUser = await db.pPPoEUser.update({
      where: { id: params.id },
      data: {
        status: status || existingUser.status,
        downloadSpeed: downloadSpeed || existingUser.downloadSpeed,
        uploadSpeed: uploadSpeed || existingUser.uploadSpeed,
        dataLimit: dataLimit || existingUser.dataLimit,
        expiresAt: expiresAt ? new Date(expiresAt) : existingUser.expiresAt
      },
      include: {
        customer: true,
        router: true,
        plan: true
      }
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Error updating PPPoE user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/pppoe-users/[id] - Delete a PPPoE user
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

    // Verify the PPPoE user belongs to the ISP owner
    const existingUser = await db.pPPoEUser.findFirst({
      where: {
        id: params.id,
        customer: {
          ispOwnerId: ispOwner.id
        }
      }
    });

    if (!existingUser) {
      return NextResponse.json({ error: 'PPPoE user not found or not authorized' }, { status: 404 });
    }

    await db.pPPoEUser.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ message: 'PPPoE user deleted successfully' });
  } catch (error) {
    console.error('Error deleting PPPoE user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}