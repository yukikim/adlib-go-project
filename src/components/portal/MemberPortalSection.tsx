import { useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { SearchableCombobox } from '@/components/ui/searchable-combobox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Section } from './Section';
import { AGE_RANGE_OPTIONS, GENDER_OPTIONS, PREFECTURE_OPTIONS } from '@/lib/memberProfile';
import { getSessionEventStatusLabel, isSessionEventFinished } from '@/lib/sessionEventStatus';
import { formatEventDateTime } from '@/lib/utils';
import type {
  AnnouncementView,
  AttendanceStatus,
  AuthUser,
  Instrument,
  MemberDetailView,
  MemberListView,
  MemberRatingHistoryView,
  SessionEntryView,
  SessionEventView,
  SessionSetView,
} from './types';
import type { RunPortalActionOptions } from './utils';

type EntryState = {
  canSubmit: boolean;
  round: 1 | 2 | null;
  reason: string | null;
};

const NONE_VALUE = '__none__';

function formatSessionMemberName(name: string, isForced?: boolean) {
  return isForced ? `${name} (強制追加)` : name;
}

function formatAttendanceStatusLabel(status: AttendanceStatus) {
  switch (status) {
    case 'attending':
      return '参加';
    case 'undecided':
      return '未定';
    case 'absent':
      return '不参加';
    default:
      return status;
  }
}

type FieldProps = {
  htmlFor?: string;
  label: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
};

function Field({ htmlFor, label, description, children, className }: FieldProps) {
  return (
    <div className={className ?? 'grid gap-2'}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
      {children}
    </div>
  );
}

type MemberPortalSectionProps = {
  loading: boolean;
  currentUser: AuthUser | null;
  announcements: AnnouncementView[];
  members: MemberListView[];
  selectedMemberId: string;
  selectedMemberDetail: MemberDetailView | null;
  selectedMemberRatings: MemberRatingHistoryView[];
  sessionEvents: SessionEventView[];
  sessionEntries: SessionEntryView[];
  memberSessionSets: SessionSetView[];
  memberEventId: string;
  memberAttendanceStatus: AttendanceStatus;
  memberRound1Song1: string;
  memberRound1Song2: string;
  memberRound2Song1: string;
  memberRound2Song2: string;
  memberRound1Key1: string;
  memberRound1Key2: string;
  memberRound2Key1: string;
  memberRound2Key2: string;
  round1SongOptions: string[];
  memberRatings: Record<string, number>;
  memberRatingComments: Record<string, string>;
  memberEventComment: string;
  entryState: EntryState;
  setSelectedMemberId: (value: string) => void;
  setMemberEventId: (value: string) => void;
  setMemberAttendanceStatus: (value: AttendanceStatus) => void;
  setMemberRound1Song1: (value: string) => void;
  setMemberRound1Song2: (value: string) => void;
  setMemberRound2Song1: (value: string) => void;
  setMemberRound2Song2: (value: string) => void;
  setMemberRound1Key1: (value: string) => void;
  setMemberRound1Key2: (value: string) => void;
  setMemberRound2Key1: (value: string) => void;
  setMemberRound2Key2: (value: string) => void;
  setMemberRatings: (updater: (current: Record<string, number>) => Record<string, number>) => void;
  setMemberRatingComments: (updater: (current: Record<string, string>) => Record<string, string>) => void;
  setMemberEventComment: (value: string) => void;
  onProfileDisplayNameChange: (value: string) => void;
  onProfileMainInstrumentChange: (value: Instrument) => void;
  onProfileNicknameChange: (value: string) => void;
  onProfileGenderChange: (value: string) => void;
  onProfileAgeRangeChange: (value: string) => void;
  onProfileAreaChange: (value: string) => void;
  onProfileBioChange: (value: string) => void;
  onProfileSubInstrumentChange: (value: string) => void;
  onProfileCurrentPasswordChange: (value: string) => void;
  onProfileNewPasswordChange: (value: string) => void;
  onProfileNewPasswordConfirmChange: (value: string) => void;
  profileDisplayName: string;
  profileMainInstrument: string;
  profileNickname: string;
  profileGender: string;
  profileAgeRange: string;
  profileArea: string;
  profileBio: string;
  profileSubInstrument: string;
  profileCurrentPassword: string;
  profileNewPassword: string;
  profileNewPasswordConfirm: string;
  onProfileUpdate: () => void;
  onSignOut: () => void;
  onSubmitEntry: (options?: RunPortalActionOptions) => Promise<void>;
  onSaveRating: (sessionSetId: string) => void;
  onSaveEventComment: () => void;
};

export function MemberPortalSection(props: MemberPortalSectionProps) {
  const {
    loading,
    currentUser,
    announcements,
    members,
    selectedMemberDetail,
    selectedMemberId,
    selectedMemberRatings,
    sessionEvents,
    sessionEntries,
    memberSessionSets,
    memberEventId,
    memberAttendanceStatus,
    memberRound1Song1,
    memberRound1Song2,
    memberRound2Song1,
    memberRound2Song2,
    memberRound1Key1,
    memberRound1Key2,
    memberRound2Key1,
    memberRound2Key2,
    round1SongOptions,
    memberRatings,
    memberRatingComments,
    memberEventComment,
    entryState,
    setSelectedMemberId,
    setMemberEventId,
    setMemberAttendanceStatus,
    setMemberRound1Song1,
    setMemberRound1Song2,
    setMemberRound2Song1,
    setMemberRound2Song2,
    setMemberRound1Key1,
    setMemberRound1Key2,
    setMemberRound2Key1,
    setMemberRound2Key2,
    setMemberRatings,
    setMemberRatingComments,
    setMemberEventComment,
    onProfileDisplayNameChange,
    onProfileMainInstrumentChange,
    onProfileNicknameChange,
    onProfileGenderChange,
    onProfileAgeRangeChange,
    onProfileAreaChange,
    onProfileBioChange,
    onProfileSubInstrumentChange,
    onProfileCurrentPasswordChange,
    onProfileNewPasswordChange,
    onProfileNewPasswordConfirmChange,
    profileDisplayName,
    profileMainInstrument,
    profileNickname,
    profileGender,
    profileAgeRange,
    profileArea,
    profileBio,
    profileSubInstrument,
    profileCurrentPassword,
    profileNewPassword,
    profileNewPasswordConfirm,
    onProfileUpdate,
    onSignOut,
    onSubmitEntry,
    onSaveRating,
    onSaveEventComment,
  } = props;
  const [isRound1EntryDialogOpen, setIsRound1EntryDialogOpen] = useState(false);

  const handleProfileSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading) {
      return;
    }

    onProfileUpdate();
  };

  const selectedMemberEvent = sessionEvents.find((event) => event.id === memberEventId) ?? null;
  const visibleSessionEvents = sessionEvents.filter((event) => event.isVisibleToMembers);
  const scheduledEvents = visibleSessionEvents.filter((event) => !isSessionEventFinished(event.status));
  const closedEvents = visibleSessionEvents.filter((event) => isSessionEventFinished(event.status));
  const round2CandidateSongs = selectedMemberEvent?.round2CandidateSongs ?? [];
  const round2CandidateListId = 'member-round2-song-candidates';
  const canPostEventComment = selectedMemberEvent?.status === 'published';
  const canRateSelectedEvent = selectedMemberEvent?.status === 'rating';
  const isVocalMember = currentUser?.memberProfile?.mainInstrument === 'vocal';

  const announcedEvents = sessionEvents.filter((event) => event.status === 'announced');
  const round1RecruitingEvents = sessionEvents.filter((event) => event.status === 'recruiting_round1');
  const round2RecruitingEvents = sessionEvents.filter((event) => event.status === 'recruiting_round2');
  const publishedEvents = sessionEvents.filter((event) => event.status === 'published');
  const ratingEvents = sessionEvents.filter((event) => event.status === 'rating');
  const completedEvents = sessionEvents.filter((event) => event.status === 'closed');

  // console.log('announcedEvents:', announcedEvents);
  // console.log('round1RecruitingEvents:', round1RecruitingEvents);
  // console.log('round2RecruitingEvents:', round2RecruitingEvents);
  // console.log('publishedEvents:', publishedEvents);
  // console.log('ratingEvents:', ratingEvents);
  // console.log('completedEvents:', completedEvents);

  const selectedRound1Event = round1RecruitingEvents.find((event) => event.id === memberEventId) ?? null;

  const handleRound1EntryOpen = (eventId: string) => {
    setMemberEventId(eventId);
    setIsRound1EntryDialogOpen(true);
  };

  const handleRound1EntrySubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading) {
      return;
    }

    await onSubmitEntry({
      onSuccess: () => {
        setIsRound1EntryDialogOpen(false);
      },
    });
  };

  return (
    <>


      <div className="text-lg font-semibold text-secondary mb-4 px-4">{profileDisplayName}</div>
      <Card className="rounded-xl border bg-secondary/80 p-4 border-none">
        <CardTitle className="text-2xl font-semibold text-on-secondary">お知らせ</CardTitle>
          <CardDescription className="text-on-secondary">運営からのお知らせです。</CardDescription>

        {announcements.length === 0 ? <p className="text-sm text-on-secondary">公開中のお知らせはありません。</p> : (
          <ul className="space-y-3">
            {announcements.map((announcement) => (
              <li key={announcement.id} className="rounded-xl border bg-neutral-100 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">お知らせ</Badge>
                  {announcement.publishedAt ? <span className="text-sm text-muted-foreground">{new Date(announcement.publishedAt).toLocaleDateString('ja-JP')}</span> : null}
                </div>
                <strong className="mt-3 block text-base">{announcement.title}</strong>
                <div className="mt-2 text-sm leading-7 text-muted-foreground">{announcement.body}</div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card id="event-info" className="rounded-xl border bg-primary p-2 my-4">
        <CardTitle className="text-2xl font-semibold text-on-primary">イベント情報</CardTitle>

        <Card className="border p-2 bg-on-primary/5">
          <CardTitle className="text-sm font-semibold text-on-primary bg-neutral-50 px-4 py-1">開催予定イベント</CardTitle>
          <CardDescription className={announcedEvents.length === 0 ? 'hidden' : ''}>開催を予定しているベントです。<br />※日時は変更される場合があります。</CardDescription>

          {announcedEvents.length === 0 ? <p className="text-sm text-gray-50 bg-gray-400 p-2">表示できる開催予定イベントはありません。</p> : (
            <ul className="space-y-3">
              {announcedEvents.map((event) => (
                <li key={event.id} className="rounded-xl border bg-background/60 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <strong className="text-sm text-slate-600">{event.title}</strong>
                    <Badge variant="outline">{getSessionEventStatusLabel(event.status)}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{formatEventDateTime(event.eventDate)} / {event.venue}</p>
                  {event.entryReason ? <p className="mt-2 text-sm text-muted-foreground">{event.entryReason}</p> : null}
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="border p-2 bg-orange-100">
          <CardTitle className="text-sm font-semibold text-orange-600 bg-neutral-50 px-4 py-1">参加募集中イベント(ラウンド1)</CardTitle>
          <CardDescription className={round1RecruitingEvents.length === 0 ? 'hidden' : ''}>参加可否とリクエスト曲を募っています。</CardDescription>
          {round1RecruitingEvents.length === 0 ? <p className="text-sm text-gray-50 bg-gray-400 p-2">表示できる参加募集中イベントはありません。</p> : (
            <ul className="space-y-3">
              {round1RecruitingEvents.map((event) => (
                <li key={event.id} className="rounded-xl border bg-background/20 p-4">
                  {(() => {
                    const eventEntry = sessionEntries.find((entry) => entry.sessionEventId === event.id);
                    const round1Requests = (eventEntry?.requests ?? []).filter((request) => request.round === 1).sort((a, b) => a.priority - b.priority);

                    return (
                      <>
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <strong className="text-sm text-orange-600">{event.title}</strong>
                              <Badge variant="outline">{getSessionEventStatusLabel(event.status)}</Badge>
                              <Badge variant={eventEntry ? 'default' : 'secondary'}>エントリー: {eventEntry ? '済' : '未'}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{formatEventDateTime(event.eventDate)} / {event.venue}</p>
                            {event.entryReason ? <p className="text-sm text-muted-foreground">{event.entryReason}</p> : null}
                            {eventEntry ? (
                              <div className="rounded-lg border bg-background/70 p-3 text-sm">
                                <p className="font-medium text-foreground">参加可否: {formatAttendanceStatusLabel(eventEntry.attendanceStatus)}</p>
                                {round1Requests.length === 0 ? (
                                  <p className="mt-1 text-muted-foreground">リクエスト曲は未登録です。</p>
                                ) : (
                                  <ul className="mt-2 space-y-1 text-muted-foreground">
                                    {round1Requests.map((request) => (
                                      <li key={request.id}>第{request.priority}希望: {request.songTitleSnapshot}{request.keyName ? ` / key ${request.keyName}` : ''}</li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            ) : null}
                          </div>
                          <Button type="button" size="sm" onClick={() => handleRound1EntryOpen(event.id)} disabled={loading}>
                            エントリー
                          </Button>
                        </div>
                      </>
                    );
                  })()}
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Dialog open={isRound1EntryDialogOpen} onOpenChange={setIsRound1EntryDialogOpen}>
          <DialogContent className="sm:max-w-2xl bg-neutral-200">
            <DialogHeader>
              <DialogTitle>{selectedRound1Event ? `${selectedRound1Event.title} のエントリー` : 'ラウンド1エントリー'}</DialogTitle>
              <DialogDescription>
                参加可否とラウンド1のリクエスト2曲を登録できます。募集期間中は何度でも修正できます。
              </DialogDescription>
            </DialogHeader>

            {!selectedRound1Event ? (
              <Alert variant="destructive">
                <AlertTitle>イベントが選択されていません</AlertTitle>
                <AlertDescription>参加募集中イベントの「エントリー」ボタンから開いてください。</AlertDescription>
              </Alert>
            ) : (
              <form className="grid gap-4" onSubmit={handleRound1EntrySubmit}>
                <Alert variant={entryState.canSubmit ? 'default' : 'destructive'}>
                  <AlertTitle>{entryState.canSubmit ? '入力可能です' : '現在は入力できません'}</AlertTitle>
                  <AlertDescription>{entryState.canSubmit ? 'ラウンド1の募集内容を保存できます。' : entryState.reason}</AlertDescription>
                </Alert>

                <Field label="参加可否" htmlFor="member-round1-attendance-status">
                  <Select value={memberAttendanceStatus} onValueChange={(value) => setMemberAttendanceStatus(value as AttendanceStatus)}>
                    <SelectTrigger id="member-round1-attendance-status" className="w-full bg-background">
                      <SelectValue placeholder="参加可否を選択" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="attending">参加</SelectItem>
                      <SelectItem value="undecided">未定</SelectItem>
                      <SelectItem value="absent">不参加</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>

                <div className={isVocalMember ? 'grid gap-4 md:grid-cols-2' : 'grid gap-4'}>
                  <Field htmlFor="member-round1-song1" label="リクエスト1曲目" description="黒本1 / 黒本2 の曲名を入力すると候補から選択できます。">
                    <SearchableCombobox
                      id="member-round1-song1"
                      value={memberRound1Song1}
                      onValueChange={setMemberRound1Song1}
                      options={round1SongOptions}
                      placeholder="曲名を選択"
                      searchPlaceholder="黒本1 / 黒本2 から検索"
                      emptyMessage="一致する曲がありません。"
                    />
                  </Field>
                  {isVocalMember ? (
                    <Field htmlFor="member-round1-key1" label="1曲目 key">
                      <Input id="member-round1-key1" type="text" placeholder="例: F, Bb" value={memberRound1Key1} onChange={(event) => setMemberRound1Key1(event.target.value)} className="bg-background" />
                    </Field>
                  ) : null}
                </div>

                <div className={isVocalMember ? 'grid gap-4 md:grid-cols-2' : 'grid gap-4'}>
                  <Field htmlFor="member-round1-song2" label="リクエスト2曲目" description="未入力でも保存できます。">
                    <SearchableCombobox
                      id="member-round1-song2"
                      value={memberRound1Song2}
                      onValueChange={setMemberRound1Song2}
                      options={round1SongOptions}
                      placeholder="曲名を選択"
                      searchPlaceholder="黒本1 / 黒本2 から検索"
                      emptyMessage="一致する曲がありません。"
                    />
                  </Field>
                  {isVocalMember ? (
                    <Field htmlFor="member-round1-key2" label="2曲目 key">
                      <Input id="member-round1-key2" type="text" placeholder="例: Eb, G" value={memberRound1Key2} onChange={(event) => setMemberRound1Key2(event.target.value)} className="bg-background" />
                    </Field>
                  ) : null}
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsRound1EntryDialogOpen(false)} disabled={loading}>閉じる</Button>
                  <Button type="submit" disabled={loading || !entryState.canSubmit}>保存</Button>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>

        <Card className="border p-2 bg-pink-100">
          <CardTitle className="text-sm font-semibold text-pink-600 bg-neutral-50 px-4 py-1">追加リクエスト曲募集中イベント(ラウンド2)</CardTitle>
          <CardDescription className={round2RecruitingEvents.length === 0 ? 'hidden' : ''}>ラウンド1のリクエスト曲に加えて追加のリクエスト曲を募っています。</CardDescription>
          {round2RecruitingEvents.length === 0 ? <p className="text-sm text-gray-50 bg-gray-400 p-2">表示できる追加リクエスト曲募集中イベントはありません。</p> : (
            <ul className="space-y-3">
              {round2RecruitingEvents.map((event) => (
                <li key={event.id} className="rounded-xl border bg-background/20 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <strong className="text-sm text-pink-600">{event.title}</strong>
                    <Badge variant="outline">{getSessionEventStatusLabel(event.status)}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{formatEventDateTime(event.eventDate)} / {event.venue}</p>
                  {event.entryReason ? <p className="mt-2 text-sm text-muted-foreground">{event.entryReason}</p> : null}
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="border p-2 bg-sky-100">
          <CardTitle className="text-sm font-semibold text-sky-600 bg-neutral-50 px-4 py-1">セッションセット確定イベント(公開)</CardTitle>
          <CardDescription className={publishedEvents.length === 0 ? 'hidden' : ''}>演奏曲とメンバーが確定したイベントです。</CardDescription>
          {publishedEvents.length === 0 ? <p className="text-sm text-gray-50 bg-gray-400 p-2">表示できる確定イベントはありません。</p> : (
            <ul className="space-y-3">
              {publishedEvents.map((event) => (
                <li key={event.id} className="rounded-xl border bg-background/20 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <strong className="text-sm text-sky-600">{event.title}</strong>
                    <Badge variant="outline">{getSessionEventStatusLabel(event.status)}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{formatEventDateTime(event.eventDate)} / {event.venue}</p>
                  {event.entryReason ? <p className="mt-2 text-sm text-muted-foreground">{event.entryReason}</p> : null}
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="border p-2 bg-emerald-50">
          <CardTitle className="text-sm font-semibold text-emerald-600 bg-neutral-50 px-4 py-1">レイティング受付中イベント</CardTitle>
          <CardDescription className={ratingEvents.length === 0 ? 'hidden' : ''}>レイティングや感想をコメント出来るイベントです。</CardDescription>
          {ratingEvents.length === 0 ? <p className="text-sm text-gray-50 bg-gray-400 p-2">表示できるレイティング受付中イベントはありません。</p> : (
            <ul className="space-y-3">
              {ratingEvents.map((event) => (
                <li key={event.id} className="rounded-xl border bg-background/20 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <strong className="text-sm text-emerald-600">{event.title}</strong>
                    <Badge variant="outline">{getSessionEventStatusLabel(event.status)}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{formatEventDateTime(event.eventDate)} / {event.venue}</p>
                  {event.entryReason ? <p className="mt-2 text-sm text-muted-foreground">{event.entryReason}</p> : null}
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="border p-2">
          <CardTitle className="text-sm font-semibold text-neutral-600 bg-neutral-50 px-4 py-1">終了イベント</CardTitle>
          <CardDescription className={completedEvents.length === 0 ? 'hidden' : ''}>既に終了したイベントです。</CardDescription>
          {completedEvents.length === 0 ? <p className="text-sm text-gray-50 bg-gray-400 p-2">表示できる終了イベントはありません。</p> : (
            <ul className="space-y-3">
              {completedEvents.map((event) => (
                <li key={event.id} className="rounded-xl border bg-background/20 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <strong className="text-sm text-neutral-600">{event.title}</strong>
                    <Badge variant="outline">{getSessionEventStatusLabel(event.status)}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{formatEventDateTime(event.eventDate)} / {event.venue}</p>
                  {event.entryReason ? <p className="mt-2 text-sm text-muted-foreground">{event.entryReason}</p> : null}
                </li>
              ))}
            </ul>
          )}
        </Card>

      </Card>

<div className="hidden">
      <Section title="メンバー一覧 / 詳細" description="参加メンバーのプロフィールと最近の評価履歴を確認できます。">
        <div className="grid gap-4 xl:grid-cols-[320px_1fr]">
          <ul className="space-y-2">
            {members.map((member) => (
              <li key={member.id}>
                <Button type="button" variant={selectedMemberId === member.id ? 'default' : 'ghost'} className="h-auto w-full justify-between px-3 py-3" onClick={() => setSelectedMemberId(member.id)}>
                  <span className="text-left">
                    <span className="block font-medium">{member.displayName}</span>
                    <span className="block text-xs text-muted-foreground">{member.mainInstrument}</span>
                  </span>
                  <Badge variant="outline">{member.entryCount}件</Badge>
                </Button>
              </li>
            ))}
          </ul>
          <div>
            {selectedMemberDetail ? (
              <div className="rounded-xl border bg-background/60 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-semibold">{selectedMemberDetail.displayName}</h3>
                  <Badge variant="outline">{selectedMemberDetail.mainInstrument}</Badge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{selectedMemberDetail.mainInstrument === 'front' && selectedMemberDetail.subInstrument ? `演奏楽器 ${selectedMemberDetail.subInstrument}` : 'サブ楽器未設定'}</p>
                <p className="mt-2 text-sm text-muted-foreground">{selectedMemberDetail.area || '地域未設定'} / {selectedMemberDetail.gender || '性別未設定'} / {selectedMemberDetail.ageRange || '年代未設定'}</p>
                <p className="mt-4 text-sm leading-7">{selectedMemberDetail.bio || '自己紹介未設定'}</p>
                <p className="mt-4 text-sm text-muted-foreground">活動件数: {selectedMemberDetail.sessionEntries.length}</p>
                <Separator className="my-4" />
                <h4 className="font-medium">最近の評価</h4>
                {selectedMemberRatings.length === 0 ? <p className="mt-3 text-sm text-muted-foreground">評価履歴はありません。</p> : (
                  <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                    {selectedMemberRatings.slice(0, 5).map((rating) => (
                      <li key={rating.id}>{rating.sessionEvent.title} / {rating.sessionSet.title} / {rating.rating} 星</li>
                    ))}
                  </ul>
                )}
              </div>
            ) : <p className="text-sm text-muted-foreground">メンバーを選択してください。</p>}
          </div>
        </div>
      </Section>
      </div>



      <Section title="セッションエントリー" description="ラウンド1は上のイベント一覧から、ラウンド2はここから追加リクエストを登録します。">
        <div className="mt-4 grid max-w-3xl gap-4 md:grid-cols-2">
          <Field label="イベント" htmlFor="member-event-id" className="md:col-span-2">
            <Select value={memberEventId || NONE_VALUE} onValueChange={(value) => setMemberEventId(value === NONE_VALUE ? '' : value)}>
              <SelectTrigger id="member-event-id" className="w-full">
                <SelectValue placeholder="イベントを選択" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE_VALUE}>イベントを選択</SelectItem>
                {scheduledEvents.map((event) => (
                  <SelectItem key={event.id} value={event.id}>{event.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          {entryState.round === 1 ? (
            <div className="md:col-span-2">
              <Alert>
                <AlertTitle>ラウンド1は上の一覧から登録します</AlertTitle>
                <AlertDescription>
                  参加募集中イベント(ラウンド1) の「エントリー」ボタンからモーダルを開いてください。募集期間中は何度でも修正できます。
                </AlertDescription>
              </Alert>
            </div>
          ) : null}
          {entryState.round === 2 ? (
            <>
              <div className="md:col-span-2">
                <Alert variant={entryState.canSubmit ? 'default' : 'destructive'}>
                  <AlertTitle>{entryState.canSubmit ? '入力可能です' : '現在は入力できません'}</AlertTitle>
                  <AlertDescription>{entryState.canSubmit ? '現在入力できるのは Round 2 です。' : entryState.reason}</AlertDescription>
                </Alert>
              </div>
              <Field label="参加可否" htmlFor="member-attendance-status" className="md:col-span-2">
                <Select value={memberAttendanceStatus} onValueChange={(value) => setMemberAttendanceStatus(value as AttendanceStatus)}>
                  <SelectTrigger id="member-attendance-status" className="w-full">
                    <SelectValue placeholder="参加可否を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="attending">参加</SelectItem>
                    <SelectItem value="undecided">未定</SelectItem>
                    <SelectItem value="absent">不参加</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            <>
              <Field htmlFor="member-round2-song1" label="Round2 1曲目" description={round2CandidateSongs.length > 0 ? '候補曲リストから選択してください。' : '候補曲はまだ生成されていません。'}>
                <Input id="member-round2-song1" type="text" list={round2CandidateListId} placeholder="Round2 1曲目" value={memberRound2Song1} onChange={(event) => setMemberRound2Song1(event.target.value)} />
              </Field>
              <Field htmlFor="member-round2-key1" label="Round2 1曲目 key">
                <Input id="member-round2-key1" type="text" placeholder="Round2 1曲目 key" value={memberRound2Key1} onChange={(event) => setMemberRound2Key1(event.target.value)} />
              </Field>
              <Field htmlFor="member-round2-song2" label="Round2 2曲目" description={round2CandidateSongs.length > 0 ? '候補曲リストから選択してください。' : '候補曲はまだ生成されていません。'}>
                <Input id="member-round2-song2" type="text" list={round2CandidateListId} placeholder="Round2 2曲目" value={memberRound2Song2} onChange={(event) => setMemberRound2Song2(event.target.value)} />
              </Field>
              <Field htmlFor="member-round2-key2" label="Round2 2曲目 key">
                <Input id="member-round2-key2" type="text" placeholder="Round2 2曲目 key" value={memberRound2Key2} onChange={(event) => setMemberRound2Key2(event.target.value)} />
              </Field>
              <datalist id={round2CandidateListId}>
                {round2CandidateSongs.map((songTitle) => (
                  <option key={songTitle} value={songTitle} />
                ))}
              </datalist>
              {round2CandidateSongs.length > 0 ? (
                <div className="md:col-span-2 rounded-xl border bg-background/60 p-4">
                  <p className="text-sm font-medium">Round2 候補曲</p>
                  <p className="mt-1 text-sm text-muted-foreground">Round1 の希望曲を名寄せして重複を除いた候補です。</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {round2CandidateSongs.map((songTitle) => (
                      <Badge key={songTitle} variant="outline">{songTitle}</Badge>
                    ))}
                  </div>
                </div>
              ) : null}
            </>
              <div className="md:col-span-2">
                <Button type="button" onClick={() => { void onSubmitEntry(); }} disabled={loading || !entryState.canSubmit}>エントリー保存</Button>
              </div>
            </>
          ) : null}
        </div>
      </Section>

      <Section title="自分の履歴 / 公開情報" description="過去エントリー、公開中イベントのコメント、レイティング、終了イベントの結果を確認できます。">
        <h3 className="font-medium">エントリー履歴</h3>
        {sessionEntries.length === 0 ? <p className="mt-3 text-sm text-muted-foreground">まだエントリーはありません。</p> : (
          <ul className="mt-3 space-y-3">
            {sessionEntries.map((entry) => (
              <li key={entry.id} className="rounded-xl border bg-background/60 p-4 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">{entry.attendanceStatus}</Badge>
                  <span className="font-medium">{entry.sessionEvent.title}</span>
                </div>
                <p className="mt-2 text-muted-foreground">{entry.requests.length} 曲 / {formatEventDateTime(entry.sessionEvent.eventDate)}</p>
              </li>
            ))}
          </ul>
        )}
        <Separator className="my-4" />
        <h3 className="font-medium">選択中イベントの公開済み sessionSet</h3>
        {selectedMemberEvent ? (
          <div className="mt-3 rounded-xl border bg-background/60 p-4 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <strong>{selectedMemberEvent.title}</strong>
              <Badge variant="outline">{getSessionEventStatusLabel(selectedMemberEvent.status)}</Badge>
            </div>
            <p className="mt-2 text-muted-foreground">{formatEventDateTime(selectedMemberEvent.eventDate)} / {selectedMemberEvent.venue}</p>
          </div>
        ) : null}
        {memberSessionSets.length === 0 ? <p className="mt-3 text-sm text-muted-foreground">評価対象の公開済み sessionSet はありません。</p> : (
          <ul className="mt-3 space-y-4">
            {memberSessionSets.map((sessionSet) => (
              <li key={sessionSet.id} className="rounded-xl border bg-background/60 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <strong className="text-base">{sessionSet.songTitle}</strong>
                  {sessionSet.key ? <Badge variant="outline">key {sessionSet.key}</Badge> : null}
                </div>
                <div className="mt-3 grid gap-2 text-sm text-muted-foreground">
                  <p>drum {sessionSet.drum ? formatSessionMemberName(sessionSet.drum.name, sessionSet.drum.isForced) : '-'}</p>
                  <p>bass {sessionSet.bass ? formatSessionMemberName(sessionSet.bass.name, sessionSet.bass.isForced) : '-'}</p>
                  <p>piano {sessionSet.piano ? formatSessionMemberName(sessionSet.piano.name, sessionSet.piano.isForced) : '-'}</p>
                  <p>
                    front {sessionSet.front?.length
                      ? sessionSet.front.map((member) => {
                        const baseName = formatSessionMemberName(member.name, member.isForced);
                        return member.subInstrument ? `${baseName} (${member.subInstrument})` : baseName;
                      }).join(', ')
                      : '-'}
                  </p>
                  <p>
                    vocal {sessionSet.vocal?.length
                      ? sessionSet.vocal.map((member) => {
                        const baseName = formatSessionMemberName(member.name, member.isForced);
                        return sessionSet.key ? `${baseName} (key ${sessionSet.key})` : baseName;
                      }).join(', ')
                      : '-'}
                  </p>
                </div>
                {canRateSelectedEvent ? (
                  <div className="mt-4 grid max-w-xl gap-3 md:grid-cols-[180px_1fr]">
                    <Field label="評価" htmlFor={`member-rating-${sessionSet.id}`}>
                      <Select value={String(memberRatings[sessionSet.id] ?? NONE_VALUE)} onValueChange={(value) => setMemberRatings((current) => ({ ...current, [sessionSet.id]: value === NONE_VALUE ? 0 : Number(value) }))}>
                        <SelectTrigger id={`member-rating-${sessionSet.id}`} className="w-full">
                          <SelectValue placeholder="星を選択" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={NONE_VALUE}>星を選択</SelectItem>
                          <SelectItem value="1">1</SelectItem>
                          <SelectItem value="2">2</SelectItem>
                          <SelectItem value="3">3</SelectItem>
                          <SelectItem value="4">4</SelectItem>
                          <SelectItem value="5">5</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field label="コメント" htmlFor={`member-rating-comment-${sessionSet.id}`}>
                      <Textarea id={`member-rating-comment-${sessionSet.id}`} rows={3} placeholder="コメント" value={memberRatingComments[sessionSet.id] ?? ''} onChange={(event) => setMemberRatingComments((current) => ({ ...current, [sessionSet.id]: event.target.value }))} />
                    </Field>
                    <div className="md:col-span-2">
                      <Button type="button" onClick={() => onSaveRating(sessionSet.id)} disabled={loading || !memberRatings[sessionSet.id]}>評価を保存</Button>
                    </div>
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-muted-foreground">
                    {selectedMemberEvent?.status === 'published'
                      ? '現在は sessionSet 公開中です。レイティング開始後に各曲を評価できます。'
                      : 'このイベントではレイティング入力を受け付けていません。'}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
        <Separator className="my-4" />
        <h3 className="font-medium">イベントコメント</h3>
        {selectedMemberEvent?.comments?.length ? (
          <ul className="mt-3 space-y-3">
            {selectedMemberEvent.comments.map((comment) => (
              <li key={comment.id} className="rounded-xl border bg-background/60 p-4 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">{comment.memberDisplayName}</Badge>
                  <span className="text-muted-foreground">{new Date(comment.createdAt).toLocaleString('ja-JP')}</span>
                </div>
                <p className="mt-2 leading-7">{comment.body}</p>
              </li>
            ))}
          </ul>
        ) : <p className="mt-3 text-sm text-muted-foreground">イベントコメントはまだありません。</p>}
        {canPostEventComment ? (
          <div className="mt-4 grid max-w-3xl gap-3">
            <Field htmlFor="member-event-comment" label="公開イベントへのコメント">
              <Textarea id="member-event-comment" rows={4} placeholder="公開された sessionSet やイベント全体へのコメントを入力してください" value={memberEventComment} onChange={(event) => setMemberEventComment(event.target.value)} />
            </Field>
            <div>
              <Button type="button" onClick={onSaveEventComment} disabled={loading || !memberEventComment.trim()}>コメントを投稿</Button>
            </div>
          </div>
        ) : null}
        <Separator className="my-4" />
        <h3 className="font-medium">終了イベント</h3>
        {closedEvents.length === 0 ? <p className="mt-3 text-sm text-muted-foreground">終了イベントはまだありません。</p> : (
          <div className="mt-3 space-y-3">
            {closedEvents.map((event) => (
              <details key={event.id} className="rounded-xl border bg-background/60 p-4">
                <summary className="cursor-pointer list-none">
                  <div className="flex flex-wrap items-center gap-2">
                    <strong>{event.title}</strong>
                    <Badge variant="outline">{formatEventDateTime(event.eventDate)}</Badge>
                  </div>
                </summary>
                <div className="mt-4 space-y-3 text-sm">
                  <p className="text-muted-foreground">{event.venue}</p>
                  {!event.ratingSummaries?.length ? <p className="text-muted-foreground">レイティング結果はまだありません。</p> : (
                    <ul className="space-y-2">
                      {event.ratingSummaries.map((summary) => (
                        <li key={summary.sessionSetId} className="rounded-lg border bg-background/70 p-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="font-medium">{summary.songTitle}</span>
                            <span className="text-muted-foreground">{summary.ratingCount} 件 / 平均 {summary.averageRating ? summary.averageRating.toFixed(1) : '-'}</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </details>
            ))}
          </div>
        )}
      </Section>
      <Section title="プロフィール" description="プロフィール更新とパスワード変更をこの画面で行います。">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Badge variant="outline">{currentUser?.role ?? 'member'}</Badge>
          <span className="text-sm text-muted-foreground">{currentUser?.email}</span>
        </div>
        <form className="grid max-w-3xl gap-4 md:grid-cols-2" onSubmit={handleProfileSubmit}>
          <Field htmlFor="member-profile-display-name" label="表示名" className="md:col-span-2">
            <Input id="member-profile-display-name" type="text" placeholder="表示名" value={profileDisplayName} onChange={(event) => onProfileDisplayNameChange(event.target.value)} />
          </Field>
          <Field label="メイン楽器" htmlFor="member-profile-main-instrument">
            <Select value={profileMainInstrument} onValueChange={(value) => onProfileMainInstrumentChange(value as Instrument)}>
              <SelectTrigger id="member-profile-main-instrument" className="w-full">
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
          <Field htmlFor="member-profile-nickname" label="ニックネーム">
            <Input id="member-profile-nickname" type="text" placeholder="ニックネーム" value={profileNickname} onChange={(event) => onProfileNicknameChange(event.target.value)} />
          </Field>
          {profileMainInstrument === 'front' ? (
            <Field htmlFor="member-profile-sub-instrument" label="演奏楽器">
              <Input id="member-profile-sub-instrument" type="text" placeholder="演奏楽器" value={profileSubInstrument} onChange={(event) => onProfileSubInstrumentChange(event.target.value)} />
            </Field>
          ) : (
            <div className="hidden md:block" />
          )}
          <Field label="居住地域" htmlFor="member-profile-area">
            <Select value={profileArea || NONE_VALUE} onValueChange={(value) => onProfileAreaChange(value === NONE_VALUE ? '' : value)}>
              <SelectTrigger id="member-profile-area" className="w-full">
                <SelectValue placeholder="居住地域を選択" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE_VALUE}>居住地域を選択</SelectItem>
                {PREFECTURE_OPTIONS.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="性別" htmlFor="member-profile-gender">
            <Select value={profileGender || NONE_VALUE} onValueChange={(value) => onProfileGenderChange(value === NONE_VALUE ? '' : value)}>
              <SelectTrigger id="member-profile-gender" className="w-full">
                <SelectValue placeholder="性別を選択" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE_VALUE}>性別を選択</SelectItem>
                {GENDER_OPTIONS.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="年代" htmlFor="member-profile-age-range">
            <Select value={profileAgeRange || NONE_VALUE} onValueChange={(value) => onProfileAgeRangeChange(value === NONE_VALUE ? '' : value)}>
              <SelectTrigger id="member-profile-age-range" className="w-full">
                <SelectValue placeholder="年代を選択" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE_VALUE}>年代を選択</SelectItem>
                {AGE_RANGE_OPTIONS.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field htmlFor="member-profile-bio" label="自己紹介" className="md:col-span-2">
            <Textarea id="member-profile-bio" rows={4} placeholder="自己紹介" value={profileBio} onChange={(event) => onProfileBioChange(event.target.value)} />
          </Field>
          <Field htmlFor="member-profile-current-password" label="現在のパスワード">
            <Input id="member-profile-current-password" type="password" autoComplete="current-password" placeholder="現在のパスワード（変更時のみ）" value={profileCurrentPassword} onChange={(event) => onProfileCurrentPasswordChange(event.target.value)} />
          </Field>
          <Field htmlFor="member-profile-new-password" label="新しいパスワード">
            <Input id="member-profile-new-password" type="password" autoComplete="new-password" placeholder="新しいパスワード（変更時のみ）" value={profileNewPassword} onChange={(event) => onProfileNewPasswordChange(event.target.value)} />
          </Field>
          <Field htmlFor="member-profile-new-password-confirm" label="新しいパスワード確認" className="md:col-span-2">
            <Input id="member-profile-new-password-confirm" type="password" autoComplete="new-password" placeholder="新しいパスワード確認" value={profileNewPasswordConfirm} onChange={(event) => onProfileNewPasswordConfirmChange(event.target.value)} />
          </Field>
          <div className="flex flex-wrap gap-3 md:col-span-2">
            <Button type="submit" disabled={loading}>プロフィール保存</Button>
            <Button type="button" variant="outline" onClick={onSignOut} disabled={loading}>サインアウト</Button>
          </div>
        </form>
      </Section>
    </>
  );
}
