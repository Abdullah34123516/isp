import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticate, authorize, authorizeTenantAccess } from '@/lib/middleware';
import { UserRole, PaymentStatus, InvoiceStatus } from '@prisma/client';

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
    const invoiceId = searchParams.get('invoiceId');
    const status = searchParams.get('status') as PaymentStatus | null;

    const skip = (page - 1) * limit;

    const where: any = {};

    // Filter by tenant
    if (tenantId) {
      const tenantError = authorizeTenantAccess(authResult, tenantId);
      if (tenantError) {
        return tenantError;
      }
      // Need to join through customer or invoice to get tenant
      where.OR = [
        {
          customer: {
            ispOwnerId: tenantId
          }
        },
        {
          invoice: {
            ispOwnerId: tenantId
          }
        }
      ];
    } else if (authResult.user!.role === UserRole.ISP_OWNER) {
      // ISP owners can only see their own payments
      let ownerTenantId = authResult.user!.tenantId;
      
      // If tenantId is not available, look up the ISP owner record
      if (!ownerTenantId) {
        const ispOwner = await db.ispOwner.findUnique({
          where: { userId: authResult.user!.userId }
        });
        
        if (!ispOwner) {
          return NextResponse.json(
            { error: 'ISP owner record not found' },
            { status: 404 }
          );
        }
        
        ownerTenantId = ispOwner.id;
      }
      
      where.OR = [
        {
          customer: {
            ispOwnerId: ownerTenantId
          }
        },
        {
          invoice: {
            ispOwnerId: ownerTenantId
          }
        }
      ];
    } else if (authResult.user!.role === UserRole.CUSTOMER) {
      // Customers can only see their own payments
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

    // Filter by invoice
    if (invoiceId) {
      where.invoiceId = invoiceId;
    }

    // Filter by status
    if (status) {
      where.status = status;
    }

    const [payments, total] = await Promise.all([
      db.payment.findMany({
        where,
        include: {
          customer: {
            include: {
              user: true
            }
          },
          invoice: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      db.payment.count({ where })
    ]);

    return NextResponse.json({
      payments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get payments error:', error);
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

    const { invoiceId, amount, paymentMethod, transactionId, notes } = await request.json();

    // Validate required fields
    if (!invoiceId || !amount) {
      return NextResponse.json(
        { error: 'Invoice ID and amount are required' },
        { status: 400 }
      );
    }

    // Get invoice to verify tenant access
    const invoice = await db.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        customer: {
          include: {
            ispOwner: true
          }
        }
      }
    });

    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    // Verify tenant access
    const tenantError = authorizeTenantAccess(authResult, invoice.ispOwnerId!);
    if (tenantError) {
      return tenantError;
    }

    // Create payment
    const payment = await db.payment.create({
      data: {
        invoiceId,
        customerId: invoice.customerId,
        amount: parseFloat(amount),
        status: PaymentStatus.COMPLETED,
        paymentDate: new Date(),
        paymentMethod,
        transactionId,
        notes,
        createdBy: authResult.user!.userId
      },
      include: {
        customer: {
          include: {
            user: true
          }
        },
        invoice: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Update invoice status if fully paid
    const totalPaid = await db.payment.aggregate({
      where: {
        invoiceId,
        status: PaymentStatus.COMPLETED
      },
      _sum: {
        amount: true
      }
    });

    if (totalPaid._sum.amount && totalPaid._sum.amount >= invoice.amount) {
      await db.invoice.update({
        where: { id: invoiceId },
        data: { status: InvoiceStatus.PAID }
      });
    }

    return NextResponse.json({
      message: 'Payment recorded successfully',
      payment
    });

  } catch (error) {
    console.error('Create payment error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}