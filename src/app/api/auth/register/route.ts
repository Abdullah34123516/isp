import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { UserRole } from '@prisma/client';
import { hashPassword, generateToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { email, password, name, role, companyName, tenantId } = await request.json();

    // Validate required fields
    if (!email || !password || !name || !role) {
      return NextResponse.json(
        { error: 'Email, password, name, and role are required' },
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
    const hashedPassword = await hashPassword(password);

    // Create user
    const userData: any = {
      email,
      password: hashedPassword,
      name,
      role,
      tenantId: tenantId || null
    };

    const user = await db.user.create({
      data: userData
    });

    // Create role-specific records
    if (role === UserRole.ISP_OWNER) {
      if (!companyName) {
        return NextResponse.json(
          { error: 'Company name is required for ISP owners' },
          { status: 400 }
        );
      }

      await db.ispOwner.create({
        data: {
          userId: user.id,
          companyName,
          tenantId: user.id // Use user ID as tenant ID for ISP owners
        }
      });

      // Update user with tenant ID
      await db.user.update({
        where: { id: user.id },
        data: { tenantId: user.id }
      });
    } else if (role === UserRole.CUSTOMER) {
      // For customers, we need an ISP owner to be specified
      if (!tenantId) {
        return NextResponse.json(
          { error: 'ISP Owner (tenantId) is required for customers' },
          { status: 400 }
        );
      }

      await db.customer.create({
        data: {
          userId: user.id,
          ispOwnerId: tenantId,
          name,
          email
        }
      });
    }

    // Generate token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId || undefined
    });

    return NextResponse.json({
      message: 'User registered successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tenantId: user.tenantId
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}