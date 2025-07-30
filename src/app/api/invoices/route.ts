import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticate, authorize, authorizeTenantAccess } from '@/lib/middleware';
import { UserRole, InvoiceStatus } from '@prisma/client';

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
    const customerId = searchParams.get('customerId');
    const status = searchParams.get('status') as InvoiceStatus | null;

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
      // ISP owners can only see their own invoices
      let ispOwnerId = authResult.user!.tenantId;
      
      // If tenantId is not available, look up the ISP owner record
      if (!ispOwnerId) {
        const ispOwner = await db.ispOwner.findUnique({
          where: { userId: authResult.user!.userId }
        });
        
        if (!ispOwner) {
          return NextResponse.json(
            { error: 'ISP owner record not found' },
            { status: 404 }
          );
        }
        
        ispOwnerId = ispOwner.id;
      }
      
      where.ispOwnerId = ispOwnerId;
    } else if (authResult.user!.role === UserRole.CUSTOMER) {
      // Customers can only see their own invoices
      const customer = await db.customer.findUnique({
        where: { userId: authResult.user!.userId }
      });
      if (customer) {
        where.customerId = customer.id;
      }
    }

    // Filter by customer
    if (customerId) {
      where.customerId = customerId;
    }

    // Filter by status
    if (status) {
      where.status = status;
    }

    const [invoices, total] = await Promise.all([
      db.invoice.findMany({
        where,
        include: {
          customer: {
            include: {
              user: true
            }
          },
          plan: true,
          creator: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          payments: {
            orderBy: { createdAt: 'desc' }
          },
          _count: {
            select: {
              payments: true
            }
          }
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      db.invoice.count({ where })
    ]);

    return NextResponse.json({
      invoices,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get invoices error:', error);
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

    const { customerId, amount, dueDate, description, planId } = await request.json();

    // Validate required fields
    if (!customerId || !amount || !dueDate) {
      return NextResponse.json(
        { error: 'Customer ID, amount, and due date are required' },
        { status: 400 }
      );
    }

    // Get customer to verify tenant access
    const customer = await db.customer.findUnique({
      where: { id: customerId },
      include: {
        ispOwner: true
      }
    });

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Verify tenant access
    const tenantError = authorizeTenantAccess(authResult, customer.ispOwnerId);
    if (tenantError) {
      return tenantError;
    }

    // Generate invoice number
    const invoiceCount = await db.invoice.count({
      where: {
        ispOwnerId: customer.ispOwnerId
      }
    });
    const invoiceNo = `INV-${customer.ispOwnerId}-${String(invoiceCount + 1).padStart(6, '0')}`;

    // Create invoice
    const invoice = await db.invoice.create({
      data: {
        invoiceNo,
        customerId,
        planId,
        amount: parseFloat(amount),
        dueDate: new Date(dueDate),
        description,
        ispOwnerId: customer.ispOwnerId,
        createdBy: authResult.user!.userId
      },
      include: {
        customer: {
          include: {
            user: true
          }
        },
        plan: true,
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    return NextResponse.json({
      message: 'Invoice created successfully',
      invoice
    });

  } catch (error) {
    console.error('Create invoice error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}