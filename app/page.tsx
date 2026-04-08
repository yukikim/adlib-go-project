"use client";

import { useEffect, useState } from "react";

const formatDateTimeLocal = (value?: string | null) => {
  if (!value) return "";
  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60_000);
  return localDate.toISOString().slice(0, 16);
};

const getEventEntryState = (event?: SessionEventView | null) => {
  if (!event) {
    return { canSubmit: false, round: null as 1 | 2 | null, reason: "イベントを選択してください" };
  }

  const now = new Date();
  const isWithinWindow = (start?: string | null, end?: string | null) => {
    const startDate = start ? new Date(start) : null;
    const endDate = end ? new Date(end) : null;
    if (startDate && now < startDate) return false;
    if (endDate && now > endDate) return false;
    return true;
  };

  if (event.status === "recruiting_round1") {
    const active = isWithinWindow(event.round1StartAt, event.round1EndAt);
    return { canSubmit: active, round: 1 as const, reason: active ? null : "round1 の募集期間外です" };
  }

  if (event.status === "recruiting_round2") {
    const active = isWithinWindow(event.round2StartAt, event.round2EndAt);
    return { canSubmit: active, round: 2 as const, reason: active ? null : "round2 の募集期間外です" };
  }

  return { canSubmit: false, round: null as 1 | 2 | null, reason: "現在は募集受付中ではありません" };
};

type Instrument = "drum" | "bass" | "piano" | "front" | "vocal";

interface Participant {
  id: string;
  name: string;
  instrument: Instrument;
  requestedSongs: {
    id: string;
    round: 1 | 2;
    keyName?: string | null;
    song: {
      id: string;
      title: string;
    };
  }[];
}

interface Song {
  id: string;
  title: string;
}

interface SessionSetView {
  id: string;
  sessionEventId?: string | null;
  setOrder?: number | null;
  isPublished?: boolean;
  songTitle: string;
  key?: string | null;
  drum: { id: string; name: string } | null;
  bass: { id: string; name: string } | null;
  piano: { id: string; name: string } | null;
  front?: { id: string; name: string }[];
  vocal?: { id: string; name: string }[];
}

interface SkippedSongView {
  songTitle: string;
  reasons: string[];
}

interface ForcedSessionSetView {
  songTitle: string;
  forcedInstruments: Instrument[];
  requesterCount: number;
}

interface AuthUser {
  id: string;
  email: string;
  role: "member" | "admin";
  status: string;
  memberProfile?: {
    id: string;
    displayName: string;
    mainInstrument: Instrument;
    nickname?: string | null;
    area?: string | null;
    bio?: string | null;
    subInstrument?: string | null;
  } | null;
}

interface SessionEventView {
  id: string;
  title: string;
  description?: string | null;
  venue: string;
  eventDate: string;
  startTime?: string | null;
  endTime?: string | null;
  round1StartAt?: string | null;
  round1EndAt?: string | null;
  round2StartAt?: string | null;
  round2EndAt?: string | null;
  status: string;
  _count?: {
    sessionEntries: number;
    sessionSets: number;
  };
}

interface SessionEntryView {
  id: string;
  sessionEventId: string;
  attendanceStatus: "attending" | "absent" | "undecided";
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
}

interface RatingSummaryView {
  sessionSetId: string;
  songTitle: string;
  ratingCount: number;
  averageRating: number | null;
  minRating: number | null;
  maxRating: number | null;
  distribution: Record<string, number>;
  ratedMemberCount: number;
}

interface ArchiveView {
  id: string;
  sessionEventId: string;
  sessionEventTitle: string;
  title: string;
  version: number;
  eventDate: string;
  venue: string;
  participantCount: number;
  setCount: number;
  ratingCount: number;
  deletedAt?: string | null;
  createdAt: string;
  createdBy: {
    id: string;
    email: string;
  };
}

interface AnnouncementView {
  id: string;
  title: string;
  body: string;
  isPublished: boolean;
  publishedAt?: string | null;
  createdAt: string;
  createdBy: {
    id: string;
    email: string;
  };
}

interface MemberListView {
  id: string;
  displayName: string;
  nickname?: string | null;
  mainInstrument: Instrument;
  area?: string | null;
  bio?: string | null;
  createdAt: string;
  entryCount: number;
  userAccount: {
    id: string;
    email: string;
    role: "member" | "admin";
    status: string;
    createdAt: string;
  };
}

interface MemberDetailView {
  id: string;
  displayName: string;
  nickname?: string | null;
  mainInstrument: Instrument;
  subInstrument?: string | null;
  area?: string | null;
  bio?: string | null;
  userAccount: {
    id: string;
    email: string;
    role: "member" | "admin";
    status: string;
    createdAt: string;
    lastSignedInAt?: string | null;
  };
  sessionEntries: SessionEntryView[];
}

interface MemberRatingHistoryView {
  id: string;
  rating: number;
  comment?: string | null;
  ratedAt: string;
  sessionEvent: {
    id: string;
    title: string;
    eventDate: string;
  };
  sessionSet: {
    id: string;
    title: string;
  };
}

interface ActivityLogView {
  id: string;
  action: string;
  targetType: string;
  targetId?: string | null;
  summary?: string | null;
  performedAt: string;
  performedBy: {
    id: string;
    email: string;
  };
}

interface MailLogView {
  id: string;
  mailType: string;
  toAddress: string;
  subject: string;
  status: string;
  errorMessage?: string | null;
  createdAt: string;
  sentAt?: string | null;
}

