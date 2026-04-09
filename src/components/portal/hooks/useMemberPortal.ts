import { useEffect, useState } from 'react';
import type {
  AttendanceStatus,
  AuthUser,
  MemberDetailView,
  MemberListView,
  MemberRatingHistoryView,
  SessionEntryView,
  SessionEventView,
  SessionSetView,
} from '../types';
import { getEventEntryState, parseJson, type RunPortalAction } from '../utils';

type UseMemberPortalArgs = {
  currentUser: AuthUser | null;
  members: MemberListView[];
  sessionEvents: SessionEventView[];
  runAction: RunPortalAction;
  reloadShared: () => Promise<void>;
};

export function useMemberPortal({ currentUser, members, sessionEvents, runAction, reloadShared }: UseMemberPortalArgs) {
  const [profileDisplayName, setProfileDisplayName] = useState('');
  const [profileNickname, setProfileNickname] = useState('');
  const [profileArea, setProfileArea] = useState('');
  const [profileBio, setProfileBio] = useState('');
  const [profileSubInstrument, setProfileSubInstrument] = useState('');
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [selectedMemberDetail, setSelectedMemberDetail] = useState<MemberDetailView | null>(null);
  const [selectedMemberRatings, setSelectedMemberRatings] = useState<MemberRatingHistoryView[]>([]);
  const [sessionEntries, setSessionEntries] = useState<SessionEntryView[]>([]);
  const [memberSessionSets, setMemberSessionSets] = useState<SessionSetView[]>([]);
  const [memberEventId, setMemberEventId] = useState('');
  const [memberAttendanceStatus, setMemberAttendanceStatus] = useState<AttendanceStatus>('attending');
  const [memberRound1Song1, setMemberRound1Song1] = useState('');
  const [memberRound1Song2, setMemberRound1Song2] = useState('');
  const [memberRound2Song1, setMemberRound2Song1] = useState('');
  const [memberRound2Song2, setMemberRound2Song2] = useState('');
  const [memberRound1Key1, setMemberRound1Key1] = useState('');
  const [memberRound1Key2, setMemberRound1Key2] = useState('');
  const [memberRound2Key1, setMemberRound2Key1] = useState('');
  const [memberRound2Key2, setMemberRound2Key2] = useState('');
  const [memberRatings, setMemberRatings] = useState<Record<string, number>>({});
  const [memberRatingComments, setMemberRatingComments] = useState<Record<string, string>>({});

  const selectedMemberEvent = sessionEvents.find((event) => event.id === memberEventId) ?? null;
  const entryState = getEventEntryState(selectedMemberEvent);

  async function loadMemberData() {
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
  }

  useEffect(() => {
    if (currentUser?.memberProfile) {
      setProfileDisplayName(currentUser.memberProfile.displayName ?? '');
      setProfileNickname(currentUser.memberProfile.nickname ?? '');
      setProfileArea(currentUser.memberProfile.area ?? '');
      setProfileBio(currentUser.memberProfile.bio ?? '');
      setProfileSubInstrument(currentUser.memberProfile.subInstrument ?? '');
    }
  }, [currentUser]);

  useEffect(() => {
    if (!memberEventId && sessionEvents.length > 0) {
      setMemberEventId(sessionEvents[0].id);
    }
    if (!selectedMemberId && members.length > 0) {
      setSelectedMemberId(members[0].id);
    }
  }, [memberEventId, members, selectedMemberId, sessionEvents]);

  useEffect(() => {
    loadMemberData().catch((error) => console.error(error));
  }, [currentUser, memberEventId]);

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
      return;
    }
    setMemberAttendanceStatus(currentEntry.attendanceStatus);
  }, [memberEventId, sessionEntries]);

  const handleProfileUpdate = async () => runAction(async () => {
    const res = await fetch('/api/members/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        displayName: profileDisplayName,
        nickname: profileNickname,
        area: profileArea,
        bio: profileBio,
        subInstrument: profileSubInstrument,
      }),
    });
    const json = await parseJson(res);
    if (!res.ok) throw new Error(json.error ?? 'プロフィール更新に失敗しました');
    await reloadShared();
  }, 'プロフィールを更新しました');

  const handleSubmitEntry = async () => runAction(async () => {
    if (!memberEventId || !entryState.round || !entryState.canSubmit) {
      throw new Error(entryState.reason ?? '現在は登録できません');
    }
    const requests = entryState.round === 1
      ? [
          { songTitle: memberRound1Song1.trim(), round: 1, priority: 1, keyName: memberRound1Key1.trim() || null },
          { songTitle: memberRound1Song2.trim(), round: 1, priority: 2, keyName: memberRound1Key2.trim() || null },
        ]
      : [
          { songTitle: memberRound2Song1.trim(), round: 2, priority: 1, keyName: memberRound2Key1.trim() || null },
          { songTitle: memberRound2Song2.trim(), round: 2, priority: 2, keyName: memberRound2Key2.trim() || null },
        ];

    const res = await fetch('/api/session-entries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionEventId: memberEventId,
        attendanceStatus: memberAttendanceStatus,
        requests: requests.filter((item) => item.songTitle),
      }),
    });
    const json = await parseJson(res);
    if (!res.ok) throw new Error(json.error ?? 'エントリー保存に失敗しました');
    await loadMemberData();
  }, 'セッションエントリーを保存しました');

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

  return {
    profileDisplayName,
    setProfileDisplayName,
    profileNickname,
    setProfileNickname,
    profileArea,
    setProfileArea,
    profileBio,
    setProfileBio,
    profileSubInstrument,
    setProfileSubInstrument,
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
    memberRound2Key1,
    setMemberRound2Key1,
    memberRound2Key2,
    setMemberRound2Key2,
    memberRatings,
    setMemberRatings,
    memberRatingComments,
    setMemberRatingComments,
    entryState,
    handleProfileUpdate,
    handleSubmitEntry,
    handleSaveRating,
  };
}