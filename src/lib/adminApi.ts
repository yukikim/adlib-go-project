import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';

type AdminContext = {
  userId: string;
};

type RequireAdminResult = {
  admin?: AdminContext;
  response?: NextResponse;
};

export async function requireAdmin(request: NextRequest): Promise<RequireAdminResult> {
  const authenticatedUser = await getAuthenticatedUser(request);

  if (authenticatedUser?.role === 'admin' && authenticatedUser.status === 'active') {
    return { admin: { userId: authenticatedUser.id } };
  }

  return {
    response: NextResponse.json(
      { error: 'forbidden', message: 'admin role is required' },
      { status: 403 },
    ),
  };
}