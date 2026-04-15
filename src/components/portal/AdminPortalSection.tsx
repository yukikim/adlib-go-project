import type { ReactNode } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
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

const NONE_VALUE = '__none__';

type FieldProps = {
  htmlFor?: string;
  label: string;
  children: ReactNode;
  description?: string;
  className?: string;
};

function Field({ htmlFor, label, children, description, className }: FieldProps) {
  return (
    <div className={cn('grid gap-2', className)}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
    </div>
  );
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
      <Section title="イベント管理" description="新規イベント作成と既存イベントの公開フローを管理します。">
        <div className="grid gap-4 xl:grid-cols-2">
          <div className="grid gap-4 rounded-xl border bg-background/60 p-4">
            <div className="space-y-1">
              <h3 className="font-medium">イベント作成</h3>
              <p className="text-sm text-muted-foreground">イベント名、会場、開催日を指定して新規イベントを作成します。</p>
            </div>
            <Field htmlFor="admin-event-title" label="イベント名">
              <Input id="admin-event-title" type="text" placeholder="イベント名" value={eventTitle} onChange={(event) => setEventTitle(event.target.value)} />
            </Field>
            <Field htmlFor="admin-event-venue" label="会場">
              <Input id="admin-event-venue" type="text" placeholder="会場" value={eventVenue} onChange={(event) => setEventVenue(event.target.value)} />
            </Field>
            <Field htmlFor="admin-event-date" label="開催日">
              <Input id="admin-event-date" type="date" value={eventDate} onChange={(event) => setEventDate(event.target.value)} />
            </Field>
            <Button type="button" onClick={onCreateEvent} disabled={loading} className="w-fit">
              イベント作成
            </Button>
          </div>

          <div className="grid gap-4 rounded-xl border bg-background/60 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                <h3 className="font-medium">イベント編集</h3>
                <p className="text-sm text-muted-foreground">募集ラウンドや公開状態、受付期間を更新できます。</p>
              </div>
              {selectedAdminEvent ? <Badge>{selectedAdminEvent.status}</Badge> : null}
            </div>

            <Field label="編集対象イベント" htmlFor="admin-event-select">
              <Select value={selectedAdminEventId || NONE_VALUE} onValueChange={(value) => setSelectedAdminEventId(value === NONE_VALUE ? '' : value)}>
                <SelectTrigger id="admin-event-select" className="w-full">
                  <SelectValue placeholder="編集対象イベントを選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE_VALUE}>編集対象イベントを選択</SelectItem>
                  {sessionEvents.map((sessionEvent) => (
                    <SelectItem key={sessionEvent.id} value={sessionEvent.id}>{sessionEvent.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            {selectedAdminEvent ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field htmlFor="admin-edit-event-title" label="イベント名" className="sm:col-span-2">
                  <Input id="admin-edit-event-title" type="text" placeholder="イベント名" value={editEventTitle} onChange={(event) => setEditEventTitle(event.target.value)} />
                </Field>
                <Field htmlFor="admin-edit-event-venue" label="会場">
                  <Input id="admin-edit-event-venue" type="text" placeholder="会場" value={editEventVenue} onChange={(event) => setEditEventVenue(event.target.value)} />
                </Field>
                <Field htmlFor="admin-edit-event-date" label="開催日">
                  <Input id="admin-edit-event-date" type="date" value={editEventDate} onChange={(event) => setEditEventDate(event.target.value)} />
                </Field>
                <Field label="ステータス" htmlFor="admin-edit-event-status">
                  <Select value={editEventStatus} onValueChange={setEditEventStatus}>
                    <SelectTrigger id="admin-edit-event-status" className="w-full">
                      <SelectValue placeholder="ステータスを選択" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">draft</SelectItem>
                      <SelectItem value="recruiting_round1">recruiting_round1</SelectItem>
                      <SelectItem value="recruiting_round2">recruiting_round2</SelectItem>
                      <SelectItem value="generating">generating</SelectItem>
                      <SelectItem value="published">published</SelectItem>
                      <SelectItem value="closed">closed</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <div className="hidden sm:block" />
                <Field htmlFor="admin-edit-round1-start" label="Round1 開始">
                  <Input id="admin-edit-round1-start" type="datetime-local" value={editRound1StartAt} onChange={(event) => setEditRound1StartAt(event.target.value)} />
                </Field>
                <Field htmlFor="admin-edit-round1-end" label="Round1 終了">
                  <Input id="admin-edit-round1-end" type="datetime-local" value={editRound1EndAt} onChange={(event) => setEditRound1EndAt(event.target.value)} />
                </Field>
                <Field htmlFor="admin-edit-round2-start" label="Round2 開始">
                  <Input id="admin-edit-round2-start" type="datetime-local" value={editRound2StartAt} onChange={(event) => setEditRound2StartAt(event.target.value)} />
                </Field>
                <Field htmlFor="admin-edit-round2-end" label="Round2 終了">
                  <Input id="admin-edit-round2-end" type="datetime-local" value={editRound2EndAt} onChange={(event) => setEditRound2EndAt(event.target.value)} />
                </Field>
                <div className="sm:col-span-2">
                  <Button type="button" onClick={onUpdateEvent} disabled={loading}>
                    イベント更新
                  </Button>
                </div>
              </div>
            ) : (
              <Alert>
                <AlertTitle>編集対象を選択してください</AlertTitle>
                <AlertDescription>登録済みイベントを選ぶと、公開ステータスと募集期間を編集できます。</AlertDescription>
              </Alert>
            )}
          </div>
        </div>
      </Section>

      <Section title="sessionSet 管理" description="生成、公開、結果確認をまとめて行います。">
        <div className="flex flex-wrap gap-3">
          <Button type="button" onClick={onGenerateSets} disabled={loading || !selectedAdminEventId}>
            sessionSet 生成
          </Button>
          <Button type="button" variant="secondary" onClick={onPublishSets} disabled={loading || !selectedAdminEventId || sessionSets.length === 0}>
            sessionSet 公開
          </Button>
          <Button type="button" variant="outline" onClick={onSignOut} disabled={loading}>
            サインアウト
          </Button>
        </div>
        <Separator className="my-4" />
        {sessionSets.length === 0 ? <p className="text-sm text-muted-foreground">まだ sessionSet はありません。</p> : (
          <ul className="grid gap-3 md:grid-cols-2">
            {sessionSets.map((sessionSet) => (
              <li key={sessionSet.id} className="rounded-xl border bg-background/60 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{sessionSet.songTitle}</p>
                    <p className="text-sm text-muted-foreground">key {sessionSet.key ?? '-'}</p>
                  </div>
                  {sessionSet.isPublished ? <Badge>公開中</Badge> : <Badge variant="outline">下書き</Badge>}
                </div>
                <div className="mt-3 grid gap-2 text-sm text-muted-foreground">
                  <p>drum {sessionSet.drum?.name ?? '-'}</p>
                  <p>bass {sessionSet.bass?.name ?? '-'}</p>
                  <p>piano {sessionSet.piano?.name ?? '-'}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
        {(generatedResult.forcedSessionSets.length > 0 || generatedResult.skippedSongs.length > 0) && (
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {generatedResult.forcedSessionSets.length > 0 && (
              <div className="rounded-xl border bg-background/60 p-4">
                <h3 className="font-medium">強制追加</h3>
                <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                  {generatedResult.forcedSessionSets.map((item) => (
                    <li key={item.songTitle}>{item.songTitle} / {item.forcedInstruments.join(', ')}</li>
                  ))}
                </ul>
              </div>
            )}
            {generatedResult.skippedSongs.length > 0 && (
              <div className="rounded-xl border bg-background/60 p-4">
                <h3 className="font-medium">未生成理由</h3>
                <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                  {generatedResult.skippedSongs.map((item) => (
                    <li key={item.songTitle}>{item.songTitle} / {item.reasons.join(' / ')}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </Section>

      <Section title="レイティング / アーカイブ" description="評価集計の確認とアーカイブ作成を行います。">
        <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-4">
            <div className="rounded-xl border bg-background/60 p-4">
              <h3 className="font-medium">レイティング集計</h3>
              {ratingSummaries.length === 0 ? <p className="mt-3 text-sm text-muted-foreground">まだ評価集計はありません。</p> : (
                <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                  {ratingSummaries.map((summary) => (
                    <li key={summary.sessionSetId}>{summary.songTitle} / 件数 {summary.ratingCount} / 平均 {summary.averageRating?.toFixed(2) ?? '-'}</li>
                  ))}
                </ul>
              )}
            </div>
            <Alert>
              <AlertTitle>アーカイブ preview</AlertTitle>
              <AlertDescription>
                {archivePreview
                  ? `参加者 ${archivePreview.participantCount} 名 / sets ${archivePreview.setCount} / 評価 ${archivePreview.ratingSummaryIncluded ? 'あり' : 'なし'}`
                  : 'preview はありません。'}
              </AlertDescription>
            </Alert>
          </div>

          <div className="grid gap-4 rounded-xl border bg-background/60 p-4">
            <div className="space-y-1">
              <h3 className="font-medium">アーカイブ作成</h3>
              <p className="text-sm text-muted-foreground">選択中のイベント状態をスナップショット保存します。</p>
            </div>
            <Field htmlFor="admin-archive-title" label="アーカイブ名">
              <Input id="admin-archive-title" type="text" placeholder="アーカイブ名" value={archiveTitle} onChange={(event) => setArchiveTitle(event.target.value)} />
            </Field>
            <Field htmlFor="admin-archive-note" label="メモ">
              <Textarea id="admin-archive-note" rows={3} placeholder="メモ" value={archiveNote} onChange={(event) => setArchiveNote(event.target.value)} />
            </Field>
            <Button type="button" onClick={onCreateArchive} disabled={loading || !selectedAdminEventId} className="w-fit">
              アーカイブ作成
            </Button>
          </div>
        </div>

        <Separator className="my-4" />
        {archives.length === 0 ? <p className="text-sm text-muted-foreground">アーカイブはありません。</p> : (
          <ul className="grid gap-3">
            {archives.map((archive) => (
              <li key={archive.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-background/60 p-4">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{archive.title}</p>
                    <Badge variant="outline">v{archive.version}</Badge>
                    {archive.deletedAt ? <Badge variant="destructive">削除済み</Badge> : null}
                  </div>
                  <p className="text-sm text-muted-foreground">{archive.sessionEventTitle} / sets {archive.setCount} / ratings {archive.ratingCount}</p>
                </div>
                {!archive.deletedAt && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button type="button" variant="outline" size="sm" disabled={loading}>削除</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>アーカイブを削除しますか</DialogTitle>
                        <DialogDescription>{archive.title} を削除すると一覧から除外されます。</DialogDescription>
                      </DialogHeader>
                      <DialogFooter showCloseButton>
                        <Button type="button" variant="destructive" onClick={() => onDeleteArchive(archive.id)} disabled={loading}>削除する</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="メンバー / 管理者管理" description="プロフィール、権限、状態をこの画面で更新できます。">
        <div className="grid gap-4 xl:grid-cols-[320px_1fr]">
          <div className="rounded-xl border bg-background/60 p-4">
            <Field htmlFor="admin-member-search" label="メンバー検索">
              <Input
                id="admin-member-search"
                type="search"
                placeholder="名前、メール、role、status で検索"
                value={memberSearchQuery}
                onChange={(event) => setMemberSearchQuery(event.target.value)}
              />
            </Field>
            {filteredMembers.length === 0 ? <p className="mt-4 text-sm text-muted-foreground">該当するメンバーはいません。</p> : (
              <ul className="mt-4 space-y-2">
                {filteredMembers.map((member) => (
                  <li key={member.id}>
                    <Button
                      type="button"
                      variant={selectedManagedMemberId === member.id ? 'default' : 'ghost'}
                      className="h-auto w-full justify-between px-3 py-3"
                      onClick={() => setSelectedManagedMemberId(member.id)}
                    >
                      <span className="text-left">
                        <span className="block font-medium">{member.displayName}</span>
                        <span className="block text-xs text-muted-foreground">{member.userAccount.email}</span>
                      </span>
                      <Badge variant={member.userAccount.status === 'active' ? 'secondary' : 'outline'}>{member.userAccount.status}</Badge>
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-xl border bg-background/60 p-4">
            <Alert>
              <AlertTitle>管理者権限について</AlertTitle>
              <AlertDescription>既存メンバーの role を admin に変更すると管理者として追加されます。管理者の編集もこの画面で行います。</AlertDescription>
            </Alert>
            {selectedManagedMemberDetail ? (
              <div className="mt-4 grid gap-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={selectedManagedMemberDetail.userAccount.role === 'admin' ? 'default' : 'secondary'}>
                    {selectedManagedMemberDetail.userAccount.role}
                  </Badge>
                  <Badge variant="outline">{selectedManagedMemberDetail.userAccount.status}</Badge>
                  <span className="text-sm text-muted-foreground">{selectedManagedMemberDetail.userAccount.email}</span>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <Field htmlFor="admin-member-display-name" label="表示名">
                    <Input id="admin-member-display-name" type="text" placeholder="表示名" value={adminMemberDisplayName} onChange={(event) => setAdminMemberDisplayName(event.target.value)} />
                  </Field>
                  <Field htmlFor="admin-member-nickname" label="ニックネーム">
                    <Input id="admin-member-nickname" type="text" placeholder="ニックネーム" value={adminMemberNickname} onChange={(event) => setAdminMemberNickname(event.target.value)} />
                  </Field>
                  <Field label="メイン楽器" htmlFor="admin-member-main-instrument">
                    <Select value={adminMemberMainInstrument} onValueChange={(value) => setAdminMemberMainInstrument(value as Instrument)}>
                      <SelectTrigger id="admin-member-main-instrument" className="w-full">
                        <SelectValue placeholder="メイン楽器を選択" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="drum">drum</SelectItem>
                        <SelectItem value="bass">bass</SelectItem>
                        <SelectItem value="piano">piano</SelectItem>
                        <SelectItem value="front">front</SelectItem>
                        <SelectItem value="vocal">vocal</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  {adminMemberMainInstrument === 'front' ? (
                    <Field htmlFor="admin-member-sub-instrument" label="演奏楽器">
                      <Input id="admin-member-sub-instrument" type="text" placeholder="演奏楽器" value={adminMemberSubInstrument} onChange={(event) => setAdminMemberSubInstrument(event.target.value)} />
                    </Field>
                  ) : (
                    <div className="hidden md:block" />
                  )}
                  <Field label="居住地域" htmlFor="admin-member-area">
                    <Select value={adminMemberArea || NONE_VALUE} onValueChange={(value) => setAdminMemberArea(value === NONE_VALUE ? '' : value)}>
                      <SelectTrigger id="admin-member-area" className="w-full">
                        <SelectValue placeholder="居住地域を選択" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NONE_VALUE}>居住地域を選択</SelectItem>
                        {PREFECTURE_OPTIONS.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="性別" htmlFor="admin-member-gender">
                    <Select value={adminMemberGender || NONE_VALUE} onValueChange={(value) => setAdminMemberGender(value === NONE_VALUE ? '' : value)}>
                      <SelectTrigger id="admin-member-gender" className="w-full">
                        <SelectValue placeholder="性別を選択" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NONE_VALUE}>性別を選択</SelectItem>
                        {GENDER_OPTIONS.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="年代" htmlFor="admin-member-age-range">
                    <Select value={adminMemberAgeRange || NONE_VALUE} onValueChange={(value) => setAdminMemberAgeRange(value === NONE_VALUE ? '' : value)}>
                      <SelectTrigger id="admin-member-age-range" className="w-full">
                        <SelectValue placeholder="年代を選択" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NONE_VALUE}>年代を選択</SelectItem>
                        {AGE_RANGE_OPTIONS.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field htmlFor="admin-member-bio" label="自己紹介" className="md:col-span-2">
                    <Textarea id="admin-member-bio" rows={4} placeholder="自己紹介" value={adminMemberBio} onChange={(event) => setAdminMemberBio(event.target.value)} />
                  </Field>
                  <Field label="ロール" htmlFor="admin-member-role">
                    <Select value={adminMemberRole} onValueChange={(value) => setAdminMemberRole(value as 'member' | 'admin')}>
                      <SelectTrigger id="admin-member-role" className="w-full">
                        <SelectValue placeholder="ロールを選択" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="member">member</SelectItem>
                        <SelectItem value="admin">admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="ステータス" htmlFor="admin-member-status">
                    <Select value={adminMemberStatus} onValueChange={(value) => setAdminMemberStatus(value as 'active' | 'suspended' | 'invited')}>
                      <SelectTrigger id="admin-member-status" className="w-full">
                        <SelectValue placeholder="ステータスを選択" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">active</SelectItem>
                        <SelectItem value="suspended">suspended</SelectItem>
                        <SelectItem value="invited">invited</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button type="button" onClick={onUpdateMember} disabled={loading}>メンバー設定保存</Button>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button type="button" variant="outline" disabled={loading || selectedManagedMemberDetail.userAccount.role === 'admin'}>メンバー削除</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>メンバーを削除しますか</DialogTitle>
                        <DialogDescription>{selectedManagedMemberDetail.displayName} のアカウントを削除します。管理者アカウントは削除できません。</DialogDescription>
                      </DialogHeader>
                      <DialogFooter showCloseButton>
                        <Button type="button" variant="destructive" onClick={onDeleteMember} disabled={loading || selectedManagedMemberDetail.userAccount.role === 'admin'}>削除する</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>

                {memberUpdateMessage && (
                  <Alert className={memberUpdateMessageTone === 'error' ? '' : 'brand-success-surface'} variant={memberUpdateMessageTone === 'error' ? 'destructive' : 'default'}>
                    <AlertTitle>{memberUpdateMessageTone === 'error' ? '更新に失敗しました' : '更新しました'}</AlertTitle>
                    <AlertDescription>{memberUpdateMessage}</AlertDescription>
                  </Alert>
                )}
                {selectedManagedMemberDetail.userAccount.role === 'admin' && <p className="text-sm text-muted-foreground">管理者アカウントは削除せず、role を member に戻して管理してください。</p>}
              </div>
            ) : <p className="mt-4 text-sm text-muted-foreground">メンバーを選択してください。</p>}
          </div>
        </div>
      </Section>

      <Section title="コラム管理" description="コラムの作成、更新、公開スケジュールの設定を行います。">
        <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="grid gap-4 rounded-xl border bg-background/60 p-4">
            <div className="flex flex-wrap items-end gap-3">
              <Field label="編集対象コラム" htmlFor="admin-column-select" className="min-w-55 flex-1">
                <Select value={editingColumnSlug || NONE_VALUE} onValueChange={(value) => setEditingColumnSlug(value === NONE_VALUE ? '' : value)}>
                  <SelectTrigger id="admin-column-select" className="w-full">
                    <SelectValue placeholder="新規コラム" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE_VALUE}>新規コラム</SelectItem>
                    {columns.map((column) => (
                      <SelectItem key={column.id} value={column.slug}>{column.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Button type="button" variant="outline" onClick={onResetColumnForm} disabled={loading}>フォームをクリア</Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field htmlFor="admin-column-title" label="タイトル" className="md:col-span-2">
                <Input id="admin-column-title" type="text" placeholder="タイトル" value={columnTitle} onChange={(event) => setColumnTitle(event.target.value)} />
              </Field>
              <Field htmlFor="admin-column-slug" label="slug（任意）">
                <Input id="admin-column-slug" type="text" placeholder="slug（任意）" value={columnSlug} onChange={(event) => setColumnSlug(event.target.value)} />
              </Field>
              <Field htmlFor="admin-column-author-name" label="著者名">
                <Input id="admin-column-author-name" type="text" placeholder="著者名" value={columnAuthorName} onChange={(event) => setColumnAuthorName(event.target.value)} />
              </Field>
              <Field htmlFor="admin-column-summary" label="要約" className="md:col-span-2">
                <Input id="admin-column-summary" type="text" placeholder="要約" value={columnSummary} onChange={(event) => setColumnSummary(event.target.value)} />
              </Field>
              <Field htmlFor="admin-column-thumbnail-label" label="サムネイルラベル">
                <Input id="admin-column-thumbnail-label" type="text" placeholder="サムネイルラベル" value={columnThumbnailLabel} onChange={(event) => setColumnThumbnailLabel(event.target.value)} />
              </Field>
              <Field htmlFor="admin-column-display-order" label="表示順">
                <Input id="admin-column-display-order" type="number" placeholder="表示順" value={columnDisplayOrder} onChange={(event) => setColumnDisplayOrder(Number(event.target.value) || 0)} />
              </Field>
              <Field htmlFor="admin-column-publish-at" label="公開日時">
                <Input id="admin-column-publish-at" type="datetime-local" value={columnPublishAt} onChange={(event) => setColumnPublishAt(event.target.value)} />
              </Field>
              <div className="flex items-center gap-3 rounded-xl border px-3 py-2 md:col-span-2">
                <Checkbox id="admin-column-published" checked={columnPublished} onCheckedChange={(checked) => setColumnPublished(checked === true)} />
                <Label htmlFor="admin-column-published">公開する</Label>
              </div>
              <Field htmlFor="admin-column-body" label="本文" className="md:col-span-2">
                <Textarea id="admin-column-body" rows={10} placeholder="本文。段落ごとに空行で区切ります。" value={columnBody} onChange={(event) => setColumnBody(event.target.value)} />
              </Field>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button type="button" onClick={onCreateColumn} disabled={loading}>コラム作成</Button>
              <Button type="button" variant="secondary" onClick={onUpdateColumn} disabled={loading || !editingColumnSlug}>コラム更新</Button>
              <Dialog>
                <DialogTrigger asChild>
                  <Button type="button" variant="outline" disabled={loading || !editingColumnSlug}>コラム削除</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>コラムを削除しますか</DialogTitle>
                    <DialogDescription>{columnTitle || editingColumnSlug || '現在のコラム'} を削除します。</DialogDescription>
                  </DialogHeader>
                  <DialogFooter showCloseButton>
                    <Button type="button" variant="destructive" onClick={() => onDeleteColumn()} disabled={loading || !editingColumnSlug}>削除する</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="rounded-xl border bg-background/60 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">{columnThumbnailLabel || 'Column'}</Badge>
                <Badge variant={columnPublished ? 'secondary' : 'outline'}>{columnPublished ? 'published' : 'draft'}</Badge>
              </div>
              <h3 className="mt-4 text-lg font-semibold">{columnTitle || 'タイトル未入力'}</h3>
              <p className="mt-2 text-sm text-muted-foreground">表示順 {columnDisplayOrder} / {columnPublishAt || '即時公開または未設定'} / {columnAuthorName || '著者未設定'}</p>
              <p className="mt-4 text-sm leading-7 text-muted-foreground">{columnSummary || '要約未入力'}</p>
              <Separator className="my-4" />
              <div className="space-y-3 text-sm leading-7">
                {previewParagraphs.length === 0 ? <p className="text-muted-foreground">本文未入力</p> : previewParagraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              </div>
            </div>

            <div className="rounded-xl border bg-background/60 p-4">
              <h3 className="font-medium">登録済みコラム</h3>
              {columns.length === 0 ? <p className="mt-3 text-sm text-muted-foreground">登録済みコラムはありません。</p> : (
                <ul className="mt-3 space-y-3">
                  {columns.map((column) => (
                    <li key={column.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-background p-3">
                      <div>
                        <p className="font-medium">{column.title}</p>
                        <p className="text-sm text-muted-foreground">{column.slug} / {column.authorName}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant={column.isPublished ? 'secondary' : 'outline'}>{column.isPublished ? 'published' : 'draft'}</Badge>
                        <Button type="button" variant="ghost" size="sm" onClick={() => setEditingColumnSlug(column.slug)} disabled={loading}>編集</Button>
                        <Button type="button" variant="outline" size="sm" onClick={() => onDeleteColumn(column.slug)} disabled={loading}>削除</Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </Section>

      <Section title="アクティビティ / 通知" description="運営の更新履歴、通知作成、送信ログを確認できます。">
        <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
          <div className="space-y-4">
            <div className="rounded-xl border bg-background/60 p-4">
              <h3 className="font-medium">アクティビティ履歴</h3>
              {activityLogs.length === 0 ? <p className="mt-3 text-sm text-muted-foreground">履歴はありません。</p> : (
                <ul className="mt-3 space-y-3">
                  {activityLogs.map((log) => (
                    <li key={log.id} className="rounded-xl border bg-background p-3 text-sm">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline">{log.action}</Badge>
                        <span className="text-muted-foreground">{new Date(log.performedAt).toLocaleString('ja-JP')}</span>
                      </div>
                      <p className="mt-2 text-muted-foreground">{log.summary || log.targetType}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="rounded-xl border bg-background/60 p-4">
              <h3 className="font-medium">MailLog</h3>
              {mailLogs.length === 0 ? <p className="mt-3 text-sm text-muted-foreground">メール送信ログはありません。</p> : (
                <ul className="mt-3 space-y-3">
                  {mailLogs.map((log) => (
                    <li key={log.id} className="rounded-xl border bg-background p-3 text-sm">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline">{log.mailType}</Badge>
                        <Badge variant={log.status === 'sent' ? 'secondary' : 'outline'}>{log.status}</Badge>
                      </div>
                      <p className="mt-2 text-muted-foreground">{new Date(log.createdAt).toLocaleString('ja-JP')} / {log.toAddress}{log.errorMessage ? ` / ${log.errorMessage}` : ''}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="grid gap-4 rounded-xl border bg-background/60 p-4">
            <div className="space-y-1">
              <h3 className="font-medium">お知らせ作成</h3>
              <p className="text-sm text-muted-foreground">メンバー向け通知を新規作成します。</p>
            </div>
            <Field htmlFor="admin-announcement-title" label="タイトル">
              <Input id="admin-announcement-title" type="text" placeholder="タイトル" value={announcementTitle} onChange={(event) => setAnnouncementTitle(event.target.value)} />
            </Field>
            <Field htmlFor="admin-announcement-body" label="本文">
              <Textarea id="admin-announcement-body" rows={5} placeholder="本文" value={announcementBody} onChange={(event) => setAnnouncementBody(event.target.value)} />
            </Field>
            <div className="flex items-center gap-3 rounded-xl border px-3 py-2">
              <Checkbox id="admin-announcement-published" checked={announcementPublished} onCheckedChange={(checked) => setAnnouncementPublished(checked === true)} />
              <Label htmlFor="admin-announcement-published">公開する</Label>
            </div>
            <Button type="button" onClick={onCreateAnnouncement} disabled={loading} className="w-fit">お知らせ作成</Button>
          </div>
        </div>
      </Section>
    </>
  );
}
