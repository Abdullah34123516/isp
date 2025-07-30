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
    if (!payload || payload.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch system statistics
    const [
      totalUsers,
      totalISPOwners,
      totalCustomers,
      totalInvoices,
      totalPayments,
      pendingInvoices,
      activeUsers
    ] = await Promise.all([
      // Total users
      db.user.count(),
      
      // Total ISP owners
      db.user.count({ where: { role: 'ISP_OWNER' } }),
      
      // Total customers
      db.user.count({ where: { role: 'CUSTOMER' } }),
      
      // Total invoices
      db.invoice.count(),
      
      // Total payments
      db.payment.count(),
      
      // Pending invoices
      db.invoice.count({ where: { status: 'PENDING' } }),
      
      // Active users
      db.user.count({ where: { isActive: true } })
    ]);

    // Calculate total revenue
    const payments = await db.payment.findMany({
      where: { status: 'COMPLETED' },
      select: { amount: true }
    });
    const totalRevenue = payments.reduce((sum, payment) => sum + payment.amount, 0);

    const stats = {
      totalUsers,
      totalISPOwners,
      totalCustomers,
      totalInvoices,
      totalPayments,
      totalRevenue,
      pendingInvoices,
      activeUsers
    };

    return NextResponse.json(stats);

  } catch (error) {
    console.error('Error fetching system stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}