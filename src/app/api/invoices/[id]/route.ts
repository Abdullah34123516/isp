import { NextRequest, NextResponse } from 'next/server';
import { authenticate, authorize } from '@/lib/middleware';
import { db } from '@/lib/db';
import { UserRole, InvoiceStatus } from '@prisma/client';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { id } = params;

    // Get tenant ID from user
    const tenantId = user.tenantId;
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 });
    }

    // Fetch invoice with related data
    const invoice = await db.invoice.findFirst({
      where: {
        id,
        ispOwnerId: tenantId
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            address: true
          }
        },
        plan: {
          select: {
            id: true,
            name: true,
            price: true,
            validity: true,
            description: true
          }
        },
        payments: {
          select: {
            id: true,
            amount: true,
            status: true,
            paymentDate: true,
            paymentMethod: true,
            transactionId: true
          }
        }
      }
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Transform data for frontend
    const transformedInvoice = {
      id: invoice.id,
      invoiceNo: invoice.invoiceNo,
      customerName: invoice.customer?.name || 'Unknown',
      amount: invoice.amount,
      dueDate: invoice.dueDate.toISOString(),
      status: invoice.status.toLowerCase(),
      createdAt: invoice.createdAt.toISOString(),
      updatedAt: invoice.updatedAt.toISOString(),
      planName: invoice.plan?.name || 'Unknown Plan',
      description: invoice.description,
      customer: invoice.customer,
      plan: invoice.plan,
      payments: invoice.payments
    };

    return NextResponse.json(transformedInvoice);
  } catch (error) {
    console.error('Error fetching invoice:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { id } = params;

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
      status,
      description
    } = body;

    // Check if invoice exists and belongs to tenant
    const existingInvoice = await db.invoice.findFirst({
      where: {
        id,
        ispOwnerId: tenantId
      }
    });

    if (!existingInvoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Update invoice
    const updatedInvoice = await db.invoice.update({
      where: { id },
      data: {
        ...(customerId && { customerId }),
        ...(planId && { planId }),
        ...(amount && { amount: parseFloat(amount) }),
        ...(dueDate && { dueDate: new Date(dueDate) }),
        ...(status && { status: status.toUpperCase() as InvoiceStatus }),
        ...(description !== undefined && { description })
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
      id: updatedInvoice.id,
      invoiceNo: updatedInvoice.invoiceNo,
      customerName: updatedInvoice.customer?.name || 'Unknown',
      amount: updatedInvoice.amount,
      dueDate: updatedInvoice.dueDate.toISOString(),
      status: updatedInvoice.status.toLowerCase(),
      createdAt: updatedInvoice.createdAt.toISOString(),
      planName: updatedInvoice.plan?.name || 'Unknown Plan',
      customer: updatedInvoice.customer,
      plan: updatedInvoice.plan
    };

    return NextResponse.json(transformedInvoice);
  } catch (error) {
    console.error('Error updating invoice:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { id } = params;

    // Get tenant ID from user
    const tenantId = user.tenantId;
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 });
    }

    // Check if invoice exists and belongs to tenant
    const existingInvoice = await db.invoice.findFirst({
      where: {
        id,
        ispOwnerId: tenantId
      }
    });

    if (!existingInvoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Delete invoice
    await db.invoice.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Invoice deleted successfully' });
  } catch (error) {
    console.error('Error deleting invoice:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}