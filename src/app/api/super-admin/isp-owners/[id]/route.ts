import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
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

    const { id } = params;

    // Fetch ISP owner with detailed information
    const ispOwnerUser = await db.user.findUnique({
      where: { id, role: 'ISP_OWNER' },
      include: {
        ispOwner: true,
        customers: {
          include: {
            plan: true,
            invoices: {
              include: {
                payments: true
              }
            }
          }
        },
        routers: true,
        plans: true,
        invoices: {
          include: {
            payments: true
          }
        }
      }
    });

    if (!ispOwnerUser || !ispOwnerUser.ispOwner) {
      return NextResponse.json(
        { error: 'ISP owner not found' },
        { status: 404 }
      );
    }

    // Calculate statistics
    const totalCustomers = ispOwnerUser.customers.length;
    const totalRouters = ispOwnerUser.routers.length;
    const totalPlans = ispOwnerUser.plans.length;
    
    // Calculate revenue from completed payments
    const totalRevenue = ispOwnerUser.invoices.reduce((sum, invoice) => {
      const completedPayments = invoice.payments?.filter(payment => payment.status === 'COMPLETED') || [];
      return sum + completedPayments.reduce((paymentSum, payment) => paymentSum + payment.amount, 0);
    }, 0);

    // Get PPPoE users count
    const pppoeUsers = await db.pPPoEUser.findMany({
      where: {
        customerId: { in: ispOwnerUser.customers.map(c => c.id) }
      }
    });

    const ispOwnerDetails = {
      id: ispOwnerUser.id,
      companyName: ispOwnerUser.ispOwner.companyName,
      email: ispOwnerUser.email,
      name: ispOwnerUser.name,
      phone: ispOwnerUser.ispOwner.phone || '',
      address: ispOwnerUser.ispOwner.address || '',
      customers: totalCustomers,
      routers: totalRouters,
      plans: totalPlans,
      pppoeUsers: pppoeUsers.length,
      revenue: totalRevenue,
      status: ispOwnerUser.isActive ? 'active' : 'inactive',
      createdAt: ispOwnerUser.createdAt,
      updatedAt: ispOwnerUser.updatedAt,
      customersList: ispOwnerUser.customers,
      routersList: ispOwnerUser.routers,
      plansList: ispOwnerUser.plans
    };

    return NextResponse.json(ispOwnerDetails);

  } catch (error) {
    console.error('Error fetching ISP owner:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
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

    const { id } = params;
    const { email, name, password, companyName, phone, address, isActive } = await request.json();

    // Check if ISP owner exists
    const existingIspOwner = await db.user.findUnique({
      where: { id, role: 'ISP_OWNER' },
      include: {
        ispOwner: true
      }
    });

    if (!existingIspOwner || !existingIspOwner.ispOwner) {
      return NextResponse.json(
        { error: 'ISP owner not found' },
        { status: 404 }
      );
    }

    // Check if email is being changed and already exists
    if (email !== existingIspOwner.email) {
      const emailExists = await db.user.findUnique({
        where: { email }
      });

      if (emailExists) {
        return NextResponse.json(
          { error: 'User with this email already exists' },
          { status: 400 }
        );
      }
    }

    // Prepare update data
    const updateData: any = {
      email: email || existingIspOwner.email,
      name: name || existingIspOwner.name,
      isActive: isActive !== undefined ? isActive : existingIspOwner.isActive
    };

    // Update password if provided
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    // Update ISP owner record
    const ispOwnerUpdateData: any = {};
    if (companyName !== undefined) ispOwnerUpdateData.companyName = companyName;
    if (phone !== undefined) ispOwnerUpdateData.phone = phone;
    if (address !== undefined) ispOwnerUpdateData.address = address;

    // Update both user and ISP owner records in a transaction
    const result = await db.$transaction(async (prisma) => {
      // Update user
      const updatedUser = await prisma.user.update({
        where: { id },
        data: updateData
      });

      // Update ISP owner
      const updatedIspOwner = await prisma.ispOwner.update({
        where: { userId: id },
        data: ispOwnerUpdateData
      });

      return { user: updatedUser, ispOwner: updatedIspOwner };
    });

    return NextResponse.json({
      message: 'ISP owner updated successfully',
      ispOwner: {
        id: result.ispOwner.id,
        userId: result.user.id,
        companyName: result.ispOwner.companyName,
        email: result.user.email,
        name: result.user.name,
        phone: result.ispOwner.phone,
        address: result.ispOwner.address,
        status: result.user.isActive ? 'active' : 'inactive',
        updatedAt: result.user.updatedAt
      }
    });

  } catch (error) {
    console.error('Error updating ISP owner:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
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

    const { id } = params;

    // Check if ISP owner exists
    const existingIspOwner = await db.user.findUnique({
      where: { id, role: 'ISP_OWNER' },
      include: {
        ispOwner: true,
        customers: true,
        routers: true,
        plans: true,
        invoices: true
      }
    });

    if (!existingIspOwner || !existingIspOwner.ispOwner) {
      return NextResponse.json(
        { error: 'ISP owner not found' },
        { status: 404 }
      );
    }

    // Prevent deletion of the current user
    if (existingIspOwner.id === payload.userId) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      );
    }

    // Delete all related data in a transaction
    await db.$transaction(async (prisma) => {
      // Delete PPPoE users for all customers of this ISP owner
      const customerIds = existingIspOwner.customers.map(c => c.id);
      await prisma.pPPoEUser.deleteMany({
        where: { customerId: { in: customerIds } }
      });

      // Delete payments for invoices of this ISP owner
      const invoiceIds = existingIspOwner.invoices.map(i => i.id);
      await prisma.payment.deleteMany({
        where: { invoiceId: { in: invoiceIds } }
      });

      // Delete invoices
      await prisma.invoice.deleteMany({
        where: { ispOwnerId: existingIspOwner.ispOwner.id }
      });

      // Delete customers
      await prisma.customer.deleteMany({
        where: { ispOwnerId: existingIspOwner.ispOwner.id }
      });

      // Delete routers
      await prisma.router.deleteMany({
        where: { ispOwnerId: existingIspOwner.ispOwner.id }
      });

      // Delete plans
      await prisma.plan.deleteMany({
        where: { ispOwnerId: existingIspOwner.ispOwner.id }
      });

      // Delete ISP owner record
      await prisma.ispOwner.delete({
        where: { userId: id }
      });

      // Delete user
      await prisma.user.delete({
        where: { id }
      });
    });

    return NextResponse.json({
      message: 'ISP owner and all related data deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting ISP owner:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}