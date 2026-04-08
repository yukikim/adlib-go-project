import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/adminApi';

// DELETE /api/session-archives/:id
export async function DELETE(request: NextRequest) {
  const { admin, response } = await requireAdmin(request);
  if (response) {
    return response;
  }

  const archiveId = request.nextUrl.pathname.split('/').pop();

  if (!archiveId) {
    return NextResponse.json({ error: 'archive id is required' }, { status: 400 });
  }

  const archive = await prisma.sessionArchive.findUnique({
    where: { id: archiveId },
    select: {
      id: true,
      title: true,
      sessionEventId: true,
      version: true,
      deletedAt: true,
    },
  });

  if (!archive) {
    return NextResponse.json({ error: 'archive not found' }, { status: 404 });
  }

  if (archive.deletedAt) {
    return NextResponse.json(
      { error: 'archive already deleted', archiveId: archive.id, deletedAt: archive.deletedAt },
      { status: 409 },
    );
  }

  const deletedAt = new Date();

  const result = await prisma.$transaction(async (tx) => {
    const updatedArchive = await tx.sessionArchive.update({
      where: { id: archive.id },
      data: { deletedAt },
      select: { id: true, deletedAt: true },
    });

    const auditLog = await tx.adminAuditLog.create({
      data: {
        action: 'archive_deleted',
        targetType: 'SessionArchive',
        targetId: archive.id,
        summary: `Deleted archive version ${archive.version}`,
        payload: {
          title: archive.title,
          sessionEventId: archive.sessionEventId,
          version: archive.version,
        },
        performedById: admin!.userId,
        sessionArchiveId: archive.id,
      },
      select: { id: true },
    });

    return { updatedArchive, auditLog };
  });

  return NextResponse.json({
    deleted: true,
    archiveId: result.updatedArchive.id,
    deletedAt: result.updatedArchive.deletedAt,
    auditLogId: result.auditLog.id,
  });
}