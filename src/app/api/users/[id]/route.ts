import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticate, authorize } from '@/lib/middleware';
import { hashPassword } from '@/lib/auth';
import { UserRole } from '@prisma/client';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authResult = await authenticate(request);
    
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const authError = authorize([UserRole.SUPER_ADMIN, UserRole.SUB_ADMIN])(authResult);
    if (authError) {
      return authError;
    }

    const { id } = params;

    const user = await db.user.findUnique({
      where: { id },
      include: {
        ispOwner: true,
        customer: {
          include: {
            plan: true
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if the current user has permission to view this user
    if (authResult.user!.role === UserRole.SUB_ADMIN) {
      // Sub admins can only view ISP owners and customers
      if (user.role === UserRole.SUPER_ADMIN || user.role === UserRole.SUB_ADMIN) {
        return NextResponse.json(
          { error: 'Forbidden' },
          { status: 403 }
        );
      }
    }

    return NextResponse.json({ user });

  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authResult = await authenticate(request);
    
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const authError = authorize([UserRole.SUPER_ADMIN, UserRole.SUB_ADMIN])(authResult);
    if (authError) {
      return authError;
    }

    const { id } = params;
    const { email, name, role, companyName, isActive, password } = await request.json();

    // Check if user exists
    const existingUser = await db.user.findUnique({
      where: { id },
      include: {
        ispOwner: true,
        customer: true
      }
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if the current user has permission to edit this user
    if (authResult.user!.role === UserRole.SUB_ADMIN) {
      // Sub admins can only edit ISP owners and customers
      if (existingUser.role === UserRole.SUPER_ADMIN || existingUser.role === UserRole.SUB_ADMIN) {
        return NextResponse.json(
          { error: 'Forbidden' },
          { status: 403 }
        );
      }
    }

    // Check if email is being changed and already exists
    if (email !== existingUser.email) {
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
      email: email || existingUser.email,
      name: name || existingUser.name,
      isActive: isActive !== undefined ? isActive : existingUser.isActive
    };

    // Update password if provided
    if (password) {
      updateData.password = await hashPassword(password);
    }

    // Handle role change (only super admin can change roles)
    if (role && authResult.user!.role === UserRole.SUPER_ADMIN && role !== existingUser.role) {
      updateData.role = role;

      // Handle role-specific cleanup and creation
      if (existingUser.role === UserRole.ISP_OWNER && role !== UserRole.ISP_OWNER) {
        // Remove ISP owner record if changing from ISP owner
        await db.ispOwner.delete({
          where: { userId: existingUser.id }
        });
      } else if (existingUser.role === UserRole.CUSTOMER && role !== UserRole.CUSTOMER) {
        // Remove customer record if changing from customer
        await db.customer.delete({
          where: { userId: existingUser.id }
        });
      }

      // Create new role-specific records
      if (role === UserRole.ISP_OWNER && !existingUser.ispOwner) {
        if (!companyName) {
          return NextResponse.json(
            { error: 'Company name is required for ISP owners' },
            { status: 400 }
          );
        }

        await db.ispOwner.create({
          data: {
            userId: existingUser.id,
            companyName,
            tenantId: existingUser.id
          }
        });

        updateData.tenantId = existingUser.id;
      } else if (role === UserRole.CUSTOMER && !existingUser.customer) {
        // For new customers, we need to assign them to an ISP owner
        // This should be handled by the frontend or require additional parameters
        return NextResponse.json(
          { error: 'Customer creation requires ISP owner assignment' },
          { status: 400 }
        );
      }
    }

    // Update ISP owner company name if provided
    if (existingUser.ispOwner && companyName) {
      await db.ispOwner.update({
        where: { userId: existingUser.id },
        data: { companyName }
      });
    }

    // Update the user
    const updatedUser = await db.user.update({
      where: { id },
      data: updateData,
      include: {
        ispOwner: true,
        customer: {
          include: {
            plan: true
          }
        }
      }
    });

    return NextResponse.json({
      message: 'User updated successfully',
      user: updatedUser
    });

  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authResult = await authenticate(request);
    
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const authError = authorize([UserRole.SUPER_ADMIN])(authResult);
    if (authError) {
      return authError;
    }

    const { id } = params;

    // Check if user exists
    const existingUser = await db.user.findUnique({
      where: { id },
      include: {
        ispOwner: true,
        customer: true
      }
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Prevent deletion of the current user
    if (existingUser.id === authResult.user!.id) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      );
    }

    // Delete role-specific records first (due to foreign key constraints)
    if (existingUser.ispOwner) {
      // Delete related data for ISP owner
      await db.$transaction([
        db.pPPoEUser.deleteMany({
          where: {
            customer: {
              ispOwnerId: existingUser.ispOwner.id
            }
          }
        }),
        db.customer.deleteMany({
          where: { ispOwnerId: existingUser.ispOwner.id }
        }),
        db.router.deleteMany({
          where: { ispOwnerId: existingUser.ispOwner.id }
        }),
        db.plan.deleteMany({
          where: { ispOwnerId: existingUser.ispOwner.id }
        }),
        db.invoice.deleteMany({
          where: { ispOwnerId: existingUser.ispOwner.id }
        }),
        db.ispOwner.delete({
          where: { userId: existingUser.id }
        })
      ]);
    }

    if (existingUser.customer) {
      // Delete related data for customer
      await db.$transaction([
        db.pPPoEUser.deleteMany({
          where: { customerId: existingUser.customer.id }
        }),
        db.payment.deleteMany({
          where: { customerId: existingUser.customer.id }
        }),
        db.invoice.deleteMany({
          where: { customerId: existingUser.customer.id }
        }),
        db.customer.delete({
          where: { userId: existingUser.id }
        })
      ]);
    }

    // Delete the user
    await db.user.delete({
      where: { id }
    });

    return NextResponse.json({
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}