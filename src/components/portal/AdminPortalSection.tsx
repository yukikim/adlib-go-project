import { useEffect, useState, type DragEvent, type ReactNode } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Bell,
  ArrowDown,
  ArrowUp,
  BookOpenText,
  CalendarDays,
  ChevronDown,
  FileDown,
  FileArchive,
  GripVertical,
  Music4,
  Users,
  MessageCircleQuestionMark,
  Star,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
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
import { cn, formatEventDate, formatEventDateTime, formatEventSchedule, formatYen } from '@/lib/utils';
import { Section } from './Section';
import { downloadSessionSetPdf } from './sessionSetPdf';
import { RatingSummaryList } from './RatingSummaryList';
import { AGE_RANGE_OPTIONS, GENDER_OPTIONS, PREFECTURE_OPTIONS } from '@/lib/memberProfile';
import { getSessionEventStatusLabel } from '@/lib/sessionEventStatus';
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
  SavedSessionSetDraftView,
  SessionEventView,
  SessionSetView,
} from './types';
import { Tooltip } from "radix-ui";

// import { Field, FieldGroup } from "@/components/ui/field"
// import MainHeader from '@/components/portal/MainHeader';

type ArchivePreview = {
  participantCount: number;
  setCount: number;
  ratingSummaryIncluded: boolean;
};

function splitPreviewBody(body: string) {
  return body.split(/\n{2,}/).map((paragraph) => paragraph.trim()).filter(Boolean);
}

function formatSessionMemberName(name: string, isForced?: boolean, forcedCount?: number) {
  if (!isForced) {
    return name;
  }

  return `${name} (強制追加${forcedCount && forcedCount > 0 ? forcedCount : ''})`;
}

function renderSessionMemberName(
  name: string,
  options?: { isForced?: boolean; forcedCount?: number; requestedInRound1?: boolean },
) {
  return (
    <span className="inline-flex items-center gap-1">
      {options?.requestedInRound1 ? <Star className="size-3.5 fill-amber-400 text-amber-500" /> : null}
      <span>{formatSessionMemberName(name, options?.isForced, options?.forcedCount)}</span>
    </span>
  );
}

function buildSessionMemberOptionValue(instrument: Instrument, name: string) {
  return `${instrument}::${name}`;
}

type SessionMemberOption = {
  value: string;
  name: string;
  instrument: Instrument;
  label: string;
  subInstrument?: string | null;
};

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

type AdminNavGroup = {
  id: string;
  label: string;
  icon: ReactNode;
  children: { id: string; label: string }[];
  tooltip?: string;
};

const adminNavGroups: AdminNavGroup[] = [
  {
    id: 'admin-events',
    label: 'イベント管理',
    icon: <CalendarDays className="size-4" />,
    tooltip: 'イベントのリスト表示や、参加状況の確認、イベントの編集と新規作成、ステータス変更などを行います。',
    children: [
      { id: 'admin-events-create', label: 'イベント作成' },
      { id: 'admin-events-edit', label: 'イベント編集' },
    ],
  },
  {
    id: 'admin-session-sets',
    label: 'sessionSet 管理',
    icon: <Music4 className="size-4" />,
    tooltip: 'セッションで使用するセットの生成・公開を行います。',
    children: [
      { id: 'admin-session-sets-actions', label: '生成 / 公開' },
      { id: 'admin-session-sets-list', label: 'sessionSet 一覧' },
      { id: 'admin-session-sets-results', label: '生成結果' },
    ],
  },
  {
    id: 'admin-archives',
    label: 'レイティング / アーカイブ',
    icon: <FileArchive className="size-4" />,
    tooltip: 'レイティングの集計やアーカイブの作成・管理を行います。',
    children: [
      { id: 'admin-archives-summary', label: '評価集計' },
      { id: 'admin-archives-create', label: 'アーカイブ作成' },
      { id: 'admin-archives-list', label: 'アーカイブ一覧' },
    ],
  },
  {
    id: 'admin-members',
    label: 'メンバー / 管理者管理',
    icon: <Users className="size-4" />,
    tooltip: 'メンバーや管理者の検索・編集を行います。',
    children: [
      { id: 'admin-members-search', label: 'メンバー検索' },
      { id: 'admin-members-editor', label: 'プロフィール編集' },
      { id: 'admin-members-invitation', label: '新規メンバー仮登録' },
    ],
  },
  {
    id: 'admin-columns',
    label: 'コラム管理',
    icon: <BookOpenText className="size-4" />,
    tooltip: 'コラムの編集やプレビュー、一覧管理を行います。',
    children: [
      { id: 'admin-columns-editor', label: 'コラム編集' },
      { id: 'admin-columns-preview', label: 'プレビュー' },
      { id: 'admin-columns-list', label: '登録済みコラム' },
    ],
  },
  {
    id: 'admin-activity',
    label: 'アクティビティ / 通知',
    icon: <Bell className="size-4" />,
    children: [
      { id: 'admin-activity-log', label: 'アクティビティ履歴' },
      { id: 'admin-announcement-create', label: 'お知らせ作成' },
      { id: 'admin-mail-log', label: 'MailLog' },
    ],
  },
];

const defaultAdminGroupId = 'admin-activity';
const adminSelectionStorageKey = 'adlib-admin-dashboard-selection';
const legacyAdminSelectionStorageKey = 'adolib-admin-dashboard-selection';
const adminNavGroupIdSet = new Set(adminNavGroups.map((group) => group.id));
const adminNavChildIdsByGroup = new Map(adminNavGroups.map((group) => [group.id, new Set(group.children.map((child) => child.id))]));

