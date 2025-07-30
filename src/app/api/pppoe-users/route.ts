import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticate, authorize } from '@/lib/middleware';
import { UserRole } from '@prisma/client';

// GET /api/pppoe-users - Get all PPPoE users for the authenticated ISP owner
export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticate(request);
    
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const authError = authorize([UserRole.SUPER_ADMIN, UserRole.SUB_ADMIN, UserRole.ISP_OWNER])(authResult);
    if (authError) {
      return authError;
    }

    // Determine tenant ID
    let tenantId;
    
    if (authResult.user!.role === UserRole.ISP_OWNER) {
      // For ISP owners, get their ISP owner record
      // First try to use tenantId from the token if available
      if (authResult.user!.tenantId) {
        tenantId = authResult.user!.tenantId;
      } else {
        // If not available, look up by userId
        const ispOwner = await db.ispOwner.findUnique({
          where: { userId: authResult.user!.userId }
        });
        
        if (!ispOwner) {
          return NextResponse.json(
            { error: 'ISP owner record not found' },
            { status: 404 }
          );
        }
        
        tenantId = ispOwner.id;
      }
    } else {
      // For super admin and sub admin, get tenantId from query params
      const { searchParams } = new URL(request.url);
      tenantId = searchParams.get('tenantId');
      
      if (!tenantId) {
        return NextResponse.json(
          { error: 'Tenant ID is required for admin users' },
          { status: 400 }
        );
      }
    }

    const pppoeUsers = await db.pPPoEUser.findMany({
      where: {
        customer: {
          ispOwnerId: tenantId
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
    const authResult = await authenticate(request);
    
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const authError = authorize([UserRole.SUPER_ADMIN, UserRole.SUB_ADMIN, UserRole.ISP_OWNER])(authResult);
    if (authError) {
      return authError;
    }

    // Determine tenant ID
    let tenantId;
    let body;
    
    if (authResult.user!.role === UserRole.ISP_OWNER) {
      // For ISP owners, get their ISP owner record
      // First try to use tenantId from the token if available
      if (authResult.user!.tenantId) {
        tenantId = authResult.user!.tenantId;
      } else {
        // If not available, look up by userId
        const ispOwner = await db.ispOwner.findUnique({
          where: { userId: authResult.user!.userId }
        });
        
        if (!ispOwner) {
          return NextResponse.json(
            { error: 'ISP owner record not found' },
            { status: 404 }
          );
        }
        
        tenantId = ispOwner.id;
      }
    } else {
      // For super admin and sub admin, get tenantId from request body
      body = await request.json();
      tenantId = body.tenantId;
      
      if (!tenantId) {
        return NextResponse.json(
          { error: 'Tenant ID is required for admin users' },
          { status: 400 }
        );
      }
    }

    // Parse body if not already parsed
    if (!body) {
      body = await request.json();
    }
    
    const { username, password, customerId, routerId, planId, downloadSpeed, uploadSpeed, dataLimit, expiresAt } = body;

    if (!username || !password || !customerId || !routerId || !planId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify that the customer belongs to the ISP owner
    const customer = await db.customer.findFirst({
      where: {
        id: customerId,
        ispOwnerId: tenantId
      }
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found or not authorized' }, { status: 404 });
    }

    // Verify that the router belongs to the ISP owner
    const router = await db.router.findFirst({
      where: {
        id: routerId,
        ispOwnerId: tenantId
      }
    });

    if (!router) {
      return NextResponse.json({ error: 'Router not found or not authorized' }, { status: 404 });
    }

    // Verify that the plan belongs to the ISP owner
    const plan = await db.plan.findFirst({
      where: {
        id: planId,
        ispOwnerId: tenantId
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