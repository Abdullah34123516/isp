import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, extractTokenFromHeader } from './auth';
import { UserRole } from '@prisma/client';

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    userId: string;
    email: string;
    role: UserRole;
    tenantId?: string;
  };
}

export async function authenticate(request: NextRequest): Promise<AuthenticatedRequest | NextResponse> {
  const authHeader = request.headers.get('authorization');
  const token = extractTokenFromHeader(authHeader);

  if (!token) {
    return NextResponse.json({ error: 'No token provided' }, { status: 401 });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  const authenticatedRequest = request as AuthenticatedRequest;
  authenticatedRequest.user = payload;
  return authenticatedRequest;
}

export function authorize(roles: UserRole[]) {
  return (request: AuthenticatedRequest): NextResponse | null => {
    if (!request.user) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    if (!roles.includes(request.user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    return null;
  };
}

export function authorizeTenantAccess(request: AuthenticatedRequest, tenantId: string): NextResponse | null {
  if (!request.user) {
    return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
  }

  // Super admin can access everything
  if (request.user.role === UserRole.SUPER_ADMIN) {
    return null;
  }

  // Sub admin can access everything
  if (request.user.role === UserRole.SUB_ADMIN) {
    return null;
  }

  // ISP owner can only access their own tenant
  if (request.user.role === UserRole.ISP_OWNER && request.user.tenantId === tenantId) {
    return null;
  }

  return NextResponse.json({ error: 'Access denied' }, { status: 403 });
}