import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type AdminContext = {
  userId: string;
};

type RequireAdminResult = {
  admin?: AdminContext;
  response?: NextResponse;
};

export async function requireAdmin(request: NextRequest): Promise<RequireAdminResult> {
  const role = request.headers.get('x-user-role');
  const userId = request.headers.get('x-user-id');

  if (role !== 'admin') {
    return {
      response: NextResponse.json(
        { error: 'forbidden', message: 'admin role is required' },
        { status: 403 },
      ),
    };
  }

  if (!userId) {
    return {
      response: NextResponse.json(
        { error: 'invalid_request', message: 'x-user-id header is required' },
        { status: 400 },
      ),
    };
  }

  const user = await prisma.userAccount.findUnique({
    where: { id: userId },
    select: { id: true, role: true, status: true },
  });

  if (!user || user.role !== 'admin' || user.status !== 'active') {
    return {
      response: NextResponse.json(
        { error: 'forbidden', message: 'active admin user was not found' },
        { status: 403 },
      ),
    };
  }

  return { admin: { userId: user.id } };
}