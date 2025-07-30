import { NextRequest, NextResponse } from 'next/server';
import { authenticate, authorize } from '@/lib/middleware';
import { db } from '@/lib/db';
import { UserRole, InvoiceStatus } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = await authenticate(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const user = authResult.user!;

    // Authorize user role
    const authError = authorize([UserRole.SUPER_ADMIN, UserRole.SUB_ADMIN, UserRole.ISP_OWNER])(authResult);
    if (authError) {
      return authError;
    }

    // Get tenant ID from user
    const tenantId = user.tenantId;
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 });
    }

    // Fetch invoices with related data
    const invoices = await db.invoice.findMany({
      where: {
        ispOwnerId: tenantId
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        plan: {
          select: {
            id: true,
            name: true,
            price: true
          }
        },
        payments: {
          select: {
            id: true,
            amount: true,
            status: true,
            paymentDate: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Transform data for frontend
    const transformedInvoices = invoices.map(invoice => ({
      id: invoice.id,
      invoiceNo: invoice.invoiceNo,
      customerName: invoice.customer?.name || 'Unknown',
      amount: invoice.amount,
      dueDate: invoice.dueDate.toISOString(),
      status: invoice.status.toLowerCase(),
      createdAt: invoice.createdAt.toISOString(),
      planName: invoice.plan?.name || 'Unknown Plan',
      customer: invoice.customer,
      plan: invoice.plan,
      payments: invoice.payments
    }));

    return NextResponse.json(transformedInvoices);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = await authenticate(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const user = authResult.user!;

    // Authorize user role
    const authError = authorize([UserRole.SUPER_ADMIN, UserRole.SUB_ADMIN, UserRole.ISP_OWNER])(authResult);
    if (authError) {
      return authError;
    }

    // Get tenant ID from user
    const tenantId = user.tenantId;
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 });
    }

    // Parse request body
    const body = await request.json();
    const {
      customerId,
      planId,
      amount,
      dueDate,
      items = [],
      description = ''
    } = body;

    // Validate required fields
    if (!customerId || !planId || !amount || !dueDate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Generate invoice number
    const invoiceCount = await db.invoice.count({
      where: { ispOwnerId: tenantId }
    });
    const invoiceNo = `INV-${String(invoiceCount + 1).padStart(6, '0')}`;

    // Create invoice
    const invoice = await db.invoice.create({
      data: {
        invoiceNo,
        customerId,
        planId,
        amount: parseFloat(amount),
        dueDate: new Date(dueDate),
        status: InvoiceStatus.PENDING,
        ispOwnerId: tenantId,
        description,
        createdBy: user.userId
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        plan: {
          select: {
            id: true,
            name: true,
            price: true
          }
        }
      }
    });

    // Transform response
    const transformedInvoice = {
      id: invoice.id,
      invoiceNo: invoice.invoiceNo,
      customerName: invoice.customer?.name || 'Unknown',
      amount: invoice.amount,
      dueDate: invoice.dueDate.toISOString(),
      status: invoice.status.toLowerCase(),
      createdAt: invoice.createdAt.toISOString(),
      planName: invoice.plan?.name || 'Unknown Plan',
      customer: invoice.customer,
      plan: invoice.plan
    };

    return NextResponse.json(transformedInvoice, { status: 201 });
  } catch (error) {
    console.error('Error creating invoice:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}