import type { ReactNode } from 'react';
import type { SessionEventStatus } from '@/lib/sessionEventStatus';

export type PortalView = 'signin' | 'signup' | 'admin-signin' | 'member' | 'admin';
export type Instrument = 'drum' | 'bass' | 'piano' | 'front' | 'vocal';
export type AttendanceStatus = 'attending' | 'absent' | 'undecided';

export type AuthUser = {
  id: string;
  email: string;
  role: 'member' | 'admin';
  status: string;
  memberProfile?: {
    id: string;
    displayName: string;
    mainInstrument: Instrument;
    nickname?: string | null;
    gender?: string | null;
    ageRange?: string | null;
    area?: string | null;
    bio?: string | null;
    subInstrument?: string | null;
  } | null;
};

export type AnnouncementView = {
  id: string;
  title: string;
  body: string;
  isPublished: boolean;
  publishedAt?: string | null;
};

export type MemberListView = {
  id: string;
  displayName: string;
  nickname?: string | null;
  mainInstrument: Instrument;
  subInstrument?: string | null;
  gender?: string | null;
  ageRange?: string | null;
  area?: string | null;
  bio?: string | null;
  entryCount: number;
  userAccount: {
    email: string;
    role: 'member' | 'admin';
    status: string;
  };
};

export type SessionEventView = {
  id: string;
  title: string;
  venue: string;
  eventDate: string;
  startTime?: string | null;
  endTime?: string | null;
  participantLimit?: number | null;
  attendingEntryCount?: number;
  remainingEntryCapacity?: number | null;
  isEntryCapacityFull?: boolean;
  participationFee?: number | null;
  hasAfterParty?: boolean;
  afterPartyFee?: number | null;
  notes?: string | null;
  round1StartAt?: string | null;
  round1EndAt?: string | null;
  round2StartAt?: string | null;
  round2EndAt?: string | null;
  status: SessionEventStatus;
  canSubmit?: boolean;
  entryRound?: 1 | 2 | null;
  entryReason?: string | null;
  isVisibleToMembers?: boolean;
  round2CandidateSongs?: string[];
  ratingSummaries?: RatingSummaryView[];
  comments?: SessionEventCommentView[];
  canGenerateSessionSets?: boolean;
  canPrepareRound2Candidates?: boolean;
  _count?: {
    sessionEntries: number;
    sessionSets: number;
  };
  sessionEntries?: {
    id: string;
    attendanceStatus: AttendanceStatus;
    afterPartyAttendanceStatus?: AttendanceStatus | null;
    allowForcedAssignment?: boolean;
    memberProfile: {
      id: string;
      displayName: string;
      mainInstrument: Instrument;
      subInstrument?: string | null;
      nickname?: string | null;
    };
    requests: {
      id: string;
      songTitleSnapshot: string;
      round: number;
      priority: number;
      keyName?: string | null;
    }[];
  }[];
};

export type SessionEventCommentView = {
  id: string;
  body: string;
  createdAt: string;
  memberDisplayName: string;
  userAccountId: string;
};

export type SessionEntryView = {
  id: string;
  sessionEventId: string;
  attendanceStatus: AttendanceStatus;
  afterPartyAttendanceStatus?: AttendanceStatus | null;
  allowForcedAssignment?: boolean;
  sessionEvent: {
    id: string;
    title: string;
    venue: string;
    eventDate: string;
    startTime?: string | null;
    endTime?: string | null;
    participantLimit?: number | null;
    participationFee?: number | null;
    hasAfterParty?: boolean;
    afterPartyFee?: number | null;
    notes?: string | null;
  };
  requests: {
    id: string;
    songTitleSnapshot: string;
    round: number;
    priority: number;
    keyName?: string | null;
  }[];
};

