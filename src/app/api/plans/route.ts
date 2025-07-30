import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticate, authorize, authorizeTenantAccess } from '@/lib/middleware';
import { UserRole } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticate(request);
    
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const tenantId = searchParams.get('tenantId');
    const isActive = searchParams.get('isActive');

    const skip = (page - 1) * limit;

    const where: any = {};

    // Filter by tenant
    if (tenantId) {
      const tenantError = authorizeTenantAccess(authResult, tenantId);
      if (tenantError) {
        return tenantError;
      }
      where.ispOwnerId = tenantId;
    } else if (authResult.user!.role === UserRole.ISP_OWNER) {
      // ISP owners can only see their own plans
      where.ispOwnerId = authResult.user!.tenantId;
    }

    // Filter by active status
    if (isActive !== null) {
      where.isActive = isActive === 'true';
    }

    const [plans, total] = await Promise.all([
      db.plan.findMany({
        where,
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
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      db.plan.count({ where })
    ]);

    return NextResponse.json({
      plans,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get plans error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticate(request);
    
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const authError = authorize([UserRole.SUPER_ADMIN, UserRole.SUB_ADMIN, UserRole.ISP_OWNER])(authResult);
    if (authError) {
      return authError;
    }

    const { name, description, price, speed, dataLimit, validity, tenantId } = await request.json();

    // Validate required fields
    if (!name || !price || !speed || !validity) {
      return NextResponse.json(
        { error: 'Name, price, speed, and validity are required' },
        { status: 400 }
      );
    }

    // Determine tenant ID
    let finalTenantId = tenantId;
    
    if (authResult.user!.role === UserRole.ISP_OWNER) {
      finalTenantId = authResult.user!.tenantId;
    } else if (!finalTenantId) {
      return NextResponse.json(
        { error: 'Tenant ID is required' },
        { status: 400 }
      );
    }

    // Verify tenant access
    const tenantError = authorizeTenantAccess(authResult, finalTenantId);
    if (tenantError) {
      return tenantError;
    }

    // Create plan
    const plan = await db.plan.create({
      data: {
        name,
        description,
        price: parseFloat(price),
        speed,
        dataLimit,
        validity: parseInt(validity),
        ispOwnerId: finalTenantId,
        createdBy: authResult.user!.userId
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
      message: 'Plan created successfully',
      plan
    });

  } catch (error) {
    console.error('Create plan error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}