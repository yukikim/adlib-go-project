"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AdminPortalSection } from '@/components/portal/AdminPortalSection';
import { AuthPortalSection } from '@/components/portal/AuthPortalSection';
import { MemberPortalSection } from '@/components/portal/MemberPortalSection';
import { useAdminPortal } from '@/components/portal/hooks/useAdminPortal';
import { useAuthPortal } from '@/components/portal/hooks/useAuthPortal';
import { useMemberPortal } from '@/components/portal/hooks/useMemberPortal';
import {
  type AnnouncementView,
  type AuthUser,
  type MemberListView,
  type PortalView,
  type SessionEventView,
} from '@/components/portal/types';
import { parseJson } from '@/components/portal/utils';
// import MainHeader from '@/components/portal/MainHeader';

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
    } catch (error: unknown) {
      const nextMessage = error instanceof Error ? error.message : '処理に失敗しました';
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
      const meRes = await fetch('/api/auth/me');
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
      // eventJson イベントリスト
      const eventJson = await parseJson(eventRes);

      // console.log('round1 candidate songs', (eventJson.sessionEvents ?? []).map((sessionEvent: SessionEventView) => ({
      //   sessionEventId: sessionEvent.id,
      //   sessionEventTitle: sessionEvent.title,
      //   songs: sessionEvent.round2CandidateSongs ?? [],
      // })));

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
      if (view === 'signin' && roleTarget === 'member') {
        router.push('/member');
      }
    },
  });
  const member = useMemberPortal({ currentUser, members, sessionEvents, runAction, reloadShared });
  const admin = useAdminPortal({ currentUser, members, sessionEvents, runAction, reloadShared });
  // console.log('admin', admin);
  // console.log('currentUser', currentUser);

  const isMember = currentUser?.role === 'member';
  const isAdmin = currentUser?.role === 'admin';

  useEffect(() => {
    reloadShared().catch((error) => {
      console.error(error);
      setMessage('データ取得に失敗しました');
      setLoading(false);
    });
  }, []);

  return (
    <main className={view === "admin" ? "mx-0 min-w-lvw flex w-full flex-col mt-15" : "mx-auto flex max-w-6xl flex-col px-2 xl:px-6 py-8 md:px-8 mt-15"}>
      {/* <MainHeader
        view={currentUser?.role === 'admin' ? '管理者' : 'メンバー'}
        currentUser={{ role: currentUser?.role, displayName: admin.adminMemberDisplayName }}
        auth={{ handleSignOut: auth.handleSignOut }}
        loading={loading}
        admin={{ adminMemberDisplayName: admin.adminMemberDisplayName }}
        memberProfile={{ memberDisplayName: currentUser?.memberProfile?.displayName }}
      /> */}
      <div className="space-y-3 p-4">
        <Badge variant="outline" className="w-fit">
          {view === "admin" ? "Admin" : view === "member" ? "Member" : "Auth"}
        </Badge>
        <h1 className="text-2xl font-semibold tracking-tight">{view === "admin" ? "管理ダッシュボード" : view === "member" ? "メンバーマイページ" : view === "signup" ? "メンバーサインアップ" : view === "admin-signin" ? "管理者サインイン" : "メンバーサインイン"}</h1>
      </div>
      {message && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setMessage(null)}>
          <Alert
            role="dialog"
            aria-modal="true"
            className="brand-success-surface w-full max-w-md border shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <AlertTitle>ステータス</AlertTitle>
            <AlertDescription className="text-red-500">{message}</AlertDescription>
            <div className="mt-4 flex justify-end">
              <Button type="button" variant="outline" onClick={() => setMessage(null)}>
                閉じる
              </Button>
            </div>
          </Alert>
        </div>
      )}
      {loading && <p className="mt-4 text-sm text-red-500 fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">処理中...</p>}

      {(view === "signin" || view === "signup" || view === "admin-signin") && (
        <AuthPortalSection
          view={view}
          authTarget={view === "admin-signin" ? "admin" : "member"}
          loading={loading}
          authEmail={auth.authEmail}
          authPassword={auth.authPassword}
          signupPasswordConfirmation={auth.signupPasswordConfirmation}
          signupInvitationToken=""
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
          setSignupPasswordConfirmation={auth.setSignupPasswordConfirmation}
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
          publishedSessionSets={member.publishedSessionSets}
          memberEventId={member.memberEventId}
          memberAttendanceStatus={member.memberAttendanceStatus}
          memberAfterPartyAttendanceStatus={member.memberAfterPartyAttendanceStatus}
          memberAllowForcedAssignment={member.memberAllowForcedAssignment}
          memberRound1Song1={member.memberRound1Song1}
          memberRound1Song2={member.memberRound1Song2}
          memberRound1Song3={member.memberRound1Song3}
          memberRound1Song4={member.memberRound1Song4}
          memberRound2Songs={member.memberRound2Songs}
          memberRound1Key1={member.memberRound1Key1}
          memberRound1Key2={member.memberRound1Key2}
          memberRound1Key3={member.memberRound1Key3}
          memberRound1Key4={member.memberRound1Key4}
          round1SongOptions={member.round1SongOptions}
          memberRatings={member.memberRatings}
          memberRatingComments={member.memberRatingComments}
          memberEventComment={member.memberEventComment}
          entryState={member.entryState}
          setSelectedMemberId={member.setSelectedMemberId}
          setMemberEventId={member.setMemberEventId}
          setMemberAttendanceStatus={member.setMemberAttendanceStatus}
          setMemberAfterPartyAttendanceStatus={member.setMemberAfterPartyAttendanceStatus}
          setMemberAllowForcedAssignment={member.setMemberAllowForcedAssignment}
          setMemberRound1Song1={member.setMemberRound1Song1}
          setMemberRound1Song2={member.setMemberRound1Song2}
          setMemberRound1Song3={member.setMemberRound1Song3}
          setMemberRound1Song4={member.setMemberRound1Song4}
          setMemberRound2Songs={member.setMemberRound2Songs}
          setMemberRound1Key1={member.setMemberRound1Key1}
          setMemberRound1Key2={member.setMemberRound1Key2}
          setMemberRound1Key3={member.setMemberRound1Key3}
          setMemberRound1Key4={member.setMemberRound1Key4}
          setMemberRatings={member.setMemberRatings}
          setMemberRatingComments={member.setMemberRatingComments}
          setMemberEventComment={member.setMemberEventComment}
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
          onSaveEventComment={member.handleSaveEventComment}
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
          eventStartTime={admin.eventStartTime}
          eventEndTime={admin.eventEndTime}
          eventParticipationFee={admin.eventParticipationFee}
          eventHasAfterParty={admin.eventHasAfterParty}
          eventAfterPartyFee={admin.eventAfterPartyFee}
          eventNotes={admin.eventNotes}
          eventParticipantLimit={admin.eventParticipantLimit}
          editEventTitle={admin.editEventTitle}
          editEventVenue={admin.editEventVenue}
          editEventDate={admin.editEventDate}
          editEventStartTime={admin.editEventStartTime}
          editEventEndTime={admin.editEventEndTime}
          editEventParticipationFee={admin.editEventParticipationFee}
          editEventHasAfterParty={admin.editEventHasAfterParty}
          editEventAfterPartyFee={admin.editEventAfterPartyFee}
          editEventNotes={admin.editEventNotes}
          editEventParticipantLimit={admin.editEventParticipantLimit}
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
          generateDrumForcedAssignmentMax={admin.generateDrumForcedAssignmentMax}
          setGenerateDrumForcedAssignmentMax={admin.setGenerateDrumForcedAssignmentMax}
          generateForcedAssignmentMax={admin.generateForcedAssignmentMax}
          setGenerateForcedAssignmentMax={admin.setGenerateForcedAssignmentMax}
          savedSessionSetDrafts={admin.savedSessionSetDrafts}
          activityLogs={admin.activityLogs}
          mailLogs={admin.mailLogs}
          members={members}
          selectedManagedMemberId={admin.selectedManagedMemberId}
          selectedManagedMemberDetail={admin.selectedManagedMemberDetail}
          memberUpdateMessage={admin.memberUpdateMessage}
          memberUpdateMessageTone={admin.memberUpdateMessageTone}
          memberSearchQuery={admin.memberSearchQuery}
          memberInvitationEmail={admin.memberInvitationEmail}
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
          setEventStartTime={admin.setEventStartTime}
          setEventEndTime={admin.setEventEndTime}
          setEventParticipationFee={admin.setEventParticipationFee}
          setEventHasAfterParty={admin.setEventHasAfterParty}
          setEventAfterPartyFee={admin.setEventAfterPartyFee}
          setEventNotes={admin.setEventNotes}
          setEventParticipantLimit={admin.setEventParticipantLimit}
          setEditEventTitle={admin.setEditEventTitle}
          setEditEventVenue={admin.setEditEventVenue}
          setEditEventDate={admin.setEditEventDate}
          setEditEventStartTime={admin.setEditEventStartTime}
          setEditEventEndTime={admin.setEditEventEndTime}
          setEditEventParticipationFee={admin.setEditEventParticipationFee}
          setEditEventHasAfterParty={admin.setEditEventHasAfterParty}
          setEditEventAfterPartyFee={admin.setEditEventAfterPartyFee}
          setEditEventNotes={admin.setEditEventNotes}
          setEditEventParticipantLimit={admin.setEditEventParticipantLimit}
          setEditEventStatus={admin.setEditEventStatus}
          setEditRound1StartAt={admin.setEditRound1StartAt}
          setEditRound1EndAt={admin.setEditRound1EndAt}
          setEditRound2StartAt={admin.setEditRound2StartAt}
          setEditRound2EndAt={admin.setEditRound2EndAt}
          setSelectedManagedMemberId={admin.setSelectedManagedMemberId}
          setMemberSearchQuery={admin.setMemberSearchQuery}
          setMemberInvitationEmail={admin.setMemberInvitationEmail}
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
          onUpdateSessionSet={admin.handleUpdateSessionSet}
          onReorderSessionSets={admin.handleReorderSessionSets}
          onSaveEditedSessionSets={admin.handleSaveEditedSessionSets}
          onSaveGeneratedSessionSets={admin.handleSaveGeneratedSessionSets}
          onShowSavedSessionSetDraft={admin.handleShowSavedSessionSetDraft}
          onRegenerateSavedSessionSetDraft={admin.handleRegenerateSavedSessionSetDraft}
          onSignOut={auth.handleSignOut}
          onCreateArchive={admin.handleCreateArchive}
          onDeleteArchive={admin.handleDeleteArchive}
          onUpdateMember={admin.handleUpdateMember}
          onDeleteMember={admin.handleDeleteMember}
          onCreateMemberInvitation={admin.handleCreateMemberInvitation}
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
