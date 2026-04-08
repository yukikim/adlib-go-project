import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/adminApi';

export async function GET(request: NextRequest) {
  const { response } = await requireAdmin(request);
  if (response) {
    return response;
  }

  const mailLogs = await prisma.mailLog.findMany({
    include: {
      createdBy: {
        select: {
          id: true,
          email: true,
        },
      },
    },
    orderBy: [{ createdAt: 'desc' }],
    take: 50,
  });

  return NextResponse.json({ mailLogs });
}