import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticate, authorize } from '@/lib/middleware';
import { hashPassword } from '@/lib/auth';
import { UserRole } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticate(request);
    
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const authError = authorize([UserRole.SUPER_ADMIN, UserRole.SUB_ADMIN])(authResult);
    if (authError) {
      return authError;
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const role = searchParams.get('role') as UserRole | null;
    const tenantId = searchParams.get('tenantId');

    const skip = (page - 1) * limit;

    const where: any = {};
    
    if (role) {
      where.role = role;
    }

    if (tenantId) {
      where.tenantId = tenantId;
    }

    // If user is SUB_ADMIN, they can only see users they have access to
    if (authResult.user!.role === UserRole.SUB_ADMIN) {
      // Sub admins can see ISP owners and customers, but not other sub admins or super admins
      where.role = {
        in: [UserRole.ISP_OWNER, UserRole.CUSTOMER]
      };
    }

    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
        include: {
          ispOwner: true,
          customer: {
            include: {
              plan: true
            }
          }
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      db.user.count({ where })
    ]);

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get users error:', error);
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

    const authError = authorize([UserRole.SUPER_ADMIN, UserRole.SUB_ADMIN])(authResult);
    if (authError) {
      return authError;
    }

    const { email, password, name, role, companyName, tenantId } = await request.json();

    // Validate required fields
    if (!email || !password || !name || !role) {
      return NextResponse.json(
        { error: 'Email, password, name, and role are required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const userData: any = {
      email,
      password: hashedPassword,
      name,
      role,
      tenantId: tenantId || null
    };

    const user = await db.user.create({
      data: userData
    });

    // Create role-specific records
    if (role === UserRole.ISP_OWNER) {
      if (!companyName) {
        return NextResponse.json(
          { error: 'Company name is required for ISP owners' },
          { status: 400 }
        );
      }

      await db.ispOwner.create({
        data: {
          userId: user.id,
          companyName,
          tenantId: user.id // Use user ID as tenant ID for ISP owners
        }
      });

      // Update user with tenant ID
      await db.user.update({
        where: { id: user.id },
        data: { tenantId: user.id }
      });
    } else if (role === UserRole.CUSTOMER) {
      // For customers, we need an ISP owner to be specified
      if (!tenantId) {
        return NextResponse.json(
          { error: 'ISP Owner (tenantId) is required for customers' },
          { status: 400 }
        );
      }

      // Get the ISP owner record ID from the user ID
      const ispOwnerUser = await db.user.findUnique({
        where: { id: tenantId },
        include: { ispOwner: true }
      });

      if (!ispOwnerUser || !ispOwnerUser.ispOwner) {
        return NextResponse.json(
          { error: 'Invalid ISP owner specified' },
          { status: 400 }
        );
      }

      await db.customer.create({
        data: {
          userId: user.id,
          ispOwnerId: ispOwnerUser.ispOwner.id, // Use the ISP owner record ID
          name,
          email
        }
      });
    }

    // Get the complete user with relations
    const completeUser = await db.user.findUnique({
      where: { id: user.id },
      include: {
        ispOwner: true,
        customer: true
      }
    });

    return NextResponse.json({
      message: 'User created successfully',
      user: completeUser
    });

  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}