import type { ReactNode } from 'react';

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
  round1StartAt?: string | null;
  round1EndAt?: string | null;
  round2StartAt?: string | null;
  round2EndAt?: string | null;
  status: string;
  _count?: {
    sessionEntries: number;
    sessionSets: number;
  };
};

export type SessionEntryView = {
  id: string;
  sessionEventId: string;
  attendanceStatus: AttendanceStatus;
  sessionEvent: {
    id: string;
    title: string;
    venue: string;
    eventDate: string;
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
  songTitle: string;
  key?: string | null;
  isPublished?: boolean;
  drum: { id: string; name: string } | null;
  bass: { id: string; name: string } | null;
  piano: { id: string; name: string } | null;
  front?: { id: string; name: string }[];
  vocal?: { id: string; name: string }[];
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
  sessionSetId: string;
  songTitle: string;
  ratingCount: number;
  averageRating: number | null;
};

export type ArchiveView = {
  id: string;
  title: string;
  version: number;
  sessionEventTitle: string;
  setCount: number;
  ratingCount: number;
  deletedAt?: string | null;
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

export type SectionProps = {
  title: string;
  description?: string;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
  contentClassName?: string;
};
