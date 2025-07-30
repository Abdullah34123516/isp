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
      where: { userId },
      include: {
        user: {
          select: {
            tenantId: true
          }
        },
        plan: true
      }
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // Fetch customer statistics
    const [
      totalInvoices,
      totalPayments,
      pendingInvoices,
      paidInvoices
    ] = await Promise.all([
      // Total invoices for this customer
      db.invoice.count({ where: { customerId: customer.id } }),
      
      // Total payments for this customer
      db.payment.count({ where: { customerId: customer.id } }),
      
      // Pending invoices for this customer
      db.invoice.count({ 
        where: { 
          customerId: customer.id,
          status: 'PENDING'
        }
      }),
      
      // Paid invoices for this customer
      db.invoice.count({ 
        where: { 
          customerId: customer.id,
          status: 'PAID'
        }
      })
    ]);

    // Calculate total amount paid
    const payments = await db.payment.findMany({
      where: { 
        customerId: customer.id,
        status: 'COMPLETED'
      },
      select: { amount: true }
    });
    const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);

    // Calculate payment success rate
    const paymentSuccessRate = totalInvoices > 0 ? Math.round((paidInvoices / totalInvoices) * 100) : 100;

    const stats = {
      totalPaid,
      pendingInvoices,
      paymentSuccessRate,
      currentPlan: customer.plan ? {
        id: customer.plan.id,
        name: customer.plan.name,
        description: customer.plan.description,
        price: customer.plan.price,
        speed: customer.plan.speed,
        dataLimit: customer.plan.dataLimit || 'Unlimited',
        validity: customer.plan.validity,
        status: customer.status === 'ACTIVE' ? 'active' : 'inactive'
      } : null
    };

    return NextResponse.json(stats);

  } catch (error) {
    console.error('Error fetching customer stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}