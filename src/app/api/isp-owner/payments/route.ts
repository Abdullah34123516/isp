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

    // Fetch recent payments for this ISP owner
    const payments = await db.payment.findMany({
      where: {
        invoice: {
          ispOwnerId: tenantId
        }
      },
      include: {
        customer: {
          select: {
            name: true
          }
        }
      },
      orderBy: { paymentDate: 'desc' },
      take: 10 // Get last 10 payments
    });

    // Transform the data
    const recentPayments = payments.map(payment => ({
      id: payment.id,
      customerName: payment.customer.name,
      amount: payment.amount,
      paymentDate: payment.paymentDate ? payment.paymentDate.toISOString() : new Date().toISOString(),
      method: payment.paymentMethod || 'Unknown'
    }));

    return NextResponse.json(recentPayments);

  } catch (error) {
    console.error('Error fetching ISP owner payments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}