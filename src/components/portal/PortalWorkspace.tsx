"use client";

import { useEffect, useState } from "react";
import { AdminPortalSection } from "@/components/portal/AdminPortalSection";
import { AuthPortalSection } from "@/components/portal/AuthPortalSection";
import { MemberPortalSection } from "@/components/portal/MemberPortalSection";
import { useAdminPortal } from "@/components/portal/hooks/useAdminPortal";
import { useAuthPortal } from "@/components/portal/hooks/useAuthPortal";
import { useMemberPortal } from "@/components/portal/hooks/useMemberPortal";
import {
  type AnnouncementView,
  type AuthUser,
  type MemberListView,
  type PortalView,
  type SessionEventView,
} from "@/components/portal/types";
import { parseJson } from "@/components/portal/utils";

export default function PortalWorkspace({ view }: { view: PortalView }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [announcements, setAnnouncements] = useState<AnnouncementView[]>([]);
  const [members, setMembers] = useState<MemberListView[]>([]);
  const [sessionEvents, setSessionEvents] = useState<SessionEventView[]>([]);

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

  const reloadShared = async () => {
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
    } finally {
      setLoading(false);
    }
  };

  const auth = useAuthPortal({ runAction, setCurrentUser, reloadShared });
  const member = useMemberPortal({ currentUser, members, sessionEvents, runAction, reloadShared });
  const admin = useAdminPortal({ currentUser, members, sessionEvents, runAction, reloadShared });

  const isMember = currentUser?.role === "member";
  const isAdmin = currentUser?.role === "admin";

  useEffect(() => {
    reloadShared().catch((error) => {
      console.error(error);
      setMessage("データ取得に失敗しました");
      setLoading(false);
    });
  }, []);

  return (
    <main style={{ padding: "2rem", maxWidth: 1000, margin: "0 auto" }}>
      <h1>{view === "admin" ? "管理ダッシュボード" : view === "member" ? "メンバーページ" : view === "signup" ? "メンバーサインアップ" : view === "admin-signin" ? "管理者サインイン" : "メンバーサインイン"}</h1>
      {message && <p style={{ color: "darkgreen" }}>{message}</p>}
      {loading && <p style={{ color: "#666" }}>処理中...</p>}

      {(view === "signin" || view === "signup" || view === "admin-signin") && (
        <AuthPortalSection
          view={view}
          authTarget={view === "admin-signin" ? "admin" : "member"}
          loading={loading}
          authEmail={auth.authEmail}
          authPassword={auth.authPassword}
          signupDisplayName={auth.signupDisplayName}
          signupInstrument={auth.signupInstrument}
          resetEmail={auth.resetEmail}
          resetToken={auth.resetToken}
          resetPassword={auth.resetPassword}
          issuedResetToken={auth.issuedResetToken}
          setAuthEmail={auth.setAuthEmail}
          setAuthPassword={auth.setAuthPassword}
          setSignupDisplayName={auth.setSignupDisplayName}
          setSignupInstrument={auth.setSignupInstrument}
          setResetEmail={auth.setResetEmail}
          setResetToken={auth.setResetToken}
          setResetPassword={auth.setResetPassword}
          onSignIn={() => auth.handleSignIn(view === "admin-signin" ? "admin" : "member")}
          onSignUp={auth.handleSignUp}
          onForgotPassword={auth.handleForgotPassword}
          onResetPassword={auth.handleResetPassword}
        />
      )}

      {view === "member" && isMember && (
        <MemberPortalSection
          loading={loading}
          currentUser={currentUser}
          announcements={announcements}
          members={members}
          selectedMemberId={member.selectedMemberId}
          selectedMemberDetail={member.selectedMemberDetail}
          selectedMemberRatings={member.selectedMemberRatings}
          sessionEvents={sessionEvents}
          sessionEntries={member.sessionEntries}
          memberSessionSets={member.memberSessionSets}
          memberEventId={member.memberEventId}
          memberAttendanceStatus={member.memberAttendanceStatus}
          memberRound1Song1={member.memberRound1Song1}
          memberRound1Song2={member.memberRound1Song2}
          memberRound2Song1={member.memberRound2Song1}
          memberRound2Song2={member.memberRound2Song2}
          memberRound1Key1={member.memberRound1Key1}
          memberRound1Key2={member.memberRound1Key2}
          memberRound2Key1={member.memberRound2Key1}
          memberRound2Key2={member.memberRound2Key2}
          memberRatings={member.memberRatings}
          memberRatingComments={member.memberRatingComments}
          entryState={member.entryState}
          setSelectedMemberId={member.setSelectedMemberId}
          setMemberEventId={member.setMemberEventId}
          setMemberAttendanceStatus={member.setMemberAttendanceStatus}
          setMemberRound1Song1={member.setMemberRound1Song1}
          setMemberRound1Song2={member.setMemberRound1Song2}
          setMemberRound2Song1={member.setMemberRound2Song1}
          setMemberRound2Song2={member.setMemberRound2Song2}
          setMemberRound1Key1={member.setMemberRound1Key1}
          setMemberRound1Key2={member.setMemberRound1Key2}
          setMemberRound2Key1={member.setMemberRound2Key1}
          setMemberRound2Key2={member.setMemberRound2Key2}
          setMemberRatings={member.setMemberRatings}
          setMemberRatingComments={member.setMemberRatingComments}
          onProfileDisplayNameChange={member.setProfileDisplayName}
          onProfileNicknameChange={member.setProfileNickname}
          onProfileAreaChange={member.setProfileArea}
          onProfileBioChange={member.setProfileBio}
          onProfileSubInstrumentChange={member.setProfileSubInstrument}
          profileDisplayName={member.profileDisplayName}
          profileNickname={member.profileNickname}
          profileArea={member.profileArea}
          profileBio={member.profileBio}
          profileSubInstrument={member.profileSubInstrument}
          onProfileUpdate={member.handleProfileUpdate}
          onSignOut={auth.handleSignOut}
          onSubmitEntry={member.handleSubmitEntry}
          onSaveRating={member.handleSaveRating}
        />
      )}

      {view === "admin" && isAdmin && (
        <AdminPortalSection
          loading={loading}
          sessionEvents={sessionEvents}
          selectedAdminEventId={admin.selectedAdminEventId}
          selectedAdminEvent={admin.selectedAdminEvent}
          eventTitle={admin.eventTitle}
          eventVenue={admin.eventVenue}
          eventDate={admin.eventDate}
          editEventTitle={admin.editEventTitle}
          editEventVenue={admin.editEventVenue}
          editEventDate={admin.editEventDate}
          editEventStatus={admin.editEventStatus}
          editRound1StartAt={admin.editRound1StartAt}
          editRound1EndAt={admin.editRound1EndAt}
          editRound2StartAt={admin.editRound2StartAt}
          editRound2EndAt={admin.editRound2EndAt}
          sessionSets={admin.sessionSets}
          ratingSummaries={admin.ratingSummaries}
          archives={admin.archives}
          archiveTitle={admin.archiveTitle}
          archiveNote={admin.archiveNote}
          archivePreview={admin.archivePreview}
          generatedResult={admin.generatedResult}
          activityLogs={admin.activityLogs}
          mailLogs={admin.mailLogs}
          members={members}
          selectedManagedMemberId={admin.selectedManagedMemberId}
          selectedManagedMemberDetail={admin.selectedManagedMemberDetail}
          adminMemberRole={admin.adminMemberRole}
          adminMemberStatus={admin.adminMemberStatus}
          announcementTitle={admin.announcementTitle}
          announcementBody={admin.announcementBody}
          announcementPublished={admin.announcementPublished}
          columns={admin.columns}
          editingColumnSlug={admin.editingColumnSlug}
          columnTitle={admin.columnTitle}
          columnSlug={admin.columnSlug}
          columnSummary={admin.columnSummary}
          columnBody={admin.columnBody}
          columnThumbnailLabel={admin.columnThumbnailLabel}
          columnAuthorName={admin.columnAuthorName}
          columnPublished={admin.columnPublished}
          setSelectedAdminEventId={admin.setSelectedAdminEventId}
          setEventTitle={admin.setEventTitle}
          setEventVenue={admin.setEventVenue}
          setEventDate={admin.setEventDate}
          setEditEventTitle={admin.setEditEventTitle}
          setEditEventVenue={admin.setEditEventVenue}
          setEditEventDate={admin.setEditEventDate}
          setEditEventStatus={admin.setEditEventStatus}
          setEditRound1StartAt={admin.setEditRound1StartAt}
          setEditRound1EndAt={admin.setEditRound1EndAt}
          setEditRound2StartAt={admin.setEditRound2StartAt}
          setEditRound2EndAt={admin.setEditRound2EndAt}
          setSelectedManagedMemberId={admin.setSelectedManagedMemberId}
          setAdminMemberRole={admin.setAdminMemberRole}
          setAdminMemberStatus={admin.setAdminMemberStatus}
          setAnnouncementTitle={admin.setAnnouncementTitle}
          setAnnouncementBody={admin.setAnnouncementBody}
          setAnnouncementPublished={admin.setAnnouncementPublished}
          setArchiveTitle={admin.setArchiveTitle}
          setArchiveNote={admin.setArchiveNote}
          setEditingColumnSlug={admin.setEditingColumnSlug}
          setColumnTitle={admin.setColumnTitle}
          setColumnSlug={admin.setColumnSlug}
          setColumnSummary={admin.setColumnSummary}
          setColumnBody={admin.setColumnBody}
          setColumnThumbnailLabel={admin.setColumnThumbnailLabel}
          setColumnAuthorName={admin.setColumnAuthorName}
          setColumnPublished={admin.setColumnPublished}
          onCreateEvent={admin.handleCreateEvent}
          onUpdateEvent={admin.handleUpdateEvent}
          onGenerateSets={admin.handleGenerateSets}
          onPublishSets={admin.handlePublishSets}
          onSignOut={auth.handleSignOut}
          onCreateArchive={admin.handleCreateArchive}
          onDeleteArchive={admin.handleDeleteArchive}
          onUpdateMember={admin.handleUpdateMember}
          onCreateAnnouncement={admin.handleCreateAnnouncement}
          onCreateColumn={admin.handleCreateColumn}
          onUpdateColumn={admin.handleUpdateColumn}
          onDeleteColumn={admin.handleDeleteColumn}
          onResetColumnForm={admin.resetColumnForm}
        />
      )}
    </main>
  );
}