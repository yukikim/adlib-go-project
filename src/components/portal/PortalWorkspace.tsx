"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
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
import MainHeader from '@/components/portal/MainHeader';

export default function PortalWorkspace({ view }: { view: PortalView }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [announcements, setAnnouncements] = useState<AnnouncementView[]>([]);
  const [members, setMembers] = useState<MemberListView[]>([]);
  const [sessionEvents, setSessionEvents] = useState<SessionEventView[]>([]);

  const runAction = async (action: () => Promise<void>, successMessage?: string, options?: { onSuccess?: (message?: string) => void; onError?: (message: string) => void; skipGlobalMessage?: boolean }) => {
    setLoading(true);
    if (!options?.skipGlobalMessage) {
      setMessage(null);
    }
    try {
      await action();
      if (successMessage && !options?.skipGlobalMessage) {
        setMessage(successMessage);
      }
      options?.onSuccess?.(successMessage);
    } catch (error: any) {
      const nextMessage = error?.message ?? "処理に失敗しました";
      if (!options?.skipGlobalMessage) {
        setMessage(nextMessage);
      }
      options?.onError?.(nextMessage);
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

  const auth = useAuthPortal({
    runAction,
    setCurrentUser,
    reloadShared,
    onSignInSuccess: (roleTarget) => {
      if (view === "signin" && roleTarget === "member") {
        router.push("/member");
      }
    },
  });
  const member = useMemberPortal({ currentUser, members, sessionEvents, runAction, reloadShared });
  const admin = useAdminPortal({ currentUser, members, sessionEvents, runAction, reloadShared });
  // console.log("admin", admin);
  // console.log("currentUser", currentUser);

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
    <main className="mx-auto flex max-w-6xl flex-col px-6 py-8 md:px-8">
      <MainHeader
        view={ currentUser?.role === "admin" ? "管理者" : "メンバー" }
        currentUser={{ role: currentUser?.role, displayName: admin.adminMemberDisplayName }}
        auth={{ handleSignOut: auth.handleSignOut }}
        loading={loading}
        admin={{ adminMemberDisplayName: admin.adminMemberDisplayName }}
        memberProfile={{ memberDisplayName: currentUser?.memberProfile?.displayName }}
      />
      <div className="space-y-3">
        <Badge variant="outline" className="w-fit">
          {view === "admin" ? "Admin" : view === "member" ? "Member" : "Auth"}
        </Badge>
        <h1 className="text-3xl font-semibold tracking-tight">{view === "admin" ? "管理ダッシュボード" : view === "member" ? "メンバーページ" : view === "signup" ? "メンバーサインアップ" : view === "admin-signin" ? "管理者サインイン" : "メンバーサインイン"}</h1>
      </div>
      {message && (
        <Alert className="brand-success-surface mt-4">
          <AlertTitle>ステータス</AlertTitle>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}
      {loading && <p className="mt-4 text-sm text-muted-foreground">処理中...</p>}

      {(view === "signin" || view === "signup" || view === "admin-signin") && (
        <AuthPortalSection
          view={view}
          authTarget={view === "admin-signin" ? "admin" : "member"}
          loading={loading}
          authEmail={auth.authEmail}
          authPassword={auth.authPassword}
          signupDisplayName={auth.signupDisplayName}
          signupInstrument={auth.signupInstrument}
          signupSubInstrument={auth.signupSubInstrument}
          signupGender={auth.signupGender}
          signupAgeRange={auth.signupAgeRange}
          signupArea={auth.signupArea}
          resetEmail={auth.resetEmail}
          resetToken={auth.resetToken}
          resetPassword={auth.resetPassword}
          issuedResetToken={auth.issuedResetToken}
          setAuthEmail={auth.setAuthEmail}
          setAuthPassword={auth.setAuthPassword}
          setSignupDisplayName={auth.setSignupDisplayName}
          setSignupInstrument={auth.setSignupInstrument}
          setSignupSubInstrument={auth.setSignupSubInstrument}
          setSignupGender={auth.setSignupGender}
          setSignupAgeRange={auth.setSignupAgeRange}
          setSignupArea={auth.setSignupArea}
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
          onProfileMainInstrumentChange={member.setProfileMainInstrument}
          onProfileNicknameChange={member.setProfileNickname}
          onProfileGenderChange={member.setProfileGender}
          onProfileAgeRangeChange={member.setProfileAgeRange}
          onProfileAreaChange={member.setProfileArea}
          onProfileBioChange={member.setProfileBio}
          onProfileSubInstrumentChange={member.setProfileSubInstrument}
          onProfileCurrentPasswordChange={member.setProfileCurrentPassword}
          onProfileNewPasswordChange={member.setProfileNewPassword}
          onProfileNewPasswordConfirmChange={member.setProfileNewPasswordConfirm}
          profileDisplayName={member.profileDisplayName}
          profileMainInstrument={member.profileMainInstrument}
          profileNickname={member.profileNickname}
          profileGender={member.profileGender}
          profileAgeRange={member.profileAgeRange}
          profileArea={member.profileArea}
          profileBio={member.profileBio}
          profileSubInstrument={member.profileSubInstrument}
          profileCurrentPassword={member.profileCurrentPassword}
          profileNewPassword={member.profileNewPassword}
          profileNewPasswordConfirm={member.profileNewPasswordConfirm}
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
          memberUpdateMessage={admin.memberUpdateMessage}
          memberUpdateMessageTone={admin.memberUpdateMessageTone}
          memberSearchQuery={admin.memberSearchQuery}
          adminMemberDisplayName={admin.adminMemberDisplayName}
          adminMemberNickname={admin.adminMemberNickname}
          adminMemberMainInstrument={admin.adminMemberMainInstrument}
          adminMemberSubInstrument={admin.adminMemberSubInstrument}
          adminMemberGender={admin.adminMemberGender}
          adminMemberAgeRange={admin.adminMemberAgeRange}
          adminMemberArea={admin.adminMemberArea}
          adminMemberBio={admin.adminMemberBio}
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
          columnDisplayOrder={admin.columnDisplayOrder}
          columnPublishAt={admin.columnPublishAt}
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
          setMemberSearchQuery={admin.setMemberSearchQuery}
          setAdminMemberDisplayName={admin.setAdminMemberDisplayName}
          setAdminMemberNickname={admin.setAdminMemberNickname}
          setAdminMemberMainInstrument={admin.setAdminMemberMainInstrument}
          setAdminMemberSubInstrument={admin.setAdminMemberSubInstrument}
          setAdminMemberGender={admin.setAdminMemberGender}
          setAdminMemberAgeRange={admin.setAdminMemberAgeRange}
          setAdminMemberArea={admin.setAdminMemberArea}
          setAdminMemberBio={admin.setAdminMemberBio}
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
          setColumnDisplayOrder={admin.setColumnDisplayOrder}
          setColumnPublishAt={admin.setColumnPublishAt}
          setColumnPublished={admin.setColumnPublished}
          onCreateEvent={admin.handleCreateEvent}
          onUpdateEvent={admin.handleUpdateEvent}
          onGenerateSets={admin.handleGenerateSets}
          onPublishSets={admin.handlePublishSets}
          onSignOut={auth.handleSignOut}
          onCreateArchive={admin.handleCreateArchive}
          onDeleteArchive={admin.handleDeleteArchive}
          onUpdateMember={admin.handleUpdateMember}
          onDeleteMember={admin.handleDeleteMember}
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