export type SessionSetView = {
  id: string;
  sessionEventId?: string | null;
  songTitle: string;
  setOrder?: number | null;
  key?: string | null;
  isPublished?: boolean;
  myRating?: {
    rating: number;
    comment?: string | null;
  } | null;
  drum: { id: string; name: string; isForced?: boolean; forcedCount?: number; requestedInRound1?: boolean } | null;
  bass: { id: string; name: string; isForced?: boolean; forcedCount?: number; requestedInRound1?: boolean } | null;
  piano: { id: string; name: string; isForced?: boolean; forcedCount?: number; requestedInRound1?: boolean } | null;
  front?: { id: string; name: string; subInstrument?: string | null; isForced?: boolean; forcedCount?: number; requestedInRound1?: boolean }[];
  vocal?: { id: string; name: string; isForced?: boolean; forcedCount?: number; requestedInRound1?: boolean }[];
};

export type MemberDetailView = {
  id: string;
  displayName: string;
  mainInstrument: Instrument;
  nickname?: string | null;
  subInstrument?: string | null;
  gender?: string | null;
  ageRange?: string | null;
  area?: string | null;
  bio?: string | null;
  userAccount: {
    email: string;
    role: 'member' | 'admin';
    status: string;
  };
  sessionEntries: SessionEntryView[];
};

export type MemberRatingHistoryView = {
  id: string;
  rating: number;
  sessionEvent: {
    title: string;
  };
  sessionSet: {
    title: string;
  };
};

export type RatingSummaryView = {
  sessionEventId?: string;
  sessionEventTitle?: string;
  sessionSetId: string;
  songTitle: string;
  ratingCount: number;
  totalRating: number;
  averageRating: number | null;
  comments?: {
    id: string;
    rating: number;
    comment: string;
  }[];
};

export type ArchiveView = {
  id: string;
  sessionEventId: string | null;
  title: string;
  version: number;
  sessionEventTitle: string;
  eventDate: string;
  venue: string;
  participantCount: number;
  participants: {
    id: string;
    displayName: string;
    mainInstrument?: Instrument | null;
  }[];
  setCount: number;
  ratingCount: number;
  sets: {
    id: string;
    songTitle: string;
    setOrder?: number | null;
    drumName?: string | null;
    bassName?: string | null;
    pianoName?: string | null;
    frontSnapshot: string[];
    vocalSnapshot: string[];
    keyName?: string | null;
    ratingSummary: {
      ratingCount: number;
      averageRating?: number | null;
      minRating?: number | null;
      maxRating?: number | null;
      distribution: Record<string, number>;
    } | null;
  }[];
  deletedAt?: string | null;
  createdAt: string;
  createdBy?: {
    id: string;
    email: string;
  };
};

export type ActivityLogView = {
  id: string;
  action: string;
  targetType: string;
  summary?: string | null;
  performedAt: string;
};

export type MailLogView = {
  id: string;
  mailType: string;
  toAddress: string;
  status: string;
  createdAt: string;
  errorMessage?: string | null;
};

export type ColumnView = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  body: string;
  thumbnailLabel?: string | null;
  authorName: string;
  displayOrder: number;
  isPublished: boolean;
  publishedAt?: string | null;
};

export type GeneratedResult = {
  sessionSets: SessionSetView[];
  skippedSongs: { songTitle: string; reasons: string[] }[];
  forcedSessionSets: { songTitle: string; forcedInstruments: Instrument[]; requesterCount: number }[];
};

export type SavedSessionSetDraftView = {
  id: string;
  sessionEventId: string;
  title: string;
  sessionSetCount: number;
  createdAt: string;
  updatedAt: string;
  sessionSets: SessionSetView[];
  skippedSongs: { songTitle: string; reasons: string[] }[];
  forcedSessionSets: { songTitle: string; forcedInstruments: Instrument[]; requesterCount: number }[];
};

export type SectionProps = {
  title: string;
  description?: string;
  children: ReactNode;
  action?: ReactNode;
  sectionId?: string;
  className?: string;
  contentClassName?: string;
};
