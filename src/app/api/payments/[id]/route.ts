import { NextRequest, NextResponse } from 'next/server';
import { authenticate, authorize } from '@/lib/middleware';
import { db } from '@/lib/db';
import { UserRole, PaymentStatus, InvoiceStatus } from '@prisma/client';

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

    // Fetch payment with related data
    const payment = await db.payment.findFirst({
      where: {
        id,
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
            status: true,
            dueDate: true
          }
        },
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            address: true
          }
        }
      }
    });

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    // Transform data for frontend
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
      notes: payment.notes,
      createdAt: payment.createdAt.toISOString(),
      updatedAt: payment.updatedAt.toISOString(),
      invoice: payment.invoice,
      customer: payment.customer
    };

    return NextResponse.json(transformedPayment);
  } catch (error) {
    console.error('Error fetching payment:', error);
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
      amount,
      method,
      status,
      transactionId,
      notes
    } = body;

    // Check if payment exists and belongs to tenant
    const existingPayment = await db.payment.findFirst({
      where: {
        id,
        invoice: {
          ispOwnerId: tenantId
        }
      }
    });

    if (!existingPayment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    // Update payment
    const updatedPayment = await db.payment.update({
      where: { id },
      data: {
        ...(amount && { amount: parseFloat(amount) }),
        ...(method && { paymentMethod: method }),
        ...(status && { status: status.toUpperCase() as PaymentStatus }),
        ...(transactionId !== undefined && { transactionId }),
        ...(notes !== undefined && { notes })
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

    // Update invoice status if payment status changed
    if (status && status !== existingPayment.status) {
      const invoice = await db.invoice.findUnique({
        where: { id: updatedPayment.invoiceId }
      });

      if (invoice) {
        // Calculate total paid for this invoice
        const totalPaid = await db.payment.aggregate({
          where: {
            invoiceId: invoice.id,
            status: PaymentStatus.COMPLETED
          },
          _sum: {
            amount: true
          }
        });

        // Update invoice status based on payment
        let newInvoiceStatus = invoice.status;
        if (status.toUpperCase() === PaymentStatus.COMPLETED && 
            totalPaid._sum.amount && 
            totalPaid._sum.amount >= invoice.amount) {
          newInvoiceStatus = InvoiceStatus.PAID;
        } else if (status.toUpperCase() === PaymentStatus.FAILED || 
                   status.toUpperCase() === PaymentStatus.REFUNDED) {
          // Check if there are other completed payments
          const otherPayments = await db.payment.aggregate({
            where: {
              invoiceId: invoice.id,
              status: PaymentStatus.COMPLETED,
              id: { not: id }
            },
            _sum: {
              amount: true
            }
          });

          if (!otherPayments._sum.amount || otherPayments._sum.amount < invoice.amount) {
            newInvoiceStatus = InvoiceStatus.PENDING;
          }
        }

        if (newInvoiceStatus !== invoice.status) {
          await db.invoice.update({
            where: { id: invoice.id },
            data: { status: newInvoiceStatus }
          });
        }
      }
    }

    // Transform response
    const transformedPayment = {
      id: updatedPayment.id,
      paymentNo: `PAY-${updatedPayment.id.slice(-6)}`,
      customerName: updatedPayment.customer?.name || 'Unknown',
      amount: updatedPayment.amount,
      paymentDate: updatedPayment.paymentDate?.toISOString() || new Date().toISOString(),
      method: updatedPayment.paymentMethod || 'unknown',
      status: updatedPayment.status.toLowerCase(),
      invoiceNo: updatedPayment.invoice?.invoiceNo || 'Unknown',
      planName: 'Unknown Plan',
      transactionId: updatedPayment.transactionId,
      invoice: updatedPayment.invoice,
      customer: updatedPayment.customer
    };

    return NextResponse.json(transformedPayment);
  } catch (error) {
    console.error('Error updating payment:', error);
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

    // Check if payment exists and belongs to tenant
    const existingPayment = await db.payment.findFirst({
      where: {
        id,
        invoice: {
          ispOwnerId: tenantId
        }
      },
      include: {
        invoice: {
          select: {
            id: true,
            status: true
          }
        }
      }
    });

    if (!existingPayment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    // Delete payment
    await db.payment.delete({
      where: { id }
    });

    // Update invoice status if needed
    if (existingPayment.invoice) {
      const invoice = await db.invoice.findUnique({
        where: { id: existingPayment.invoice.id }
      });

      if (invoice) {
        // Calculate remaining payments
        const remainingPayments = await db.payment.aggregate({
          where: {
            invoiceId: invoice.id,
            status: PaymentStatus.COMPLETED
          },
          _sum: {
            amount: true
          }
        });

        // Update invoice status
        let newStatus = invoice.status;
        if (!remainingPayments._sum.amount || remainingPayments._sum.amount === 0) {
          newStatus = InvoiceStatus.PENDING;
        } else if (remainingPayments._sum.amount < invoice.amount) {
          newStatus = InvoiceStatus.PENDING;
        }

        if (newStatus !== invoice.status) {
          await db.invoice.update({
            where: { id: invoice.id },
            data: { status: newStatus }
          });
        }
      }
    }

    return NextResponse.json({ message: 'Payment deleted successfully' });
  } catch (error) {
    console.error('Error deleting payment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}