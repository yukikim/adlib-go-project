import { NextRequest, NextResponse } from 'next/server';

import { deleteExpiredLogs, LOG_RETENTION_MONTHS } from '@/lib/logRetention';

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authorization = request.headers.get('authorization');

  if (!cronSecret || authorization !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const result = await deleteExpiredLogs();

  return NextResponse.json({
    success: true,
    retentionMonths: LOG_RETENTION_MONTHS,
    cutoff: result.cutoff.toISOString(),
    deleted: result.deleted,
  });
}
