import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword, generateToken } from '@/lib/auth';
import { UserRole } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json();

    // Validate required fields
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, password, and name are required' },
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

    // Create Super Admin user
    const superAdmin = await db.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: UserRole.SUPER_ADMIN,
        tenantId: null,
        isActive: true
      }
    });

    // Generate token
    const token = generateToken({
      userId: superAdmin.id,
      email: superAdmin.email,
      role: superAdmin.role,
      tenantId: superAdmin.tenantId || undefined
    });

    return NextResponse.json({
      message: 'Super Admin created successfully',
      token,
      user: {
        id: superAdmin.id,
        email: superAdmin.email,
        name: superAdmin.name,
        role: superAdmin.role,
        tenantId: superAdmin.tenantId
      }
    });

  } catch (error) {
    console.error('Error creating Super Admin:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}