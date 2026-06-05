import { useCallback, useEffect, useState } from 'react';
import { AGE_RANGE_OPTIONS, GENDER_OPTIONS, PREFECTURE_OPTIONS } from '@/lib/memberProfile';
import { formatRoundCandidateSong } from '@/lib/sessionEventWindow';
import type {
  AttendanceStatus,
  AuthUser,
  Instrument,
  MemberDetailView,
  MemberListView,
  MemberRatingHistoryView,
  SessionEntryView,
  SessionEventView,
  SessionSetView,
} from '../types';
import { getEventEntryState, parseJson, type RunPortalAction, type RunPortalActionOptions } from '../utils';
import { isSessionEventFinished } from '@/lib/sessionEventStatus';

type UseMemberPortalArgs = {
  currentUser: AuthUser | null;
  members: MemberListView[];
  sessionEvents: SessionEventView[];
  runAction: RunPortalAction;
  reloadShared: () => Promise<void>;
};

export function useMemberPortal({ currentUser, members, sessionEvents, runAction, reloadShared }: UseMemberPortalArgs) {
  const [profileDisplayName, setProfileDisplayName] = useState('');
  const [profileMainInstrument, setProfileMainInstrument] = useState<Instrument>('front');
  const [profileNickname, setProfileNickname] = useState('');
  const [profileGender, setProfileGender] = useState('');
  const [profileAgeRange, setProfileAgeRange] = useState('');
  const [profileArea, setProfileArea] = useState('');
  const [profileBio, setProfileBio] = useState('');
  const [profileSubInstrument, setProfileSubInstrument] = useState('');
  const [profileCurrentPassword, setProfileCurrentPassword] = useState('');
  const [profileNewPassword, setProfileNewPassword] = useState('');
  const [profileNewPasswordConfirm, setProfileNewPasswordConfirm] = useState('');
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [selectedMemberDetail, setSelectedMemberDetail] = useState<MemberDetailView | null>(null);
  const [selectedMemberRatings, setSelectedMemberRatings] = useState<MemberRatingHistoryView[]>([]);
  const [sessionEntries, setSessionEntries] = useState<SessionEntryView[]>([]);
  const [memberSessionSets, setMemberSessionSets] = useState<SessionSetView[]>([]);
  const [memberEventId, setMemberEventId] = useState('');
  const [memberAttendanceStatus, setMemberAttendanceStatus] = useState<AttendanceStatus>('attending');
  const [memberAfterPartyAttendanceStatus, setMemberAfterPartyAttendanceStatus] = useState<AttendanceStatus>('undecided');
  const [memberRound1Song1, setMemberRound1Song1] = useState('');
  const [memberRound1Song2, setMemberRound1Song2] = useState('');
  const [memberRound2Song1, setMemberRound2Song1] = useState('');
  const [memberRound2Song2, setMemberRound2Song2] = useState('');
  const [memberRound1Key1, setMemberRound1Key1] = useState('');
  const [memberRound1Key2, setMemberRound1Key2] = useState('');
  const [round1SongOptions, setRound1SongOptions] = useState<string[]>([]);
  const [memberRatings, setMemberRatings] = useState<Record<string, number>>({});
  const [memberRatingComments, setMemberRatingComments] = useState<Record<string, string>>({});
  const [memberEventComment, setMemberEventComment] = useState('');

  const selectedMemberEvent = sessionEvents.find((event) => event.id === memberEventId) ?? null;
  const visibleSessionEvents = sessionEvents.filter((event) => event.isVisibleToMembers);
  const selectableSessionEvents = visibleSessionEvents.filter((event) => !isSessionEventFinished(event.status));
  const entryState = getEventEntryState(selectedMemberEvent);

  const loadMemberData = useCallback(async () => {
    if (currentUser?.role !== 'member') {
      setSessionEntries([]);
      setMemberSessionSets([]);
      return;
    }

    const [entryRes, setRes] = await Promise.all([
      fetch('/api/session-entries'),
      memberEventId ? fetch(`/api/session-sets?sessionEventId=${memberEventId}`) : Promise.resolve(null),
    ]);
    const entryJson = await parseJson(entryRes);
    setSessionEntries(entryJson.entries ?? []);
    if (setRes) {
      const setJson = await parseJson(setRes);
      setMemberSessionSets((setJson.sessionSets ?? []).filter((item: SessionSetView) => item.isPublished));
    } else {
      setMemberSessionSets([]);
    }
  }, [currentUser?.role, memberEventId]);

  useEffect(() => {
    if (currentUser?.memberProfile) {
      setProfileDisplayName(currentUser.memberProfile.displayName ?? '');
      setProfileMainInstrument(currentUser.memberProfile.mainInstrument ?? 'front');
      setProfileNickname(currentUser.memberProfile.nickname ?? '');
      setProfileGender(currentUser.memberProfile.gender ?? '');
      setProfileAgeRange(currentUser.memberProfile.ageRange ?? '');
      setProfileArea(currentUser.memberProfile.area ?? '');
      setProfileBio(currentUser.memberProfile.bio ?? '');
      setProfileSubInstrument(currentUser.memberProfile.subInstrument ?? '');
    }
  }, [currentUser]);

  useEffect(() => {
    if (profileMainInstrument !== 'front') {
      setProfileSubInstrument('');
    }
  }, [profileMainInstrument]);

  useEffect(() => {
    if (!memberEventId && selectableSessionEvents.length > 0) {
      setMemberEventId(selectableSessionEvents[0].id);
    } else if (memberEventId && !selectableSessionEvents.some((event) => event.id === memberEventId)) {
      setMemberEventId(selectableSessionEvents[0]?.id ?? '');
    }
    if (!selectedMemberId && members.length > 0) {
      setSelectedMemberId(members[0].id);
    }
  }, [memberEventId, members, selectableSessionEvents, selectedMemberId]);

  useEffect(() => {
    loadMemberData().catch((error) => console.error(error));
  }, [loadMemberData]);

  useEffect(() => {
    const loadRound1Songs = async () => {
      const preferredResponse = await fetch('/api/songs?catalog=black-book');
      const preferredJson = await parseJson(preferredResponse);
      const preferredSongs = Array.isArray(preferredJson.songs)
        ? preferredJson.songs
          .map((song: { title?: unknown }) => (typeof song.title === 'string' ? song.title : ''))
          .filter((title: string) => title.length > 0)
        : [];

      if (preferredSongs.length > 0) {
        setRound1SongOptions(preferredSongs);
        return;
      }

      const fallbackResponse = await fetch('/api/songs');
      const fallbackJson = await parseJson(fallbackResponse);
      const fallbackSongs = Array.isArray(fallbackJson.songs)
        ? fallbackJson.songs
          .map((song: { title?: unknown }) => (typeof song.title === 'string' ? song.title : ''))
          .filter((title: string) => title.length > 0)
        : [];
      setRound1SongOptions(fallbackSongs);
    };

    loadRound1Songs().catch((error) => console.error(error));
  }, []);

  useEffect(() => {
    if (!selectedMemberId || !currentUser) {
      setSelectedMemberDetail(null);
      setSelectedMemberRatings([]);
      return;
    }
    fetch(`/api/members/${selectedMemberId}`)
      .then(parseJson)
      .then((json) => {
        setSelectedMemberDetail(json.member ?? null);
        setSelectedMemberRatings(json.ratings ?? []);
      })
      .catch((error) => console.error(error));
  }, [currentUser, selectedMemberId]);

  useEffect(() => {
    const currentEntry = sessionEntries.find((entry) => entry.sessionEventId === memberEventId);
    if (!currentEntry) {
      setMemberAttendanceStatus('attending');
      setMemberAfterPartyAttendanceStatus('undecided');
      setMemberRound1Song1('');
      setMemberRound1Song2('');
      setMemberRound1Key1('');
      setMemberRound1Key2('');
      setMemberRound2Song1('');
      setMemberRound2Song2('');
      return;
    }

    const round1Requests = currentEntry.requests
      .filter((request) => request.round === 1)
      .sort((a, b) => a.priority - b.priority);
    const round2Requests = currentEntry.requests
      .filter((request) => request.round === 2)
      .sort((a, b) => a.priority - b.priority);

    setMemberAttendanceStatus(currentEntry.attendanceStatus);
  setMemberAfterPartyAttendanceStatus(currentEntry.afterPartyAttendanceStatus ?? 'undecided');
    setMemberRound1Song1(round1Requests[0]?.songTitleSnapshot ?? '');
    setMemberRound1Song2(round1Requests[1]?.songTitleSnapshot ?? '');
    setMemberRound1Key1(round1Requests[0]?.keyName ?? '');
    setMemberRound1Key2(round1Requests[1]?.keyName ?? '');
    setMemberRound2Song1(formatRoundCandidateSong(round2Requests[0]?.songTitleSnapshot ?? '', round2Requests[0]?.keyName ?? null));
    setMemberRound2Song2(formatRoundCandidateSong(round2Requests[1]?.songTitleSnapshot ?? '', round2Requests[1]?.keyName ?? null));
  }, [memberEventId, sessionEntries]);

  useEffect(() => {
    setMemberEventComment('');
  }, [memberEventId]);

  const handleProfileUpdate = async () => runAction(async () => {
    if (!profileDisplayName.trim()) {
      throw new Error('表示名を入力してください');
    }
    if (!GENDER_OPTIONS.includes(profileGender as (typeof GENDER_OPTIONS)[number])) {
      throw new Error('性別を選択してください');
    }
    if (!AGE_RANGE_OPTIONS.includes(profileAgeRange as (typeof AGE_RANGE_OPTIONS)[number])) {
      throw new Error('年代を選択してください');
    }
    if (!PREFECTURE_OPTIONS.includes(profileArea as (typeof PREFECTURE_OPTIONS)[number])) {
      throw new Error('居住地域を選択してください');
    }
    if (profileNewPassword || profileCurrentPassword || profileNewPasswordConfirm) {
      if (!profileCurrentPassword || !profileNewPassword) {
        throw new Error('パスワード変更には現在のパスワードと新しいパスワードが必要です');
      }
      if (profileNewPassword !== profileNewPasswordConfirm) {
        throw new Error('新しいパスワード確認が一致しません');
      }
    }

    const res = await fetch('/api/members/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        displayName: profileDisplayName,
        mainInstrument: profileMainInstrument,
        nickname: profileNickname,
        gender: profileGender,
        ageRange: profileAgeRange,
        area: profileArea,
        bio: profileBio,
        subInstrument: profileMainInstrument === 'front' ? profileSubInstrument : null,
        currentPassword: profileCurrentPassword || undefined,
        newPassword: profileNewPassword || undefined,
      }),
    });
    const json = await parseJson(res);
    if (!res.ok) throw new Error(json.error ?? 'プロフィール更新に失敗しました');
    setProfileCurrentPassword('');
    setProfileNewPassword('');
    setProfileNewPasswordConfirm('');
    await reloadShared();
  }, 'プロフィールを更新しました');

  const handleSubmitEntry = async (options?: RunPortalActionOptions) => runAction(async () => {
    if (!memberEventId || !entryState.round || !entryState.canSubmit) {
      throw new Error(entryState.reason ?? '現在は登録できません');
    }
    const requests = entryState.round === 1
      ? [
          { songTitle: memberRound1Song1.trim(), round: 1, priority: 1, keyName: memberRound1Key1.trim() || null },
          { songTitle: memberRound1Song2.trim(), round: 1, priority: 2, keyName: memberRound1Key2.trim() || null },
        ]
      : [
          { songTitle: memberRound2Song1.trim(), round: 2, priority: 1, keyName: null },
          { songTitle: memberRound2Song2.trim(), round: 2, priority: 2, keyName: null },
        ];

    const res = await fetch('/api/session-entries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionEventId: memberEventId,
        attendanceStatus: memberAttendanceStatus,
        afterPartyAttendanceStatus: entryState.round === 1 && selectedMemberEvent?.hasAfterParty
          ? memberAfterPartyAttendanceStatus
          : undefined,
        requests: requests.filter((item) => item.songTitle),
      }),
    });
    const json = await parseJson(res);
    if (!res.ok) throw new Error(json.error ?? 'エントリー保存に失敗しました');
    await loadMemberData();
  }, 'セッションエントリーを保存しました', options);

  const handleSaveRating = async (sessionSetId: string) => runAction(async () => {
    const res = await fetch(`/api/session-sets/${sessionSetId}/ratings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rating: memberRatings[sessionSetId],
        comment: memberRatingComments[sessionSetId] ?? '',
      }),
    });
    const json = await parseJson(res);
    if (!res.ok) throw new Error(json.error ?? '評価保存に失敗しました');
    await loadMemberData();
  }, '評価を保存しました');

  const handleSaveEventComment = async () => runAction(async () => {
    if (!memberEventId) {
      throw new Error('イベントを選択してください');
    }
    if (!memberEventComment.trim()) {
      throw new Error('コメントを入力してください');
    }

    const res = await fetch(`/api/session-events/${memberEventId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: memberEventComment }),
    });
    const json = await parseJson(res);
    if (!res.ok) throw new Error(json.error ?? 'コメント保存に失敗しました');
    setMemberEventComment('');
    await reloadShared();
  }, 'イベントコメントを保存しました');

  return {
    profileDisplayName,
    setProfileDisplayName,
    profileMainInstrument,
    setProfileMainInstrument,
    profileNickname,
    setProfileNickname,
    profileGender,
    setProfileGender,
    profileAgeRange,
    setProfileAgeRange,
    profileArea,
    setProfileArea,
    profileBio,
    setProfileBio,
    profileSubInstrument,
    setProfileSubInstrument,
    profileCurrentPassword,
    setProfileCurrentPassword,
    profileNewPassword,
    setProfileNewPassword,
    profileNewPasswordConfirm,
    setProfileNewPasswordConfirm,
    selectedMemberId,
    setSelectedMemberId,
    selectedMemberDetail,
    selectedMemberRatings,
    sessionEntries,
    memberSessionSets,
    memberEventId,
    setMemberEventId,
    memberAttendanceStatus,
    setMemberAttendanceStatus,
    memberAfterPartyAttendanceStatus,
    setMemberAfterPartyAttendanceStatus,
    memberRound1Song1,
    setMemberRound1Song1,
    memberRound1Song2,
    setMemberRound1Song2,
    memberRound2Song1,
    setMemberRound2Song1,
    memberRound2Song2,
    setMemberRound2Song2,
    memberRound1Key1,
    setMemberRound1Key1,
    memberRound1Key2,
    setMemberRound1Key2,
    round1SongOptions,
    memberRatings,
    setMemberRatings,
    memberRatingComments,
    setMemberRatingComments,
    memberEventComment,
    setMemberEventComment,
    entryState,
    handleProfileUpdate,
    handleSubmitEntry,
    handleSaveRating,
    handleSaveEventComment,
  };
}