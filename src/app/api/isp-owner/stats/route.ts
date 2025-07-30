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

    // Fetch ISP owner statistics
    const [
      totalCustomers,
      activeCustomers,
      totalPlans,
      totalInvoices,
      totalPayments,
      pendingInvoices,
      overdueInvoices
    ] = await Promise.all([
      // Total customers for this ISP owner
      db.customer.count({ where: { ispOwnerId: tenantId } }),
      
      // Active customers for this ISP owner
      db.customer.count({ 
        where: { 
          ispOwnerId: tenantId,
          status: 'ACTIVE'
        }
      }),
      
      // Total plans for this ISP owner
      db.plan.count({ where: { ispOwnerId: tenantId } }),
      
      // Total invoices for this ISP owner
      db.invoice.count({ where: { ispOwnerId: tenantId } }),
      
      // Total payments for this ISP owner
      db.payment.count({
        where: {
          invoice: {
            ispOwnerId: tenantId
          }
        }
      }),
      
      // Pending invoices for this ISP owner
      db.invoice.count({ 
        where: { 
          ispOwnerId: tenantId,
          status: 'PENDING'
        }
      }),
      
      // Overdue invoices for this ISP owner
      db.invoice.count({ 
        where: { 
          ispOwnerId: tenantId,
          status: 'OVERDUE'
        }
      })
    ]);

    // Calculate total revenue from completed payments
    const payments = await db.payment.findMany({
      where: {
        invoice: {
          ispOwnerId: tenantId
        },
        status: 'COMPLETED'
      },
      select: { amount: true }
    });
    const totalRevenue = payments.reduce((sum, payment) => sum + payment.amount, 0);

    const stats = {
      totalCustomers,
      activeCustomers,
      totalPlans,
      totalInvoices,
      totalPayments,
      totalRevenue,
      pendingInvoices,
      overdueInvoices
    };

    return NextResponse.json(stats);

  } catch (error) {
    console.error('Error fetching ISP owner stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}