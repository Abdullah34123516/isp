import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import bcrypt from 'bcryptjs';

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

    // Fetch ISP owners with their statistics
    const ispOwners = await db.user.findMany({
      where: { role: 'ISP_OWNER' },
      include: {
        ispOwner: true
      },
      orderBy: {
        createdAt: 'desc'
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

      // Get routers count
      const routers = await db.router.findMany({
        where: { ispOwnerId: owner.id }
      });

      // Get PPPoE users count
      const pppoeUsers = await db.pPPoEUser.findMany({
        where: {
          customerId: { in: customerIds }
        }
      });

      return {
        id: owner.id,
        companyName: owner.ispOwner?.companyName || owner.name,
        email: owner.email,
        phone: owner.ispOwner?.phone || '',
        address: owner.ispOwner?.address || '',
        customers: totalCustomers,
        routers: routers.length,
        pppoeUsers: pppoeUsers.length,
        revenue: totalRevenue,
        status: owner.isActive ? 'active' : 'inactive',
        createdAt: owner.createdAt,
        updatedAt: owner.updatedAt
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

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { email, password, name, companyName, phone, address } = body;

    // Validate required fields
    if (!email || !password || !name || !companyName) {
      return NextResponse.json(
        { error: 'Email, password, name, and company name are required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user and ISP owner in a transaction
    const result = await db.$transaction(async (prisma) => {
      // Create user
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          role: 'ISP_OWNER',
          isActive: true
        }
      });

      // Create ISP owner
      const ispOwner = await prisma.ispOwner.create({
        data: {
          userId: user.id,
          companyName,
          phone: phone || '',
          address: address || ''
        }
      });

      return { user, ispOwner };
    });

    return NextResponse.json({
      message: 'ISP owner created successfully',
      ispOwner: {
        id: result.ispOwner.id,
        userId: result.user.id,
        companyName: result.ispOwner.companyName,
        email: result.user.email,
        name: result.user.name,
        phone: result.ispOwner.phone,
        address: result.ispOwner.address,
        status: 'active',
        createdAt: result.user.createdAt
      }
    });

  } catch (error) {
    console.error('Error creating ISP owner:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}