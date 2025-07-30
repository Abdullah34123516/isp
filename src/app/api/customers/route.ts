import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticate, authorize, authorizeTenantAccess } from '@/lib/middleware';
import { hashPassword } from '@/lib/auth';
import { UserRole, CustomerStatus } from '@prisma/client';

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
    const status = searchParams.get('status') as CustomerStatus | null;
    const search = searchParams.get('search');

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
      // ISP owners can only see their own customers
      where.ispOwnerId = authResult.user!.tenantId;
    } else if (authResult.user!.role === UserRole.CUSTOMER) {
      // Customers can only see their own record
      where.userId = authResult.user!.userId;
    }

    // Filter by status
    if (status) {
      where.status = status;
    }

    // Search functionality
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [customers, total] = await Promise.all([
      db.customer.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              isActive: true
            }
          },
          ispOwner: {
            include: {
              user: true
            }
          },
          plan: true,
          _count: {
            select: {
              invoices: true,
              payments: true
            }
          }
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      db.customer.count({ where })
    ]);

    return NextResponse.json({
      customers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get customers error:', error);
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

    const { name, email, phone, address, tenantId, planId } = await request.json();

    // Validate required fields
    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
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

    // Check if user with this email already exists
    const existingUser = await db.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Create user for customer
    const tempPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await hashPassword(tempPassword);

    const user = await db.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: UserRole.CUSTOMER,
        tenantId: finalTenantId
      }
    });

    // Create customer
    const customer = await db.customer.create({
      data: {
        userId: user.id,
        ispOwnerId: finalTenantId,
        name,
        email,
        phone,
        address,
        planId
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            isActive: true
          }
        },
        ispOwner: {
          include: {
            user: true
          }
        },
        plan: true
      }
    });

    return NextResponse.json({
      message: 'Customer created successfully',
      customer,
      tempPassword // In real app, send this via email
    });

  } catch (error) {
    console.error('Create customer error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}