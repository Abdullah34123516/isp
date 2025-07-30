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

    // Fetch customer invoices
    const invoices = await db.invoice.findMany({
      where: { customerId: customer.id },
      orderBy: { createdAt: 'desc' },
      take: 10 // Get last 10 invoices
    });

    // Transform the data
    const customerInvoices = invoices.map(invoice => ({
      id: invoice.id,
      invoiceNo: invoice.invoiceNo,
      amount: invoice.amount,
      dueDate: invoice.dueDate.toISOString(),
      status: invoice.status.toLowerCase(),
      createdAt: invoice.createdAt.toISOString()
    }));

    return NextResponse.json(customerInvoices);

  } catch (error) {
    console.error('Error fetching customer invoices:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}