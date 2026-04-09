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

  return (
    <>
      <Section title="プロフィール">
        <p>{currentUser?.email}</p>
        <div style={{ display: 'grid', gap: '0.75rem', maxWidth: 560 }}>
          <input type="text" placeholder="表示名" value={profileDisplayName} onChange={(event) => onProfileDisplayNameChange(event.target.value)} />
          <select value={profileMainInstrument} onChange={(event) => onProfileMainInstrumentChange(event.target.value as Instrument)}>
            <option value="drum">drum</option>
            <option value="bass">bass</option>
            <option value="piano">piano</option>
            <option value="front">front</option>
            <option value="vocal">vocal</option>
          </select>
          <input type="text" placeholder="ニックネーム" value={profileNickname} onChange={(event) => onProfileNicknameChange(event.target.value)} />
          {profileMainInstrument !== 'vocal' && <input type="text" placeholder="サブ楽器（任意）" value={profileSubInstrument} onChange={(event) => onProfileSubInstrumentChange(event.target.value)} />}
          <select value={profileArea} onChange={(event) => onProfileAreaChange(event.target.value)}>
            <option value="">居住地域を選択</option>
            {PREFECTURE_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
          <select value={profileGender} onChange={(event) => onProfileGenderChange(event.target.value)}>
            <option value="">性別を選択</option>
            {GENDER_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
          <select value={profileAgeRange} onChange={(event) => onProfileAgeRangeChange(event.target.value)}>
            <option value="">年代を選択</option>
            {AGE_RANGE_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
          <textarea rows={3} placeholder="自己紹介" value={profileBio} onChange={(event) => onProfileBioChange(event.target.value)} />
          <input type="password" placeholder="現在のパスワード（変更時のみ）" value={profileCurrentPassword} onChange={(event) => onProfileCurrentPasswordChange(event.target.value)} />
          <input type="password" placeholder="新しいパスワード（変更時のみ）" value={profileNewPassword} onChange={(event) => onProfileNewPasswordChange(event.target.value)} />
          <input type="password" placeholder="新しいパスワード確認" value={profileNewPasswordConfirm} onChange={(event) => onProfileNewPasswordConfirmChange(event.target.value)} />
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button type="button" onClick={onProfileUpdate} disabled={loading}>プロフィール保存</button>
            <button type="button" onClick={onSignOut} disabled={loading}>サインアウト</button>
          </div>
        </div>
      </Section>

      <Section title="お知らせ">
        {announcements.length === 0 ? <p>公開中のお知らせはありません。</p> : (
          <ul>
            {announcements.map((announcement) => (
              <li key={announcement.id} style={{ marginBottom: '0.75rem' }}>
                <strong>{announcement.title}</strong>
                <div>{announcement.body}</div>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="メンバー一覧 / 詳細">
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 280px) 1fr', gap: '1rem' }}>
          <ul style={{ margin: 0, paddingLeft: '1rem' }}>
            {members.map((member) => (
              <li key={member.id} style={{ marginBottom: '0.5rem' }}>
                <button type="button" onClick={() => setSelectedMemberId(member.id)}>{member.displayName} ({member.mainInstrument})</button>
              </li>
            ))}
          </ul>
          <div>
            {selectedMemberDetail ? (
              <>
                <h3>{selectedMemberDetail.displayName}</h3>
                <p>{selectedMemberDetail.mainInstrument}{selectedMemberDetail.subInstrument ? ` / sub ${selectedMemberDetail.subInstrument}` : ''}</p>
                <p>{selectedMemberDetail.area || '地域未設定'} / {selectedMemberDetail.gender || '性別未設定'} / {selectedMemberDetail.ageRange || '年代未設定'}</p>
                <p>{selectedMemberDetail.bio || '自己紹介未設定'}</p>
                <p>活動件数: {selectedMemberDetail.sessionEntries.length}</p>
                <h4>最近の評価</h4>
                {selectedMemberRatings.length === 0 ? <p>評価履歴はありません。</p> : (
                  <ul>
                    {selectedMemberRatings.slice(0, 5).map((rating) => (
                      <li key={rating.id}>{rating.sessionEvent.title} / {rating.sessionSet.title} / {rating.rating} 星</li>
                    ))}
                  </ul>
                )}
              </>
            ) : <p>メンバーを選択してください。</p>}
          </div>
        </div>
      </Section>

      <Section title="セッションエントリー">
        <p style={{ color: entryState.canSubmit ? '#666' : '#a33' }}>{entryState.canSubmit ? `現在入力できるのは Round ${entryState.round} です。` : entryState.reason}</p>
        <div style={{ display: 'grid', gap: '0.75rem', maxWidth: 640 }}>
          <select value={memberEventId} onChange={(event) => setMemberEventId(event.target.value)}>
            <option value="">イベントを選択</option>
            {sessionEvents.map((event) => (
              <option key={event.id} value={event.id}>{event.title}</option>
            ))}
          </select>
          <select value={memberAttendanceStatus} onChange={(event) => setMemberAttendanceStatus(event.target.value as AttendanceStatus)}>
            <option value="attending">attending</option>
            <option value="undecided">undecided</option>
            <option value="absent">absent</option>
          </select>
          {entryState.round === 1 && (
            <>
              <input type="text" placeholder="Round1 1曲目" value={memberRound1Song1} onChange={(event) => setMemberRound1Song1(event.target.value)} />
              <input type="text" placeholder="Round1 1曲目 key" value={memberRound1Key1} onChange={(event) => setMemberRound1Key1(event.target.value)} />
              <input type="text" placeholder="Round1 2曲目" value={memberRound1Song2} onChange={(event) => setMemberRound1Song2(event.target.value)} />
              <input type="text" placeholder="Round1 2曲目 key" value={memberRound1Key2} onChange={(event) => setMemberRound1Key2(event.target.value)} />
            </>
          )}
          {entryState.round === 2 && (
            <>
              <input type="text" placeholder="Round2 1曲目" value={memberRound2Song1} onChange={(event) => setMemberRound2Song1(event.target.value)} />
              <input type="text" placeholder="Round2 1曲目 key" value={memberRound2Key1} onChange={(event) => setMemberRound2Key1(event.target.value)} />
              <input type="text" placeholder="Round2 2曲目" value={memberRound2Song2} onChange={(event) => setMemberRound2Song2(event.target.value)} />
              <input type="text" placeholder="Round2 2曲目 key" value={memberRound2Key2} onChange={(event) => setMemberRound2Key2(event.target.value)} />
            </>
          )}
          <div>
            <button type="button" onClick={onSubmitEntry} disabled={loading || !entryState.canSubmit}>エントリー保存</button>
          </div>
        </div>
      </Section>

      <Section title="自分の履歴 / レイティング">
        <h3>エントリー履歴</h3>
        {sessionEntries.length === 0 ? <p>まだエントリーはありません。</p> : (
          <ul>
            {sessionEntries.map((entry) => (
              <li key={entry.id} style={{ marginBottom: '0.75rem' }}>{entry.sessionEvent.title} / {entry.attendanceStatus} / {entry.requests.length} 曲</li>
            ))}
          </ul>
        )}
        <h3>公開済み sessionSet</h3>
        {memberSessionSets.length === 0 ? <p>評価対象の公開済み sessionSet はありません。</p> : (
          <ul>
            {memberSessionSets.map((sessionSet) => (
              <li key={sessionSet.id} style={{ marginBottom: '1rem' }}>
                <strong>{sessionSet.songTitle}</strong>
                <div style={{ display: 'grid', gap: '0.5rem', marginTop: '0.5rem', maxWidth: 320 }}>
                  <select value={String(memberRatings[sessionSet.id] ?? '')} onChange={(event) => setMemberRatings((current) => ({ ...current, [sessionSet.id]: Number(event.target.value) }))}>
                    <option value="">星を選択</option>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                    <option value="5">5</option>
                  </select>
                  <textarea rows={2} placeholder="コメント" value={memberRatingComments[sessionSet.id] ?? ''} onChange={(event) => setMemberRatingComments((current) => ({ ...current, [sessionSet.id]: event.target.value }))} />
                  <div>
                    <button type="button" onClick={() => onSaveRating(sessionSet.id)} disabled={loading || !memberRatings[sessionSet.id]}>評価を保存</button>
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
