import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import { Section } from './Section';
import { AGE_RANGE_OPTIONS, GENDER_OPTIONS, PREFECTURE_OPTIONS } from '@/lib/memberProfile';
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

type EntryState = {
  canSubmit: boolean;
  round: 1 | 2 | null;
  reason: string | null;
};

const NONE_VALUE = '__none__';

type FieldProps = {
  htmlFor?: string;
  label: string;
  children: React.ReactNode;
  className?: string;
};

function Field({ htmlFor, label, children, className }: FieldProps) {
  return (
    <div className={className ?? 'grid gap-2'}>
      <Label htmlFor={htmlFor}>{label}</Label>
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
  memberRatings: Record<string, number>;
  memberRatingComments: Record<string, string>;
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
  onSubmitEntry: () => void;
  onSaveRating: (sessionSetId: string) => void;
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
    memberRatings,
    memberRatingComments,
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
  } = props;

  const handleProfileSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading) {
      return;
    }

    onProfileUpdate();
  };

  return (
    <>
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

      <Section title="お知らせ" description="運営からの告知を確認できます。">
        {announcements.length === 0 ? <p className="text-sm text-muted-foreground">公開中のお知らせはありません。</p> : (
          <ul className="space-y-3">
            {announcements.map((announcement) => (
              <li key={announcement.id} className="rounded-xl border bg-background/60 p-4">
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
      </Section>

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

      <Section title="セッションエントリー" description="受付中のラウンドにあわせて希望曲を登録します。">
        <Alert variant={entryState.canSubmit ? 'default' : 'destructive'}>
          <AlertTitle>{entryState.canSubmit ? '入力可能です' : '現在は入力できません'}</AlertTitle>
          <AlertDescription>{entryState.canSubmit ? `現在入力できるのは Round ${entryState.round} です。` : entryState.reason}</AlertDescription>
        </Alert>
        <div className="mt-4 grid max-w-3xl gap-4 md:grid-cols-2">
          <Field label="イベント" htmlFor="member-event-id" className="md:col-span-2">
            <Select value={memberEventId || NONE_VALUE} onValueChange={(value) => setMemberEventId(value === NONE_VALUE ? '' : value)}>
              <SelectTrigger id="member-event-id" className="w-full">
                <SelectValue placeholder="イベントを選択" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE_VALUE}>イベントを選択</SelectItem>
                {sessionEvents.map((event) => (
                  <SelectItem key={event.id} value={event.id}>{event.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="参加可否" htmlFor="member-attendance-status" className="md:col-span-2">
            <Select value={memberAttendanceStatus} onValueChange={(value) => setMemberAttendanceStatus(value as AttendanceStatus)}>
              <SelectTrigger id="member-attendance-status" className="w-full">
                <SelectValue placeholder="参加可否を選択" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="attending">attending</SelectItem>
                <SelectItem value="undecided">undecided</SelectItem>
                <SelectItem value="absent">absent</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          {entryState.round === 1 && (
            <>
              <Field htmlFor="member-round1-song1" label="Round1 1曲目">
                <Input id="member-round1-song1" type="text" placeholder="Round1 1曲目" value={memberRound1Song1} onChange={(event) => setMemberRound1Song1(event.target.value)} />
              </Field>
              <Field htmlFor="member-round1-key1" label="Round1 1曲目 key">
                <Input id="member-round1-key1" type="text" placeholder="Round1 1曲目 key" value={memberRound1Key1} onChange={(event) => setMemberRound1Key1(event.target.value)} />
              </Field>
              <Field htmlFor="member-round1-song2" label="Round1 2曲目">
                <Input id="member-round1-song2" type="text" placeholder="Round1 2曲目" value={memberRound1Song2} onChange={(event) => setMemberRound1Song2(event.target.value)} />
              </Field>
              <Field htmlFor="member-round1-key2" label="Round1 2曲目 key">
                <Input id="member-round1-key2" type="text" placeholder="Round1 2曲目 key" value={memberRound1Key2} onChange={(event) => setMemberRound1Key2(event.target.value)} />
              </Field>
            </>
          )}
          {entryState.round === 2 && (
            <>
              <Field htmlFor="member-round2-song1" label="Round2 1曲目">
                <Input id="member-round2-song1" type="text" placeholder="Round2 1曲目" value={memberRound2Song1} onChange={(event) => setMemberRound2Song1(event.target.value)} />
              </Field>
              <Field htmlFor="member-round2-key1" label="Round2 1曲目 key">
                <Input id="member-round2-key1" type="text" placeholder="Round2 1曲目 key" value={memberRound2Key1} onChange={(event) => setMemberRound2Key1(event.target.value)} />
              </Field>
              <Field htmlFor="member-round2-song2" label="Round2 2曲目">
                <Input id="member-round2-song2" type="text" placeholder="Round2 2曲目" value={memberRound2Song2} onChange={(event) => setMemberRound2Song2(event.target.value)} />
              </Field>
              <Field htmlFor="member-round2-key2" label="Round2 2曲目 key">
                <Input id="member-round2-key2" type="text" placeholder="Round2 2曲目 key" value={memberRound2Key2} onChange={(event) => setMemberRound2Key2(event.target.value)} />
              </Field>
            </>
          )}
          <div className="md:col-span-2">
            <Button type="button" onClick={onSubmitEntry} disabled={loading || !entryState.canSubmit}>エントリー保存</Button>
          </div>
        </div>
      </Section>

      <Section title="自分の履歴 / レイティング" description="過去エントリーと公開済みsessionSetへの評価入力です。">
        <h3 className="font-medium">エントリー履歴</h3>
        {sessionEntries.length === 0 ? <p className="mt-3 text-sm text-muted-foreground">まだエントリーはありません。</p> : (
          <ul className="mt-3 space-y-3">
            {sessionEntries.map((entry) => (
              <li key={entry.id} className="rounded-xl border bg-background/60 p-4 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">{entry.attendanceStatus}</Badge>
                  <span className="font-medium">{entry.sessionEvent.title}</span>
                </div>
                <p className="mt-2 text-muted-foreground">{entry.requests.length} 曲 / {new Date(entry.sessionEvent.eventDate).toLocaleDateString('ja-JP')}</p>
              </li>
            ))}
          </ul>
        )}
        <Separator className="my-4" />
        <h3 className="font-medium">公開済み sessionSet</h3>
        {memberSessionSets.length === 0 ? <p className="mt-3 text-sm text-muted-foreground">評価対象の公開済み sessionSet はありません。</p> : (
          <ul className="mt-3 space-y-4">
            {memberSessionSets.map((sessionSet) => (
              <li key={sessionSet.id} className="rounded-xl border bg-background/60 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <strong className="text-base">{sessionSet.songTitle}</strong>
                  {sessionSet.key ? <Badge variant="outline">key {sessionSet.key}</Badge> : null}
                </div>
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
              </li>
            ))}
          </ul>
        )}
      </Section>
    </>
  );
}