type AdminPortalSectionProps = {
  loading: boolean;
  sessionEvents: SessionEventView[];
  selectedAdminEventId: string;
  selectedArchiveEventId: string;
  selectedAdminEvent: SessionEventView | null;
  eventTitle: string;
  eventVenue: string;
  eventDate: string;
  eventStartTime: string;
  eventEndTime: string;
  eventParticipantLimit: string;
  eventParticipationFee: string;
  eventHasAfterParty: boolean;
  eventAfterPartyFee: string;
  eventNotes: string;
  editEventTitle: string;
  editEventVenue: string;
  editEventDate: string;
  editEventStartTime: string;
  editEventEndTime: string;
  editEventParticipantLimit: string;
  editEventParticipationFee: string;
  editEventHasAfterParty: boolean;
  editEventAfterPartyFee: string;
  editEventNotes: string;
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
  generateDrumForcedAssignmentMax: string;
  setGenerateDrumForcedAssignmentMax: (value: string) => void;
  generateForcedAssignmentMax: string;
  setGenerateForcedAssignmentMax: (value: string) => void;
  savedSessionSetDrafts: SavedSessionSetDraftView[];
  activityLogs: ActivityLogView[];
  mailLogs: MailLogView[];
  members: MemberListView[];
  selectedManagedMemberId: string;
  selectedManagedMemberDetail: MemberDetailView | null;
  memberUpdateMessage: string | null;
  memberUpdateMessageTone: 'success' | 'error' | null;
  memberSearchQuery: string;
  memberInvitationEmail: string;
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
  setSelectedArchiveEventId: (value: string) => void;
  setEventTitle: (value: string) => void;
  setEventVenue: (value: string) => void;
  setEventDate: (value: string) => void;
  setEventStartTime: (value: string) => void;
  setEventEndTime: (value: string) => void;
  setEventParticipantLimit: (value: string) => void;
  setEventParticipationFee: (value: string) => void;
  setEventHasAfterParty: (value: boolean) => void;
  setEventAfterPartyFee: (value: string) => void;
  setEventNotes: (value: string) => void;
  setEditEventTitle: (value: string) => void;
  setEditEventVenue: (value: string) => void;
  setEditEventDate: (value: string) => void;
  setEditEventStartTime: (value: string) => void;
  setEditEventEndTime: (value: string) => void;
  setEditEventParticipantLimit: (value: string) => void;
  setEditEventParticipationFee: (value: string) => void;
  setEditEventHasAfterParty: (value: boolean) => void;
  setEditEventAfterPartyFee: (value: string) => void;
  setEditEventNotes: (value: string) => void;
  setEditEventStatus: (value: string) => void;
  setEditRound1StartAt: (value: string) => void;
  setEditRound1EndAt: (value: string) => void;
  setEditRound2StartAt: (value: string) => void;
  setEditRound2EndAt: (value: string) => void;
  setSelectedManagedMemberId: (value: string) => void;
  setMemberSearchQuery: (value: string) => void;
  setMemberInvitationEmail: (value: string) => void;
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
  onGenerateSets: (eventId?: string) => void;
  onPublishSets: () => void;
  onUpdateSessionSet: (sessionSet: SessionSetView) => void;
  onReorderSessionSets: (sourceSessionSetId: string, destinationSessionSetId: string) => void;
  onSaveEditedSessionSets: () => void;
  onSaveGeneratedSessionSets: () => void;
  onShowSavedSessionSetDraft: (draft: SavedSessionSetDraftView) => void;
  onRegenerateSavedSessionSetDraft: (draft: SavedSessionSetDraftView) => void;
  onSignOut: () => void;
  onCreateArchive: () => void;
  onDeleteArchive: (archiveId: string) => void;
  onUpdateMember: () => void;
  onDeleteMember: () => void;
  onCreateMemberInvitation: () => void;
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
    selectedArchiveEventId,
    selectedAdminEvent,
    eventTitle,
    eventVenue,
    eventDate,
    eventStartTime,
    eventEndTime,
    eventParticipantLimit,
    eventParticipationFee,
    eventHasAfterParty,
    eventAfterPartyFee,
    eventNotes,
    editEventTitle,
    editEventVenue,
    editEventDate,
    editEventStartTime,
    editEventEndTime,
    editEventParticipantLimit,
    editEventParticipationFee,
    editEventHasAfterParty,
    editEventAfterPartyFee,
    editEventNotes,
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
    generateDrumForcedAssignmentMax,
    setGenerateDrumForcedAssignmentMax,
    generateForcedAssignmentMax,
    setGenerateForcedAssignmentMax,
    savedSessionSetDrafts,
    activityLogs,
    mailLogs,
    members,
    selectedManagedMemberId,
    selectedManagedMemberDetail,
    memberUpdateMessage,
    memberUpdateMessageTone,
    memberSearchQuery,
    memberInvitationEmail,
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
    setSelectedArchiveEventId,
    setEventTitle,
    setEventVenue,
    setEventDate,
    setEventStartTime,
    setEventEndTime,
    setEventParticipantLimit,
    setEventParticipationFee,
    setEventHasAfterParty,
    setEventAfterPartyFee,
    setEventNotes,
    setEditEventTitle,
    setEditEventVenue,
    setEditEventDate,
    setEditEventStartTime,
    setEditEventEndTime,
    setEditEventParticipantLimit,
    setEditEventParticipationFee,
    setEditEventHasAfterParty,
    setEditEventAfterPartyFee,
    setEditEventNotes,
    setEditEventStatus,
    setEditRound1StartAt,
    setEditRound1EndAt,
    setEditRound2StartAt,
    setEditRound2EndAt,
    setSelectedManagedMemberId,
    setMemberSearchQuery,
    setMemberInvitationEmail,
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
    onUpdateSessionSet,
    onReorderSessionSets,
    onSaveEditedSessionSets,
    onSaveGeneratedSessionSets,
    onShowSavedSessionSetDraft,
    onRegenerateSavedSessionSetDraft,
    onCreateArchive,
    onDeleteArchive,
    onUpdateMember,
    onDeleteMember,
    onCreateMemberInvitation,
    onCreateAnnouncement,
    onCreateColumn,
    onUpdateColumn,
    onDeleteColumn,
    onResetColumnForm,
  } = props;
  const [activeGroupId, setActiveGroupId] = useState(defaultAdminGroupId);
  const [activeChildId, setActiveChildId] = useState<string | null>(null);
  const [openMobileGroupId, setOpenMobileGroupId] = useState(defaultAdminGroupId);
  const [openSessionEventIds, setOpenSessionEventIds] = useState<string[]>([]);
  const [hasRestoredSelection, setHasRestoredSelection] = useState(false);
  const [editingSessionSet, setEditingSessionSet] = useState<SessionSetView | null>(null);
  const [showSessionSetContainer, setShowSessionSetContainer] = useState(false);
  const [draggingSessionSetId, setDraggingSessionSetId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') {
      setHasRestoredSelection(true);
      return;
    }

    try {
      const rawSelection = window.localStorage.getItem(adminSelectionStorageKey)
        ?? window.localStorage.getItem(legacyAdminSelectionStorageKey);

      if (rawSelection) {
        const parsedSelection = JSON.parse(rawSelection) as {
          groupId?: string;
          childId?: string | null;
          openMobileGroupId?: string;
        };

        const nextGroupId = typeof parsedSelection.groupId === 'string' && adminNavGroupIdSet.has(parsedSelection.groupId)
          ? parsedSelection.groupId
          : defaultAdminGroupId;
        const nextChildId = typeof parsedSelection.childId === 'string' && adminNavChildIdsByGroup.get(nextGroupId)?.has(parsedSelection.childId)
          ? parsedSelection.childId
          : null;
        const nextOpenMobileGroupId = typeof parsedSelection.openMobileGroupId === 'string' && adminNavGroupIdSet.has(parsedSelection.openMobileGroupId)
          ? parsedSelection.openMobileGroupId
          : nextGroupId;

        setActiveGroupId(nextGroupId);
        setActiveChildId(nextChildId);
        setOpenMobileGroupId(nextOpenMobileGroupId);
        window.localStorage.removeItem(legacyAdminSelectionStorageKey);
      }
    } catch {
      window.localStorage.removeItem(adminSelectionStorageKey);
      window.localStorage.removeItem(legacyAdminSelectionStorageKey);
    }

    setHasRestoredSelection(true);
  }, []);

  useEffect(() => {
    if (!hasRestoredSelection || typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(adminSelectionStorageKey, JSON.stringify({
      groupId: activeGroupId,
      childId: activeChildId,
      openMobileGroupId,
    }));
  }, [activeChildId, activeGroupId, hasRestoredSelection, openMobileGroupId]);

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
  const generatableSessionEvents = sessionEvents.filter((sessionEvent) => sessionEvent.canGenerateSessionSets);
  const closedSessionEvents = sessionEvents.filter((sessionEvent) => sessionEvent.status === 'closed');
  const savedDraftEventIdSet = new Set(savedSessionSetDrafts.map((draft) => draft.sessionEventId));
  const hasSavedDraftForSelectedEvent = selectedAdminEventId ? savedDraftEventIdSet.has(selectedAdminEventId) : false;
  const isSessionSetSaveDisabled = loading
    || !selectedAdminEventId
    || sessionSets.length === 0;
  const handleSaveSessionSets = hasSavedDraftForSelectedEvent
    ? onSaveEditedSessionSets
    : onSaveGeneratedSessionSets;
  const frontMemberByName = new Map(
    members
      .filter((member) => member.mainInstrument === 'front')
      .map((member) => [member.displayName, member]),
  );
  const attendingEntries = selectedAdminEvent?.sessionEntries?.filter((entry) => entry.attendanceStatus === 'attending') ?? [];

  const buildInstrumentOptions = (instrument: Instrument) => {
    const seen = new Set<string>();
    return attendingEntries.flatMap((entry) => {
      if (entry.memberProfile.mainInstrument !== instrument) {
        return [] as SessionMemberOption[];
      }

      const name = entry.memberProfile.displayName;
      const value = buildSessionMemberOptionValue(instrument, name);
      if (seen.has(value)) {
        return [] as SessionMemberOption[];
      }
      seen.add(value);

      const subInstrument = instrument === 'front'
        ? frontMemberByName.get(name)?.subInstrument ?? null
        : null;

      return [{
        value,
        name,
        instrument,
        label: instrument === 'front' && subInstrument ? `${name} (${subInstrument})` : name,
        subInstrument,
      }];
    });
  };

  const instrumentOptions = {
    drum: buildInstrumentOptions('drum'),
    bass: buildInstrumentOptions('bass'),
    piano: buildInstrumentOptions('piano'),
    front: buildInstrumentOptions('front'),
    vocal: buildInstrumentOptions('vocal'),
  } as const;

  const previewParagraphs = splitPreviewBody(columnBody);
  const activeContentKey = `${activeGroupId}:${activeChildId ?? 'all'}`;

  const activeGroup = adminNavGroups.find((group) => group.id === activeGroupId) ?? adminNavGroups[0];
  const activeChild = activeGroup?.children.find((child) => child.id === activeChildId) ?? null;

  const handleGroupSelect = (groupId: string) => {
    setActiveGroupId(groupId);
    setActiveChildId(null);
    setOpenMobileGroupId(groupId);
  };

  const handleChildSelect = (groupId: string, childId: string) => {
    setActiveGroupId(groupId);
    setActiveChildId(childId);
    setOpenMobileGroupId(groupId);
    if (groupId === 'admin-session-sets' && (childId === 'admin-session-sets-list' || childId === 'admin-session-sets-results')) {
      setShowSessionSetContainer(true);
    }
  };

  const toggleSessionEventOpen = (sessionEventId: string) => {
    setOpenSessionEventIds((current) => (
      current.includes(sessionEventId)
        ? current.filter((id) => id !== sessionEventId)
        : [...current, sessionEventId]
    ));
  };

  const isGroupVisible = (groupId: string) => activeGroupId === groupId;
  const isChildVisible = (groupId: string, childId: string) => activeGroupId === groupId && (!activeChildId || activeChildId === childId);

  const buildFrontMemberFromOption = (option: SessionMemberOption) => ({
    id: option.value,
    name: option.name,
    subInstrument: option.subInstrument ?? null,
    isForced: false,
  });

  const buildBasicMemberFromOption = (option: SessionMemberOption) => ({
    id: option.value,
    name: option.name,
    isForced: false,
  });

  const getOptionListWithCurrentMember = (
    options: SessionMemberOption[],
    member: { name: string; subInstrument?: string | null } | null | undefined,
    instrument: Instrument,
  ) => {
    if (!member) {
      return options;
    }

    const value = buildSessionMemberOptionValue(instrument, member.name);
    if (options.some((option) => option.value === value)) {
      return options;
    }

    const subInstrument = instrument === 'front'
      ? member.subInstrument ?? frontMemberByName.get(member.name)?.subInstrument ?? null
      : null;

    return [{
      value,
      name: member.name,
      instrument,
      label: instrument === 'front' && subInstrument ? `${member.name} (${subInstrument})` : member.name,
      subInstrument,
    }, ...options];
  };

  const openSessionSetEditor = (sessionSet: SessionSetView) => {
    setEditingSessionSet({
      ...sessionSet,
      drum: sessionSet.drum ? { ...sessionSet.drum } : null,
      bass: sessionSet.bass ? { ...sessionSet.bass } : null,
      piano: sessionSet.piano ? { ...sessionSet.piano } : null,
      front: sessionSet.front?.map((member) => ({ ...member })) ?? [],
      vocal: sessionSet.vocal?.map((member) => ({ ...member })) ?? [],
    });
  };

  const updateEditingSessionSetMember = (
    field: 'drum' | 'bass' | 'piano',
    instrument: 'drum' | 'bass' | 'piano',
    value: string,
  ) => {
    setEditingSessionSet((current) => {
      if (!current) {
        return current;
      }

      if (value === NONE_VALUE) {
        return { ...current, [field]: null };
      }

      const option = instrumentOptions[instrument].find((candidate) => candidate.value === value);
      if (!option) {
        return current;
      }

      return {
        ...current,
        [field]: buildBasicMemberFromOption(option),
      };
    });
  };

  const updateEditingSessionSetArrayMember = (
    field: 'front' | 'vocal',
    index: number,
    instrument: 'front' | 'vocal',
    value: string,
  ) => {
    setEditingSessionSet((current) => {
      if (!current) {
        return current;
      }

      const nextMembers = [...(current[field] ?? [])];
      if (value === NONE_VALUE) {
        if (index < nextMembers.length) {
          nextMembers.splice(index, 1);
        }
      } else {
        const option = instrumentOptions[instrument].find((candidate) => candidate.value === value);
        if (!option) {
          return current;
        }
        nextMembers[index] = instrument === 'front'
          ? buildFrontMemberFromOption(option)
          : buildBasicMemberFromOption(option);
      }

      const dedupedMembers = nextMembers.filter((member, memberIndex, membersList) =>
        membersList.findIndex((candidate) => candidate.name === member.name) === memberIndex,
      );

      return {
        ...current,
        [field]: dedupedMembers,
      };
    });
  };

  const applyEditingSessionSet = () => {
    if (!editingSessionSet) {
      return;
    }

    onUpdateSessionSet(editingSessionSet);
    setEditingSessionSet(null);
  };

  const handleSessionSetDragStart = (event: DragEvent<HTMLLIElement>, sessionSetId: string) => {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', sessionSetId);
    setDraggingSessionSetId(sessionSetId);
  };

  const handleSessionSetDrop = (event: DragEvent<HTMLLIElement>, destinationSessionSetId: string) => {
    event.preventDefault();
    const sourceSessionSetId = event.dataTransfer.getData('text/plain') || draggingSessionSetId;
    setDraggingSessionSetId(null);

    if (!sourceSessionSetId || sourceSessionSetId === destinationSessionSetId) {
      return;
    }

    onReorderSessionSets(sourceSessionSetId, destinationSessionSetId);
  };

  const handleGenerateSets = (eventId?: string) => {
    setShowSessionSetContainer(true);
    onGenerateSets(eventId);
  };

  const handleShowSavedSessionSetDraft = (draft: SavedSessionSetDraftView) => {
    setShowSessionSetContainer(true);
    onShowSavedSessionSetDraft(draft);
  };

  const handleRegenerateSavedSessionSetDraft = (draft: SavedSessionSetDraftView) => {
    setShowSessionSetContainer(true);
    onRegenerateSavedSessionSetDraft(draft);
  };

  const getGroupLinkClassName = (groupId: string) => cn(
    'flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors',
    activeGroupId === groupId
      ? 'bg-tertiary text-primary-foreground shadow-sm'
      : 'text-foreground hover:bg-muted',
  );

  const getChildLinkClassName = (childId: string) => cn(
    'block rounded-lg px-3 py-1.5 text-sm transition-colors',
    activeChildId === childId
      ? 'bg-brand-base/50 text-brand-sub'
      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
  );

  const statusConversion = (status: string) => {
    return getSessionEventStatusLabel(status);
  };

  const attendanceStatusConversion = (status: string) => {
    switch (status) {
      case 'attending':
        return '参加';
      case 'undecided':
        return '未定';
      case 'absent':
        return '欠席';
      default:
        return status;
    }
  };

  const memberSubInstrument = (menberId: string) => {
    const member = members.find((m) => m.id === menberId);
    if (!member) {
      return null;
    }
    if (member.mainInstrument === 'front') {
      return member.subInstrument;
    }
    return null;
  };

  // console.log(generatedResult.forcedSessionSets)
  // console.log(sessionSets)
  console.log('selectedAdminEventId', selectedAdminEventId)
  // console.log('isChildVisible', isChildVisible)
  // console.log('savedSessionSetDrafts', savedSessionSetDrafts)
  // console.log('sessionEvents', sessionEvents)
  // console.log('filteredMembers', filteredMembers)
  // console.log(memberSubInstrument("f86759b3-8eb8-45cb-be74-373f538d058c"))
  // console.log(ratingSummaries)
  const ratingEventIds = [...new Set(ratingSummaries.map((summary) => summary.sessionEventId))];
  console.log('ratingEventIds', ratingEventIds)
  // ratingEventIds.map((eventId) => {
  //     console.log('eventId', eventId)
  //     const summariesForEvent = ratingSummaries.filter((summary) => summary.sessionEventId === eventId);
  //     console.log('title ', summariesForEvent[0]?.sessionEventTitle)
  //     console.log(summariesForEvent)
  // });

  return (
    <div id="admin-portal-section">
      {/* <MainHeader view="admin" currentUser={{ role: 'admin', displayName: adminMemberDisplayName }} auth={{ handleSignOut: onSignOut }} loading={loading} admin={{ adminMemberDisplayName }} /> */}
      <div className="mt-6 grid gap-0 xl:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="xl:sticky xl:top-24 xl:self-start">
          <div className="text-gray-700 px-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">コンテンツメニュー</p>
              <h2 className="text-lg font-semibold">管理ダッシュボード</h2>
              <p className="text-sm text-muted-foreground">左のメニューから表示するセクションとサブメニューを切り替えます。</p>
            </div>
            <Separator className="my-4 bg-secondary" />
            <nav id="mobil-dashboard" className="space-y-3 xl:hidden" aria-label="管理ダッシュボードメニュー（モバイル）">
              {adminNavGroups.map((group) => {
                const isOpen = openMobileGroupId === group.id;

                return (
                  <div key={group.id} className="overflow-hidden rounded-xl border border-border/70 bg-background/80">
                    <div className="flex items-center gap-2 p-2">
                      <button
                        type="button"
                        aria-current={activeGroupId === group.id ? 'location' : undefined}
                        className={cn(getGroupLinkClassName(group.id), 'min-w-0 flex-1 text-left')}
                        onClick={() => handleGroupSelect(group.id)}
                      >
                        {group.icon}
                        <span className="truncate">{group.label}</span>
                      </button>
                      <button
                        type="button"
                        aria-expanded={isOpen}
                        aria-controls={`${group.id}-submenu`}
                        className="inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        onClick={() => setOpenMobileGroupId(isOpen ? '' : group.id)}
                      >
                        <ChevronDown className={cn('size-4 transition-transform', isOpen ? 'rotate-180' : 'rotate-0')} />
                      </button>
                    </div>
                    {isOpen ? (
                      <div id={`${group.id}-submenu`} className="border-t border-border/70 px-2 pb-2 pt-1">
                        {group.children.map((child) => (
                          <button
                            type="button"
                            key={child.id}
                            aria-current={activeChildId === child.id ? 'location' : undefined}
                            className={cn(getChildLinkClassName(child.id), 'w-full text-left')}
                            onClick={() => handleChildSelect(group.id, child.id)}
                          >
                            {child.label}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </nav>
            <nav id="desktop-dashboard" className="hidden space-y-4 xl:block" aria-label="管理ダッシュボードメニュー">
              {adminNavGroups.map((group) => (
                <div key={group.id} className="space-y-1.5">
                  <Tooltip.Provider>
                    <Tooltip.Root>
                      <Tooltip.Trigger asChild>
                        <button className="IconButton absolute right-10">
                          <MessageCircleQuestionMark size={16} />
                        </button>
                      </Tooltip.Trigger>
                      <Tooltip.Portal>
                        <Tooltip.Content className="TooltipContent text-sm bg-gray-700 text-white p-2 rounded-md w-64" sideOffset={5}>
                          {group.tooltip ?? 'このセクションの内容を表示します。'}
                          <Tooltip.Arrow className="TooltipArrow" />
                        </Tooltip.Content>
                      </Tooltip.Portal>
                    </Tooltip.Root>
                  </Tooltip.Provider>
                  <button
                    type="button"
                    aria-current={activeGroupId === group.id ? 'location' : undefined}
                    className={cn(getGroupLinkClassName(group.id), 'text-gray-700 w-full text-left cursor-pointer')}
                    onClick={() => handleGroupSelect(group.id)}
                  >
                    {group.icon}
                    <span>{group.label}</span>
                  </button>
                  {/* <div className="space-y-1 border-l border-border/80 pl-4">
                  {group.children.map((child) => (
                    <button
                      type="button"
                      key={child.id}
                      aria-current={activeChildId === child.id ? 'location' : undefined}
                      className={cn(getChildLinkClassName(child.id), 'w-full text-left')}
                      onClick={() => handleChildSelect(group.id, child.id)}
                    >
                      {child.label}
                    </button>
                  ))}
                </div> */}
                </div>
              ))}
            </nav>
          </div>
        </aside>

        <div className="min-w-0 pr-4">
          <div className="rounded-2xl bg-tertiary p-4 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">現在表示中</p>
                <h3 className="text-xl font-semibold">{activeGroup?.label}</h3>
                <p className="text-sm text-muted-foreground">このセクションの全コンテンツを表示しています。</p>
              </div>
              {activeChild ? (
                <Button type="button" variant="outline" size="sm" onClick={() => setActiveChildId(null)}>
                  セクション全体を表示
                </Button>
              ) : null}
            </div>
          </div>


          <div key={activeContentKey} className="admin-content-stage">

            <Section sectionId="admin-events" title="イベント管理" description="新規イベント作成と既存イベントの公開フローを管理します。" className={cn(!isGroupVisible('admin-events') && 'hidden', 'border-gray-300')}>
              <div className="flex gap-2 items-start">
                <Dialog>
                  <form className="mb-4">
                    <DialogTrigger asChild>
                      <Button variant="secondary">新規イベント作成</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-xl bg-neutral-200">
                      <DialogHeader>
                        <DialogTitle>イベント作成</DialogTitle>
                        <DialogDescription>
                          新しいイベントを作成します。
                        </DialogDescription>
                      </DialogHeader>
                      <div id="admin-event-edit" className="grid gap-4 py-4 sm:grid-cols-2">
                        <Field htmlFor="admin-event-title" label="イベント名" className="sm:col-span-2">
                          <Input id="admin-event-title" type="text" placeholder="イベント名" value={eventTitle} onChange={(event) => setEventTitle(event.target.value)} />
                        </Field>
                        <Field htmlFor="admin-event-venue" label="会場" className="sm:col-span-2">
                          <Input id="admin-event-venue" type="text" placeholder="会場" value={eventVenue} onChange={(event) => setEventVenue(event.target.value)} />
                        </Field>
                        <Field htmlFor="admin-event-date" label="開催日">
                          <Input id="admin-event-date" type="date" value={eventDate} onChange={(event) => setEventDate(event.target.value)} />
                        </Field>
                        <Field htmlFor="admin-event-start-time" label="開始時間">
                          <Input id="admin-event-start-time" type="time" value={eventStartTime} onChange={(event) => setEventStartTime(event.target.value)} />
                        </Field>
                        <Field htmlFor="admin-event-end-time" label="終了時間">
                          <Input id="admin-event-end-time" type="time" value={eventEndTime} onChange={(event) => setEventEndTime(event.target.value)} />
                        </Field>
                        <Field htmlFor="admin-event-participant-limit" label="参加人数上限">
                          <Input id="admin-event-participant-limit" type="number" min="0" step="1" placeholder="30" value={eventParticipantLimit} onChange={(event) => setEventParticipantLimit(event.target.value)} />
                        </Field>
                        <Field htmlFor="admin-event-fee" label="参加料金">
                          <Input id="admin-event-fee" type="number" min="0" step="1" placeholder="3000" value={eventParticipationFee} onChange={(event) => setEventParticipationFee(event.target.value)} />
                        </Field>
                        <div className="sm:col-span-2 flex items-center gap-3 rounded-lg border bg-background/70 px-3 py-3">
                          <Checkbox id="admin-event-after-party" checked={eventHasAfterParty} onCheckedChange={(checked) => setEventHasAfterParty(checked === true)} />
                          <Label htmlFor="admin-event-after-party">懇親会あり</Label>
                        </div>
                        {eventHasAfterParty ? (
                          <Field htmlFor="admin-event-after-party-fee" label="懇親会参加料金">
                            <Input id="admin-event-after-party-fee" type="number" min="0" step="1" placeholder="4000" value={eventAfterPartyFee} onChange={(event) => setEventAfterPartyFee(event.target.value)} />
                          </Field>
                        ) : null}
                        <Field htmlFor="admin-event-notes" label="備考" className="sm:col-span-2">
                          <Textarea id="admin-event-notes" rows={4} placeholder="注意事項や持ち物など" value={eventNotes} onChange={(event) => setEventNotes(event.target.value)} />
                        </Field>
                      </div>
                      <DialogFooter>
                        <DialogClose asChild>
                          <div className="flex w-full justify-end gap-2">
                            <Button variant="outline">Cancel</Button>
                            <Button className="w-fit" variant="secondary" type="submit" onClick={onCreateEvent} disabled={loading}>イベント作成</Button>
                          </div>
                        </DialogClose>
                        {/* <Button type="submit" onClick={onUpdateEvent} disabled={loading}>イベント更新</Button> */}
                      </DialogFooter>
                    </DialogContent>
                  </form>
                </Dialog>
                <Tooltip.Provider>
                  <Tooltip.Root>
                    <Tooltip.Trigger asChild>
                      <button className="IconButton">
                        <MessageCircleQuestionMark size={16} />
                      </button>
                    </Tooltip.Trigger>
                    <Tooltip.Portal>
                      <Tooltip.Content className="TooltipContent text-sm bg-gray-700 text-white p-2 rounded-md w-64" sideOffset={5}>
                        ここから新しいイベントを作成できます。イベントの開催日や会場などの基本情報を入力して、イベントを作成してください。作成後は、「イベント編集」で募集期間の設定やステータスの変更が出来ます。
                        <Tooltip.Arrow className="TooltipArrow" />
                      </Tooltip.Content>
                    </Tooltip.Portal>
                  </Tooltip.Root>
                </Tooltip.Provider>
              </div>

              <div id="admin-session-list" className="mb-4 bg-secondary p-2 rounded-lg">
                <h3 className="text-gray-100 text-lg font-semibold">イベント一覧</h3>
                <ul className="mt-3 space-y-3">
                  {/* sessionEvents イベントリスト */}
                  {sessionEvents.map((sessionEvent) => {
                    const isOpen = openSessionEventIds.includes(sessionEvent.id);
                    // sessionEntries イベントごとの参加エントリーリスト
                    const sessionEntries = sessionEvent.sessionEntries ?? [];

                    // 懇親会参加者の名前リスト
                    const afterPartyAttendMemberNames = sessionEntries
                      .filter((entry) => entry.afterPartyAttendanceStatus === 'attending')
                      .map((entry) => entry.memberProfile.displayName);

                    function formatDateTime(dateTimeString: string | null | undefined): ReactNode {
                      if (!dateTimeString) return '未定';
                      return formatEventDateTime(dateTimeString);
                    }

                    // function savedSessionSet(sessionEventId: string) {
                    //   const result = savedSessionSetDrafts.find((draft) => draft.id === sessionEventId);
                    //   return result;
                    // }
                    const savedSessionSet = savedSessionSetDrafts.find((draft) => draft.sessionEventId === sessionEvent.id);
                    // console.log('savedSessionSet', savedSessionSet?.title ?? 'なし');

                    return (
                      <li key={sessionEvent.id} className="overflow-hidden rounded-lg bg-taupe-100 p-2 space-y-2">
                        <div className="flex flex-wrap items-center gap-2 mb-0">
                          <span className="text-lg text-on-primary font-semibold">{sessionEvent.title}</span>
                          <Badge variant="outline">ステータス: {statusConversion(sessionEvent.status)}</Badge>
                        </div>
                        <div className="text-sm font-semibold bg-background text-on-background p-1 w-auto">
                          {formatEventSchedule(sessionEvent.eventDate, sessionEvent.startTime, sessionEvent.endTime)}
                          {sessionEvent.venue ? ` / ${sessionEvent.venue}` : ''}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-sm">
                          {sessionEvent.participantLimit != null ? <Badge variant="secondary">参加人数 {sessionEvent.attendingEntryCount ?? 0} / {sessionEvent.participantLimit}</Badge> : <Badge variant="secondary">参加人数 {sessionEvent.attendingEntryCount ?? 0}人</Badge>}
                          {sessionEvent.participantLimit != null ? <Badge variant={sessionEvent.isEntryCapacityFull ? 'destructive' : 'secondary'}>{sessionEvent.isEntryCapacityFull ? '満員' : `残り ${sessionEvent.remainingEntryCapacity ?? 0} 人`}</Badge> : null}
                          {sessionEvent.participationFee != null ? <Badge variant="secondary">参加料金 {formatYen(sessionEvent.participationFee)}</Badge> : null}
                          {sessionEvent.hasAfterParty ? <Badge variant="secondary">懇親会 {sessionEvent.afterPartyFee != null ? formatYen(sessionEvent.afterPartyFee) : '料金未定'}</Badge> : null}
                        </div>
                        {sessionEvent.notes ? <p className="text-sm text-gray-700">備考: {sessionEvent.notes}</p> : null}
                        <div className="pl-4">
                          <p className="text-sm text-gray-700"><span className="font-semibold text-xs">募集期間(Round1):</span> {formatDateTime(sessionEvent.round1StartAt)} 〜 {formatDateTime(sessionEvent.round1EndAt)}</p>
                          <p className="text-sm text-gray-700"><span className="font-semibold text-xs">募集期間(Round2):</span> {formatDateTime(sessionEvent.round2StartAt)} 〜 {formatDateTime(sessionEvent.round2EndAt)}</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-4">

                          <button
                            type="button"
                            aria-expanded={isOpen}
                            aria-controls={`session-event-${sessionEvent.id}`}
                            className="flex items-start justify-between gap-3 px-2 py-[0.4rem] text-left transition-colors hover:bg-muted/50 bg-tertiary rounded-lg"
                            onClick={() => toggleSessionEventOpen(sessionEvent.id)}
                          >
                            <div className="space-y-1">
                              <p className="text-sm text-on-tertiary">
                                【参加状況】 参加 {sessionEvent.attendingEntryCount ?? 0} 人 / エントリー {sessionEntries.length} 件{sessionEvent.participantLimit != null ? ` / 残り ${sessionEvent.remainingEntryCapacity ?? 0} 人` : ''}
                              </p>
                            </div>
                            <ChevronDown className={cn('mt-0.5 size-4 shrink-0 transition-transform', isOpen ? 'rotate-180' : 'rotate-0', 'text-gray-50')} />
                          </button>
                          <Dialog>
                            <form className="text-right">
                              <DialogTrigger asChild>
                                <Button variant="default" onClick={() => setSelectedAdminEventId(sessionEvent.id)}>イベント編集</Button>
                              </DialogTrigger>
                              <DialogContent className="sm:max-w-xl bg-neutral-200">
                                <DialogHeader>
                                  <DialogTitle>イベント編集</DialogTitle>
                                  <DialogDescription>
                                    募集ラウンドや公開状態、受付期間を更新できます。
                                  </DialogDescription>
                                </DialogHeader>
                                <div id="admin-event-edit" className="grid gap-4 py-4">
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
                                      <Field htmlFor="admin-edit-event-start-time" label="開始時間">
                                        <Input id="admin-edit-event-start-time" type="time" value={editEventStartTime} onChange={(event) => setEditEventStartTime(event.target.value)} />
                                      </Field>
                                      <Field htmlFor="admin-edit-event-end-time" label="終了時間">
                                        <Input id="admin-edit-event-end-time" type="time" value={editEventEndTime} onChange={(event) => setEditEventEndTime(event.target.value)} />
                                      </Field>
                                      <Field htmlFor="admin-edit-event-participant-limit" label="参加人数上限">
                                        <Input id="admin-edit-event-participant-limit" type="number" min="0" step="1" placeholder="30" value={editEventParticipantLimit} onChange={(event) => setEditEventParticipantLimit(event.target.value)} />
                                      </Field>
                                      <Field htmlFor="admin-edit-event-fee" label="参加料金">
                                        <Input id="admin-edit-event-fee" type="number" min="0" step="1" placeholder="3000" value={editEventParticipationFee} onChange={(event) => setEditEventParticipationFee(event.target.value)} />
                                      </Field>
                                      <Field label="ステータス" htmlFor="admin-edit-event-status">
                                        <Select value={editEventStatus} onValueChange={setEditEventStatus}>
                                          <SelectTrigger id="admin-edit-event-status" className="w-full">
                                            <SelectValue placeholder="ステータスを選択" />
                                          </SelectTrigger>
                                          <SelectContent className="bg-gray-200">
                                            <SelectItem value="draft">下書き</SelectItem>
                                            <SelectItem value="announced">告知</SelectItem>
                                            <SelectItem value="recruiting_round1">募集（ラウンド1）</SelectItem>
                                            <SelectItem value="recruiting_round2">募集（ラウンド2）</SelectItem>
                                            <SelectItem value="generating">生成中</SelectItem>
                                            <SelectItem value="published">公開</SelectItem>
                                            <SelectItem value="rating">レイティング</SelectItem>
                                            <SelectItem value="closed">終了</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </Field>
                                      <div className="sm:col-span-2 flex items-center gap-3 rounded-lg border bg-background/70 px-3 py-3">
                                        <Checkbox id="admin-edit-event-after-party" checked={editEventHasAfterParty} onCheckedChange={(checked) => setEditEventHasAfterParty(checked === true)} />
                                        <Label htmlFor="admin-edit-event-after-party">懇親会あり</Label>
                                      </div>
                                      {editEventHasAfterParty ? (
                                        <Field htmlFor="admin-edit-event-after-party-fee" label="懇親会参加料金">
                                          <Input id="admin-edit-event-after-party-fee" type="number" min="0" step="1" placeholder="4000" value={editEventAfterPartyFee} onChange={(event) => setEditEventAfterPartyFee(event.target.value)} />
                                        </Field>
                                      ) : null}
                                      <Field htmlFor="admin-edit-event-notes" label="備考" className="sm:col-span-2">
                                        <Textarea id="admin-edit-event-notes" rows={4} placeholder="注意事項や持ち物など" value={editEventNotes} onChange={(event) => setEditEventNotes(event.target.value)} />
                                      </Field>
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
                                      {/* <div className="sm:col-span-2">
                                      <Button type="button" onClick={onUpdateEvent} disabled={loading}>
                                        イベント更新
                                      </Button>
                                    </div> */}
                                    </div>
                                  ) : (
                                    <Alert>
                                      <AlertTitle>編集対象を選択してください</AlertTitle>
                                      <AlertDescription>登録済みイベントを選ぶと、公開ステータスと募集期間を編集できます。</AlertDescription>
                                    </Alert>
                                  )}
                                </div>
                                <DialogFooter>
                                  <DialogClose asChild>
                                    <div className="flex w-full justify-end gap-2">
                                      <Button variant="outline">Cancel</Button>
                                      <Button variant="default" type="submit" onClick={onUpdateEvent} disabled={loading}>イベント更新</Button>
                                    </div>
                                  </DialogClose>
                                  {/* <Button type="submit" onClick={onUpdateEvent} disabled={loading}>イベント更新</Button> */}
                                </DialogFooter>
                              </DialogContent>
                            </form>
                          </Dialog>
                        </div>
                        {isOpen ? (
                          <div id={`session-event-${sessionEvent.id}`} className="border-t border-border/70 px-4 py-4">
                            {sessionEntries.length === 0 ? (
                              <p className="text-sm text-muted-foreground">このイベントへの参加エントリーはまだありません。</p>
                            ) : (
                              <div className="flex gap-4 md:flex-row">
                                <ul className="space-y-1 grid gap-1 md:grid-cols-2">
                                  {sessionEntries.map((entry) => {
                                    const round1Requests = entry.requests.filter((request) => request.round === 1);
                                    const round2Requests = entry.requests.filter((request) => request.round === 2);

                                    return (
                                      <li key={entry.id} className="rounded-lg border bg-card/80 p-4">
                                        <p>{entry.afterPartyAttendanceStatus}</p>
                                        <div className="flex flex-wrap items-center gap-2">
                                          <span className="font-medium">{entry.memberProfile.displayName}</span>
                                          <Badge variant="secondary">{entry.memberProfile.mainInstrument}</Badge>
                                          <span>{memberSubInstrument(entry.memberProfile.id)}</span>
                                          <Badge variant={entry.attendanceStatus === 'attending' ? 'default' : 'outline'}>
                                            {attendanceStatusConversion(entry.attendanceStatus)}
                                          </Badge>
                                          {sessionEvent.hasAfterParty ? (
                                            <Badge variant={entry.afterPartyAttendanceStatus === 'attending' ? 'default' : 'outline'}>
                                              懇親会 {entry.afterPartyAttendanceStatus ? attendanceStatusConversion(entry.afterPartyAttendanceStatus) : '未回答'}
                                            </Badge>
                                          ) : null}
                                        </div>
                                        <div className="mt-3">

                                          <div className="">
                                            <div className="space-y-2 mb-4">
                                              <p className="text-xs font-medium py-1 px-2 bg-secondary text-on-secondary w-29">Round 1 の希望曲</p>
                                              {round1Requests.length === 0 ? (
                                                <p className="text-sm text-muted-foreground">登録なし</p>
                                              ) : (
                                                <ul className="space-y-1 text-sm text-muted-foreground">
                                                  {round1Requests.map((request) => (
                                                    <li key={request.id}>
                                                      第{request.priority}希望: <span className="font-semibold">{request.songTitleSnapshot}
                                                        {request.keyName ? ` (${request.keyName})` : ''}</span>
                                                    </li>
                                                  ))}
                                                </ul>
                                              )}
                                            </div>
                                            <div className="space-y-2">
                                              <p className="text-xs font-medium py-1 px-2 bg-secondary text-on-secondary w-29">Round 2 の希望曲</p>
                                              {round2Requests.length === 0 ? (
                                                <p className="text-sm text-muted-foreground">登録なし</p>
                                              ) : (
                                                <ul className="space-y-1 text-sm text-muted-foreground">
                                                  {round2Requests.map((request) => (
                                                    <li key={request.id}>
                                                      第{request.priority}希望: {request.songTitleSnapshot}
                                                      {request.keyName ? ` (${request.keyName})` : ''}
                                                    </li>
                                                  ))}
                                                </ul>
                                              )}
                                            </div>
                                          </div>

                                        </div>
                                      </li>
                                    );
                                  })}
                                </ul>
                                <div className="">
                                  <h4 className="text-sm bg-pearl-beige px-2 py-1 mb-4">名寄せしたリクエスト曲リスト({sessionEvent.round2CandidateSongs?.length || 0}曲)</h4>
                                  <div>
                                    {sessionEvent.round2CandidateSongs?.length ? (
                                      <ul className="space-y-1 text-sm text-muted-foreground">
                                        {sessionEvent.round2CandidateSongs.map((song, index) => (
                                          <li key={index}>
                                            {song}
                                          </li>
                                        ))}
                                      </ul>
                                    ) : (
                                      <p className="text-sm text-muted-foreground">登録なし</p>
                                    )}
                                  </div>
                                </div>
                                <div>
                                  <h4 className="text-sm bg-pearl-beige px-2 py-1 mb-4">懇親会参加人数({afterPartyAttendMemberNames.length || 0}人)</h4>
                                  <div>
                                    {afterPartyAttendMemberNames.length ? (
                                      <ul className="space-y-1 text-sm text-muted-foreground">
                                        {afterPartyAttendMemberNames.map((name, index) => (
                                          <li key={index}>
                                            {name}
                                          </li>
                                        ))}
                                      </ul>
                                    ) : (
                                      <p className="text-sm text-muted-foreground">参加なし</p>
                                    )}
                                  </div>

                                </div>
                              </div>
                            )}
                            <div className="mt-4">
                              <h4 className="font-medium">イベントコメント</h4>
                              {!sessionEvent.comments?.length ? (
                                <p className="mt-2 text-sm text-muted-foreground">投稿されたコメントはまだありません。</p>
                              ) : (
                                <ul className="mt-3 space-y-2">
                                  {sessionEvent.comments.map((comment) => (
                                    <li key={comment.id} className="rounded-lg border bg-card/80 p-3 text-sm">
                                      <div className="flex flex-wrap items-center gap-2">
                                        <Badge variant="secondary">{comment.memberDisplayName}</Badge>
                                        <span className="text-muted-foreground">{new Date(comment.createdAt).toLocaleString('ja-JP')}</span>
                                      </div>
                                      <p className="mt-2 leading-7 text-muted-foreground">{comment.body}</p>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          </div>
                        ) : null}
                        <div className="flex gap-2 text-secondary">
                          <p className="text-xs">保存済みセッションセット: <span className={`${savedSessionSet ? 'text-accent' : ''} font-semibold`}>{savedSessionSet ? savedSessionSet.title : 'なし'}</span></p>
                          <Tooltip.Provider>
                            <Tooltip.Root>
                              <Tooltip.Trigger asChild>
                                <button className="IconButton">
                                  <MessageCircleQuestionMark size={16} />
                                </button>
                              </Tooltip.Trigger>
                              <Tooltip.Portal>
                                <Tooltip.Content className="TooltipContent text-sm bg-gray-700 text-white p-2 rounded-md w-64" sideOffset={5}>
                                  保存済セッションセットがある場合はsessionSet管理で確認出来ます。
                                  <Tooltip.Arrow className="TooltipArrow" />
                                </Tooltip.Content>
                              </Tooltip.Portal>
                            </Tooltip.Root>
                          </Tooltip.Provider>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </Section>

            <Section sectionId="admin-session-sets" title="sessionSet 管理" description="生成、公開、結果確認をまとめて行います。" className={cn(!isGroupVisible('admin-session-sets') && 'hidden')}>
              <div id="admin-session-sets-actions" className={cn('flex scroll-mt-24 flex-wrap items-end gap-3', !isChildVisible('admin-session-sets', 'admin-session-sets-actions') && 'hidden')}>
                <Field htmlFor="admin-generate-drum-forced-max" label="drum の強制追加数" description="未入力時は現在の既定値を使います。">
                  <Input
                    id="admin-generate-drum-forced-max"
                    type="number"
                    min={0}
                    inputMode="numeric"
                    className="w-40"
                    value={generateDrumForcedAssignmentMax}
                    onChange={(event) => setGenerateDrumForcedAssignmentMax(event.target.value)}
                  />
                </Field>
                <Field htmlFor="admin-generate-forced-max" label="その他楽器の強制追加数" description="bass、piano、front に適用します。">
                  <Input
                    id="admin-generate-forced-max"
                    type="number"
                    min={0}
                    inputMode="numeric"
                    className="w-40"
                    value={generateForcedAssignmentMax}
                    onChange={(event) => setGenerateForcedAssignmentMax(event.target.value)}
                  />
                </Field>
              </div>
              <div className={cn('mt-4 rounded-xl border p-4', !isChildVisible('admin-session-sets', 'admin-session-sets-actions') && 'hidden')}>
                <div className="space-y-1">
                  <h3 className="font-medium">sessionSet 生成可能イベント</h3>
                  <p className="text-sm text-muted-foreground">round2 終了後のイベントだけ、ここから個別に生成できます。</p>
                </div>
                {generatableSessionEvents.length === 0 ? (
                  <p className="mt-3 text-sm text-muted-foreground">現在、sessionSet を生成できるイベントはありません。</p>
                ) : (
                  <ul className="mt-3 space-y-3">
                    {generatableSessionEvents.map((sessionEvent) => (
                      <li key={sessionEvent.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card/80 p-4">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-medium">{sessionEvent.title}</p>
                            <Badge variant="outline">{statusConversion(sessionEvent.status)}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            候補曲 {sessionEvent.round2CandidateSongs?.length ?? 0} 曲 / 参加エントリー {sessionEvent._count?.sessionEntries ?? 0} 件 / 既存 sessionSet {sessionEvent._count?.sessionSets ?? 0} 件
                          </p>
                        </div>
                        <div>
                          <Badge>{savedDraftEventIdSet.has(sessionEvent.id) ? '保存済み' : '未保存'}</Badge>
                          <Button type="button" size="sm" disabled={loading || savedDraftEventIdSet.has(sessionEvent.id)} onClick={() => handleGenerateSets(sessionEvent.id)}>
                            sessionSet 生成
                          </Button>
                          <Button type="button" variant="secondary" onClick={onPublishSets} disabled={loading || !selectedAdminEventId || sessionSets.length === 0}>
                            sessionSet 公開
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <Separator className={cn('my-4', !isChildVisible('admin-session-sets', 'admin-session-sets-list') && !isChildVisible('admin-session-sets', 'admin-session-sets-results') && 'hidden', 'bg-secondary')} />
              <div className="rounded-xl border p-4 lg:col-span-2 bg-gray-200">
                <h3 className="font-medium">保存済み sessionSet</h3>
                {savedSessionSetDrafts.length === 0 ? (
                  <p className="mt-3 text-sm text-muted-foreground">保存済み sessionSet はありません。</p>
                ) : (
                  <ul className="mt-3 space-y-3">
                    {savedSessionSetDrafts.map((draft) => (
                      <li key={draft.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card/80 p-4">
                        <div className="space-y-1">
                          <p className="font-medium">{draft.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {draft.sessionSetCount} 件 / 更新 {new Date(draft.updatedAt).toLocaleString('ja-JP')}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button type="button" variant="outline" size="sm" disabled={loading} onClick={() => handleShowSavedSessionSetDraft(draft)}>
                            表示
                          </Button>
                          <Button type="button" size="sm" disabled={loading} onClick={() => handleRegenerateSavedSessionSetDraft(draft)}>
                            再生成
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <Separator className={cn('my-4', !isChildVisible('admin-session-sets', 'admin-session-sets-list') && !isChildVisible('admin-session-sets', 'admin-session-sets-results') && 'hidden', 'bg-secondary')} />
              {/* <div id="session-set-container" className="bg-slate-900 p-2 rounded-2xl text-white"> */}
              <div id="session-set-container" className={cn('bg-slate-900 p-2 rounded-2xl text-white', (!showSessionSetContainer || !isChildVisible('admin-session-sets', 'admin-session-sets-results')) && 'hidden')}>
                {/* <h3 className={cn('font-medium my-2', !isChildVisible('admin-session-sets', 'admin-session-sets-list') && 'hidden')}> */}
                <div className="mb-2 flex items-start justify-between gap-3">
                  <h3 className="font-medium">
                    {selectedAdminEvent ? `${selectedAdminEvent.title} の sessionSet` : 'この sessionSetを書き出したイベント名'}
                  </h3>
                  <p>演奏順はPDF書き出し時に「非公開」の曲を除外して番号が振られます。</p>
                  <div className="flex flex-wrap justify-end gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      disabled={sessionSets.length === 0}
                      onClick={() => downloadSessionSetPdf({ sessionEvent: selectedAdminEvent, sessionSets })}
                    >
                      <FileDown className="size-4" />
                      PDF
                    </Button>
                    <Button type="button" variant="secondary" size="sm" onClick={() => setShowSessionSetContainer(false)}>
                      閉じる
                    </Button>
                  </div>
                </div>
                {sessionSets.length === 0 ? <p className={cn('text-sm text-muted-foreground', !isChildVisible('admin-session-sets', 'admin-session-sets-list') && 'hidden')}>まだ sessionSet はありません。</p> : (
                  // <ul id="admin-session-sets-list" className={cn('grid scroll-mt-24 gap-3 md:grid-cols-2', !isChildVisible('admin-session-sets', 'admin-session-sets-list') && 'hidden')}>
                  <ul id="admin-session-sets-list" className="grid scroll-mt-24 gap-3 md:grid-cols-2">
                    {sessionSets.map((sessionSet, index) => (
                      <li
                        key={sessionSet.id}
                        draggable={!loading}
                        onDragStart={(event) => handleSessionSetDragStart(event, sessionSet.id)}
                        onDragOver={(event) => event.preventDefault()}
                        onDrop={(event) => handleSessionSetDrop(event, sessionSet.id)}
                        onDragEnd={() => setDraggingSessionSetId(null)}
                        className={cn(
                          'rounded-xl p-4 transition-opacity',
                          !loading && 'cursor-grab active:cursor-grabbing',
                          draggingSessionSetId === sessionSet.id && 'opacity-50',
                          sessionSet.isPublished ? 'bg-sky-800' : 'bg-gray-400',
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-2">
                            <GripVertical className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                            <div>
                              <p className="font-bold"><Badge>{sessionSet.setOrder ?? index + 1}</Badge> {sessionSet.songTitle}</p>
                              <p className="text-sm text-muted-foreground">key {sessionSet.key ?? '-'}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex items-start gap-3">
                              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Checkbox
                                  checked={sessionSet.isPublished === true}
                                  disabled={loading}
                                  onCheckedChange={(checked) => onUpdateSessionSet({
                                    ...sessionSet,
                                    isPublished: checked === true,
                                  })}
                                />
                                <span>{sessionSet.isPublished ? '公開中' : '非公開'}</span>
                              </label>
                            </div>
                            {sessionSet.isPublished ? <Badge>公開中</Badge> : <Badge variant="destructive">下書き</Badge>}
                            <Button type="button" variant="default" size="sm" disabled={loading} onClick={() => openSessionSetEditor(sessionSet)}>
                              編集
                            </Button>
                          </div>
                        </div>
                        <div className="mt-3 flex items-center gap-1">
                          <span className="mr-1 text-xs text-muted-foreground">演奏順</span>
                          <Button
                            type="button"
                            variant="secondary"
                            size="icon-sm"
                            disabled={loading || index === 0}
                            onClick={() => onReorderSessionSets(sessionSet.id, sessionSets[index - 1].id)}
                            aria-label={`${sessionSet.songTitle} を1曲上へ移動`}
                          >
                            <ArrowUp className="size-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="secondary"
                            size="icon-sm"
                            disabled={loading || index === sessionSets.length - 1}
                            onClick={() => onReorderSessionSets(sessionSet.id, sessionSets[index + 1].id)}
                            aria-label={`${sessionSet.songTitle} を1曲下へ移動`}
                          >
                            <ArrowDown className="size-4" />
                          </Button>
                        </div>
                        <div className="mt-3 grid gap-2 text-sm text-muted-foreground">
                          <div className="flex items-start gap-4">
                          <p>drum {sessionSet.drum ? renderSessionMemberName(sessionSet.drum.name, sessionSet.drum) : '-'}</p>
                          <p>bass {sessionSet.bass ? renderSessionMemberName(sessionSet.bass.name, sessionSet.bass) : '-'}</p>
                          <p>piano {sessionSet.piano ? renderSessionMemberName(sessionSet.piano.name, sessionSet.piano) : '-'}</p>
                          </div>
                          <p>
                            front {sessionSet.front?.length
                              ? sessionSet.front.map((member, index) => (
                                <span key={`${member.id}-${index}`}>
                                  {index > 0 ? ', ' : null}
                                  {renderSessionMemberName(member.name, member)}
                                  {member.subInstrument ? ` (${member.subInstrument})` : null}
                                </span>
                              ))
                              : '-'}
                          </p>
                          <p>
                            vocal {sessionSet.vocal?.length
                              ? sessionSet.vocal.map((member, index) => (
                                <span key={`${member.id}-${index}`}>
                                  {index > 0 ? ', ' : null}
                                  {renderSessionMemberName(member.name, member)}
                                  {sessionSet.key ? ` (key ${sessionSet.key})` : null}
                                </span>
                              ))
                              : '-'}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
                <div className={cn('mt-4 flex flex-wrap gap-2', !isChildVisible('admin-session-sets', 'admin-session-sets-list') && 'hidden')}>
                  <Button type="button" onClick={handleSaveSessionSets} disabled={isSessionSetSaveDisabled}>
                    {selectedAdminEvent
                      ? hasSavedDraftForSelectedEvent
                        ? `「${selectedAdminEvent.title} sessionSet」を上書き保存`
                        : `「${selectedAdminEvent.title} sessionSet」として保存`
                      : hasSavedDraftForSelectedEvent
                        ? 'sessionSet を上書き保存'
                        : 'sessionSet を保存'}
                  </Button>
                </div>
                <Dialog open={Boolean(editingSessionSet)} onOpenChange={(open) => { if (!open) setEditingSessionSet(null); }}>
                  <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>sessionSet を編集</DialogTitle>
                      <DialogDescription>各セッションの曲名、key、担当メンバーを個別に調整できます。</DialogDescription>
                    </DialogHeader>
                    {editingSessionSet ? (
                      <div className="grid gap-4 py-2 sm:grid-cols-2">
                        <Field htmlFor="admin-edit-session-set-song-title" label="曲名" className="sm:col-span-2">
                          <Input
                            id="admin-edit-session-set-song-title"
                            type="text"
                            value={editingSessionSet.songTitle}
                            onChange={(event) => setEditingSessionSet((current) => current ? ({ ...current, songTitle: event.target.value }) : current)}
                          />
                        </Field>
                        <Field htmlFor="admin-edit-session-set-key" label="key">
                          <Input
                            id="admin-edit-session-set-key"
                            type="text"
                            value={editingSessionSet.key ?? ''}
                            onChange={(event) => setEditingSessionSet((current) => current ? ({ ...current, key: event.target.value || null }) : current)}
                          />
                        </Field>
                        <Field label="公開設定" className="sm:col-span-2">
                          <label className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Checkbox
                              checked={editingSessionSet.isPublished === true}
                              onCheckedChange={(checked) => setEditingSessionSet((current) => current ? ({
                                ...current,
                                isPublished: checked === true,
                              }) : current)}
                            />
                            <span>{editingSessionSet.isPublished ? '公開中' : '非公開'}</span>
                          </label>
                        </Field>
                        <Field label="drum">
                          <Select value={editingSessionSet.drum ? buildSessionMemberOptionValue('drum', editingSessionSet.drum.name) : NONE_VALUE} onValueChange={(value) => updateEditingSessionSetMember('drum', 'drum', value)}>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="drum を選択" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={NONE_VALUE}>未設定</SelectItem>
                              {getOptionListWithCurrentMember(instrumentOptions.drum, editingSessionSet.drum, 'drum').map((option) => (
                                <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </Field>
                        <Field label="bass">
                          <Select value={editingSessionSet.bass ? buildSessionMemberOptionValue('bass', editingSessionSet.bass.name) : NONE_VALUE} onValueChange={(value) => updateEditingSessionSetMember('bass', 'bass', value)}>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="bass を選択" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={NONE_VALUE}>未設定</SelectItem>
                              {getOptionListWithCurrentMember(instrumentOptions.bass, editingSessionSet.bass, 'bass').map((option) => (
                                <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </Field>
                        <Field label="piano">
                          <Select value={editingSessionSet.piano ? buildSessionMemberOptionValue('piano', editingSessionSet.piano.name) : NONE_VALUE} onValueChange={(value) => updateEditingSessionSetMember('piano', 'piano', value)}>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="piano を選択" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={NONE_VALUE}>未設定</SelectItem>
                              {getOptionListWithCurrentMember(instrumentOptions.piano, editingSessionSet.piano, 'piano').map((option) => (
                                <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </Field>
                        <Field label="front 1">
                          <Select value={editingSessionSet.front?.[0] ? buildSessionMemberOptionValue('front', editingSessionSet.front[0].name) : NONE_VALUE} onValueChange={(value) => updateEditingSessionSetArrayMember('front', 0, 'front', value)}>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="front 1 を選択" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={NONE_VALUE}>未設定</SelectItem>
                              {getOptionListWithCurrentMember(instrumentOptions.front, editingSessionSet.front?.[0], 'front').map((option) => (
                                <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </Field>
                        <Field label="front 2">
                          <Select value={editingSessionSet.front?.[1] ? buildSessionMemberOptionValue('front', editingSessionSet.front[1].name) : NONE_VALUE} onValueChange={(value) => updateEditingSessionSetArrayMember('front', 1, 'front', value)}>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="front 2 を選択" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={NONE_VALUE}>未設定</SelectItem>
                              {getOptionListWithCurrentMember(instrumentOptions.front, editingSessionSet.front?.[1], 'front').map((option) => (
                                <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </Field>
                        <Field label="vocal">
                          <Select value={editingSessionSet.vocal?.[0] ? buildSessionMemberOptionValue('vocal', editingSessionSet.vocal[0].name) : NONE_VALUE} onValueChange={(value) => updateEditingSessionSetArrayMember('vocal', 0, 'vocal', value)}>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="vocal を選択" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={NONE_VALUE}>未設定</SelectItem>
                              {getOptionListWithCurrentMember(instrumentOptions.vocal, editingSessionSet.vocal?.[0], 'vocal').map((option) => (
                                <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </Field>
                      </div>
                    ) : null}
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setEditingSessionSet(null)}>キャンセル</Button>
                      <Button type="button" onClick={applyEditingSessionSet} disabled={loading || !editingSessionSet}>一覧に反映</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                {(generatedResult.forcedSessionSets.length > 0 || generatedResult.skippedSongs.length > 0 || savedSessionSetDrafts.length > 0) && (
                  <div id="admin-session-sets-results" className={cn('mt-4 grid scroll-mt-24 gap-4 lg:grid-cols-2', !isChildVisible('admin-session-sets', 'admin-session-sets-results') && 'hidden')}>
                    {generatedResult.forcedSessionSets.length > 0 && (
                      <div className="rounded-xl border p-4">
                        <h3 className="font-medium border-b">強制追加</h3>
                        <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                          {generatedResult.forcedSessionSets.map((item) => (
                            <li key={item.songTitle}>{item.songTitle} / {item.forcedInstruments.join(', ')}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {generatedResult.skippedSongs.length > 0 && (
                      <div className="rounded-xl border p-4">
                        <h3 className="font-medium border-b">未生成理由</h3>
                        <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                          {generatedResult.skippedSongs.map((item) => (
                            <li key={item.songTitle}>{item.songTitle} / {item.reasons.join(' / ')}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                  </div>
                )}
              </div>
              {/* <Separator className={cn('my-4', !isChildVisible('admin-session-sets', 'admin-session-sets-list') && !isChildVisible('admin-session-sets', 'admin-session-sets-results') && 'hidden', 'bg-secondary')} />
              <div className="rounded-xl border p-4 lg:col-span-2 bg-gray-200">
                <h3 className="font-medium">保存済み sessionSet</h3>
                {savedSessionSetDrafts.length === 0 ? (
                  <p className="mt-3 text-sm text-muted-foreground">保存済み sessionSet はありません。</p>
                ) : (
                  <ul className="mt-3 space-y-3">
                    {savedSessionSetDrafts.map((draft) => (
                      <li key={draft.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card/80 p-4">
                        <div className="space-y-1">
                          <p className="font-medium">{draft.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {draft.sessionSetCount} 件 / 更新 {new Date(draft.updatedAt).toLocaleString('ja-JP')}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button type="button" variant="outline" size="sm" disabled={loading} onClick={() => onShowSavedSessionSetDraft(draft)}>
                            表示
                          </Button>
                          <Button type="button" size="sm" disabled={loading} onClick={() => onRegenerateSavedSessionSetDraft(draft)}>
                            再生成
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div> */}
            </Section>

            <Section sectionId="admin-archives" title="レイティング / アーカイブ" description="評価集計の確認とアーカイブ作成を行います。" className={cn(!isGroupVisible('admin-archives') && 'hidden')}>
              <div className={cn('grid gap-4 lg:grid-cols-[1.15fr_0.85fr]', activeGroupId === 'admin-archives' && activeChildId && 'lg:grid-cols-1')}>
                {/* <div className={cn('space-y-4', !isChildVisible('admin-session-sets', 'admin-archives', 'admin-archives-summary') && 'hidden')}> */}
                <div className={cn('space-y-4')}>
                  <div id="admin-archives-summary" className="rounded-xl border p-4 scroll-mt-24">
                    <h3 className="font-medium">レイティング集計</h3>
                    <div className="mt-3">
                      <RatingSummaryList summaries={ratingSummaries} emptyMessage="まだ評価集計はありません。" />
                    </div>
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

                <div id="admin-archives-create" className={cn('flex flex-col scroll-mt-24 gap-4 rounded-xl border p-4', !isChildVisible('admin-archives', 'admin-archives-create') && 'hidden')}>
                  <div className="space-y-1">
                    <h3 className="font-medium">アーカイブ作成</h3>
                    <p className="text-sm text-muted-foreground">終了したイベントの状態をスナップショット保存します。</p>
                  </div>
                  <Field htmlFor="admin-archive-event" label="対象イベント">
                    <Select value={selectedArchiveEventId} onValueChange={setSelectedArchiveEventId} disabled={closedSessionEvents.length === 0}>
                      <SelectTrigger id="admin-archive-event" className="w-full">
                        <SelectValue placeholder="終了したイベントを選択" />
                      </SelectTrigger>
                      <SelectContent>
                        {closedSessionEvents.map((sessionEvent) => (
                          <SelectItem key={sessionEvent.id} value={sessionEvent.id}>
                            {sessionEvent.title} / {formatEventSchedule(sessionEvent.eventDate, sessionEvent.startTime, sessionEvent.endTime)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {closedSessionEvents.length === 0 ? (
                      <p className="text-sm text-muted-foreground">ステータスが「終了」のイベントはありません。</p>
                    ) : null}
                  </Field>
                  <Field htmlFor="admin-archive-title" label="アーカイブ名">
                    <Input id="admin-archive-title" type="text" placeholder="アーカイブ名" value={archiveTitle} onChange={(event) => setArchiveTitle(event.target.value)} />
                  </Field>
                  <Field htmlFor="admin-archive-note" label="メモ">
                    <Textarea id="admin-archive-note" rows={3} placeholder="メモ" value={archiveNote} onChange={(event) => setArchiveNote(event.target.value)} />
                  </Field>
                  <Button type="button" onClick={onCreateArchive} disabled={loading || !selectedArchiveEventId} className="w-fit">
                    アーカイブ作成
                  </Button>
                </div>
              </div>

              <Separator className={cn('my-4', !isChildVisible('admin-archives', 'admin-archives-list') && 'hidden', 'bg-secondary')} />
              {archives.length === 0 ? <p className={cn('text-sm text-muted-foreground', !isChildVisible('admin-archives', 'admin-archives-list') && 'hidden')}>アーカイブはありません。</p> : (
                <ul id="admin-archives-list" className={cn('grid scroll-mt-24 gap-3', !isChildVisible('admin-archives', 'admin-archives-list') && 'hidden')}>
                  {archives.map((archive) => (
                    <li key={archive.id}>
                      <details className="group rounded-xl border bg-background/60 p-4">
                        <summary className="cursor-pointer list-none">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="font-medium">{archive.title}</p>
                                <Badge variant="outline">v{archive.version}</Badge>
                                {archive.deletedAt ? <Badge variant="destructive">削除済み</Badge> : null}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {formatEventDate(archive.eventDate)} / 参加者 {archive.participantCount} 名 / sessionSet {archive.setCount} 件 / レイティング {archive.ratingCount} 件
                              </p>
                            </div>
                            <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
                          </div>
                        </summary>

                        <div className="mt-4 space-y-5 border-t pt-4 text-sm">
                          <dl className="grid gap-3 sm:grid-cols-2">
                            <div>
                              <dt className="font-medium">アーカイブ名称</dt>
                              <dd className="mt-1 text-muted-foreground">{archive.title}</dd>
                            </div>
                            <div>
                              <dt className="font-medium">イベント開催日</dt>
                              <dd className="mt-1 text-muted-foreground">{formatEventDate(archive.eventDate)}</dd>
                            </div>
                          </dl>

                          <div>
                            <h4 className="font-medium">参加者（{archive.participants.length} 名）</h4>
                            {archive.participants.length === 0 ? (
                              <p className="mt-2 text-muted-foreground">参加者情報はありません。</p>
                            ) : (
                              <ul className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                {archive.participants.map((participant) => (
                                  <li key={participant.id} className="rounded-md border px-3 py-2">
                                    {participant.displayName}
                                    {participant.mainInstrument ? (
                                      <span className="ml-2 text-xs text-muted-foreground">{participant.mainInstrument}</span>
                                    ) : null}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>

                          <div>
                            <h4 className="font-medium">sessionSet / レイティング結果</h4>
                            {archive.sets.length === 0 ? (
                              <p className="mt-2 text-muted-foreground">sessionSet はありません。</p>
                            ) : (
                              <ol className="mt-2 space-y-3">
                                {archive.sets.map((sessionSet, index) => {
                                  const rating = sessionSet.ratingSummary;
                                  const memberRows = [
                                    ['Dr', sessionSet.drumName ? [sessionSet.drumName] : []],
                                    ['Ba', sessionSet.bassName ? [sessionSet.bassName] : []],
                                    ['Pf', sessionSet.pianoName ? [sessionSet.pianoName] : []],
                                    ['Front', sessionSet.frontSnapshot],
                                    ['Vo', sessionSet.vocalSnapshot],
                                  ] as const;

                                  return (
                                    <li key={sessionSet.id} className="rounded-lg border p-3">
                                      <div className="flex flex-wrap items-center justify-between gap-2">
                                        <p className="font-medium">
                                          {sessionSet.setOrder ?? index + 1}. {sessionSet.songTitle}
                                          {sessionSet.keyName ? `（Key: ${sessionSet.keyName}）` : ''}
                                        </p>
                                        <Badge variant="secondary">
                                          {rating?.ratingCount ?? 0} 件 / 平均 {rating?.averageRating != null ? rating.averageRating.toFixed(1) : '-'}
                                        </Badge>
                                      </div>
                                      <dl className="mt-2 grid gap-x-4 gap-y-1 text-muted-foreground sm:grid-cols-2 lg:grid-cols-3">
                                        {memberRows.map(([label, names]) => (
                                          <div key={label} className="flex gap-2">
                                            <dt className="font-medium text-foreground">{label}</dt>
                                            <dd>{names.length > 0 ? names.join('、') : '-'}</dd>
                                          </div>
                                        ))}
                                      </dl>
                                      {rating ? (
                                        <p className="mt-2 text-xs text-muted-foreground">
                                          最小 {rating.minRating ?? '-'} / 最大 {rating.maxRating ?? '-'} / 分布{' '}
                                          {[5, 4, 3, 2, 1].map((score) => `★${score}: ${rating.distribution[String(score)] ?? 0}件`).join('、')}
                                        </p>
                                      ) : (
                                        <p className="mt-2 text-xs text-muted-foreground">レイティング結果はありません。</p>
                                      )}
                                    </li>
                                  );
                                })}
                              </ol>
                            )}
                          </div>

                          {!archive.deletedAt && (
                            <Dialog>
                              <DialogTrigger asChild>
                                <div className="text-right">
                                  <Button type="button" variant="outline" size="sm" disabled={loading}>削除</Button>
                                </div>
                              </DialogTrigger>
                              <DialogContent className="bg-gray-200">
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
                        </div>
                      </details>
                    </li>
                  ))}
                </ul>
              )}
            </Section>

            <Section sectionId="admin-members" title="メンバー / 管理者管理" description="プロフィール、権限、状態をこの画面で更新できます。" className={cn(!isGroupVisible('admin-members') && 'hidden')}>
              <div className={cn('grid gap-4 xl:grid-cols-[320px_1fr]', activeGroupId === 'admin-members' && activeChildId && 'xl:grid-cols-1')}>
                <div id="admin-members-invitation" className={cn('rounded-xl border p-4 scroll-mt-24', !isChildVisible('admin-members', 'admin-members-invitation') && 'hidden')}>
                  <h3 className="font-medium">新規メンバー仮登録</h3>
                  <p className="mt-1 text-sm text-muted-foreground">紹介を受けた方のメールアドレスへ、1か月間有効な登録リンクを送信します。</p>
                  <div className="mt-4 flex flex-wrap items-end gap-3">
                    <Field htmlFor="member-invitation-email" label="登録希望者のメールアドレス" className="min-w-72 flex-1">
                      <Input id="member-invitation-email" type="email" value={memberInvitationEmail} onChange={(event) => setMemberInvitationEmail(event.target.value)} placeholder="member@example.com" />
                    </Field>
                    <Button type="button" onClick={onCreateMemberInvitation} disabled={loading}>新規メンバー仮登録</Button>
                  </div>
                </div>
                <div id="admin-members-search" className={cn('rounded-xl border p-4 scroll-mt-24', !isChildVisible('admin-members', 'admin-members-search') && 'hidden')}>
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
                              <span className="block text-xs text-muted-foreground">{member.mainInstrument}</span>
                              <span className="block text-xs text-muted-foreground">{member.mainInstrument === 'front' ? member.subInstrument : ''}</span>
                            </span>
                            <Badge variant={member.userAccount.status === 'active' ? 'secondary' : 'outline'}>{member.userAccount.status}</Badge>
                          </Button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div id="admin-members-editor" className={cn('rounded-xl border p-4 scroll-mt-24', !isChildVisible('admin-members', 'admin-members-editor') && 'hidden')}>
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
                            <SelectContent className="bg-gray-200">
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
                            <SelectContent className="bg-gray-200">
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
                            <SelectContent className="bg-gray-200">
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
                            <SelectContent className="bg-gray-200">
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
                            <SelectContent className="bg-gray-200">
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
                            <SelectContent className="bg-gray-200">
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

            <Section sectionId="admin-columns" title="コラム管理" description="コラムの作成、更新、公開スケジュールの設定を行います。" className={cn(!isGroupVisible('admin-columns') && 'hidden')}>
              <div className={cn('grid gap-4 xl:grid-cols-[1.1fr_0.9fr]', activeGroupId === 'admin-columns' && activeChildId && 'xl:grid-cols-1')}>
                <div id="admin-columns-editor" className={cn('grid scroll-mt-24 gap-4 rounded-xl border p-4', !isChildVisible('admin-columns', 'admin-columns-editor') && 'hidden')}>
                  <div className="flex flex-wrap items-end gap-3">
                    <Field label="編集対象コラム" htmlFor="admin-column-select" className="min-w-55 flex-1">
                      <Select value={editingColumnSlug || NONE_VALUE} onValueChange={(value) => setEditingColumnSlug(value === NONE_VALUE ? '' : value)}>
                        <SelectTrigger id="admin-column-select" className="w-full">
                          <SelectValue placeholder="新規コラム" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-200">
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

                <div className={cn('grid gap-4', !isChildVisible('admin-columns', 'admin-columns-preview') && !isChildVisible('admin-columns', 'admin-columns-list') && 'hidden')}>
                  <div id="admin-columns-preview" className={cn('rounded-xl border p-4 scroll-mt-24', !isChildVisible('admin-columns', 'admin-columns-preview') && 'hidden')}>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">{columnThumbnailLabel || 'Column'}</Badge>
                      <Badge variant={columnPublished ? 'secondary' : 'outline'}>{columnPublished ? 'published' : 'draft'}</Badge>
                    </div>
                    <h3 className="mt-4 text-lg font-semibold">{columnTitle || 'タイトル未入力'}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">表示順 {columnDisplayOrder} / {columnPublishAt || '即時公開または未設定'} / {columnAuthorName || '著者未設定'}</p>
                    <p className="mt-4 text-sm leading-7 text-muted-foreground">{columnSummary || '要約未入力'}</p>
                    <Separator className="my-4 bg-secondary" />
                    <div className="space-y-3 text-sm leading-7">
                      {previewParagraphs.length === 0 ? <p className="text-muted-foreground">本文未入力</p> : previewParagraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                    </div>
                  </div>

                  <div id="admin-columns-list" className={cn('rounded-xl border p-4 scroll-mt-24', !isChildVisible('admin-columns', 'admin-columns-list') && 'hidden')}>
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

            <Section sectionId="admin-activity" title="アクティビティ / 通知" description="運営の更新履歴、通知作成、送信ログを確認できます。" className={cn('mb-4', !isGroupVisible('admin-activity') && 'hidden')}>
              <div className={cn('flex gap-4 flex-col xl:flex-row items-start', activeGroupId === 'admin-activity' && activeChildId && 'xl:grid-cols-1')}>
                <div id="admin-announcement-create" className={cn('grid scroll-mt-24 gap-4 rounded-xl border p-4 xl:w-6/12', !isChildVisible('admin-activity', 'admin-announcement-create') && 'hidden')}>
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
                <div className={cn('space-y-4', !isChildVisible('admin-activity', 'admin-activity-log') && !isChildVisible('admin-activity', 'admin-mail-log') && 'hidden')}>
                  <div id="admin-activity-log" className={cn('rounded-xl border p-4 scroll-mt-24', !isChildVisible('admin-activity', 'admin-activity-log') && 'hidden')}>
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

                  <div id="admin-mail-log" className={cn('rounded-xl border p-4 scroll-mt-24', !isChildVisible('admin-activity', 'admin-mail-log') && 'hidden')}>
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


              </div>
            </Section>
          </div>
        </div>
      </div>

    </div>
  );
}
