import { Section } from './Section';
import { AGE_RANGE_OPTIONS, GENDER_OPTIONS, PREFECTURE_OPTIONS } from '@/lib/memberProfile';
import type {
  ActivityLogView,
  ArchiveView,
  ColumnView,
  GeneratedResult,
  Instrument,
  MailLogView,
  MemberDetailView,
  MemberListView,
  RatingSummaryView,
  SessionEventView,
  SessionSetView,
} from './types';

type ArchivePreview = {
  participantCount: number;
  setCount: number;
  ratingSummaryIncluded: boolean;
};

function splitPreviewBody(body: string) {
  return body.split(/\n{2,}/).map((paragraph) => paragraph.trim()).filter(Boolean);
}

type AdminPortalSectionProps = {
  loading: boolean;
  sessionEvents: SessionEventView[];
  selectedAdminEventId: string;
  selectedAdminEvent: SessionEventView | null;
  eventTitle: string;
  eventVenue: string;
  eventDate: string;
  editEventTitle: string;
  editEventVenue: string;
  editEventDate: string;
  editEventStatus: string;
  editRound1StartAt: string;
  editRound1EndAt: string;
  editRound2StartAt: string;
  editRound2EndAt: string;
  sessionSets: SessionSetView[];
  ratingSummaries: RatingSummaryView[];
  archives: ArchiveView[];
  archiveTitle: string;
  archiveNote: string;
  archivePreview: ArchivePreview | null;
  generatedResult: GeneratedResult;
  activityLogs: ActivityLogView[];
  mailLogs: MailLogView[];
  members: MemberListView[];
  selectedManagedMemberId: string;
  selectedManagedMemberDetail: MemberDetailView | null;
  memberUpdateMessage: string | null;
  memberUpdateMessageTone: 'success' | 'error' | null;
  memberSearchQuery: string;
  adminMemberDisplayName: string;
  adminMemberNickname: string;
  adminMemberMainInstrument: string;
  adminMemberSubInstrument: string;
  adminMemberGender: string;
  adminMemberAgeRange: string;
  adminMemberArea: string;
  adminMemberBio: string;
  adminMemberRole: 'member' | 'admin';
  adminMemberStatus: 'active' | 'suspended' | 'invited';
  announcementTitle: string;
  announcementBody: string;
  announcementPublished: boolean;
  columns: ColumnView[];
  editingColumnSlug: string;
  columnTitle: string;
  columnSlug: string;
  columnSummary: string;
  columnBody: string;
  columnThumbnailLabel: string;
  columnAuthorName: string;
  columnDisplayOrder: number;
  columnPublishAt: string;
  columnPublished: boolean;
  setSelectedAdminEventId: (value: string) => void;
  setEventTitle: (value: string) => void;
  setEventVenue: (value: string) => void;
  setEventDate: (value: string) => void;
  setEditEventTitle: (value: string) => void;
  setEditEventVenue: (value: string) => void;
  setEditEventDate: (value: string) => void;
  setEditEventStatus: (value: string) => void;
  setEditRound1StartAt: (value: string) => void;
  setEditRound1EndAt: (value: string) => void;
  setEditRound2StartAt: (value: string) => void;
  setEditRound2EndAt: (value: string) => void;
  setSelectedManagedMemberId: (value: string) => void;
  setMemberSearchQuery: (value: string) => void;
  setAdminMemberDisplayName: (value: string) => void;
  setAdminMemberNickname: (value: string) => void;
  setAdminMemberMainInstrument: (value: Instrument) => void;
  setAdminMemberSubInstrument: (value: string) => void;
  setAdminMemberGender: (value: string) => void;
  setAdminMemberAgeRange: (value: string) => void;
  setAdminMemberArea: (value: string) => void;
  setAdminMemberBio: (value: string) => void;
  setAdminMemberRole: (value: 'member' | 'admin') => void;
  setAdminMemberStatus: (value: 'active' | 'suspended' | 'invited') => void;
  setAnnouncementTitle: (value: string) => void;
  setAnnouncementBody: (value: string) => void;
  setAnnouncementPublished: (value: boolean) => void;
  setArchiveTitle: (value: string) => void;
  setArchiveNote: (value: string) => void;
  setEditingColumnSlug: (value: string) => void;
  setColumnTitle: (value: string) => void;
  setColumnSlug: (value: string) => void;
  setColumnSummary: (value: string) => void;
  setColumnBody: (value: string) => void;
  setColumnThumbnailLabel: (value: string) => void;
  setColumnAuthorName: (value: string) => void;
  setColumnDisplayOrder: (value: number) => void;
  setColumnPublishAt: (value: string) => void;
  setColumnPublished: (value: boolean) => void;
  onCreateEvent: () => void;
  onUpdateEvent: () => void;
  onGenerateSets: () => void;
  onPublishSets: () => void;
  onSignOut: () => void;
  onCreateArchive: () => void;
  onDeleteArchive: (archiveId: string) => void;
  onUpdateMember: () => void;
  onDeleteMember: () => void;
  onCreateAnnouncement: () => void;
  onCreateColumn: () => void;
  onUpdateColumn: () => void;
  onDeleteColumn: (slug?: string) => void;
  onResetColumnForm: () => void;
};

