import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/adminApi';

export async function GET(request: NextRequest) {
  const { response } = await requireAdmin(request);
  if (response) {
    return response;
  }

  const activity = await prisma.adminAuditLog.findMany({
    include: {
      performedBy: {
        select: {
          id: true,
          email: true,
        },
      },
    },
    orderBy: [{ performedAt: 'desc' }],
    take: 50,
  });

  return NextResponse.json({ activity });
}