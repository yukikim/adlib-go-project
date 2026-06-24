import { useCallback, useEffect, useState } from 'react';
import type {
  ActivityLogView,
  ArchiveView,
  AuthUser,
  ColumnView,
  GeneratedResult,
  Instrument,
  MemberDetailView,
  MemberListView,
  RatingSummaryView,
  SavedSessionSetDraftView,
  SessionEventView,
  SessionSetView,
} from '../types';
import {
  combineDateAndTimeToIso,
  formatDateInputToIso,
  formatDateLocal,
  formatDateTimeLocal,
  formatTimeLocal,
  parseJson,
  type RunPortalAction,
} from '../utils';
import {
  DEFAULT_DRUM_FORCED_ASSIGNMENT_MAX,
  DEFAULT_FORCED_ASSIGNMENT_MAX,
} from '@/lib/sessionSetGenerationConfig';

type ArchivePreview = { participantCount: number; setCount: number; ratingSummaryIncluded: boolean } | null;

type UseAdminPortalArgs = {
  currentUser: AuthUser | null;
  members: MemberListView[];
  sessionEvents: SessionEventView[];
  runAction: RunPortalAction;
  reloadShared: () => Promise<void>;
};

function parseOptionalInteger(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? Math.trunc(parsed) : null;
}

function hasLocalTime(value?: string | null) {
  if (!value) {
    return false;
  }
  const date = new Date(value);
  return date.getHours() !== 0 || date.getMinutes() !== 0;
}