export function AdminPortalSection(props: AdminPortalSectionProps) {
  const {
    loading,
    sessionEvents,
    selectedAdminEventId,
    selectedAdminEvent,
    eventTitle,
    eventVenue,
    eventDate,
    editEventTitle,
    editEventVenue,
    editEventDate,
    editEventStatus,
    editRound1StartAt,
    editRound1EndAt,
    editRound2StartAt,
    editRound2EndAt,
    sessionSets,
    ratingSummaries,
    archives,
    archiveTitle,
    archiveNote,
    archivePreview,
    generatedResult,
    activityLogs,
    mailLogs,
    members,
    selectedManagedMemberId,
    selectedManagedMemberDetail,
    memberUpdateMessage,
    memberUpdateMessageTone,
    memberSearchQuery,
    adminMemberDisplayName,
    adminMemberNickname,
    adminMemberMainInstrument,
    adminMemberSubInstrument,
    adminMemberGender,
    adminMemberAgeRange,
    adminMemberArea,
    adminMemberBio,
    adminMemberRole,
    adminMemberStatus,
    announcementTitle,
    announcementBody,
    announcementPublished,
    columns,
    editingColumnSlug,
    columnTitle,
    columnSlug,
    columnSummary,
    columnBody,
    columnThumbnailLabel,
    columnAuthorName,
    columnDisplayOrder,
    columnPublishAt,
    columnPublished,
    setSelectedAdminEventId,
    setEventTitle,
    setEventVenue,
    setEventDate,
    setEditEventTitle,
    setEditEventVenue,
    setEditEventDate,
    setEditEventStatus,
    setEditRound1StartAt,
    setEditRound1EndAt,
    setEditRound2StartAt,
    setEditRound2EndAt,
    setSelectedManagedMemberId,
    setMemberSearchQuery,
    setAdminMemberDisplayName,
    setAdminMemberNickname,
    setAdminMemberMainInstrument,
    setAdminMemberSubInstrument,
    setAdminMemberGender,
    setAdminMemberAgeRange,
    setAdminMemberArea,
    setAdminMemberBio,
    setAdminMemberRole,
    setAdminMemberStatus,
    setAnnouncementTitle,
    setAnnouncementBody,
    setAnnouncementPublished,
    setArchiveTitle,
    setArchiveNote,
    setEditingColumnSlug,
    setColumnTitle,
    setColumnSlug,
    setColumnSummary,
    setColumnBody,
    setColumnThumbnailLabel,
    setColumnAuthorName,
    setColumnDisplayOrder,
    setColumnPublishAt,
    setColumnPublished,
    onCreateEvent,
    onUpdateEvent,
    onGenerateSets,
    onPublishSets,
    onSignOut,
    onCreateArchive,
    onDeleteArchive,
    onUpdateMember,
    onDeleteMember,
    onCreateAnnouncement,
    onCreateColumn,
    onUpdateColumn,
    onDeleteColumn,
    onResetColumnForm,
  } = props;

  const filteredMembers = members.filter((member) => {
    const query = memberSearchQuery.trim().toLowerCase();
    if (!query) {
      return true;
    }
    return [
      member.displayName,
      member.nickname ?? '',
      member.mainInstrument,
      member.area ?? '',
      member.userAccount.email,
      member.userAccount.role,
      member.userAccount.status,
    ].some((value) => value.toLowerCase().includes(query));
  });

  const previewParagraphs = splitPreviewBody(columnBody);

  return (
    <>
        <p className="text-red-500">AdminPortalSection</p>
      <Section title="イベント管理">
        <div style={{ display: 'grid', gap: '0.75rem', maxWidth: 560 }}>
          <label htmlFor="admin-event-title">
            イベント名
            <input id="admin-event-title" type="text" placeholder="イベント名" value={eventTitle} onChange={(event) => setEventTitle(event.target.value)} />
          </label>
          <label htmlFor="admin-event-venue">
            会場
            <input id="admin-event-venue" type="text" placeholder="会場" value={eventVenue} onChange={(event) => setEventVenue(event.target.value)} />
          </label>
          <label htmlFor="admin-event-date">
            開催日
            <input id="admin-event-date" type="date" value={eventDate} onChange={(event) => setEventDate(event.target.value)} />
          </label>
          <div>
            <button type="button" onClick={onCreateEvent} disabled={loading}>イベント作成</button>
          </div>
          <label htmlFor="admin-event-select">
            編集対象イベント
            <select id="admin-event-select" value={selectedAdminEventId} onChange={(event) => setSelectedAdminEventId(event.target.value)}>
              <option value="">編集対象イベントを選択</option>
              {sessionEvents.map((sessionEvent) => (
                <option key={sessionEvent.id} value={sessionEvent.id}>{sessionEvent.title}</option>
              ))}
            </select>
          </label>
          {selectedAdminEvent && (
            <>
              <label htmlFor="admin-edit-event-title">
                イベント名
                <input id="admin-edit-event-title" type="text" placeholder="イベント名" value={editEventTitle} onChange={(event) => setEditEventTitle(event.target.value)} />
              </label>
              <label htmlFor="admin-edit-event-venue">
                会場
                <input id="admin-edit-event-venue" type="text" placeholder="会場" value={editEventVenue} onChange={(event) => setEditEventVenue(event.target.value)} />
              </label>
              <label htmlFor="admin-edit-event-date">
                開催日
                <input id="admin-edit-event-date" type="date" value={editEventDate} onChange={(event) => setEditEventDate(event.target.value)} />
              </label>
              <label htmlFor="admin-edit-event-status">
                ステータス
                <select id="admin-edit-event-status" value={editEventStatus} onChange={(event) => setEditEventStatus(event.target.value)}>
                  <option value="draft">draft</option>
                  <option value="recruiting_round1">recruiting_round1</option>
                  <option value="recruiting_round2">recruiting_round2</option>
                  <option value="generating">generating</option>
                  <option value="published">published</option>
                  <option value="closed">closed</option>
                </select>
              </label>
              <label htmlFor="admin-edit-round1-start">
                Round1 開始
                <input id="admin-edit-round1-start" type="datetime-local" value={editRound1StartAt} onChange={(event) => setEditRound1StartAt(event.target.value)} />
              </label>
              <label htmlFor="admin-edit-round1-end">
                Round1 終了
                <input id="admin-edit-round1-end" type="datetime-local" value={editRound1EndAt} onChange={(event) => setEditRound1EndAt(event.target.value)} />
              </label>
              <label htmlFor="admin-edit-round2-start">
                Round2 開始
                <input id="admin-edit-round2-start" type="datetime-local" value={editRound2StartAt} onChange={(event) => setEditRound2StartAt(event.target.value)} />
              </label>
              <label htmlFor="admin-edit-round2-end">
                Round2 終了
                <input id="admin-edit-round2-end" type="datetime-local" value={editRound2EndAt} onChange={(event) => setEditRound2EndAt(event.target.value)} />
              </label>
              <div>
                <button type="button" onClick={onUpdateEvent} disabled={loading}>イベント更新</button>
              </div>
            </>
          )}
        </div>
      </Section>

      <Section title="sessionSet 管理">
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button type="button" onClick={onGenerateSets} disabled={loading || !selectedAdminEventId}>sessionSet 生成</button>
          <button type="button" onClick={onPublishSets} disabled={loading || !selectedAdminEventId || sessionSets.length === 0}>sessionSet 公開</button>
          <button type="button" onClick={onSignOut} disabled={loading}>サインアウト</button>
        </div>
        {sessionSets.length === 0 ? <p>まだ sessionSet はありません。</p> : (
          <ul style={{ marginTop: '1rem' }}>
            {sessionSets.map((sessionSet) => (
              <li key={sessionSet.id}>{sessionSet.songTitle} / drum {sessionSet.drum?.name ?? '-'} / bass {sessionSet.bass?.name ?? '-'} / piano {sessionSet.piano?.name ?? '-'}</li>
            ))}
          </ul>
        )}
        {generatedResult.forcedSessionSets.length > 0 && (
          <>
            <h3>強制追加</h3>
            <ul>
              {generatedResult.forcedSessionSets.map((item) => (
                <li key={item.songTitle}>{item.songTitle} / {item.forcedInstruments.join(', ')}</li>
              ))}
            </ul>
          </>
        )}
        {generatedResult.skippedSongs.length > 0 && (
          <>
            <h3>未生成理由</h3>
            <ul>
              {generatedResult.skippedSongs.map((item) => (
                <li key={item.songTitle}>{item.songTitle} / {item.reasons.join(' / ')}</li>
              ))}
            </ul>
          </>
        )}
      </Section>

      <Section title="レイティング / アーカイブ">
        <h3>レイティング集計</h3>
        {ratingSummaries.length === 0 ? <p>まだ評価集計はありません。</p> : (
          <ul>
            {ratingSummaries.map((summary) => (
              <li key={summary.sessionSetId}>{summary.songTitle} / 件数 {summary.ratingCount} / 平均 {summary.averageRating?.toFixed(2) ?? '-'}</li>
            ))}
          </ul>
        )}
        <h3>アーカイブ preview</h3>
        {archivePreview ? <p>参加者 {archivePreview.participantCount} 名 / sets {archivePreview.setCount} / 評価 {archivePreview.ratingSummaryIncluded ? 'あり' : 'なし'}</p> : <p>preview はありません。</p>}
        <div style={{ display: 'grid', gap: '0.75rem', maxWidth: 560 }}>
          <label htmlFor="admin-archive-title">
            アーカイブ名
            <input id="admin-archive-title" type="text" placeholder="アーカイブ名" value={archiveTitle} onChange={(event) => setArchiveTitle(event.target.value)} />
          </label>
          <label htmlFor="admin-archive-note">
            メモ
            <textarea id="admin-archive-note" rows={2} placeholder="メモ" value={archiveNote} onChange={(event) => setArchiveNote(event.target.value)} />
          </label>
          <div>
            <button type="button" onClick={onCreateArchive} disabled={loading || !selectedAdminEventId}>アーカイブ作成</button>
          </div>
        </div>
        {archives.length === 0 ? <p>アーカイブはありません。</p> : (
          <ul>
            {archives.map((archive) => (
              <li key={archive.id} style={{ marginBottom: '0.5rem' }}>
                {archive.title} / v{archive.version} / {archive.sessionEventTitle} / sets {archive.setCount} / ratings {archive.ratingCount}
                {!archive.deletedAt && (
                  <>
                    {' '}
                    <button type="button" onClick={() => onDeleteArchive(archive.id)} disabled={loading}>削除</button>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="メンバー / 管理者管理">
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 280px) 1fr', gap: '1rem' }}>
          <div>
            <label htmlFor="admin-member-search">
              メンバー検索
              <input
                id="admin-member-search"
                type="search"
                placeholder="名前、メール、role、status で検索"
                value={memberSearchQuery}
                onChange={(event) => setMemberSearchQuery(event.target.value)}
                style={{ width: '100%', marginBottom: '0.75rem' }}
              />
            </label>
            <ul style={{ margin: 0, paddingLeft: '1rem' }}>
            {filteredMembers.map((member) => (
              <li key={member.id} style={{ marginBottom: '0.5rem' }}>
                <button type="button" onClick={() => setSelectedManagedMemberId(member.id)}>{member.displayName} / {member.userAccount.status}</button>
              </li>
            ))}
            </ul>
          </div>
          <div>
            <p style={{ color: '#666', marginTop: 0 }}>既存メンバーの role を admin に変更すると管理者として追加されます。管理者の編集もこの画面で行います。</p>
            {selectedManagedMemberDetail ? (
              <div style={{ display: 'grid', gap: '0.75rem', maxWidth: 420 }}>
                <div>{selectedManagedMemberDetail.userAccount.email}</div>
                <label htmlFor="admin-member-display-name">
                  表示名
                  <input id="admin-member-display-name" type="text" placeholder="表示名" value={adminMemberDisplayName} onChange={(event) => setAdminMemberDisplayName(event.target.value)} />
                </label>
                <label htmlFor="admin-member-nickname">
                  ニックネーム
                  <input id="admin-member-nickname" type="text" placeholder="ニックネーム" value={adminMemberNickname} onChange={(event) => setAdminMemberNickname(event.target.value)} />
                </label>
                <label htmlFor="admin-member-main-instrument">
                  メイン楽器
                  <select id="admin-member-main-instrument" value={adminMemberMainInstrument} onChange={(event) => setAdminMemberMainInstrument(event.target.value as Instrument)}>
                    <option value="drum">drum</option>
                    <option value="bass">bass</option>
                    <option value="piano">piano</option>
                    <option value="front">front</option>
                    <option value="vocal">vocal</option>
                  </select>
                </label>
                {adminMemberMainInstrument === 'front' && (
                  <label htmlFor="admin-member-sub-instrument">
                    演奏楽器
                    <input id="admin-member-sub-instrument" type="text" placeholder="演奏楽器" value={adminMemberSubInstrument} onChange={(event) => setAdminMemberSubInstrument(event.target.value)} />
                  </label>
                )}
                <label htmlFor="admin-member-area">
                  居住地域
                  <select id="admin-member-area" value={adminMemberArea} onChange={(event) => setAdminMemberArea(event.target.value)}>
                    <option value="">居住地域を選択</option>
                    {PREFECTURE_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                  </select>
                </label>
                <label htmlFor="admin-member-gender">
                  性別
                  <select id="admin-member-gender" value={adminMemberGender} onChange={(event) => setAdminMemberGender(event.target.value)}>
                    <option value="">性別を選択</option>
                    {GENDER_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                  </select>
                </label>
                <label htmlFor="admin-member-age-range">
                  年代
                  <select id="admin-member-age-range" value={adminMemberAgeRange} onChange={(event) => setAdminMemberAgeRange(event.target.value)}>
                    <option value="">年代を選択</option>
                    {AGE_RANGE_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                  </select>
                </label>
                <label htmlFor="admin-member-bio">
                  自己紹介
                  <textarea id="admin-member-bio" rows={3} placeholder="自己紹介" value={adminMemberBio} onChange={(event) => setAdminMemberBio(event.target.value)} />
                </label>
                <label htmlFor="admin-member-role">
                  ロール
                  <select id="admin-member-role" value={adminMemberRole} onChange={(event) => setAdminMemberRole(event.target.value as 'member' | 'admin')}>
                    <option value="member">member</option>
                    <option value="admin">admin</option>
                  </select>
                </label>
                <label htmlFor="admin-member-status">
                  ステータス
                  <select id="admin-member-status" value={adminMemberStatus} onChange={(event) => setAdminMemberStatus(event.target.value as 'active' | 'suspended' | 'invited')}>
                    <option value="active">active</option>
                    <option value="suspended">suspended</option>
                    <option value="invited">invited</option>
                  </select>
                </label>
                <div>
                  <button type="button" onClick={onUpdateMember} disabled={loading}>メンバー設定保存</button>
                  {' '}
                  <button type="button" onClick={onDeleteMember} disabled={loading || selectedManagedMemberDetail.userAccount.role === 'admin'}>メンバー削除</button>
                </div>
                {memberUpdateMessage && (
                  <p style={{ color: memberUpdateMessageTone === 'error' ? '#b42318' : '#027a48', margin: 0 }}>
                    {memberUpdateMessage}
                  </p>
                )}
                {selectedManagedMemberDetail.userAccount.role === 'admin' && <p style={{ color: '#666', margin: 0 }}>管理者アカウントは削除せず、role を member に戻して管理してください。</p>}
              </div>
            ) : <p>メンバーを選択してください。</p>}
          </div>
        </div>
      </Section>

      <Section title="コラム管理">
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
          <label htmlFor="admin-column-select">
            編集対象コラム
            <select id="admin-column-select" value={editingColumnSlug} onChange={(event) => setEditingColumnSlug(event.target.value)}>
              <option value="">新規コラム</option>
              {columns.map((column) => (
                <option key={column.id} value={column.slug}>{column.title}</option>
              ))}
            </select>
          </label>
          <button type="button" onClick={onResetColumnForm} disabled={loading}>フォームをクリア</button>
        </div>
        <div style={{ display: 'grid', gap: '0.75rem', maxWidth: 720 }}>
          <label htmlFor="admin-column-title">
            タイトル
            <input id="admin-column-title" type="text" placeholder="タイトル" value={columnTitle} onChange={(event) => setColumnTitle(event.target.value)} />
          </label>
          <label htmlFor="admin-column-slug">
            slug（任意）
            <input id="admin-column-slug" type="text" placeholder="slug（任意）" value={columnSlug} onChange={(event) => setColumnSlug(event.target.value)} />
          </label>
          <label htmlFor="admin-column-summary">
            要約
            <input id="admin-column-summary" type="text" placeholder="要約" value={columnSummary} onChange={(event) => setColumnSummary(event.target.value)} />
          </label>
          <label htmlFor="admin-column-thumbnail-label">
            サムネイルラベル
            <input id="admin-column-thumbnail-label" type="text" placeholder="サムネイルラベル" value={columnThumbnailLabel} onChange={(event) => setColumnThumbnailLabel(event.target.value)} />
          </label>
          <label htmlFor="admin-column-author-name">
            著者名
            <input id="admin-column-author-name" type="text" placeholder="著者名" value={columnAuthorName} onChange={(event) => setColumnAuthorName(event.target.value)} />
          </label>
          <label htmlFor="admin-column-display-order">
            表示順
            <input id="admin-column-display-order" type="number" placeholder="表示順" value={columnDisplayOrder} onChange={(event) => setColumnDisplayOrder(Number(event.target.value) || 0)} />
          </label>
          <label htmlFor="admin-column-publish-at">
            公開日時
            <input id="admin-column-publish-at" type="datetime-local" value={columnPublishAt} onChange={(event) => setColumnPublishAt(event.target.value)} />
          </label>
          <label htmlFor="admin-column-body">
            本文
            <textarea id="admin-column-body" rows={8} placeholder="本文。段落ごとに空行で区切ります。" value={columnBody} onChange={(event) => setColumnBody(event.target.value)} />
          </label>
          <label>
            <input type="checkbox" checked={columnPublished} onChange={(event) => setColumnPublished(event.target.checked)} /> 公開する
          </label>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button type="button" onClick={onCreateColumn} disabled={loading}>コラム作成</button>
            <button type="button" onClick={onUpdateColumn} disabled={loading || !editingColumnSlug}>コラム更新</button>
            <button type="button" onClick={() => onDeleteColumn()} disabled={loading || !editingColumnSlug}>コラム削除</button>
          </div>
        </div>
        {columns.length === 0 ? <p>登録済みコラムはありません。</p> : (
          <ul style={{ marginTop: '1rem' }}>
            {columns.map((column) => (
              <li key={column.id} style={{ marginBottom: '0.5rem' }}>
                {column.title} / {column.slug} / {column.isPublished ? 'published' : 'draft'} / {column.authorName}
                {' '}
                <button type="button" onClick={() => setEditingColumnSlug(column.slug)} disabled={loading}>編集</button>
                {' '}
                <button type="button" onClick={() => onDeleteColumn(column.slug)} disabled={loading}>削除</button>
              </li>
            ))}
          </ul>
        )}
        <div style={{ marginTop: '1rem', padding: '1rem', border: '1px solid #ddd', borderRadius: '0.75rem' }}>
          <h3 style={{ marginTop: 0 }}>コラムプレビュー</h3>
          <p style={{ color: '#666' }}>表示順 {columnDisplayOrder} / {columnPublishAt || '即時公開または未設定'} / {columnAuthorName || '著者未設定'}</p>
          <div style={{ color: '#666', fontSize: '0.9rem' }}>{columnThumbnailLabel || 'Column'}</div>
          <h4 style={{ marginBottom: '0.5rem' }}>{columnTitle || 'タイトル未入力'}</h4>
          <p>{columnSummary || '要約未入力'}</p>
          {previewParagraphs.length === 0 ? <p style={{ color: '#666' }}>本文未入力</p> : previewParagraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        </div>
      </Section>

      <Section title="アクティビティ / 通知">
        <h3>アクティビティ履歴</h3>
        {activityLogs.length === 0 ? <p>履歴はありません。</p> : (
          <ul>
            {activityLogs.map((log) => (
              <li key={log.id}>{new Date(log.performedAt).toLocaleString('ja-JP')} / {log.action} / {log.summary || log.targetType}</li>
            ))}
          </ul>
        )}
        <h3>お知らせ作成</h3>
        <div style={{ display: 'grid', gap: '0.75rem', maxWidth: 560 }}>
          <label htmlFor="admin-announcement-title">
            タイトル
            <input id="admin-announcement-title" type="text" placeholder="タイトル" value={announcementTitle} onChange={(event) => setAnnouncementTitle(event.target.value)} />
          </label>
          <label htmlFor="admin-announcement-body">
            本文
            <textarea id="admin-announcement-body" rows={3} placeholder="本文" value={announcementBody} onChange={(event) => setAnnouncementBody(event.target.value)} />
          </label>
          <label>
            <input type="checkbox" checked={announcementPublished} onChange={(event) => setAnnouncementPublished(event.target.checked)} /> 公開する
          </label>
          <div>
            <button type="button" onClick={onCreateAnnouncement} disabled={loading}>お知らせ作成</button>
          </div>
        </div>
        <h3>MailLog</h3>
        {mailLogs.length === 0 ? <p>メール送信ログはありません。</p> : (
          <ul>
            {mailLogs.map((log) => (
              <li key={log.id}>{new Date(log.createdAt).toLocaleString('ja-JP')} / {log.mailType} / {log.toAddress} / {log.status}{log.errorMessage ? ` / ${log.errorMessage}` : ''}</li>
            ))}
          </ul>
        )}
      </Section>
    </>
  );
}
