"use client";

import { useEffect, useState } from "react";
import { AdminPortalSection } from "@/components/portal/AdminPortalSection";
import { AuthPortalSection } from "@/components/portal/AuthPortalSection";
import { MemberPortalSection } from "@/components/portal/MemberPortalSection";
import {
  type AnnouncementView,
  type AttendanceStatus,
  type AuthUser,
  type ColumnView,
  type GeneratedResult,
  type Instrument,
  type MemberDetailView,
  type MemberListView,
  type MemberRatingHistoryView,
  type PortalView,
  type RatingSummaryView,
  type SessionEntryView,
  type SessionEventView,
  type SessionSetView,
  type ArchiveView,
  type ActivityLogView,
  type MailLogView,
} from "@/components/portal/types";

function formatDateTimeLocal(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60_000);
  return localDate.toISOString().slice(0, 16);
}

function getEventEntryState(event?: SessionEventView | null) {
  if (!event) {
    return { canSubmit: false, round: null as 1 | 2 | null, reason: "イベントを選択してください" };
  }

  const now = new Date();
  const active = (start?: string | null, end?: string | null) => {
    const startDate = start ? new Date(start) : null;
    const endDate = end ? new Date(end) : null;
    if (startDate && now < startDate) return false;
    if (endDate && now > endDate) return false;
    return true;
  };

  if (event.status === "recruiting_round1") {
    const canSubmit = active(event.round1StartAt, event.round1EndAt);
    return { canSubmit, round: 1 as const, reason: canSubmit ? null : "round1 の募集期間外です" };
  }
  if (event.status === "recruiting_round2") {
    const canSubmit = active(event.round2StartAt, event.round2EndAt);
    return { canSubmit, round: 2 as const, reason: canSubmit ? null : "round2 の募集期間外です" };
  }

  return { canSubmit: false, round: null as 1 | 2 | null, reason: "現在は募集受付中ではありません" };
}

async function parseJson(response: Response) {
  return response.json().catch(() => ({}));
}

