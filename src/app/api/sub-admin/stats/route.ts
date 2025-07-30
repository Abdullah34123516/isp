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

    // Fetch sub-admin statistics
    const [
      totalISPOwners,
      totalCustomers,
      totalInvoices,
      totalPayments,
      pendingInvoices,
      activeUsers
    ] = await Promise.all([
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

    // Get active ISP owners count
    const activeISPOwners = await db.user.count({
      where: { 
        role: 'ISP_OWNER',
        isActive: true 
      }
    });

    const stats = {
      managedISPOwners: totalISPOwners,
      totalCustomers,
      totalInvoices,
      totalPayments,
      totalRevenue,
      pendingInvoices,
      activeISPOwners
    };

    return NextResponse.json(stats);

  } catch (error) {
    console.error('Error fetching sub-admin stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}