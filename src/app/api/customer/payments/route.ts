import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Verify authentication and authorization
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.split(' ')[1];
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload || payload.role !== 'CUSTOMER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get customer's user ID
    const userId = payload.userId;
    if (!userId) {
      return NextResponse.json({ error: 'User ID not found' }, { status: 400 });
    }

    // Fetch customer data
    const customer = await db.customer.findUnique({
      where: { userId }
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // Fetch customer payments with invoice details
    const payments = await db.payment.findMany({
      where: { customerId: customer.id },
      include: {
        invoice: {
          select: {
            invoiceNo: true
          }
        }
      },
      orderBy: { paymentDate: 'desc' },
      take: 10 // Get last 10 payments
    });

    // Transform the data
    const customerPayments = payments.map(payment => ({
      id: payment.id,
      invoiceNo: payment.invoice.invoiceNo,
      amount: payment.amount,
      paymentDate: payment.paymentDate ? payment.paymentDate.toISOString() : new Date().toISOString(),
      method: payment.paymentMethod || 'Unknown',
      status: payment.status.toLowerCase()
    }));

    return NextResponse.json(customerPayments);

  } catch (error) {
    console.error('Error fetching customer payments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}