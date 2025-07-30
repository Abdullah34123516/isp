import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticate, authorize, authorizeTenantAccess } from '@/lib/middleware';
import { UserRole } from '@prisma/client';

interface RouteParams {
  params: { id: string };
}

// GET /api/plans/[id] - Get a specific plan
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await authenticate(request);
    
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const plan = await db.plan.findFirst({
      where: {
        id: params.id,
        ispOwnerId: authResult.user!.tenantId
      },
      include: {
        ispOwner: {
          include: {
            user: true
          }
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        pppoeUsers: {
          include: {
            customer: {
              select: {
                name: true,
                email: true
              }
            }
          }
        }
      }
    });

    if (!plan) {
      return NextResponse.json(
        { error: 'Plan not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(plan);

  } catch (error) {
    console.error('Get plan error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/plans/[id] - Update a plan
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await authenticate(request);
    
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const authError = authorize([UserRole.SUPER_ADMIN, UserRole.SUB_ADMIN, UserRole.ISP_OWNER])(authResult);
    if (authError) {
      return authError;
    }

    const { name, description, price, speed, dataLimit, validity, isActive } = await request.json();

    // Verify plan exists and belongs to tenant
    const existingPlan = await db.plan.findFirst({
      where: {
        id: params.id,
        ispOwnerId: authResult.user!.tenantId
      }
    });

    if (!existingPlan) {
      return NextResponse.json(
        { error: 'Plan not found' },
        { status: 404 }
      );
    }

    // Update plan
    const plan = await db.plan.update({
      where: { id: params.id },
      data: {
        name: name || existingPlan.name,
        description: description !== undefined ? description : existingPlan.description,
        price: price !== undefined ? parseFloat(price) : existingPlan.price,
        speed: speed || existingPlan.speed,
        dataLimit: dataLimit !== undefined ? dataLimit : existingPlan.dataLimit,
        validity: validity !== undefined ? parseInt(validity) : existingPlan.validity,
        isActive: isActive !== undefined ? isActive : existingPlan.isActive
      },
      include: {
        ispOwner: {
          include: {
            user: true
          }
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        pppoeUsers: {
          include: {
            customer: {
              select: {
                name: true,
                email: true
              }
            }
          }
        }
      }
    });

    return NextResponse.json({
      message: 'Plan updated successfully',
      plan
    });

  } catch (error) {
    console.error('Update plan error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/plans/[id] - Delete a plan
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await authenticate(request);
    
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const authError = authorize([UserRole.SUPER_ADMIN, UserRole.SUB_ADMIN, UserRole.ISP_OWNER])(authResult);
    if (authError) {
      return authError;
    }

    // Verify plan exists and belongs to tenant
    const existingPlan = await db.plan.findFirst({
      where: {
        id: params.id,
        ispOwnerId: authResult.user!.tenantId
      },
      include: {
        pppoeUsers: true
      }
    });

    if (!existingPlan) {
      return NextResponse.json(
        { error: 'Plan not found' },
        { status: 404 }
      );
    }

    // Check if there are PPPoE users using this plan
    if (existingPlan.pppoeUsers.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete plan with active PPPoE users' },
        { status: 400 }
      );
    }

    // Delete plan
    await db.plan.delete({
      where: { id: params.id }
    });

    return NextResponse.json({
      message: 'Plan deleted successfully'
    });

  } catch (error) {
    console.error('Delete plan error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}