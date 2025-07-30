import { NextRequest, NextResponse } from 'next/server';
import { authenticate, authorize } from '@/lib/middleware';
import { db } from '@/lib/db';
import { UserRole, PaymentStatus, InvoiceStatus } from '@prisma/client';

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

    // Fetch payments with related data
    const payments = await db.payment.findMany({
      where: {
        invoice: {
          ispOwnerId: tenantId
        }
      },
      include: {
        invoice: {
          select: {
            id: true,
            invoiceNo: true,
            amount: true,
            status: true
          }
        },
        customer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Transform data for frontend
    const transformedPayments = payments.map(payment => ({
      id: payment.id,
      paymentNo: `PAY-${payment.id.slice(-6)}`,
      customerName: payment.customer?.name || 'Unknown',
      amount: payment.amount,
      paymentDate: payment.paymentDate?.toISOString() || new Date().toISOString(),
      method: payment.paymentMethod || 'unknown',
      status: payment.status.toLowerCase(),
      invoiceNo: payment.invoice?.invoiceNo || 'Unknown',
      planName: 'Unknown Plan', // Would need to join with plan table
      transactionId: payment.transactionId,
      invoice: payment.invoice,
      customer: payment.customer
    }));

    return NextResponse.json(transformedPayments);
  } catch (error) {
    console.error('Error fetching payments:', error);
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
      invoiceId,
      customerId,
      amount,
      method,
      transactionId,
      notes = ''
    } = body;

    // Validate required fields
    if (!invoiceId || !customerId || !amount || !method) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if invoice exists and belongs to tenant
    const invoice = await db.invoice.findFirst({
      where: {
        id: invoiceId,
        ispOwnerId: tenantId
      }
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Create payment
    const payment = await db.payment.create({
      data: {
        invoiceId,
        customerId,
        amount: parseFloat(amount),
        paymentMethod: method,
        transactionId,
        status: PaymentStatus.COMPLETED,
        paymentDate: new Date(),
        notes,
        createdBy: user.userId
      },
      include: {
        invoice: {
          select: {
            id: true,
            invoiceNo: true,
            amount: true,
            status: true
          }
        },
        customer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Update invoice status to paid if payment amount matches invoice amount
    if (payment.amount >= invoice.amount) {
      await db.invoice.update({
        where: { id: invoiceId },
        data: { status: InvoiceStatus.PAID }
      });
    }

    // Transform response
    const transformedPayment = {
      id: payment.id,
      paymentNo: `PAY-${payment.id.slice(-6)}`,
      customerName: payment.customer?.name || 'Unknown',
      amount: payment.amount,
      paymentDate: payment.paymentDate?.toISOString() || new Date().toISOString(),
      method: payment.paymentMethod || 'unknown',
      status: payment.status.toLowerCase(),
      invoiceNo: payment.invoice?.invoiceNo || 'Unknown',
      planName: 'Unknown Plan',
      transactionId: payment.transactionId,
      invoice: payment.invoice,
      customer: payment.customer
    };

    return NextResponse.json(transformedPayment, { status: 201 });
  } catch (error) {
    console.error('Error creating payment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}