export default function PortalWorkspace({ view }: { view: PortalView }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);

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

  const [announcements, setAnnouncements] = useState<AnnouncementView[]>([]);
  const [members, setMembers] = useState<MemberListView[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [selectedMemberDetail, setSelectedMemberDetail] = useState<MemberDetailView | null>(null);
  const [selectedMemberRatings, setSelectedMemberRatings] = useState<MemberRatingHistoryView[]>([]);

  const [sessionEvents, setSessionEvents] = useState<SessionEventView[]>([]);
  const [sessionEntries, setSessionEntries] = useState<SessionEntryView[]>([]);
  const [memberSessionSets, setMemberSessionSets] = useState<SessionSetView[]>([]);
  const [memberEventId, setMemberEventId] = useState("");
  const [memberAttendanceStatus, setMemberAttendanceStatus] = useState<AttendanceStatus>("attending");
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

  const [selectedAdminEventId, setSelectedAdminEventId] = useState("");
  const [eventTitle, setEventTitle] = useState("2026年6月 セッション");
  const [eventVenue, setEventVenue] = useState("渋谷 Jazz Spot");
  const [eventDate, setEventDate] = useState("2026-06-21");
  const [editEventTitle, setEditEventTitle] = useState("");
  const [editEventVenue, setEditEventVenue] = useState("");
  const [editEventDate, setEditEventDate] = useState("");
  const [editEventStatus, setEditEventStatus] = useState("draft");
  const [editRound1StartAt, setEditRound1StartAt] = useState("");
  const [editRound1EndAt, setEditRound1EndAt] = useState("");
  const [editRound2StartAt, setEditRound2StartAt] = useState("");
  const [editRound2EndAt, setEditRound2EndAt] = useState("");
  const [sessionSets, setSessionSets] = useState<SessionSetView[]>([]);
  const [ratingSummaries, setRatingSummaries] = useState<RatingSummaryView[]>([]);
  const [archives, setArchives] = useState<ArchiveView[]>([]);
  const [archiveTitle, setArchiveTitle] = useState("");
  const [archiveNote, setArchiveNote] = useState("");
  const [archivePreview, setArchivePreview] = useState<{ participantCount: number; setCount: number; ratingSummaryIncluded: boolean } | null>(null);
  const [generatedResult, setGeneratedResult] = useState<GeneratedResult>({ sessionSets: [], skippedSongs: [], forcedSessionSets: [] });
  const [activityLogs, setActivityLogs] = useState<ActivityLogView[]>([]);
  const [mailLogs, setMailLogs] = useState<MailLogView[]>([]);
  const [columns, setColumns] = useState<ColumnView[]>([]);
  const [adminMemberRole, setAdminMemberRole] = useState<"member" | "admin">("member");
  const [adminMemberStatus, setAdminMemberStatus] = useState<"active" | "suspended" | "invited">("active");
  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementBody, setAnnouncementBody] = useState("");
  const [announcementPublished, setAnnouncementPublished] = useState(true);
  const [columnTitle, setColumnTitle] = useState("");
  const [columnSlug, setColumnSlug] = useState("");
  const [columnSummary, setColumnSummary] = useState("");
  const [columnBody, setColumnBody] = useState("");
  const [columnThumbnailLabel, setColumnThumbnailLabel] = useState("Guide");
  const [columnAuthorName, setColumnAuthorName] = useState("Adolib-go 運営");
  const [columnPublished, setColumnPublished] = useState(true);

  const isMember = currentUser?.role === "member";
  const isAdmin = currentUser?.role === "admin";
  const selectedMemberEvent = sessionEvents.find((event) => event.id === memberEventId) ?? null;
  const selectedAdminEvent = sessionEvents.find((event) => event.id === selectedAdminEventId) ?? null;
  const entryState = getEventEntryState(selectedMemberEvent);

  const loadAll = async () => {
    setLoading(true);
    try {
      const meRes = await fetch("/api/auth/me");
      const meJson = await parseJson(meRes);
      const user = meJson.user ?? null;
      setCurrentUser(user);

      if (!user) {
        setAnnouncements([]);
        setMembers([]);
        setSessionEvents([]);
        setSessionEntries([]);
        setMemberSessionSets([]);
        setSessionSets([]);
        setRatingSummaries([]);
        setArchives([]);
        setActivityLogs([]);
        setMailLogs([]);
        setColumns([]);
        return;
      }

      const [announcementRes, memberRes, eventRes] = await Promise.all([
        fetch("/api/announcements"),
        fetch("/api/members"),
        fetch("/api/session-events"),
      ]);
      const announcementJson = await parseJson(announcementRes);
      const memberJson = await parseJson(memberRes);
      const eventJson = await parseJson(eventRes);
      setAnnouncements(announcementJson.announcements ?? []);
      setMembers(memberJson.members ?? []);
      setSessionEvents(eventJson.sessionEvents ?? []);

      if (user.role === "member") {
        const [entryRes, setRes] = await Promise.all([
          fetch("/api/session-entries"),
          memberEventId ? fetch(`/api/session-sets?sessionEventId=${memberEventId}`) : Promise.resolve(null),
        ]);
        const entryJson = await parseJson(entryRes);
        setSessionEntries(entryJson.entries ?? []);
        if (setRes) {
          const setJson = await parseJson(setRes);
          setMemberSessionSets((setJson.sessionSets ?? []).filter((item: SessionSetView) => item.isPublished));
        }
      }

      if (user.role === "admin") {
        const [archiveRes, activityRes, mailLogRes, setRes, columnRes] = await Promise.all([
          fetch("/api/session-archives"),
          fetch("/api/admin/activity"),
          fetch("/api/admin/mail-logs"),
          selectedAdminEventId ? fetch(`/api/session-sets?sessionEventId=${selectedAdminEventId}`) : Promise.resolve(null),
          fetch("/api/columns?includeDrafts=1"),
        ]);
        const archiveJson = await parseJson(archiveRes);
        const activityJson = await parseJson(activityRes);
        const mailLogJson = await parseJson(mailLogRes);
        const columnJson = await parseJson(columnRes);
        setArchives(archiveJson.archives ?? []);
        setActivityLogs(activityJson.activity ?? []);
        setMailLogs(mailLogJson.mailLogs ?? []);
        setColumns(columnJson.columns ?? []);
        if (setRes) {
          const setJson = await parseJson(setRes);
          setSessionSets(setJson.sessionSets ?? []);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll().catch((error) => {
      console.error(error);
      setMessage("データ取得に失敗しました");
      setLoading(false);
    });
  }, [memberEventId, selectedAdminEventId]);

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
    if (!selectedAdminEventId && sessionEvents.length > 0) {
      setSelectedAdminEventId(sessionEvents[0].id);
    }
    if (!selectedMemberId && members.length > 0) {
      setSelectedMemberId(members[0].id);
    }
  }, [memberEventId, members, selectedAdminEventId, selectedMemberId, sessionEvents]);

  useEffect(() => {
    if (!selectedAdminEvent) {
      return;
    }
    setEditEventTitle(selectedAdminEvent.title);
    setEditEventVenue(selectedAdminEvent.venue);
    setEditEventDate(selectedAdminEvent.eventDate.slice(0, 10));
    setEditEventStatus(selectedAdminEvent.status);
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
    fetch(`/api/members/${selectedMemberId}`)
      .then(parseJson)
      .then((json) => {
        setSelectedMemberDetail(json.member ?? null);
        setSelectedMemberRatings(json.ratings ?? []);
      })
      .catch((error) => console.error(error));
  }, [currentUser, selectedMemberId]);

  useEffect(() => {
    if (!selectedMemberDetail) {
      return;
    }
    setAdminMemberRole(selectedMemberDetail.userAccount.role);
    setAdminMemberStatus(selectedMemberDetail.userAccount.status as "active" | "suspended" | "invited");
  }, [selectedMemberDetail]);

  useEffect(() => {
    if (!selectedAdminEventId || !isAdmin) {
      setRatingSummaries([]);
      setArchivePreview(null);
      return;
    }
    Promise.all([
      fetch(`/api/session-events/${selectedAdminEventId}/ratings-summary`).then(parseJson),
      fetch(`/api/session-events/${selectedAdminEventId}/archive-preview`).then(parseJson),
    ])
      .then(([summaryJson, previewJson]) => {
        setRatingSummaries(summaryJson.summaries ?? []);
        setArchivePreview(previewJson.preview ?? null);
      })
      .catch((error) => console.error(error));
  }, [isAdmin, selectedAdminEventId]);

  useEffect(() => {
    const currentEntry = sessionEntries.find((entry) => entry.sessionEventId === memberEventId);
    if (!currentEntry) {
      return;
    }
    setMemberAttendanceStatus(currentEntry.attendanceStatus);
  }, [memberEventId, sessionEntries]);

  const runAction = async (action: () => Promise<void>, successMessage?: string) => {
    setLoading(true);
    setMessage(null);
    try {
      await action();
      if (successMessage) {
        setMessage(successMessage);
      }
    } catch (error: any) {
      setMessage(error?.message ?? "処理に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async () => runAction(async () => {
    const res = await fetch("/api/auth/signin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: authEmail, password: authPassword }),
    });
    const json = await parseJson(res);
    if (!res.ok) throw new Error(json.error ?? "サインインに失敗しました");
    setCurrentUser(json.user ?? null);
  }, "サインインしました");

  const handleSignUp = async () => runAction(async () => {
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
    const json = await parseJson(res);
    if (!res.ok) throw new Error(json.error ?? "サインアップに失敗しました");
    setCurrentUser(json.user ?? null);
  }, "サインアップしました");

  const handleSignOut = async () => runAction(async () => {
    await fetch("/api/auth/signout", { method: "POST" });
    setCurrentUser(null);
    await loadAll();
  }, "サインアウトしました");

  const handleForgotPassword = async () => runAction(async () => {
    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: resetEmail }),
    });
    const json = await parseJson(res);
    if (!res.ok) throw new Error(json.error ?? "再設定トークン発行に失敗しました");
    setIssuedResetToken(json.resetToken ?? null);
    setResetToken(json.resetToken ?? "");
  }, "再設定トークンを発行しました");

  const handleResetPassword = async () => runAction(async () => {
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: resetToken, password: resetPassword }),
    });
    const json = await parseJson(res);
    if (!res.ok) throw new Error(json.error ?? "パスワード更新に失敗しました");
    setResetToken("");
    setResetPassword("");
  }, "パスワードを更新しました");

  const handleProfileUpdate = async () => runAction(async () => {
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
    const json = await parseJson(res);
    if (!res.ok) throw new Error(json.error ?? "プロフィール更新に失敗しました");
    setCurrentUser(json.user ?? currentUser);
    await loadAll();
  }, "プロフィールを更新しました");

  const handleSubmitEntry = async () => runAction(async () => {
    if (!memberEventId || !entryState.round || !entryState.canSubmit) {
      throw new Error(entryState.reason ?? "現在は登録できません");
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
    const res = await fetch("/api/session-entries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionEventId: memberEventId,
        attendanceStatus: memberAttendanceStatus,
        requests: requests.filter((item) => item.songTitle),
      }),
    });
    const json = await parseJson(res);
    if (!res.ok) throw new Error(json.error ?? "エントリー保存に失敗しました");
    await loadAll();
  }, "セッションエントリーを保存しました");

  const handleSaveRating = async (sessionSetId: string) => runAction(async () => {
    const res = await fetch(`/api/session-sets/${sessionSetId}/ratings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rating: memberRatings[sessionSetId],
        comment: memberRatingComments[sessionSetId] ?? "",
      }),
    });
    const json = await parseJson(res);
    if (!res.ok) throw new Error(json.error ?? "評価保存に失敗しました");
  }, "評価を保存しました");

  const handleCreateEvent = async () => runAction(async () => {
    const res = await fetch("/api/session-events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: eventTitle, venue: eventVenue, eventDate, status: "draft" }),
    });
    const json = await parseJson(res);
    if (!res.ok) throw new Error(json.error ?? "イベント作成に失敗しました");
    await loadAll();
  }, "イベントを作成しました");

  const handleUpdateEvent = async () => runAction(async () => {
    if (!selectedAdminEventId) throw new Error("イベントを選択してください");
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
    const json = await parseJson(res);
    if (!res.ok) throw new Error(json.error ?? "イベント更新に失敗しました");
    await loadAll();
  }, "イベントを更新しました");

  const handleGenerateSets = async () => runAction(async () => {
    if (!selectedAdminEventId) throw new Error("イベントを選択してください");
    const res = await fetch("/api/session-sets/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionEventId: selectedAdminEventId }),
    });
    const json = await parseJson(res);
    if (!res.ok) throw new Error(json.error ?? "sessionSet 生成に失敗しました");
    setGeneratedResult({
      sessionSets: json.sessionSets ?? [],
      skippedSongs: json.skippedSongs ?? [],
      forcedSessionSets: json.forcedSessionSets ?? [],
    });
    setSessionSets(json.sessionSets ?? []);
  }, "sessionSet を生成しました");

  const handlePublishSets = async () => runAction(async () => {
    if (!selectedAdminEventId) throw new Error("イベントを選択してください");
    const res = await fetch(`/api/session-events/${selectedAdminEventId}/publish`, { method: "POST" });
    const json = await parseJson(res);
    if (!res.ok) throw new Error(json.error ?? "公開に失敗しました");
    await loadAll();
  }, "sessionSet を公開しました");

  const handleCreateArchive = async () => runAction(async () => {
    if (!selectedAdminEventId) throw new Error("イベントを選択してください");
    const res = await fetch("/api/session-archives", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionEventId: selectedAdminEventId, title: archiveTitle, note: archiveNote }),
    });
    const json = await parseJson(res);
    if (!res.ok) throw new Error(json.error ?? "アーカイブ作成に失敗しました");
    setArchiveTitle("");
    setArchiveNote("");
    await loadAll();
  }, "アーカイブを作成しました");

  const handleDeleteArchive = async (archiveId: string) => runAction(async () => {
    const res = await fetch(`/api/session-archives/${archiveId}`, { method: "DELETE" });
    const json = await parseJson(res);
    if (!res.ok) throw new Error(json.error ?? "アーカイブ削除に失敗しました");
    await loadAll();
  }, "アーカイブを削除しました");

  const handleUpdateMember = async () => runAction(async () => {
    if (!selectedMemberId) throw new Error("メンバーを選択してください");
    const res = await fetch(`/api/members/${selectedMemberId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: adminMemberRole, status: adminMemberStatus }),
    });
    const json = await parseJson(res);
    if (!res.ok) throw new Error(json.error ?? "メンバー更新に失敗しました");
    await loadAll();
  }, "メンバー設定を更新しました");

  const handleCreateAnnouncement = async () => runAction(async () => {
    const res = await fetch("/api/announcements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: announcementTitle, body: announcementBody, isPublished: announcementPublished }),
    });
    const json = await parseJson(res);
    if (!res.ok) throw new Error(json.error ?? "お知らせ作成に失敗しました");
    setAnnouncementTitle("");
    setAnnouncementBody("");
    setAnnouncementPublished(true);
    await loadAll();
  }, "お知らせを作成しました");

  const handleCreateColumn = async () => runAction(async () => {
    const res = await fetch("/api/columns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: columnTitle,
        slug: columnSlug,
        summary: columnSummary,
        body: columnBody,
        thumbnailLabel: columnThumbnailLabel,
        authorName: columnAuthorName,
        isPublished: columnPublished,
      }),
    });
    const json = await parseJson(res);
    if (!res.ok) throw new Error(json.error ?? "コラム作成に失敗しました");
    setColumnTitle("");
    setColumnSlug("");
    setColumnSummary("");
    setColumnBody("");
    setColumnThumbnailLabel("Guide");
    setColumnAuthorName("Adolib-go 運営");
    setColumnPublished(true);
    await loadAll();
  }, "コラムを作成しました");

  return (
    <main style={{ padding: "2rem", maxWidth: 1000, margin: "0 auto" }}>
      <h1>{view === "admin" ? "管理ダッシュボード" : view === "member" ? "メンバーページ" : view === "signup" ? "サインアップ" : "サインイン"}</h1>
      {message && <p style={{ color: "darkgreen" }}>{message}</p>}
      {loading && <p style={{ color: "#666" }}>処理中...</p>}

      {(view === "signin" || view === "signup") && (
        <AuthPortalSection
          view={view}
          loading={loading}
          authEmail={authEmail}
          authPassword={authPassword}
          signupDisplayName={signupDisplayName}
          signupInstrument={signupInstrument}
          resetEmail={resetEmail}
          resetToken={resetToken}
          resetPassword={resetPassword}
          issuedResetToken={issuedResetToken}
          setAuthEmail={setAuthEmail}
          setAuthPassword={setAuthPassword}
          setSignupDisplayName={setSignupDisplayName}
          setSignupInstrument={setSignupInstrument}
          setResetEmail={setResetEmail}
          setResetToken={setResetToken}
          setResetPassword={setResetPassword}
          onSignIn={handleSignIn}
          onSignUp={handleSignUp}
          onForgotPassword={handleForgotPassword}
          onResetPassword={handleResetPassword}
        />
      )}

      {view === "member" && isMember && (
        <MemberPortalSection
          loading={loading}
          currentUser={currentUser}
          announcements={announcements}
          members={members}
          selectedMemberId={selectedMemberId}
          selectedMemberDetail={selectedMemberDetail}
          selectedMemberRatings={selectedMemberRatings}
          sessionEvents={sessionEvents}
          sessionEntries={sessionEntries}
          memberSessionSets={memberSessionSets}
          memberEventId={memberEventId}
          memberAttendanceStatus={memberAttendanceStatus}
          memberRound1Song1={memberRound1Song1}
          memberRound1Song2={memberRound1Song2}
          memberRound2Song1={memberRound2Song1}
          memberRound2Song2={memberRound2Song2}
          memberRound1Key1={memberRound1Key1}
          memberRound1Key2={memberRound1Key2}
          memberRound2Key1={memberRound2Key1}
          memberRound2Key2={memberRound2Key2}
          memberRatings={memberRatings}
          memberRatingComments={memberRatingComments}
          entryState={entryState}
          setSelectedMemberId={setSelectedMemberId}
          setMemberEventId={setMemberEventId}
          setMemberAttendanceStatus={setMemberAttendanceStatus}
          setMemberRound1Song1={setMemberRound1Song1}
          setMemberRound1Song2={setMemberRound1Song2}
          setMemberRound2Song1={setMemberRound2Song1}
          setMemberRound2Song2={setMemberRound2Song2}
          setMemberRound1Key1={setMemberRound1Key1}
          setMemberRound1Key2={setMemberRound1Key2}
          setMemberRound2Key1={setMemberRound2Key1}
          setMemberRound2Key2={setMemberRound2Key2}
          setMemberRatings={setMemberRatings}
          setMemberRatingComments={setMemberRatingComments}
          onProfileDisplayNameChange={setProfileDisplayName}
          onProfileNicknameChange={setProfileNickname}
          onProfileAreaChange={setProfileArea}
          onProfileBioChange={setProfileBio}
          onProfileSubInstrumentChange={setProfileSubInstrument}
          profileDisplayName={profileDisplayName}
          profileNickname={profileNickname}
          profileArea={profileArea}
          profileBio={profileBio}
          profileSubInstrument={profileSubInstrument}
          onProfileUpdate={handleProfileUpdate}
          onSignOut={handleSignOut}
          onSubmitEntry={handleSubmitEntry}
          onSaveRating={handleSaveRating}
        />
      )}

      {view === "admin" && isAdmin && (
        <AdminPortalSection
          loading={loading}
          sessionEvents={sessionEvents}
          selectedAdminEventId={selectedAdminEventId}
          selectedAdminEvent={selectedAdminEvent}
          eventTitle={eventTitle}
          eventVenue={eventVenue}
          eventDate={eventDate}
          editEventTitle={editEventTitle}
          editEventVenue={editEventVenue}
          editEventDate={editEventDate}
          editEventStatus={editEventStatus}
          editRound1StartAt={editRound1StartAt}
          editRound1EndAt={editRound1EndAt}
          editRound2StartAt={editRound2StartAt}
          editRound2EndAt={editRound2EndAt}
          sessionSets={sessionSets}
          ratingSummaries={ratingSummaries}
          archives={archives}
          archiveTitle={archiveTitle}
          archiveNote={archiveNote}
          archivePreview={archivePreview}
          generatedResult={generatedResult}
          activityLogs={activityLogs}
          mailLogs={mailLogs}
          members={members}
          selectedMemberId={selectedMemberId}
          selectedMemberDetail={selectedMemberDetail}
          adminMemberRole={adminMemberRole}
          adminMemberStatus={adminMemberStatus}
          announcementTitle={announcementTitle}
          announcementBody={announcementBody}
          announcementPublished={announcementPublished}
          columns={columns}
          columnTitle={columnTitle}
          columnSlug={columnSlug}
          columnSummary={columnSummary}
          columnBody={columnBody}
          columnThumbnailLabel={columnThumbnailLabel}
          columnAuthorName={columnAuthorName}
          columnPublished={columnPublished}
          setSelectedAdminEventId={setSelectedAdminEventId}
          setEventTitle={setEventTitle}
          setEventVenue={setEventVenue}
          setEventDate={setEventDate}
          setEditEventTitle={setEditEventTitle}
          setEditEventVenue={setEditEventVenue}
          setEditEventDate={setEditEventDate}
          setEditEventStatus={setEditEventStatus}
          setEditRound1StartAt={setEditRound1StartAt}
          setEditRound1EndAt={setEditRound1EndAt}
          setEditRound2StartAt={setEditRound2StartAt}
          setEditRound2EndAt={setEditRound2EndAt}
          setSelectedMemberId={setSelectedMemberId}
          setAdminMemberRole={setAdminMemberRole}
          setAdminMemberStatus={setAdminMemberStatus}
          setAnnouncementTitle={setAnnouncementTitle}
          setAnnouncementBody={setAnnouncementBody}
          setAnnouncementPublished={setAnnouncementPublished}
          setArchiveTitle={setArchiveTitle}
          setArchiveNote={setArchiveNote}
          setColumnTitle={setColumnTitle}
          setColumnSlug={setColumnSlug}
          setColumnSummary={setColumnSummary}
          setColumnBody={setColumnBody}
          setColumnThumbnailLabel={setColumnThumbnailLabel}
          setColumnAuthorName={setColumnAuthorName}
          setColumnPublished={setColumnPublished}
          onCreateEvent={handleCreateEvent}
          onUpdateEvent={handleUpdateEvent}
          onGenerateSets={handleGenerateSets}
          onPublishSets={handlePublishSets}
          onSignOut={handleSignOut}
          onCreateArchive={handleCreateArchive}
          onDeleteArchive={handleDeleteArchive}
          onUpdateMember={handleUpdateMember}
          onCreateAnnouncement={handleCreateAnnouncement}
          onCreateColumn={handleCreateColumn}
        />
      )}
    </main>
  );
}