export function useAdminPortal({ currentUser, members, sessionEvents, runAction, reloadShared }: UseAdminPortalArgs) {
  const [selectedAdminEventId, setSelectedAdminEventId] = useState('');
  const [eventTitle, setEventTitle] = useState('');
  const [eventVenue, setEventVenue] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventStartTime, setEventStartTime] = useState('');
  const [eventEndTime, setEventEndTime] = useState('');
  const [eventParticipantLimit, setEventParticipantLimit] = useState('');
  const [eventParticipationFee, setEventParticipationFee] = useState('');
  const [eventHasAfterParty, setEventHasAfterParty] = useState(false);
  const [eventAfterPartyFee, setEventAfterPartyFee] = useState('');
  const [eventNotes, setEventNotes] = useState('');
  const [editEventTitle, setEditEventTitle] = useState('');
  const [editEventVenue, setEditEventVenue] = useState('');
  const [editEventDate, setEditEventDate] = useState('');
  const [editEventStartTime, setEditEventStartTime] = useState('');
  const [editEventEndTime, setEditEventEndTime] = useState('');
  const [editEventParticipantLimit, setEditEventParticipantLimit] = useState('');
  const [editEventParticipationFee, setEditEventParticipationFee] = useState('');
  const [editEventHasAfterParty, setEditEventHasAfterParty] = useState(false);
  const [editEventAfterPartyFee, setEditEventAfterPartyFee] = useState('');
  const [editEventNotes, setEditEventNotes] = useState('');
  const [editEventStatus, setEditEventStatus] = useState('draft');
  const [editRound1StartAt, setEditRound1StartAt] = useState('');
  const [editRound1EndAt, setEditRound1EndAt] = useState('');
  const [editRound2StartAt, setEditRound2StartAt] = useState('');
  const [editRound2EndAt, setEditRound2EndAt] = useState('');
  const [sessionSets, setSessionSets] = useState<SessionSetView[]>([]);
  const [ratingSummaries, setRatingSummaries] = useState<RatingSummaryView[]>([]);
  const [archives, setArchives] = useState<ArchiveView[]>([]);
  const [archiveTitle, setArchiveTitle] = useState('');
  const [archiveNote, setArchiveNote] = useState('');
  const [archivePreview, setArchivePreview] = useState<ArchivePreview>(null);
  const [generatedResult, setGeneratedResult] = useState<GeneratedResult>({ sessionSets: [], skippedSongs: [], forcedSessionSets: [] });
  const [generateDrumForcedAssignmentMax, setGenerateDrumForcedAssignmentMax] = useState(String(DEFAULT_DRUM_FORCED_ASSIGNMENT_MAX));
  const [generateForcedAssignmentMax, setGenerateForcedAssignmentMax] = useState(String(DEFAULT_FORCED_ASSIGNMENT_MAX));
  const [savedSessionSetDrafts, setSavedSessionSetDrafts] = useState<SavedSessionSetDraftView[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLogView[]>([]);
  const [mailLogs, setMailLogs] = useState([] as { id: string; mailType: string; toAddress: string; status: string; createdAt: string; errorMessage?: string | null }[]);
  const [columns, setColumns] = useState<ColumnView[]>([]);
  const [selectedManagedMemberId, setSelectedManagedMemberId] = useState('');
  const [selectedManagedMemberDetail, setSelectedManagedMemberDetail] = useState<MemberDetailView | null>(null);
  const [memberUpdateMessage, setMemberUpdateMessage] = useState<string | null>(null);
  const [memberUpdateMessageTone, setMemberUpdateMessageTone] = useState<'success' | 'error' | null>(null);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [memberInvitationEmail, setMemberInvitationEmail] = useState('');
  const [adminMemberDisplayName, setAdminMemberDisplayName] = useState('');
  const [adminMemberNickname, setAdminMemberNickname] = useState('');
  const [adminMemberMainInstrument, setAdminMemberMainInstrument] = useState<Instrument>('front');
  const [adminMemberSubInstrument, setAdminMemberSubInstrument] = useState('');
  const [adminMemberGender, setAdminMemberGender] = useState('');
  const [adminMemberAgeRange, setAdminMemberAgeRange] = useState('');
  const [adminMemberArea, setAdminMemberArea] = useState('');
  const [adminMemberBio, setAdminMemberBio] = useState('');
  const [adminMemberRole, setAdminMemberRole] = useState<'member' | 'admin'>('member');
  const [adminMemberStatus, setAdminMemberStatus] = useState<'active' | 'suspended' | 'invited'>('active');
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementBody, setAnnouncementBody] = useState('');
  const [announcementPublished, setAnnouncementPublished] = useState(true);
  const [editingColumnSlug, setEditingColumnSlug] = useState('');
  const [columnTitle, setColumnTitle] = useState('');
  const [columnSlug, setColumnSlug] = useState('');
  const [columnSummary, setColumnSummary] = useState('');
  const [columnBody, setColumnBody] = useState('');
  const [columnThumbnailLabel, setColumnThumbnailLabel] = useState('Guide');
  const [columnAuthorName, setColumnAuthorName] = useState('Adlib-go 運営');
  const [columnDisplayOrder, setColumnDisplayOrder] = useState(0);
  const [columnPublishAt, setColumnPublishAt] = useState('');
  const [columnPublished, setColumnPublished] = useState(true);

  const isAdmin = currentUser?.role === 'admin';
  const selectedAdminEvent = sessionEvents.find((event) => event.id === selectedAdminEventId) ?? null;

  async function loadManagedMemberDetail(memberId: string) {
    const response = await fetch(`/api/members/${memberId}`);
    const json = await parseJson(response);
    if (!response.ok) {
      throw new Error(json.error ?? 'メンバー詳細の取得に失敗しました');
    }

    setSelectedManagedMemberDetail(json.member ?? null);
    if (json.member?.userAccount) {
      setAdminMemberDisplayName(json.member.displayName ?? '');
      setAdminMemberNickname(json.member.nickname ?? '');
      setAdminMemberMainInstrument(json.member.mainInstrument ?? 'front');
      setAdminMemberSubInstrument(json.member.subInstrument ?? '');
      setAdminMemberGender(json.member.gender ?? '');
      setAdminMemberAgeRange(json.member.ageRange ?? '');
      setAdminMemberArea(json.member.area ?? '');
      setAdminMemberBio(json.member.bio ?? '');
      setAdminMemberRole(json.member.userAccount.role);
      setAdminMemberStatus(json.member.userAccount.status);
    }
  }

  function resetColumnForm() {
    setEditingColumnSlug('');
    setColumnTitle('');
    setColumnSlug('');
    setColumnSummary('');
    setColumnBody('');
    setColumnThumbnailLabel('Guide');
    setColumnAuthorName('Adlib-go 運営');
    setColumnDisplayOrder(0);
    setColumnPublishAt('');
    setColumnPublished(true);
  }

  const loadAdminData = useCallback(async () => {
    if (!isAdmin) {
      setSessionSets([]);
      setRatingSummaries([]);
      setArchives([]);
      setArchivePreview(null);
      setSavedSessionSetDrafts([]);
      setActivityLogs([]);
      setMailLogs([]);
      setColumns([]);
      return;
    }

    const [archiveRes, activityRes, mailLogRes, columnRes, setRes, summaryRes, previewRes, draftRes] = await Promise.all([
      fetch('/api/session-archives'),
      fetch('/api/admin/activity'),
      fetch('/api/admin/mail-logs'),
      fetch('/api/columns?includeDrafts=1'),
      selectedAdminEventId ? fetch(`/api/session-sets?sessionEventId=${selectedAdminEventId}`) : Promise.resolve(null),
      selectedAdminEventId ? fetch(`/api/session-events/${selectedAdminEventId}/ratings-summary`) : Promise.resolve(null),
      selectedAdminEventId ? fetch(`/api/session-events/${selectedAdminEventId}/archive-preview`) : Promise.resolve(null),
      fetch('/api/session-set-drafts'),
    ]);

    const archiveJson = await parseJson(archiveRes);
    const activityJson = await parseJson(activityRes);
    const mailLogJson = await parseJson(mailLogRes);
    const columnJson = await parseJson(columnRes);
    const draftJson = await parseJson(draftRes);
    setArchives(archiveJson.archives ?? []);
    setActivityLogs(activityJson.activity ?? []);
    setMailLogs(mailLogJson.mailLogs ?? []);
    setColumns(columnJson.columns ?? []);
    if (setRes) {
      const setJson = await parseJson(setRes);
      setSessionSets(setJson.sessionSets ?? []);
    } else {
      setSessionSets([]);
    }
    if (summaryRes) {
      const summaryJson = await parseJson(summaryRes);
      setRatingSummaries(summaryJson.summaries ?? []);
    } else {
      setRatingSummaries([]);
    }
    if (previewRes) {
      const previewJson = await parseJson(previewRes);
      setArchivePreview(previewJson.preview ?? null);
    } else {
      setArchivePreview(null);
    }
    setSavedSessionSetDrafts(draftJson.drafts ?? []);
  }, [isAdmin, selectedAdminEventId]);

  useEffect(() => {
    if (!selectedAdminEventId && sessionEvents.length > 0) {
      setSelectedAdminEventId(sessionEvents[0].id);
    }
    if (!selectedManagedMemberId && members.length > 0) {
      setSelectedManagedMemberId(members[0].id);
    }
  }, [members, selectedAdminEventId, selectedManagedMemberId, sessionEvents]);

  useEffect(() => {
    if (!selectedAdminEvent) {
      return;
    }
    setEditEventTitle(selectedAdminEvent.title);
    setEditEventVenue(selectedAdminEvent.venue);
    setEditEventDate(formatDateLocal(selectedAdminEvent.eventDate));
    setEditEventStartTime(formatTimeLocal(selectedAdminEvent.startTime ?? (hasLocalTime(selectedAdminEvent.eventDate) ? selectedAdminEvent.eventDate : null)));
    setEditEventEndTime(formatTimeLocal(selectedAdminEvent.endTime));
    setEditEventParticipantLimit(selectedAdminEvent.participantLimit?.toString() ?? '');
    setEditEventParticipationFee(selectedAdminEvent.participationFee?.toString() ?? '');
    setEditEventHasAfterParty(selectedAdminEvent.hasAfterParty === true);
    setEditEventAfterPartyFee(selectedAdminEvent.afterPartyFee?.toString() ?? '');
    setEditEventNotes(selectedAdminEvent.notes ?? '');
    setEditEventStatus(selectedAdminEvent.status);
    setEditRound1StartAt(formatDateTimeLocal(selectedAdminEvent.round1StartAt));
    setEditRound1EndAt(formatDateTimeLocal(selectedAdminEvent.round1EndAt));
    setEditRound2StartAt(formatDateTimeLocal(selectedAdminEvent.round2StartAt));
    setEditRound2EndAt(formatDateTimeLocal(selectedAdminEvent.round2EndAt));
  }, [selectedAdminEvent]);

  useEffect(() => {
    loadAdminData().catch((error) => console.error(error));
  }, [loadAdminData]);

  useEffect(() => {
    if (!selectedManagedMemberId || !isAdmin) {
      setSelectedManagedMemberDetail(null);
      return;
    }
    loadManagedMemberDetail(selectedManagedMemberId).catch((error) => console.error(error));
  }, [isAdmin, members, selectedManagedMemberId]);

  useEffect(() => {
    setMemberUpdateMessage(null);
    setMemberUpdateMessageTone(null);
  }, [selectedManagedMemberId]);

  useEffect(() => {
    if (adminMemberMainInstrument !== 'front') {
      setAdminMemberSubInstrument('');
    }
  }, [adminMemberMainInstrument]);

  useEffect(() => {
    if (!eventHasAfterParty) {
      setEventAfterPartyFee('');
    }
  }, [eventHasAfterParty]);

  useEffect(() => {
    if (!editEventHasAfterParty) {
      setEditEventAfterPartyFee('');
    }
  }, [editEventHasAfterParty]);

  useEffect(() => {
    if (!editingColumnSlug) {
      return;
    }
    const column = columns.find((item) => item.slug === editingColumnSlug);
    if (!column) {
      return;
    }
    setColumnTitle(column.title);
    setColumnSlug(column.slug);
    setColumnSummary(column.summary);
    setColumnBody(column.body);
    setColumnThumbnailLabel(column.thumbnailLabel ?? 'Guide');
    setColumnAuthorName(column.authorName);
    setColumnDisplayOrder(column.displayOrder);
    setColumnPublishAt(column.publishedAt ? formatDateTimeLocal(column.publishedAt) : '');
    setColumnPublished(column.isPublished);
  }, [columns, editingColumnSlug]);

  const handleCreateEvent = async () => runAction(async () => {
    const res = await fetch('/api/session-events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: eventTitle,
        venue: eventVenue,
        eventDate: formatDateInputToIso(eventDate),
        startTime: combineDateAndTimeToIso(eventDate, eventStartTime),
        endTime: combineDateAndTimeToIso(eventDate, eventEndTime),
        participantLimit: parseOptionalInteger(eventParticipantLimit),
        participationFee: parseOptionalInteger(eventParticipationFee),
        hasAfterParty: eventHasAfterParty,
        afterPartyFee: eventHasAfterParty ? parseOptionalInteger(eventAfterPartyFee) : null,
        notes: eventNotes.trim() || null,
        status: 'draft',
      }),
    });
    const json = await parseJson(res);
    if (!res.ok) throw new Error(json.error ?? 'イベント作成に失敗しました');
    await reloadShared();
    setEventTitle('');
    setEventVenue('');
    setEventDate('');
    setEventStartTime('');
    setEventEndTime('');
    setEventParticipantLimit('');
    setEventParticipationFee('');
    setEventHasAfterParty(false);
    setEventAfterPartyFee('');
    setEventNotes('');
  }, 'イベントを作成しました');

  const handleUpdateEvent = async () => runAction(async () => {
    if (!selectedAdminEventId) throw new Error('イベントを選択してください');
    const res = await fetch(`/api/session-events/${selectedAdminEventId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: editEventTitle,
        venue: editEventVenue,
        eventDate: formatDateInputToIso(editEventDate),
        startTime: combineDateAndTimeToIso(editEventDate, editEventStartTime),
        endTime: combineDateAndTimeToIso(editEventDate, editEventEndTime),
        participantLimit: parseOptionalInteger(editEventParticipantLimit),
        participationFee: parseOptionalInteger(editEventParticipationFee),
        hasAfterParty: editEventHasAfterParty,
        afterPartyFee: editEventHasAfterParty ? parseOptionalInteger(editEventAfterPartyFee) : null,
        notes: editEventNotes.trim() || null,
        status: editEventStatus,
        round1StartAt: editRound1StartAt ? new Date(editRound1StartAt).toISOString() : null,
        round1EndAt: editRound1EndAt ? new Date(editRound1EndAt).toISOString() : null,
        round2StartAt: editRound2StartAt ? new Date(editRound2StartAt).toISOString() : null,
        round2EndAt: editRound2EndAt ? new Date(editRound2EndAt).toISOString() : null,
      }),
    });
    const json = await parseJson(res);
    if (!res.ok) throw new Error(json.error ?? 'イベント更新に失敗しました');
    await reloadShared();
    await loadAdminData();
  }, 'イベントを更新しました');

  const handleGenerateSets = async (eventId?: string) => runAction(async () => {
    const targetEventId = eventId ?? selectedAdminEventId;
    if (!targetEventId) throw new Error('イベントを選択してください');
    const res = await fetch('/api/session-sets/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionEventId: targetEventId,
        drumForcedAssignmentMax: parseOptionalInteger(generateDrumForcedAssignmentMax),
        forcedAssignmentMax: parseOptionalInteger(generateForcedAssignmentMax),
      }),
    });
    const json = await parseJson(res);
    if (!res.ok) throw new Error(json.error ?? 'sessionSet 生成に失敗しました');
    setSelectedAdminEventId(targetEventId);
    setGeneratedResult({
      sessionSets: json.sessionSets ?? [],
      skippedSongs: json.skippedSongs ?? [],
      forcedSessionSets: json.forcedSessionSets ?? [],
    });
    setSessionSets(json.sessionSets ?? []);
    await reloadShared();
  }, 'sessionSet を生成しました');

  const handlePublishSets = async () => runAction(async () => {
    if (!selectedAdminEventId) throw new Error('イベントを選択してください');
    const res = await fetch(`/api/session-events/${selectedAdminEventId}/publish`, { method: 'POST' });
    const json = await parseJson(res);
    if (!res.ok) throw new Error(json.error ?? '公開に失敗しました');
    await reloadShared();
    await loadAdminData();
  }, 'sessionSet を公開しました');

  const handleSaveGeneratedSessionSets = async () => runAction(async () => {
    if (!selectedAdminEventId) throw new Error('イベントを選択してください');
    if (sessionSets.length === 0) throw new Error('保存する sessionSet がありません');

    const res = await fetch('/api/session-set-drafts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionEventId: selectedAdminEventId,
        sessionSets,
        skippedSongs: generatedResult.skippedSongs,
        forcedSessionSets: generatedResult.forcedSessionSets,
      }),
    });
    const json = await parseJson(res);
    if (!res.ok) throw new Error(json.error ?? '保存に失敗しました');
    await loadAdminData();
  }, 'generated sessionSet を保存しました');

  const handleUpdateSessionSet = (updatedSessionSet: SessionSetView) => {
    setSessionSets((current) => current.map((sessionSet) => sessionSet.id === updatedSessionSet.id ? updatedSessionSet : sessionSet));
    setGeneratedResult((current) => ({
      ...current,
      sessionSets: current.sessionSets.map((sessionSet) => sessionSet.id === updatedSessionSet.id ? updatedSessionSet : sessionSet),
    }));
  };

  const handleReorderSessionSets = (sourceSessionSetId: string, destinationSessionSetId: string) => {
    const reorder = (current: SessionSetView[]) => {
      const sourceIndex = current.findIndex((sessionSet) => sessionSet.id === sourceSessionSetId);
      const destinationIndex = current.findIndex((sessionSet) => sessionSet.id === destinationSessionSetId);

      if (sourceIndex < 0 || destinationIndex < 0 || sourceIndex === destinationIndex) {
        return current;
      }

      const next = [...current];
      const [movedSessionSet] = next.splice(sourceIndex, 1);
      next.splice(destinationIndex, 0, movedSessionSet);
      return next.map((sessionSet, index) => ({ ...sessionSet, setOrder: index + 1 }));
    };

    setSessionSets(reorder);
    setGeneratedResult((current) => ({
      ...current,
      sessionSets: reorder(current.sessionSets),
    }));
  };

  const handleSaveEditedSessionSets = async () => runAction(async () => {
    if (!selectedAdminEventId) throw new Error('イベントを選択してください');
    if (sessionSets.length === 0) throw new Error('保存する sessionSet がありません');

    const res = await fetch('/api/session-sets', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionEventId: selectedAdminEventId,
        sessionSets,
      }),
    });
    const json = await parseJson(res);
    if (!res.ok) throw new Error(json.error ?? 'sessionSet の保存に失敗しました');

    setSessionSets(json.sessionSets ?? []);
    setGeneratedResult((current) => ({
      ...current,
      sessionSets: json.sessionSets ?? current.sessionSets,
    }));
    await reloadShared();
    await loadAdminData();
  }, 'sessionSet を保存しました');

  const handleShowSavedSessionSetDraft = (draft: SavedSessionSetDraftView) => {
    setSelectedAdminEventId(draft.sessionEventId);
    setSessionSets(draft.sessionSets ?? []);
    setGeneratedResult({
      sessionSets: draft.sessionSets ?? [],
      skippedSongs: draft.skippedSongs ?? [],
      forcedSessionSets: draft.forcedSessionSets ?? [],
    });
  };

  const handleRegenerateSavedSessionSetDraft = async (draft: SavedSessionSetDraftView) => {
    await handleGenerateSets(draft.sessionEventId);
  };

  const handleCreateArchive = async () => runAction(async () => {
    if (!selectedAdminEventId) throw new Error('イベントを選択してください');
    const res = await fetch('/api/session-archives', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionEventId: selectedAdminEventId, title: archiveTitle, note: archiveNote }),
    });
    const json = await parseJson(res);
    if (!res.ok) throw new Error(json.error ?? 'アーカイブ作成に失敗しました');
    setArchiveTitle('');
    setArchiveNote('');
    await loadAdminData();
  }, 'アーカイブを作成しました');

  const handleDeleteArchive = async (archiveId: string) => runAction(async () => {
    const res = await fetch(`/api/session-archives/${archiveId}`, { method: 'DELETE' });
    const json = await parseJson(res);
    if (!res.ok) throw new Error(json.error ?? 'アーカイブ削除に失敗しました');
    await loadAdminData();
  }, 'アーカイブを削除しました');

  const handleUpdateMember = async () => runAction(async () => {
    if (!selectedManagedMemberId) throw new Error('メンバーを選択してください');
    const res = await fetch(`/api/members/${selectedManagedMemberId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        displayName: adminMemberDisplayName,
        nickname: adminMemberNickname,
        mainInstrument: adminMemberMainInstrument,
        subInstrument: adminMemberMainInstrument === 'front' ? adminMemberSubInstrument : null,
        gender: adminMemberGender,
        ageRange: adminMemberAgeRange,
        area: adminMemberArea,
        bio: adminMemberBio,
        role: adminMemberRole,
        status: adminMemberStatus,
      }),
    });
    const json = await parseJson(res);
    if (!res.ok) throw new Error(json.error ?? 'メンバー更新に失敗しました');
    await reloadShared();
    await loadManagedMemberDetail(selectedManagedMemberId);
  }, 'メンバー設定を更新しました', {
    skipGlobalMessage: true,
    onSuccess: (message) => {
      setMemberUpdateMessage(message ?? 'メンバー設定を更新しました');
      setMemberUpdateMessageTone('success');
    },
    onError: (message) => {
      setMemberUpdateMessage(message);
      setMemberUpdateMessageTone('error');
    },
  });

  const handleDeleteMember = async () => runAction(async () => {
    if (!selectedManagedMemberId) throw new Error('削除対象のメンバーを選択してください');
    const res = await fetch(`/api/members/${selectedManagedMemberId}`, { method: 'DELETE' });
    const json = await parseJson(res);
    if (!res.ok) throw new Error(json.error ?? 'メンバー削除に失敗しました');
    setSelectedManagedMemberId('');
    setSelectedManagedMemberDetail(null);
    await reloadShared();
  }, 'メンバーを削除しました');

  const handleCreateMemberInvitation = async () => runAction(async () => {
    const res = await fetch('/api/admin/member-invitations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: memberInvitationEmail }),
    });
    const json = await parseJson(res);
    if (!res.ok) throw new Error(json.error ?? 'メンバー仮登録に失敗しました');
    setMemberInvitationEmail('');
  }, 'メンバー登録のご案内メールを送信しました');

  const handleCreateAnnouncement = async () => runAction(async () => {
    const res = await fetch('/api/announcements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: announcementTitle, body: announcementBody, isPublished: announcementPublished }),
    });
    const json = await parseJson(res);
    if (!res.ok) throw new Error(json.error ?? 'お知らせ作成に失敗しました');
    setAnnouncementTitle('');
    setAnnouncementBody('');
    setAnnouncementPublished(true);
    await reloadShared();
  }, 'お知らせを作成しました');

  const handleCreateColumn = async () => runAction(async () => {
    const res = await fetch('/api/columns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: columnTitle,
        slug: columnSlug,
        summary: columnSummary,
        body: columnBody,
        thumbnailLabel: columnThumbnailLabel,
        authorName: columnAuthorName,
        displayOrder: columnDisplayOrder,
        isPublished: columnPublished,
        publishedAt: columnPublishAt || null,
      }),
    });
    const json = await parseJson(res);
    if (!res.ok) throw new Error(json.error ?? 'コラム作成に失敗しました');
    resetColumnForm();
    await loadAdminData();
  }, 'コラムを作成しました');

  const handleUpdateColumn = async () => runAction(async () => {
    if (!editingColumnSlug) throw new Error('編集対象のコラムを選択してください');
    const res = await fetch(`/api/columns/${editingColumnSlug}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: columnTitle,
        slug: columnSlug,
        summary: columnSummary,
        body: columnBody,
        thumbnailLabel: columnThumbnailLabel,
        authorName: columnAuthorName,
        displayOrder: columnDisplayOrder,
        isPublished: columnPublished,
        publishedAt: columnPublishAt || null,
      }),
    });
    const json = await parseJson(res);
    if (!res.ok) throw new Error(json.error ?? 'コラム更新に失敗しました');
    setEditingColumnSlug(json.column?.slug ?? '');
    await loadAdminData();
  }, 'コラムを更新しました');

  const handleDeleteColumn = async (slug?: string) => runAction(async () => {
    const targetSlug = slug ?? editingColumnSlug;
    if (!targetSlug) throw new Error('削除対象のコラムを選択してください');
    const res = await fetch(`/api/columns/${targetSlug}`, { method: 'DELETE' });
    const json = await parseJson(res);
    if (!res.ok) throw new Error(json.error ?? 'コラム削除に失敗しました');
    if (targetSlug === editingColumnSlug) {
      resetColumnForm();
    }
    await loadAdminData();
  }, 'コラムを削除しました');

  return {
    selectedAdminEventId,
    setSelectedAdminEventId,
    selectedAdminEvent,
    eventTitle,
    setEventTitle,
    eventVenue,
    setEventVenue,
    eventDate,
    setEventDate,
    eventStartTime,
    setEventStartTime,
    eventEndTime,
    setEventEndTime,
    eventParticipantLimit,
    setEventParticipantLimit,
    eventParticipationFee,
    setEventParticipationFee,
    eventHasAfterParty,
    setEventHasAfterParty,
    eventAfterPartyFee,
    setEventAfterPartyFee,
    eventNotes,
    setEventNotes,
    editEventTitle,
    setEditEventTitle,
    editEventVenue,
    setEditEventVenue,
    editEventDate,
    setEditEventDate,
    editEventStartTime,
    setEditEventStartTime,
    editEventEndTime,
    setEditEventEndTime,
    editEventParticipantLimit,
    setEditEventParticipantLimit,
    editEventParticipationFee,
    setEditEventParticipationFee,
    editEventHasAfterParty,
    setEditEventHasAfterParty,
    editEventAfterPartyFee,
    setEditEventAfterPartyFee,
    editEventNotes,
    setEditEventNotes,
    editEventStatus,
    setEditEventStatus,
    editRound1StartAt,
    setEditRound1StartAt,
    editRound1EndAt,
    setEditRound1EndAt,
    editRound2StartAt,
    setEditRound2StartAt,
    editRound2EndAt,
    setEditRound2EndAt,
    sessionSets,
    ratingSummaries,
    archives,
    archiveTitle,
    setArchiveTitle,
    archiveNote,
    setArchiveNote,
    archivePreview,
    generatedResult,
    generateDrumForcedAssignmentMax,
    setGenerateDrumForcedAssignmentMax,
    generateForcedAssignmentMax,
    setGenerateForcedAssignmentMax,
    savedSessionSetDrafts,
    activityLogs,
    mailLogs,
    columns,
    selectedManagedMemberId,
    setSelectedManagedMemberId,
    selectedManagedMemberDetail,
    memberUpdateMessage,
    memberUpdateMessageTone,
    memberSearchQuery,
    setMemberSearchQuery,
    memberInvitationEmail,
    setMemberInvitationEmail,
    adminMemberDisplayName,
    setAdminMemberDisplayName,
    adminMemberNickname,
    setAdminMemberNickname,
    adminMemberMainInstrument,
    setAdminMemberMainInstrument,
    adminMemberSubInstrument,
    setAdminMemberSubInstrument,
    adminMemberGender,
    setAdminMemberGender,
    adminMemberAgeRange,
    setAdminMemberAgeRange,
    adminMemberArea,
    setAdminMemberArea,
    adminMemberBio,
    setAdminMemberBio,
    adminMemberRole,
    setAdminMemberRole,
    adminMemberStatus,
    setAdminMemberStatus,
    announcementTitle,
    setAnnouncementTitle,
    announcementBody,
    setAnnouncementBody,
    announcementPublished,
    setAnnouncementPublished,
    editingColumnSlug,
    setEditingColumnSlug,
    columnTitle,
    setColumnTitle,
    columnSlug,
    setColumnSlug,
    columnSummary,
    setColumnSummary,
    columnBody,
    setColumnBody,
    columnThumbnailLabel,
    setColumnThumbnailLabel,
    columnAuthorName,
    setColumnAuthorName,
    columnDisplayOrder,
    setColumnDisplayOrder,
    columnPublishAt,
    setColumnPublishAt,
    columnPublished,
    setColumnPublished,
    handleCreateEvent,
    handleUpdateEvent,
    handleGenerateSets,
    handlePublishSets,
    handleUpdateSessionSet,
    handleReorderSessionSets,
    handleSaveEditedSessionSets,
    handleSaveGeneratedSessionSets,
    handleShowSavedSessionSetDraft,
    handleRegenerateSavedSessionSetDraft,
    handleCreateArchive,
    handleDeleteArchive,
    handleUpdateMember,
    handleDeleteMember,
    handleCreateMemberInvitation,
    handleCreateAnnouncement,
    handleCreateColumn,
    handleUpdateColumn,
    handleDeleteColumn,
    resetColumnForm,
  };
}
