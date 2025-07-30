import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticate, authorize } from '@/lib/middleware';
import { UserRole } from '@prisma/client';

interface RouteParams {
  params: { id: string };
}

// GET /api/pppoe-users/[id] - Get a specific PPPoE user
export async function GET(request: NextRequest, { params }: RouteParams) {
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

    const pppoeUser = await db.pPPoEUser.findFirst({
      where: {
        id: params.id,
        customer: {
          ispOwnerId: tenantId
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
    
    const { status, downloadSpeed, uploadSpeed, dataLimit, expiresAt } = body;

    // Verify the PPPoE user belongs to the ISP owner
    const existingUser = await db.pPPoEUser.findFirst({
      where: {
        id: params.id,
        customer: {
          ispOwnerId: tenantId
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

    // Verify the PPPoE user belongs to the ISP owner
    const existingUser = await db.pPPoEUser.findFirst({
      where: {
        id: params.id,
        customer: {
          ispOwnerId: tenantId
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