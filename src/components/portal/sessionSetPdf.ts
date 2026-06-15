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
    member.isForced ? 'NR' : null,
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
  const sortedSessionSets = sortSessionSets(sessionSets.filter((sessionSet) => sessionSet.isPublished === true));

  return `<!doctype html>
<html lang="ja">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(eventTitle)} sessionSet</title>
  <style>
    @page { size: A4 landscape; margin: 8mm; }
    * { box-sizing: border-box; }
    body {
      color: #111827;
      font-family: -apple-system, BlinkMacSystemFont, "Hiragino Sans", "Yu Gothic", "YuGothic", "Noto Sans JP", "Segoe UI", sans-serif;
      font-size: 9.2px;
      line-height: 1.28;
      margin: 0;
    }
    header {
      border-bottom: 2px solid #0f172a;
      margin-bottom: 6px;
      padding-bottom: 5px;
    }
    h1 {
      font-size: 15px;
      line-height: 1.25;
      margin: 0;
    }
    .meta {
      color: #4b5563;
      margin-top: 2px;
    }
    .badge {
      border: 1px solid #94a3b8;
      border-radius: 999px;
      display: inline-block;
      font-size: 8.5px;
      margin-left: 8px;
      padding: 0 6px;
      vertical-align: 1px;
    }
    table {
      border-collapse: collapse;
      margin: 0;
      table-layout: fixed;
      width: 100%;
    }
    thead {
      display: table-header-group;
    }
    tr {
      page-break-inside: avoid;
    }
    th,
    td {
      border: 1px solid #cbd5e1;
      padding: 3px 4px;
      text-align: left;
      vertical-align: top;
      word-break: break-word;
    }
    th {
      background: #e2e8f0;
      color: #334155;
      font-weight: 700;
    }
    tbody tr:nth-child(even) {
      background: #f8fafc;
    }
    .order {
      text-align: right;
      width: 24px;
    }
    .song-title {
      font-weight: 700;
      width: 25%;
    }
    .key {
      color: #475569;
      width: 36px;
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
    : `<table>
      <thead>
        <tr>
          <th class="order">#</th>
          <th class="song-title">曲</th>
          <th class="key">key</th>
          <th>drum</th>
          <th>bass</th>
          <th>piano</th>
          <th>front</th>
          <th>vocal</th>
        </tr>
      </thead>
      <tbody>
        ${sortedSessionSets.map((sessionSet, index) => `
          <tr>
            <td class="order">${escapeHtml(String(sessionSet.setOrder ?? index + 1))}</td>
            <td class="song-title">${escapeHtml(sessionSet.songTitle)}</td>
            <td class="key">${escapeHtml(sessionSet.key ?? '-')}</td>
            <td>${escapeHtml(formatPdfMemberName(sessionSet.drum))}</td>
            <td>${escapeHtml(formatPdfMemberName(sessionSet.bass))}</td>
            <td>${escapeHtml(formatPdfMemberName(sessionSet.piano))}</td>
            <td>${escapeHtml(formatPdfMemberList(sessionSet.front, (member) => formatPdfMemberName(member, { subInstrument: 'subInstrument' in member ? member.subInstrument : null })))}</td>
            <td>${escapeHtml(formatPdfMemberList(sessionSet.vocal, (member) => formatPdfMemberName(member, { keyName: sessionSet.key })))}</td>
          </tr>`).join('')}
      </tbody>
    </table>`}
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
