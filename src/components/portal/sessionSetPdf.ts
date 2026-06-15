import { getSessionEventStatusLabel } from '@/lib/sessionEventStatus';
import { formatEventSchedule } from '@/lib/utils';
import type { SessionEventView, SessionSetView } from './types';

type DownloadSessionSetPdfParams = {
  sessionEvent: SessionEventView | null;
  sessionSets: SessionSetView[];
};

type SessionSetMember = NonNullable<SessionSetView['drum']>;

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatPdfMemberName(member: SessionSetMember | null | undefined, options?: { subInstrument?: string | null; keyName?: string | null }) {
  if (!member) {
    return '-';
  }

  const markers = [
    member.requestedInRound1 ? '★' : null,
    member.isForced ? `強制追加${member.forcedCount && member.forcedCount > 0 ? member.forcedCount : ''}` : null,
  ].filter(Boolean);
  const markerText = markers.length > 0 ? ` (${markers.join(' / ')})` : '';
  const subInstrumentText = options?.subInstrument ? ` (${options.subInstrument})` : '';
  const keyText = options?.keyName ? ` (key ${options.keyName})` : '';

  return `${member.name}${markerText}${subInstrumentText}${keyText}`;
}

function formatPdfMemberList(
  members: SessionSetView['front'] | SessionSetView['vocal'],
  formatter: (member: NonNullable<typeof members>[number]) => string,
) {
  return members?.length ? members.map(formatter).join(', ') : '-';
}

function sortSessionSets(sessionSets: SessionSetView[]) {
  return [...sessionSets].sort((left, right) => {
    const leftOrder = left.setOrder ?? Number.MAX_SAFE_INTEGER;
    const rightOrder = right.setOrder ?? Number.MAX_SAFE_INTEGER;
    if (leftOrder !== rightOrder) {
      return leftOrder - rightOrder;
    }
    return left.songTitle.localeCompare(right.songTitle, 'ja-JP');
  });
}

function buildSessionSetPrintHtml({ sessionEvent, sessionSets }: DownloadSessionSetPdfParams) {
  const eventTitle = sessionEvent?.title ?? 'sessionSet';
  const eventMeta = sessionEvent
    ? `${formatEventSchedule(sessionEvent.eventDate, sessionEvent.startTime, sessionEvent.endTime)} / ${sessionEvent.venue}`
    : '';
  const statusLabel = sessionEvent ? getSessionEventStatusLabel(sessionEvent.status) : '';
  const sortedSessionSets = sortSessionSets(sessionSets);

  return `<!doctype html>
<html lang="ja">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(eventTitle)} sessionSet</title>
  <style>
    @page { size: A4; margin: 14mm; }
    * { box-sizing: border-box; }
    body {
      color: #111827;
      font-family: -apple-system, BlinkMacSystemFont, "Hiragino Sans", "Yu Gothic", "YuGothic", "Noto Sans JP", "Segoe UI", sans-serif;
      font-size: 12px;
      line-height: 1.55;
      margin: 0;
    }
    header {
      border-bottom: 2px solid #0f172a;
      margin-bottom: 14px;
      padding-bottom: 10px;
    }
    h1 {
      font-size: 22px;
      line-height: 1.25;
      margin: 0;
    }
    .meta {
      color: #4b5563;
      margin-top: 6px;
    }
    .badge {
      border: 1px solid #94a3b8;
      border-radius: 999px;
      display: inline-block;
      font-size: 11px;
      margin-left: 8px;
      padding: 1px 8px;
      vertical-align: 2px;
    }
    ol {
      display: grid;
      gap: 8px;
      list-style: none;
      margin: 0;
      padding: 0;
    }
    li {
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      page-break-inside: avoid;
      padding: 10px 12px;
    }
    .song {
      align-items: baseline;
      display: flex;
      gap: 8px;
      justify-content: space-between;
      margin-bottom: 6px;
    }
    .song-title {
      font-size: 14px;
      font-weight: 700;
    }
    .key {
      color: #475569;
      white-space: nowrap;
    }
    .members {
      display: grid;
      gap: 3px;
    }
    .row {
      display: grid;
      grid-template-columns: 54px 1fr;
      gap: 8px;
    }
    .role {
      color: #475569;
      font-weight: 700;
      text-transform: lowercase;
    }
    .empty {
      color: #64748b;
      margin-top: 16px;
    }
  </style>
</head>
<body>
  <header>
    <h1>${escapeHtml(eventTitle)}<span class="badge">${escapeHtml(statusLabel)}</span></h1>
    ${eventMeta ? `<div class="meta">${escapeHtml(eventMeta)}</div>` : ''}
  </header>
  ${sortedSessionSets.length === 0
    ? '<p class="empty">公開済み sessionSet はありません。</p>'
    : `<ol>${sortedSessionSets.map((sessionSet) => `
      <li>
        <div class="song">
          <div class="song-title">${escapeHtml(sessionSet.songTitle)}</div>
          <div class="key">key ${escapeHtml(sessionSet.key ?? '-')}</div>
        </div>
        <div class="members">
          <div class="row"><div class="role">drum</div><div>${escapeHtml(formatPdfMemberName(sessionSet.drum))}</div></div>
          <div class="row"><div class="role">bass</div><div>${escapeHtml(formatPdfMemberName(sessionSet.bass))}</div></div>
          <div class="row"><div class="role">piano</div><div>${escapeHtml(formatPdfMemberName(sessionSet.piano))}</div></div>
          <div class="row"><div class="role">front</div><div>${escapeHtml(formatPdfMemberList(sessionSet.front, (member) => formatPdfMemberName(member, { subInstrument: 'subInstrument' in member ? member.subInstrument : null })))}</div></div>
          <div class="row"><div class="role">vocal</div><div>${escapeHtml(formatPdfMemberList(sessionSet.vocal, (member) => formatPdfMemberName(member, { keyName: sessionSet.key })))}</div></div>
        </div>
      </li>`).join('')}</ol>`}
  <script>
    window.addEventListener('load', () => {
      window.focus();
      window.print();
    });
  </script>
</body>
</html>`;
}

export function downloadSessionSetPdf(params: DownloadSessionSetPdfParams) {
  if (typeof window === 'undefined') {
    return;
  }

  const printWindow = window.open('', '_blank', 'width=960,height=720');
  if (!printWindow) {
    window.alert('PDF表示用のウィンドウを開けませんでした。ポップアップブロックを確認してください。');
    return;
  }

  printWindow.document.open();
  printWindow.document.write(buildSessionSetPrintHtml(params));
  printWindow.document.close();
}
