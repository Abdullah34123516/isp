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
    if (!payload || payload.role !== 'SUB_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch ISP owners with their statistics
    const ispOwners = await db.user.findMany({
      where: { role: 'ISP_OWNER' },
      include: {
        ispOwner: true
      }
    });

    // Transform the data to include calculated statistics
    const ispOwnersWithStats = await Promise.all(ispOwners.map(async (owner) => {
      // Get customers for this ISP owner
      const customers = await db.customer.findMany({
        where: { ispOwnerId: owner.id }
      });
      
      const totalCustomers = customers.length;
      
      // Calculate revenue from completed payments
      const customerIds = customers.map(c => c.id);
      const invoices = await db.invoice.findMany({
        where: { customerId: { in: customerIds } },
        include: {
          payments: true
        }
      });
      
      const totalRevenue = invoices.reduce((sum, invoice) => {
        const completedPayments = invoice.payments?.filter(payment => payment.status === 'COMPLETED') || [];
        return sum + completedPayments.reduce((paymentSum, payment) => paymentSum + payment.amount, 0);
      }, 0);

      return {
        id: owner.id,
        companyName: owner.ispOwner?.companyName || owner.name,
        email: owner.email,
        phone: owner.ispOwner?.phone || '',
        customers: totalCustomers,
        revenue: totalRevenue,
        status: owner.isActive ? 'active' : 'inactive',
        createdAt: owner.createdAt
      };
    }));

    return NextResponse.json(ispOwnersWithStats);

  } catch (error) {
    console.error('Error fetching ISP owners:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}