export default function HomePage() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [songs, setSongs] = useState<Song[]>([]);
  const [sessionSets, setSessionSets] = useState<SessionSetView[]>([]);
  const [skippedSongs, setSkippedSongs] = useState<SkippedSongView[]>([]);
  const [forcedSessionSets, setForcedSessionSets] = useState<ForcedSessionSetView[]>([]);
  const [sessionEvents, setSessionEvents] = useState<SessionEventView[]>([]);
  const [sessionEntries, setSessionEntries] = useState<SessionEntryView[]>([]);
  const [memberSessionSets, setMemberSessionSets] = useState<SessionSetView[]>([]);
  const [ratingSummaries, setRatingSummaries] = useState<RatingSummaryView[]>([]);
  const [archives, setArchives] = useState<ArchiveView[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementView[]>([]);
  const [members, setMembers] = useState<MemberListView[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [selectedMemberDetail, setSelectedMemberDetail] = useState<MemberDetailView | null>(null);
  const [selectedMemberRatings, setSelectedMemberRatings] = useState<MemberRatingHistoryView[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLogView[]>([]);
  const [mailLogs, setMailLogs] = useState<MailLogView[]>([]);

  const [newParticipantName, setNewParticipantName] = useState("");
  const [newParticipantInstrument, setNewParticipantInstrument] =
    useState<Instrument>("drum");

  const [newSongTitle, setNewSongTitle] = useState("");

  const [requestParticipantId, setRequestParticipantId] = useState("");
  const [requestSongTitle, setRequestSongTitle] = useState("");
  const [requestRound, setRequestRound] = useState<1 | 2>(1);
  const [requestKeyName, setRequestKeyName] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [authEmail, setAuthEmail] = useState("admin@adolib-go.local");
  const [authPassword, setAuthPassword] = useState("demo-admin-password");
  const [signupDisplayName, setSignupDisplayName] = useState("");
  const [signupInstrument, setSignupInstrument] = useState<Instrument>("front");
  const [resetEmail, setResetEmail] = useState("admin@adolib-go.local");
  const [resetToken, setResetToken] = useState("");
  const [resetPassword, setResetPassword] = useState("");
  const [issuedResetToken, setIssuedResetToken] = useState<string | null>(null);
  const [profileDisplayName, setProfileDisplayName] = useState("");
  const [profileNickname, setProfileNickname] = useState("");
  const [profileArea, setProfileArea] = useState("");
  const [profileBio, setProfileBio] = useState("");
  const [profileSubInstrument, setProfileSubInstrument] = useState("");
  const [eventTitle, setEventTitle] = useState("2026年6月 セッション");
  const [eventVenue, setEventVenue] = useState("渋谷 Jazz Spot");
  const [eventDate, setEventDate] = useState("2026-06-21");
  const [selectedAdminEventId, setSelectedAdminEventId] = useState("");
  const [editEventTitle, setEditEventTitle] = useState("");
  const [editEventVenue, setEditEventVenue] = useState("");
  const [editEventDate, setEditEventDate] = useState("");
  const [editEventStatus, setEditEventStatus] = useState("draft");
  const [editRound1StartAt, setEditRound1StartAt] = useState("");
  const [editRound1EndAt, setEditRound1EndAt] = useState("");
  const [editRound2StartAt, setEditRound2StartAt] = useState("");
  const [editRound2EndAt, setEditRound2EndAt] = useState("");
  const [archiveTitle, setArchiveTitle] = useState("");
  const [archiveNote, setArchiveNote] = useState("");
  const [archivePreview, setArchivePreview] = useState<{
    participantCount: number;
    setCount: number;
    ratingSummaryIncluded: boolean;
  } | null>(null);
  const [memberEventId, setMemberEventId] = useState("");
  const [memberAttendanceStatus, setMemberAttendanceStatus] = useState<"attending" | "absent" | "undecided">("attending");
  const [memberRound1Song1, setMemberRound1Song1] = useState("");
  const [memberRound1Song2, setMemberRound1Song2] = useState("");
  const [memberRound2Song1, setMemberRound2Song1] = useState("");
  const [memberRound2Song2, setMemberRound2Song2] = useState("");
  const [memberRound1Key1, setMemberRound1Key1] = useState("");
  const [memberRound1Key2, setMemberRound1Key2] = useState("");
  const [memberRound2Key1, setMemberRound2Key1] = useState("");
  const [memberRound2Key2, setMemberRound2Key2] = useState("");
  const [memberRatings, setMemberRatings] = useState<Record<string, number>>({});
  const [memberRatingComments, setMemberRatingComments] = useState<Record<string, string>>({});
  const [adminMemberRole, setAdminMemberRole] = useState<"member" | "admin">("member");
  const [adminMemberStatus, setAdminMemberStatus] = useState<"active" | "suspended" | "invited">("active");
  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementBody, setAnnouncementBody] = useState("");
  const [announcementPublished, setAnnouncementPublished] = useState(true);
  const isAdmin = currentUser?.role === "admin";
  const isMember = currentUser?.role === "member";
  const selectedMemberEvent = sessionEvents.find((event) => event.id === memberEventId) ?? null;
  const selectedAdminEvent = sessionEvents.find((event) => event.id === selectedAdminEventId) ?? null;
  const memberEntryState = getEventEntryState(selectedMemberEvent);

  const loadCurrentUser = async () => {
    const res = await fetch("/api/auth/me");
    const json = await res.json().catch(() => ({}));
    setCurrentUser(json.user ?? null);
  };

  const loadAll = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const sessionSetUrl = selectedAdminEventId
        ? `/api/session-sets?sessionEventId=${selectedAdminEventId}`
        : "/api/session-sets";

      const [pRes, sRes, ssRes, seRes, meRes] = await Promise.all([
        fetch("/api/participants"),
        fetch("/api/songs"),
        fetch(sessionSetUrl),
        fetch("/api/session-events"),
        fetch("/api/auth/me"),
      ]);
      const pJson = await pRes.json();
      const sJson = await sRes.json();
      const ssJson = await ssRes.json();
      const seJson = await seRes.json();
      const meJson = await meRes.json();
      setParticipants(pJson.participants ?? []);
      setSongs(sJson.songs ?? []);
      setSessionSets(ssJson.sessionSets ?? []);
      setSessionEvents(seJson.sessionEvents ?? []);
      setCurrentUser(meJson.user ?? null);
      if (meJson.user) {
        const [announcementRes, memberRes] = await Promise.all([
          fetch("/api/announcements"),
          fetch("/api/members"),
        ]);
        const announcementJson = await announcementRes.json().catch(() => ({}));
        const memberJson = await memberRes.json().catch(() => ({}));
        setAnnouncements(announcementJson.announcements ?? []);
        setMembers(memberJson.members ?? []);
      } else {
        setAnnouncements([]);
        setMembers([]);
      }
      if (meJson.user?.role === "member") {
        const entryRes = await fetch("/api/session-entries");
        const entryJson = await entryRes.json().catch(() => ({}));
        setSessionEntries(entryJson.entries ?? []);
      } else {
        setSessionEntries([]);
      }
      if (meJson.user?.role === "admin") {
        const [archiveRes, activityRes, mailLogRes] = await Promise.all([
          fetch("/api/session-archives"),
          fetch("/api/admin/activity"),
          fetch("/api/admin/mail-logs"),
        ]);
        const archiveJson = await archiveRes.json().catch(() => ({}));
        const activityJson = await activityRes.json().catch(() => ({}));
        const mailLogJson = await mailLogRes.json().catch(() => ({}));
        setArchives(archiveJson.archives ?? []);
        setActivityLogs(activityJson.activity ?? []);
        setMailLogs(mailLogJson.mailLogs ?? []);
      } else {
        setArchives([]);
        setActivityLogs([]);
        setMailLogs([]);
      }
      setSkippedSongs([]);
      setForcedSessionSets([]);
    } catch (e) {
      console.error(e);
      setMessage("データ取得に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    if (currentUser?.memberProfile) {
      setProfileDisplayName(currentUser.memberProfile.displayName ?? "");
      setProfileNickname(currentUser.memberProfile.nickname ?? "");
      setProfileArea(currentUser.memberProfile.area ?? "");
      setProfileBio(currentUser.memberProfile.bio ?? "");
      setProfileSubInstrument(currentUser.memberProfile.subInstrument ?? "");
    }
  }, [currentUser]);

  useEffect(() => {
    if (!memberEventId && sessionEvents.length > 0) {
      setMemberEventId(sessionEvents[0].id);
    }
  }, [memberEventId, sessionEvents]);

  useEffect(() => {
    if (!selectedAdminEventId && sessionEvents.length > 0) {
      setSelectedAdminEventId(sessionEvents[0].id);
    }
  }, [selectedAdminEventId, sessionEvents]);

  useEffect(() => {
    if (!selectedMemberId && members.length > 0) {
      setSelectedMemberId(members[0].id);
    }
  }, [members, selectedMemberId]);

  useEffect(() => {
    if (!selectedAdminEvent) {
      return;
    }

    setEditEventTitle(selectedAdminEvent.title ?? "");
    setEditEventVenue(selectedAdminEvent.venue ?? "");
    setEditEventDate(selectedAdminEvent.eventDate.slice(0, 10));
    setEditEventStatus(selectedAdminEvent.status ?? "draft");
    setEditRound1StartAt(formatDateTimeLocal(selectedAdminEvent.round1StartAt));
    setEditRound1EndAt(formatDateTimeLocal(selectedAdminEvent.round1EndAt));
    setEditRound2StartAt(formatDateTimeLocal(selectedAdminEvent.round2StartAt));
    setEditRound2EndAt(formatDateTimeLocal(selectedAdminEvent.round2EndAt));
  }, [selectedAdminEvent]);

  useEffect(() => {
    if (!selectedMemberId || !currentUser) {
      setSelectedMemberDetail(null);
      setSelectedMemberRatings([]);
      return;
    }

    const loadMemberDetail = async () => {
      const res = await fetch(`/api/members/${selectedMemberId}`);
      const json = await res.json().catch(() => ({}));
      setSelectedMemberDetail(json.member ?? null);
      setSelectedMemberRatings(json.ratings ?? []);
    };

    loadMemberDetail().catch((error) => {
      console.error(error);
    });
  }, [currentUser, selectedMemberId]);

  useEffect(() => {
    if (!selectedMemberDetail) {
      return;
    }

    setAdminMemberRole(selectedMemberDetail.userAccount.role);
    setAdminMemberStatus(selectedMemberDetail.userAccount.status as "active" | "suspended" | "invited");
  }, [selectedMemberDetail]);

  useEffect(() => {
    const currentEntry = sessionEntries.find((entry) => entry.sessionEventId === memberEventId);
    if (!currentEntry) {
      setMemberAttendanceStatus("attending");
      setMemberRound1Song1("");
      setMemberRound1Song2("");
      setMemberRound2Song1("");
      setMemberRound2Song2("");
      setMemberRound1Key1("");
      setMemberRound1Key2("");
      setMemberRound2Key1("");
      setMemberRound2Key2("");
      return;
    }

    setMemberAttendanceStatus(currentEntry.attendanceStatus);
    const round1 = currentEntry.requests.filter((request) => request.round === 1).sort((a, b) => a.priority - b.priority);
    const round2 = currentEntry.requests.filter((request) => request.round === 2).sort((a, b) => a.priority - b.priority);
    setMemberRound1Song1(round1[0]?.songTitleSnapshot ?? "");
    setMemberRound1Song2(round1[1]?.songTitleSnapshot ?? "");
    setMemberRound2Song1(round2[0]?.songTitleSnapshot ?? "");
    setMemberRound2Song2(round2[1]?.songTitleSnapshot ?? "");
    setMemberRound1Key1(round1[0]?.keyName ?? "");
    setMemberRound1Key2(round1[1]?.keyName ?? "");
    setMemberRound2Key1(round2[0]?.keyName ?? "");
    setMemberRound2Key2(round2[1]?.keyName ?? "");
  }, [memberEventId, sessionEntries]);

  useEffect(() => {
    const loadSessionSets = async () => {
      const url = selectedAdminEventId
        ? `/api/session-sets?sessionEventId=${selectedAdminEventId}`
        : "/api/session-sets";
      const res = await fetch(url);
      const json = await res.json().catch(() => ({}));
      setSessionSets(json.sessionSets ?? []);
    };

    loadSessionSets().catch((error) => {
      console.error(error);
    });
  }, [selectedAdminEventId]);

  useEffect(() => {
    if (!memberEventId || !isMember) {
      setMemberSessionSets([]);
      return;
    }

    const loadMemberSessionSets = async () => {
      const res = await fetch(`/api/session-sets?sessionEventId=${memberEventId}`);
      const json = await res.json().catch(() => ({}));
      setMemberSessionSets((json.sessionSets ?? []).filter((sessionSet: SessionSetView) => sessionSet.isPublished));
    };

    loadMemberSessionSets().catch((error) => {
      console.error(error);
    });
  }, [isMember, memberEventId]);

  useEffect(() => {
    if (!selectedAdminEventId || !isAdmin) {
      setRatingSummaries([]);
      setArchivePreview(null);
      return;
    }

    const loadAdminPanels = async () => {
      const [summaryRes, previewRes] = await Promise.all([
        fetch(`/api/session-events/${selectedAdminEventId}/ratings-summary`),
        fetch(`/api/session-events/${selectedAdminEventId}/archive-preview`),
      ]);
      const summaryJson = await summaryRes.json().catch(() => ({}));
      const previewJson = await previewRes.json().catch(() => ({}));
      setRatingSummaries(summaryJson.summaries ?? []);
      setArchivePreview(previewJson.preview ?? null);
    };

    loadAdminPanels().catch((error) => {
      console.error(error);
    });
  }, [isAdmin, selectedAdminEventId]);

  const handleSignIn = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: authEmail, password: authPassword }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json.error ?? "failed");
      }
      setCurrentUser(json.user ?? null);
      setMessage("サインインしました");
    } catch (e: any) {
      setMessage(`サインインに失敗しました: ${e.message ?? e}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: authEmail,
          password: authPassword,
          displayName: signupDisplayName,
          mainInstrument: signupInstrument,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json.error ?? "failed");
      }
      setCurrentUser(json.user ?? null);
      setMessage("サインアップしました");
    } catch (e: any) {
      setMessage(`サインアップに失敗しました: ${e.message ?? e}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    setMessage(null);
    try {
      await fetch("/api/auth/signout", { method: "POST" });
      setCurrentUser(null);
      setMessage("サインアウトしました");
      await loadAll();
    } catch (e) {
      console.error(e);
      setMessage("サインアウトに失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json.error ?? "failed");
      }
      setIssuedResetToken(json.resetToken ?? null);
      setResetToken(json.resetToken ?? "");
      setMessage("再設定トークンを発行しました");
    } catch (e: any) {
      setMessage(`再設定トークン発行に失敗しました: ${e.message ?? e}`);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: resetToken, password: resetPassword }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json.error ?? "failed");
      }
      setMessage("パスワードを更新しました");
      setIssuedResetToken(null);
      setResetToken("");
      setResetPassword("");
    } catch (e: any) {
      setMessage(`パスワード更新に失敗しました: ${e.message ?? e}`);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/members/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: profileDisplayName,
          nickname: profileNickname,
          area: profileArea,
          bio: profileBio,
          subInstrument: profileSubInstrument,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json.error ?? "failed");
      }
      await loadCurrentUser();
      setMessage("プロフィールを更新しました");
    } catch (e: any) {
      setMessage(`プロフィール更新に失敗しました: ${e.message ?? e}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSessionEvent = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/session-events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: eventTitle,
          venue: eventVenue,
          eventDate,
          status: "draft",
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json.error ?? "failed");
      }
      await loadAll();
      setMessage("セッションイベントを作成しました");
    } catch (e: any) {
      setMessage(`セッションイベント作成に失敗しました: ${e.message ?? e}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSessionEvent = async () => {
    if (!selectedAdminEventId) return;
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/session-events/${selectedAdminEventId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editEventTitle,
          venue: editEventVenue,
          eventDate: editEventDate,
          status: editEventStatus,
          round1StartAt: editRound1StartAt ? new Date(editRound1StartAt).toISOString() : null,
          round1EndAt: editRound1EndAt ? new Date(editRound1EndAt).toISOString() : null,
          round2StartAt: editRound2StartAt ? new Date(editRound2StartAt).toISOString() : null,
          round2EndAt: editRound2EndAt ? new Date(editRound2EndAt).toISOString() : null,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json.error ?? "failed");
      }
      await loadAll();
      setMessage("セッションイベントを更新しました");
    } catch (e: any) {
      setMessage(`セッションイベント更新に失敗しました: ${e.message ?? e}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitSessionEntry = async () => {
    if (!memberEventId) return;

    if (!memberEntryState.canSubmit || !memberEntryState.round) {
      setMessage(memberEntryState.reason ?? "現在は登録できません");
      return;
    }

    const requests = memberEntryState.round === 1
      ? [
          { songTitle: memberRound1Song1.trim(), round: 1 as const, priority: 1, keyName: memberRound1Key1.trim() || null },
          { songTitle: memberRound1Song2.trim(), round: 1 as const, priority: 2, keyName: memberRound1Key2.trim() || null },
        ].filter((item) => item.songTitle)
      : [
          { songTitle: memberRound2Song1.trim(), round: 2 as const, priority: 1, keyName: memberRound2Key1.trim() || null },
          { songTitle: memberRound2Song2.trim(), round: 2 as const, priority: 2, keyName: memberRound2Key2.trim() || null },
        ].filter((item) => item.songTitle);

    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/session-entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionEventId: memberEventId,
          attendanceStatus: memberAttendanceStatus,
          requests,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json.error ?? "failed");
      }
      await loadAll();
      setMessage("セッションエントリーを保存しました");
    } catch (e: any) {
      setMessage(`セッションエントリー保存に失敗しました: ${e.message ?? e}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAddParticipant = async () => {
    if (!newParticipantName.trim()) return;
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/participants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newParticipantName.trim(),
          instrument: newParticipantInstrument,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? "failed");
      }
      setNewParticipantName("");
      await loadAll();
      setMessage("参加者を追加しました");
    } catch (e: any) {
      setMessage(`参加者追加に失敗しました: ${e.message ?? e}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSong = async () => {
    if (!newSongTitle.trim()) return;
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/songs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newSongTitle.trim() }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? "failed");
      }
      setNewSongTitle("");
      await loadAll();
      setMessage("曲を追加しました");
    } catch (e: any) {
      setMessage(`曲追加に失敗しました: ${e.message ?? e}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAddRequest = async () => {
    if (!requestParticipantId || !requestSongTitle.trim()) return;
    const participant = participants.find((p) => p.id === requestParticipantId);
    const round = requestRound;
    const body: any = {
      participantId: requestParticipantId,
      songTitle: requestSongTitle.trim(),
      round,
    };
    if (participant?.instrument === "vocal") {
      body.keyName = requestKeyName.trim();
    } else if (requestKeyName.trim()) {
      body.keyName = requestKeyName.trim();
    }

    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(j.error ?? "failed");
      }
      setRequestSongTitle("");
      setRequestKeyName("");
      await loadAll();
      setMessage("希望曲を登録しました");
    } catch (e: any) {
      setMessage(`希望曲登録に失敗しました: ${e.message ?? e}`);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateSessionSets = async () => {
    if (!selectedAdminEventId) return;
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/session-sets/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionEventId: selectedAdminEventId }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(j.error ?? "failed");
      }
      setSessionSets(j.sessionSets ?? []);
      setSkippedSongs(j.skippedSongs ?? []);
      setForcedSessionSets(j.forcedSessionSets ?? []);
      setMessage(
        `sessionSet を生成しました: ${j.sessionSets?.length ?? 0} 曲、強制追加 ${j.forcedSessionSets?.length ?? 0} 曲、未生成 ${j.skippedSongs?.length ?? 0} 曲`,
      );
    } catch (e: any) {
      setMessage(`sessionSet 生成に失敗しました: ${e.message ?? e}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePublishSessionSets = async () => {
    if (!selectedAdminEventId) return;
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/session-events/${selectedAdminEventId}/publish`, {
        method: "POST",
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json.error ?? "failed");
      }
      await loadAll();
      setMessage(`公開しました: ${json.publishedSetCount ?? 0} セット`);
    } catch (e: any) {
      setMessage(`公開に失敗しました: ${e.message ?? e}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRating = async (sessionSetId: string) => {
    const rating = memberRatings[sessionSetId];
    if (!rating) {
      setMessage("星評価を選択してください");
      return;
    }

    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/session-sets/${sessionSetId}/ratings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating,
          comment: memberRatingComments[sessionSetId] ?? "",
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json.error ?? "failed");
      }
      setMessage("評価を保存しました");
    } catch (e: any) {
      setMessage(`評価保存に失敗しました: ${e.message ?? e}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateArchive = async () => {
    if (!selectedAdminEventId) return;
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/session-archives", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionEventId: selectedAdminEventId,
          title: archiveTitle,
          note: archiveNote,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json.error ?? "failed");
      }
      await loadAll();
      setArchiveTitle("");
      setArchiveNote("");
      setMessage("アーカイブを作成しました");
    } catch (e: any) {
      setMessage(`アーカイブ作成に失敗しました: ${e.message ?? e}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteArchive = async (archiveId: string) => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/session-archives/${archiveId}`, {
        method: "DELETE",
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json.error ?? "failed");
      }
      await loadAll();
      setMessage("アーカイブを削除しました");
    } catch (e: any) {
      setMessage(`アーカイブ削除に失敗しました: ${e.message ?? e}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateMemberAdmin = async () => {
    if (!selectedMemberId) return;
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/members/${selectedMemberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: adminMemberRole,
          status: adminMemberStatus,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json.error ?? "failed");
      }
      await loadAll();
      setMessage("メンバー設定を更新しました");
    } catch (e: any) {
      setMessage(`メンバー設定更新に失敗しました: ${e.message ?? e}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAnnouncement = async () => {
    if (!announcementTitle.trim() || !announcementBody.trim()) return;
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: announcementTitle,
          body: announcementBody,
          isPublished: announcementPublished,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json.error ?? "failed");
      }
      await loadAll();
      setAnnouncementTitle("");
      setAnnouncementBody("");
      setAnnouncementPublished(true);
      setMessage("お知らせを作成しました");
    } catch (e: any) {
      setMessage(`お知らせ作成に失敗しました: ${e.message ?? e}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ padding: "2rem", fontFamily: "system-ui", maxWidth: 1000, margin: "0 auto" }}>
      <h1>Jazz Session Planner</h1>
      <p>参加者・曲・希望曲を登録し、セッション構成を自動生成します。</p>
      <section style={{ marginTop: "1.5rem", padding: "1rem", border: "1px solid #ddd", borderRadius: "0.5rem" }}>
        <h2>認証</h2>
        <p style={{ color: "#555" }}>
          デモ管理者: admin@adolib-go.local / demo-admin-password
        </p>
        {currentUser ? (
          <div>
            <p>
              サインイン中: <strong>{currentUser.email}</strong> ({currentUser.role})
              {currentUser.memberProfile?.displayName ? ` / ${currentUser.memberProfile.displayName}` : ""}
            </p>
            <button type="button" onClick={handleSignOut} disabled={loading}>
              サインアウト
            </button>
            {currentUser.memberProfile && (
              <div style={{ marginTop: "1rem", display: "grid", gap: "0.5rem" }}>
                <h3>プロフィール編集</h3>
                <input type="text" placeholder="表示名" value={profileDisplayName} onChange={(e) => setProfileDisplayName(e.target.value)} />
                <input type="text" placeholder="ニックネーム" value={profileNickname} onChange={(e) => setProfileNickname(e.target.value)} />
                <input type="text" placeholder="サブ楽器" value={profileSubInstrument} onChange={(e) => setProfileSubInstrument(e.target.value)} />
                <input type="text" placeholder="住処" value={profileArea} onChange={(e) => setProfileArea(e.target.value)} />
                <textarea placeholder="自己紹介" value={profileBio} onChange={(e) => setProfileBio(e.target.value)} rows={3} />
                <div>
                  <button type="button" onClick={handleProfileUpdate} disabled={loading}>
                    プロフィール保存
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div>
            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.75rem" }}>
              <button type="button" onClick={() => setAuthMode("signin")} disabled={loading || authMode === "signin"}>
                サインイン
              </button>
              <button type="button" onClick={() => setAuthMode("signup")} disabled={loading || authMode === "signup"}>
                サインアップ
              </button>
            </div>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
              <input type="email" placeholder="メールアドレス" value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} />
              <input type="password" placeholder="パスワード" value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} />
              {authMode === "signup" && (
                <>
                  <input type="text" placeholder="表示名" value={signupDisplayName} onChange={(e) => setSignupDisplayName(e.target.value)} />
                  <select value={signupInstrument} onChange={(e) => setSignupInstrument(e.target.value as Instrument)}>
                    <option value="drum">drum</option>
                    <option value="bass">bass</option>
                    <option value="piano">piano</option>
                    <option value="front">front</option>
                    <option value="vocal">vocal</option>
                  </select>
                </>
              )}
              <button
                type="button"
                onClick={authMode === "signin" ? handleSignIn : handleSignUp}
                disabled={loading}
              >
                {authMode === "signin" ? "実行" : "登録"}
              </button>
            </div>
            <div style={{ marginTop: "1rem", display: "grid", gap: "0.5rem" }}>
              <h3>パスワード再設定</h3>
              <input type="email" placeholder="メールアドレス" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} />
              <div>
                <button type="button" onClick={handleForgotPassword} disabled={loading}>
                  再設定トークンを発行
                </button>
              </div>
              {issuedResetToken && (
                <p style={{ color: "#555", wordBreak: "break-all" }}>
                  開発用トークン: {issuedResetToken}
                </p>
              )}
              <input type="text" placeholder="再設定トークン" value={resetToken} onChange={(e) => setResetToken(e.target.value)} />
              <input type="password" placeholder="新しいパスワード" value={resetPassword} onChange={(e) => setResetPassword(e.target.value)} />
              <div>
                <button type="button" onClick={handleResetPassword} disabled={loading}>
                  パスワード更新
                </button>
              </div>
            </div>
          </div>
        )}
      </section>

      {message && (
        <p style={{ color: "darkgreen", marginTop: "0.5rem" }}>{message}</p>
      )}
      {loading && <p style={{ color: "gray" }}>処理中...</p>}

      {isMember && (
        <section style={{ marginTop: "2rem", padding: "1rem", border: "1px solid #ddd", borderRadius: "0.5rem" }}>
          <h2>メンバー画面</h2>
          <div style={{ display: "grid", gap: "1rem" }}>
            <div>
              <h3>お知らせ</h3>
              {announcements.length === 0 ? (
                <p>公開中のお知らせはありません。</p>
              ) : (
                <ul>
                  {announcements.map((announcement) => (
                    <li key={announcement.id} style={{ marginBottom: "0.75rem" }}>
                      <strong>{announcement.title}</strong>
                      <div style={{ color: "#555" }}>{announcement.body}</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <h3>メンバー一覧</h3>
              <div style={{ display: "grid", gridTemplateColumns: "minmax(220px, 280px) 1fr", gap: "1rem" }}>
                <ul style={{ margin: 0, paddingLeft: "1rem" }}>
                  {members.map((member) => (
                    <li key={member.id} style={{ marginBottom: "0.5rem" }}>
                      <button type="button" onClick={() => setSelectedMemberId(member.id)} disabled={loading}>
                        {member.displayName} ({member.mainInstrument})
                      </button>
                    </li>
                  ))}
                </ul>
                <div>
                  {selectedMemberDetail ? (
                    <>
                      <h4>{selectedMemberDetail.displayName}</h4>
                      <p>{selectedMemberDetail.area || "地域未設定"}</p>
                      <p>{selectedMemberDetail.bio || "自己紹介未設定"}</p>
                      <p>楽器: {selectedMemberDetail.mainInstrument}</p>
                      <h5>セッション履歴</h5>
                      {selectedMemberDetail.sessionEntries.length === 0 ? (
                        <p>履歴はありません。</p>
                      ) : (
                        <ul>
                          {selectedMemberDetail.sessionEntries.map((entry) => (
                            <li key={entry.id}>
                              {entry.sessionEvent.title} / {entry.attendanceStatus} / {entry.requests.length} 曲
                            </li>
                          ))}
                        </ul>
                      )}
                      <h5>評価履歴</h5>
                      {selectedMemberRatings.length === 0 ? (
                        <p>評価履歴はありません。</p>
                      ) : (
                        <ul>
                          {selectedMemberRatings.slice(0, 5).map((rating) => (
                            <li key={rating.id}>
                              {rating.sessionEvent.title} / {rating.sessionSet.title} / {rating.rating} 星
                            </li>
                          ))}
                        </ul>
                      )}
                    </>
                  ) : (
                    <p>メンバーを選択してください。</p>
                  )}
                </div>
              </div>
            </div>

            <div>
              <h3>セッションイベント一覧</h3>
              {sessionEvents.length === 0 ? (
                <p>開催予定のイベントはありません。</p>
              ) : (
                <ul>
                  {sessionEvents.map((event) => (
                    <li key={event.id}>
                      <strong>{event.title}</strong> / {event.venue} / {new Date(event.eventDate).toLocaleDateString("ja-JP")} / {event.status}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <h3>セッションエントリー</h3>
              <p style={{ color: memberEntryState.canSubmit ? "#555" : "#a33" }}>
                {memberEntryState.canSubmit
                  ? `現在入力できるのは Round ${memberEntryState.round} です。`
                  : memberEntryState.reason}
              </p>
              <div style={{ display: "grid", gap: "0.5rem" }}>
                <select value={memberEventId} onChange={(e) => setMemberEventId(e.target.value)}>
                  <option value="">イベントを選択</option>
                  {sessionEvents.map((event) => (
                    <option key={event.id} value={event.id}>
                      {event.title}
                    </option>
                  ))}
                </select>
                <select value={memberAttendanceStatus} onChange={(e) => setMemberAttendanceStatus(e.target.value as "attending" | "absent" | "undecided") }>
                  <option value="attending">attending</option>
                  <option value="undecided">undecided</option>
                  <option value="absent">absent</option>
                </select>
                {memberEntryState.round === 1 && (
                  <>
                    <input type="text" placeholder="Round 1 - 1曲目" value={memberRound1Song1} onChange={(e) => setMemberRound1Song1(e.target.value)} list="song-titles" />
                    <input type="text" placeholder="Round 1 - 1曲目 key" value={memberRound1Key1} onChange={(e) => setMemberRound1Key1(e.target.value)} />
                    <input type="text" placeholder="Round 1 - 2曲目" value={memberRound1Song2} onChange={(e) => setMemberRound1Song2(e.target.value)} list="song-titles" />
                    <input type="text" placeholder="Round 1 - 2曲目 key" value={memberRound1Key2} onChange={(e) => setMemberRound1Key2(e.target.value)} />
                  </>
                )}
                {memberEntryState.round === 2 && (
                  <>
                    <input type="text" placeholder="Round 2 - 1曲目" value={memberRound2Song1} onChange={(e) => setMemberRound2Song1(e.target.value)} list="song-titles" />
                    <input type="text" placeholder="Round 2 - 1曲目 key" value={memberRound2Key1} onChange={(e) => setMemberRound2Key1(e.target.value)} />
                    {!currentUser?.memberProfile || currentUser.memberProfile.mainInstrument !== "vocal" ? (
                      <>
                        <input type="text" placeholder="Round 2 - 2曲目" value={memberRound2Song2} onChange={(e) => setMemberRound2Song2(e.target.value)} list="song-titles" />
                        <input type="text" placeholder="Round 2 - 2曲目 key" value={memberRound2Key2} onChange={(e) => setMemberRound2Key2(e.target.value)} />
                      </>
                    ) : null}
                  </>
                )}
                <div>
                  <button type="button" onClick={handleSubmitSessionEntry} disabled={loading || !memberEventId || !memberEntryState.canSubmit}>
                    エントリー保存
                  </button>
                </div>
              </div>
            </div>

            <div>
              <h3>自分のエントリー履歴</h3>
              {sessionEntries.length === 0 ? (
                <p>まだエントリーはありません。</p>
              ) : (
                <ul>
                  {sessionEntries.map((entry) => (
                    <li key={entry.id} style={{ marginBottom: "0.75rem" }}>
                      <strong>{entry.sessionEvent.title}</strong> ({entry.attendanceStatus})
                      <ul>
                        {entry.requests.map((request) => (
                          <li key={request.id}>
                            Round {request.round} / {request.priority}: {request.songTitleSnapshot}
                            {request.keyName ? ` (key: ${request.keyName})` : ""}
                          </li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <h3>公開済み sessionSet の評価</h3>
              {memberSessionSets.length === 0 ? (
                <p>評価対象の公開済み sessionSet はありません。</p>
              ) : (
                <ul>
                  {memberSessionSets.map((sessionSet) => (
                    <li key={sessionSet.id} style={{ marginBottom: "1rem" }}>
                      <strong>{sessionSet.songTitle}</strong>
                      <div style={{ display: "grid", gap: "0.35rem", marginTop: "0.35rem" }}>
                        <select
                          value={String(memberRatings[sessionSet.id] ?? "")}
                          onChange={(e) =>
                            setMemberRatings((current) => ({
                              ...current,
                              [sessionSet.id]: Number(e.target.value),
                            }))
                          }
                        >
                          <option value="">星を選択</option>
                          <option value="1">1</option>
                          <option value="2">2</option>
                          <option value="3">3</option>
                          <option value="4">4</option>
                          <option value="5">5</option>
                        </select>
                        <textarea
                          rows={2}
                          placeholder="コメント"
                          value={memberRatingComments[sessionSet.id] ?? ""}
                          onChange={(e) =>
                            setMemberRatingComments((current) => ({
                              ...current,
                              [sessionSet.id]: e.target.value,
                            }))
                          }
                        />
                        <div>
                          <button type="button" onClick={() => handleSaveRating(sessionSet.id)} disabled={loading}>
                            評価を保存
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>
      )}

      {isAdmin && (
      <section style={{ marginTop: "2rem", padding: "1rem", border: "1px solid #ddd", borderRadius: "0.5rem" }}>
        <h2>管理者ダッシュボード</h2>
        <div style={{ display: "grid", gap: "1rem" }}>
          <div>
            <h3>セッションイベント管理</h3>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
              <input type="text" placeholder="イベント名" value={eventTitle} onChange={(e) => setEventTitle(e.target.value)} />
              <input type="text" placeholder="会場" value={eventVenue} onChange={(e) => setEventVenue(e.target.value)} />
              <input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
              <button type="button" onClick={handleCreateSessionEvent} disabled={loading}>
                イベント作成
              </button>
            </div>
            <div style={{ marginTop: "1rem", display: "grid", gap: "0.5rem" }}>
              <select value={selectedAdminEventId} onChange={(e) => setSelectedAdminEventId(e.target.value)}>
                <option value="">編集するイベントを選択</option>
                {sessionEvents.map((event) => (
                  <option key={event.id} value={event.id}>
                    {event.title}
                  </option>
                ))}
              </select>
              {selectedAdminEvent && (
                <>
                  <input type="text" placeholder="イベント名" value={editEventTitle} onChange={(e) => setEditEventTitle(e.target.value)} />
                  <input type="text" placeholder="会場" value={editEventVenue} onChange={(e) => setEditEventVenue(e.target.value)} />
                  <input type="date" value={editEventDate} onChange={(e) => setEditEventDate(e.target.value)} />
                  <select value={editEventStatus} onChange={(e) => setEditEventStatus(e.target.value)}>
                    <option value="draft">draft</option>
                    <option value="recruiting_round1">recruiting_round1</option>
                    <option value="recruiting_round2">recruiting_round2</option>
                    <option value="generating">generating</option>
                    <option value="published">published</option>
                    <option value="closed">closed</option>
                  </select>
                  <input type="datetime-local" value={editRound1StartAt} onChange={(e) => setEditRound1StartAt(e.target.value)} />
                  <input type="datetime-local" value={editRound1EndAt} onChange={(e) => setEditRound1EndAt(e.target.value)} />
                  <input type="datetime-local" value={editRound2StartAt} onChange={(e) => setEditRound2StartAt(e.target.value)} />
                  <input type="datetime-local" value={editRound2EndAt} onChange={(e) => setEditRound2EndAt(e.target.value)} />
                  <div>
                    <button type="button" onClick={handleUpdateSessionEvent} disabled={loading}>
                      イベント更新
                    </button>
                  </div>
                </>
              )}
            </div>
            <ul style={{ marginTop: "0.5rem" }}>
              {sessionEvents.map((event) => (
                <li key={event.id}>
                  <strong>{event.title}</strong> / {event.venue} / {new Date(event.eventDate).toLocaleDateString("ja-JP")} / status: {event.status}
                  {event._count ? ` / entries: ${event._count.sessionEntries} / sets: ${event._count.sessionSets}` : ""}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3>評価集計</h3>
            {ratingSummaries.length === 0 ? (
              <p>まだ評価集計はありません。</p>
            ) : (
              <ul>
                {ratingSummaries.map((summary) => (
                  <li key={summary.sessionSetId} style={{ marginBottom: "0.5rem" }}>
                    <strong>{summary.songTitle}</strong>
                    {` / 件数 ${summary.ratingCount} / 平均 ${summary.averageRating?.toFixed(2) ?? "-"}`}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <h3>アーカイブ管理</h3>
            {archivePreview ? (
              <p style={{ color: "#555" }}>
                保存対象: 参加者 {archivePreview.participantCount} 名 / sessionSet {archivePreview.setCount} 曲 / 評価集計 {archivePreview.ratingSummaryIncluded ? "あり" : "なし"}
              </p>
            ) : (
              <p style={{ color: "#555" }}>アーカイブ preview はありません。</p>
            )}
            <div style={{ display: "grid", gap: "0.5rem", maxWidth: 480 }}>
              <input type="text" placeholder="アーカイブ名" value={archiveTitle} onChange={(e) => setArchiveTitle(e.target.value)} />
              <textarea rows={2} placeholder="メモ" value={archiveNote} onChange={(e) => setArchiveNote(e.target.value)} />
              <div>
                <button type="button" onClick={handleCreateArchive} disabled={loading || !selectedAdminEventId}>
                  アーカイブ作成
                </button>
              </div>
            </div>
            {archives.length === 0 ? (
              <p>アーカイブはまだありません。</p>
            ) : (
              <ul style={{ marginTop: "0.75rem" }}>
                {archives.map((archive) => (
                  <li key={archive.id} style={{ marginBottom: "0.75rem" }}>
                    <strong>{archive.title}</strong>
                    {` / v${archive.version} / ${archive.sessionEventTitle} / sets ${archive.setCount} / ratings ${archive.ratingCount}`}
                    {archive.deletedAt ? ` / deleted ${new Date(archive.deletedAt).toLocaleString("ja-JP")}` : ""}
                    {!archive.deletedAt && (
                      <div>
                        <button type="button" onClick={() => handleDeleteArchive(archive.id)} disabled={loading}>
                          アーカイブ削除
                        </button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <h3>メンバー管理</h3>
            <div style={{ display: "grid", gridTemplateColumns: "minmax(220px, 280px) 1fr", gap: "1rem" }}>
              <ul style={{ margin: 0, paddingLeft: "1rem" }}>
                {members.map((member) => (
                  <li key={member.id} style={{ marginBottom: "0.5rem" }}>
                    <button type="button" onClick={() => setSelectedMemberId(member.id)} disabled={loading}>
                      {member.displayName} / {member.userAccount.status}
                    </button>
                  </li>
                ))}
              </ul>
              <div>
                {selectedMemberDetail ? (
                  <div style={{ display: "grid", gap: "0.5rem", maxWidth: 420 }}>
                    <div>{selectedMemberDetail.userAccount.email}</div>
                    <select value={adminMemberRole} onChange={(e) => setAdminMemberRole(e.target.value as "member" | "admin") }>
                      <option value="member">member</option>
                      <option value="admin">admin</option>
                    </select>
                    <select value={adminMemberStatus} onChange={(e) => setAdminMemberStatus(e.target.value as "active" | "suspended" | "invited") }>
                      <option value="active">active</option>
                      <option value="suspended">suspended</option>
                      <option value="invited">invited</option>
                    </select>
                    <div>
                      <button type="button" onClick={handleUpdateMemberAdmin} disabled={loading}>
                        メンバー設定保存
                      </button>
                    </div>
                  </div>
                ) : (
                  <p>メンバーを選択してください。</p>
                )}
              </div>
            </div>
          </div>

          <div>
            <h3>アクティビティ履歴</h3>
            {activityLogs.length === 0 ? (
              <p>履歴はありません。</p>
            ) : (
              <ul>
                {activityLogs.map((log) => (
                  <li key={log.id} style={{ marginBottom: "0.5rem" }}>
                    {new Date(log.performedAt).toLocaleString("ja-JP")} / {log.action} / {log.summary || log.targetType}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <h3>お知らせ配信</h3>
            <div style={{ display: "grid", gap: "0.5rem", maxWidth: 520 }}>
              <input type="text" placeholder="タイトル" value={announcementTitle} onChange={(e) => setAnnouncementTitle(e.target.value)} />
              <textarea rows={3} placeholder="本文" value={announcementBody} onChange={(e) => setAnnouncementBody(e.target.value)} />
              <label>
                <input type="checkbox" checked={announcementPublished} onChange={(e) => setAnnouncementPublished(e.target.checked)} /> 公開する
              </label>
              <div>
                <button type="button" onClick={handleCreateAnnouncement} disabled={loading}>
                  お知らせ作成
                </button>
              </div>
            </div>
            {announcements.length === 0 ? (
              <p>お知らせはまだありません。</p>
            ) : (
              <ul style={{ marginTop: "0.75rem" }}>
                {announcements.map((announcement) => (
                  <li key={announcement.id}>
                    <strong>{announcement.title}</strong>
                    {` / ${announcement.isPublished ? "published" : "draft"}`}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <h3>MailLog</h3>
            {mailLogs.length === 0 ? (
              <p>メール送信ログはありません。</p>
            ) : (
              <ul>
                {mailLogs.map((log) => (
                  <li key={log.id} style={{ marginBottom: "0.5rem" }}>
                    {new Date(log.createdAt).toLocaleString("ja-JP")} / {log.mailType} / {log.toAddress} / {log.status}
                    {log.errorMessage ? ` / ${log.errorMessage}` : ""}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>
      )}

      {isAdmin && (
      <>
      <section style={{ marginTop: "2rem" }}>
        <h2>1. 参加者の登録</h2>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
          <input
            type="text"
            placeholder="名前"
            value={newParticipantName}
            onChange={(e) => setNewParticipantName(e.target.value)}
          />
          <select
            value={newParticipantInstrument}
            onChange={(e) => setNewParticipantInstrument(e.target.value as Instrument)}
          >
            <option value="drum">drum</option>
            <option value="bass">bass</option>
            <option value="piano">piano</option>
            <option value="front">front</option>
            <option value="vocal">vocal</option>
          </select>
          <button type="button" onClick={handleAddParticipant} disabled={loading || !isAdmin}>
            追加
          </button>
        </div>
        {!isAdmin && <p style={{ color: "#a33" }}>追加操作には管理者サインインが必要です。</p>}
        <ul style={{ marginTop: "0.5rem" }}>
          {participants.map((p) => (
            <li key={p.id} style={{ marginBottom: "0.75rem" }}>
              {(() => {
                const round1Requests = [...p.requestedSongs]
                  .filter((request) => request.round === 1)
                  .sort((a, b) => a.song.title.localeCompare(b.song.title));
                const round2Requests = [...p.requestedSongs]
                  .filter((request) => request.round === 2)
                  .sort((a, b) => a.song.title.localeCompare(b.song.title));

                return (
                  <>
                    <div>
                      <strong>{p.name}</strong> ({p.instrument})
                    </div>
                    {p.requestedSongs.length === 0 ? (
                      <div style={{ color: "#666" }}>希望曲なし</div>
                    ) : (
                      <div style={{ marginTop: "0.25rem" }}>
                        <div>
                          <strong>Round 1</strong>
                        </div>
                        {round1Requests.length === 0 ? (
                          <div style={{ color: "#666" }}>なし</div>
                        ) : (
                          <ul style={{ marginTop: "0.15rem" }}>
                            {round1Requests.map((request) => (
                              <li key={request.id}>
                                {request.song.title}
                                {request.keyName ? ` (key: ${request.keyName})` : ""}
                              </li>
                            ))}
                          </ul>
                        )}

                        <div style={{ marginTop: "0.35rem" }}>
                          <strong>Round 2</strong>
                        </div>
                        {round2Requests.length === 0 ? (
                          <div style={{ color: "#666" }}>なし</div>
                        ) : (
                          <ul style={{ marginTop: "0.15rem" }}>
                            {round2Requests.map((request) => (
                              <li key={request.id}>
                                {request.song.title}
                                {request.keyName ? ` (key: ${request.keyName})` : ""}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </>
                );
              })()}
            </li>
          ))}
        </ul>
      </section>

      <section style={{ marginTop: "2rem" }}>
        <h2>2. 曲マスタの登録（任意）</h2>
        <p>round=1 の希望登録時に新曲は自動追加されるため、ここは任意です。</p>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
          <input
            type="text"
            placeholder="曲名"
            value={newSongTitle}
            onChange={(e) => setNewSongTitle(e.target.value)}
          />
          <button type="button" onClick={handleAddSong} disabled={loading || !isAdmin}>
            追加
          </button>
        </div>
        {!isAdmin && <p style={{ color: "#a33" }}>追加操作には管理者サインインが必要です。</p>}
        <ul style={{ marginTop: "0.5rem" }}>
          {songs.map((s) => (
            <li key={s.id}>{s.title}</li>
          ))}
        </ul>
      </section>

      <section style={{ marginTop: "2rem" }}>
        <h2>3. 希望曲の登録</h2>
        <p>
          1回目(round=1) は新曲も入力可、2回目(round=2) は既存の曲名から選択してください。
          vocal は常に key を入力してください。
        </p>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
          <select
            value={requestParticipantId}
            onChange={(e) => setRequestParticipantId(e.target.value)}
          >
            <option value="">参加者を選択</option>
            {participants.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.instrument})
              </option>
            ))}
          </select>

          <select
            value={requestRound}
            onChange={(e) => setRequestRound(Number(e.target.value) === 2 ? 2 : 1)}
          >
            <option value={1}>round 1</option>
            <option value={2}>round 2</option>
          </select>

          <input
            type="text"
            placeholder="曲名"
            value={requestSongTitle}
            onChange={(e) => setRequestSongTitle(e.target.value)}
            list="song-titles"
          />
          <datalist id="song-titles">
            {songs.map((s) => (
              <option key={s.id} value={s.title} />
            ))}
          </datalist>

          <input
            type="text"
            placeholder="キー (vocal のみ必須)"
            value={requestKeyName}
            onChange={(e) => setRequestKeyName(e.target.value)}
          />

          <button type="button" onClick={handleAddRequest} disabled={loading || !isAdmin}>
            希望を追加
          </button>
        </div>
        {!isAdmin && <p style={{ color: "#a33" }}>登録操作には管理者サインインが必要です。</p>}
      </section>

      <section style={{ marginTop: "2rem" }}>
        <h2>4. sessionSet の生成</h2>
        <div style={{ display: "grid", gap: "0.5rem", maxWidth: 420 }}>
          <select value={selectedAdminEventId} onChange={(e) => setSelectedAdminEventId(e.target.value)}>
            <option value="">生成対象イベントを選択</option>
            {sessionEvents.map((event) => (
              <option key={event.id} value={event.id}>
                {event.title}
              </option>
            ))}
          </select>
        <button type="button" onClick={handleGenerateSessionSets} disabled={loading || !isAdmin || !selectedAdminEventId}>
          sessionSet を自動生成
        </button>
        </div>
        <div style={{ marginTop: "0.5rem" }}>
          <button type="button" onClick={handlePublishSessionSets} disabled={loading || !isAdmin || !selectedAdminEventId || sessionSets.length === 0}>
            sessionSet を公開確定
          </button>
        </div>
        {!isAdmin && <p style={{ color: "#a33" }}>生成操作には管理者サインインが必要です。</p>}

        <div style={{ marginTop: "1rem" }}>
          {sessionSets.length === 0 ? (
            <p>まだ sessionSet がありません。</p>
          ) : (
            <table
              style={{
                borderCollapse: "collapse",
                width: "100%",
                marginTop: "0.5rem",
              }}
            >
              <thead>
                <tr>
                  <th style={{ border: "1px solid #ccc", padding: "0.25rem" }}>曲名</th>
                  <th style={{ border: "1px solid #ccc", padding: "0.25rem" }}>Key</th>
                  <th style={{ border: "1px solid #ccc", padding: "0.25rem" }}>Drum</th>
                  <th style={{ border: "1px solid #ccc", padding: "0.25rem" }}>Bass</th>
                  <th style={{ border: "1px solid #ccc", padding: "0.25rem" }}>Piano</th>
                  <th style={{ border: "1px solid #ccc", padding: "0.25rem" }}>Front</th>
                  <th style={{ border: "1px solid #ccc", padding: "0.25rem" }}>Vocal</th>
                </tr>
              </thead>
              <tbody>
                {sessionSets.map((s) => (
                  <tr key={s.id}>
                    <td style={{ border: "1px solid #ccc", padding: "0.25rem" }}>
                      {s.songTitle}
                    </td>
                    <td style={{ border: "1px solid #ccc", padding: "0.25rem" }}>
                      {s.key ?? "-"}
                    </td>
                    <td style={{ border: "1px solid #ccc", padding: "0.25rem" }}>
                      {s.drum?.name ?? "-"}
                    </td>
                    <td style={{ border: "1px solid #ccc", padding: "0.25rem" }}>
                      {s.bass?.name ?? "-"}
                    </td>
                    <td style={{ border: "1px solid #ccc", padding: "0.25rem" }}>
                      {s.piano?.name ?? "-"}
                    </td>
                    <td style={{ border: "1px solid #ccc", padding: "0.25rem" }}>
                      {(s.front ?? []).map((f) => f.name).join(", ") || "-"}
                    </td>
                    <td style={{ border: "1px solid #ccc", padding: "0.25rem" }}>
                      {(s.vocal ?? []).map((v) => v.name).join(", ") || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div style={{ marginTop: "1rem" }}>
          <h3>強制参加で追加生成された曲</h3>
          {forcedSessionSets.length === 0 ? (
            <p>強制追加された曲はありません。</p>
          ) : (
            <ul>
              {forcedSessionSets.map((song) => (
                <li key={song.songTitle} style={{ marginBottom: "0.5rem" }}>
                  <strong>{song.songTitle}</strong>
                  {` : 強制参加 ${song.forcedInstruments.join(", ")} / 他の希望者 ${song.requesterCount} 名`}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div style={{ marginTop: "1rem" }}>
          <h3>生成されなかった曲</h3>
          {skippedSongs.length === 0 ? (
            <p>未生成の曲はありません。</p>
          ) : (
            <ul>
              {skippedSongs.map((song) => (
                <li key={song.songTitle} style={{ marginBottom: "0.5rem" }}>
                  <strong>{song.songTitle}</strong>
                  <ul style={{ marginTop: "0.15rem" }}>
                    {song.reasons.map((reason) => (
                      <li key={reason}>{reason}</li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
      </>
      )}
    </main>
  );
}
