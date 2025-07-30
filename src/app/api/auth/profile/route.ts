import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticate } from '@/lib/middleware';

export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticate(request);
    
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const user = await db.user.findUnique({
      where: { id: authResult.user!.userId },
      include: {
        ispOwner: true,
        customer: {
          include: {
            plan: true,
            ispOwner: true
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const userResponse = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      tenantId: user.tenantId,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    // Add role-specific data
    if (user.ispOwner) {
      Object.assign(userResponse, {
        ispOwner: {
          id: user.ispOwner.id,
          companyName: user.ispOwner.companyName,
          address: user.ispOwner.address,
          phone: user.ispOwner.phone
        }
      });
    }

    if (user.customer) {
      Object.assign(userResponse, {
        customer: {
          id: user.customer.id,
          status: user.customer.status,
          phone: user.customer.phone,
          address: user.customer.address,
          plan: user.customer.plan,
          ispOwner: {
            companyName: user.customer.ispOwner.companyName
          }
        }
      });
    }

    return NextResponse.json({ user: userResponse });

  } catch (error) {
    console.error('Profile error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}