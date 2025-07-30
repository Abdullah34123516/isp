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
    if (!payload || payload.role !== 'ISP_OWNER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get ISP owner's tenant ID
    const tenantId = payload.tenantId;
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID not found' }, { status: 400 });
    }

    // Fetch recent invoices for this ISP owner
    const invoices = await db.invoice.findMany({
      where: { ispOwnerId: tenantId },
      include: {
        customer: {
          select: {
            name: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10 // Get last 10 invoices
    });

    // Transform the data
    const recentInvoices = invoices.map(invoice => ({
      id: invoice.id,
      invoiceNo: invoice.invoiceNo,
      customerName: invoice.customer.name,
      amount: invoice.amount,
      dueDate: invoice.dueDate.toISOString(),
      status: invoice.status.toLowerCase()
    }));

    return NextResponse.json(recentInvoices);

  } catch (error) {
    console.error('Error fetching ISP owner invoices:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}