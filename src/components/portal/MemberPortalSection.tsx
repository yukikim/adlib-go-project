import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SearchableCombobox } from "@/components/ui/searchable-combobox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { ArchiveList } from "./ArchiveList";
import { Section } from "./Section";
import { getEventEntryState } from "./utils";
import {
  AGE_RANGE_OPTIONS,
  GENDER_OPTIONS,
  PREFECTURE_OPTIONS,
} from "@/lib/memberProfile";
import { getSessionEventStatusLabel } from "@/lib/sessionEventStatus";
import { formatRoundCandidateSong } from "@/lib/sessionEventWindow";
import { formatEventDate, formatEventSchedule, formatYen } from "@/lib/utils";
import { ChevronDown, FileDown, Star } from "lucide-react";
import type {
  AnnouncementView,
  ArchiveView,
  AttendanceStatus,
  AuthUser,
  Instrument,
  MemberDetailView,
  MemberListView,
  MemberRatingHistoryView,
  SessionEntryView,
  SessionEventView,
  SessionSetView,
} from "./types";
import type { RunPortalActionOptions } from "./utils";
import { downloadSessionSetPdf } from "./sessionSetPdf";

type EntryState = {
  canSubmit: boolean;
  round: 1 | 2 | null;
  reason: string | null;
};

const NONE_VALUE = "__none__";

function formatSessionMemberName(name: string, isForced?: boolean) {
  if (!isForced) {
    return name;
  }

  return `${name} (NR)`;
}

function renderSessionMemberName(
  name: string,
  displayName: string,
  options?: {
    isForced?: boolean;
    forcedCount?: number;
    requestedInRound1?: boolean;
  },
) {
  return (
    <span className="inline-flex items-center gap-1">
      {options?.requestedInRound1 ? (
        <Star className="size-3.5 fill-amber-400 text-amber-500" />
      ) : null}
      <span className={name === displayName ? "text-red-400 font-bold" : ""}>
        {formatSessionMemberName(name, options?.isForced)}
      </span>
    </span>
  );
}

function EventMeta({
  participantLimit,
  attendingEntryCount,
  remainingEntryCapacity,
  isEntryCapacityFull,
  participationFee,
  hasAfterParty,
  afterPartyFee,
  notes,
  sessionEntries,
}: {
  participantLimit?: number | null;
  attendingEntryCount?: number;
  remainingEntryCapacity?: number | null;
  isEntryCapacityFull?: boolean;
  participationFee?: number | null;
  hasAfterParty?: boolean;
  afterPartyFee?: number | null;
  notes?: string | null;
  sessionEntries?: SessionEventView["sessionEntries"];
}) {
  const hasCapacityMeta =
    typeof attendingEntryCount === "number" || participantLimit != null;
  const eventEntries = sessionEntries ?? [];
  const attendingEntries = eventEntries.filter(
    (entry) => entry.attendanceStatus === "attending",
  );
  const participationInstrumentOrder: Instrument[] = [
    "piano",
    "drum",
    "bass",
    "front",
    "vocal",
  ];
  const participationInstrumentCounts = participationInstrumentOrder
    .map((instrument) => ({
      instrument,
      count: attendingEntries.filter(
        (entry) => entry.memberProfile.mainInstrument === instrument,
      ).length,
    }))
    .filter((item) => item.count > 0);
  const requestSongMap = new Map<
    string,
    { label: string; instruments: string[] }
  >();

  for (const entry of eventEntries) {
    if (entry.attendanceStatus === "absent") {
      continue;
    }

    const instrumentLabel =
      entry.memberProfile.mainInstrument === "front"
        ? entry.memberProfile.subInstrument?.trim() || "front"
        : entry.memberProfile.mainInstrument;

    for (const request of entry.requests) {
      const songLabel = formatRoundCandidateSong(
        request.songTitleSnapshot,
        request.keyName,
      );
      if (!songLabel) {
        continue;
      }

      const requestKey = normalizeSongTitle(songLabel);
      const requestSummary = requestSongMap.get(requestKey) ?? {
        label: songLabel,
        instruments: [],
      };
      requestSummary.instruments.push(instrumentLabel);
      requestSongMap.set(requestKey, requestSummary);
    }
  }

  const requestSongs = [...requestSongMap.values()].sort((left, right) =>
    left.label.localeCompare(right.label, "ja-JP"),
  );

  return (
    <>
      {hasCapacityMeta || participationFee != null || hasAfterParty ? (
        <div className="mt-2 flex flex-wrap gap-2">
          {typeof attendingEntryCount === "number" ? (
            <Badge variant="secondary">
              参加人数 {attendingEntryCount}
              {participantLimit != null ? ` / ${participantLimit}` : "人"}
            </Badge>
          ) : null}
          {participantLimit != null && remainingEntryCapacity != null ? (
            <Badge variant={isEntryCapacityFull ? "destructive" : "secondary"}>
              {isEntryCapacityFull
                ? "満員"
                : `残り ${remainingEntryCapacity} 人`}
            </Badge>
          ) : null}
          {participationFee != null ? (
            <Badge variant="secondary">
              参加料金 {formatYen(participationFee)}
            </Badge>
          ) : null}
          {hasAfterParty ? (
            <Badge variant="secondary">
              懇親会{" "}
              {afterPartyFee != null ? formatYen(afterPartyFee) : "料金未定"}
            </Badge>
          ) : null}
        </div>
      ) : null}
      {sessionEntries ? (
        <details className="group mt-2 rounded-lg border bg-background/70 p-1">
          <summary className="cursor-pointer list-none text-sm font-medium text-foreground">
            <div className="flex flex-wrap items-center justify-between gap-2 bg-primary p-2 rounded-lg">
              <span>【参加状況】</span>
              <span className="text-xs text-muted-foreground">
                参加 {attendingEntries.length} 人 / エントリー{" "}
                {eventEntries.length} 件
              </span>
              <ChevronDown className="mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
            </div>
          </summary>
          <div className="mt-3 space-y-3 text-sm">
            <div>
              <p className="font-medium text-foreground">【参加楽器】</p>
              {participationInstrumentCounts.length === 0 ? (
                <p className="mt-1 text-muted-foreground">
                  参加登録はまだありません。
                </p>
              ) : (
                <ul className="mt-1 space-y-1 text-muted-foreground pl-8 list-disc">
                  {participationInstrumentCounts.map((item) => (
                    <li key={item.instrument}>
                      {item.instrument}({item.count}名)
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <p className="font-medium text-foreground">【リクエスト曲】</p>
              {requestSongs.length === 0 ? (
                <p className="mt-1 text-muted-foreground">
                  リクエスト曲はまだありません。
                </p>
              ) : (
                <ul className="mt-1 space-y-1 text-muted-foreground pl-8 list-disc">
                  {requestSongs.map((requestSummary) => (
                    <li key={requestSummary.label}>
                      {requestSummary.label}(
                      {requestSummary.instruments.join(",")})
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </details>
      ) : null}
      {notes ? (
        <p className="mt-2 text-sm text-muted-foreground">備考: {notes}</p>
      ) : null}
    </>
  );
}

function formatAttendanceStatusLabel(status: AttendanceStatus) {
  switch (status) {
    case "attending":
      return "参加";
    case "undecided":
      return "未定";
    case "absent":
      return "不参加";
    default:
      return status;
  }
}

function formatOptionalAttendanceStatusLabel(status?: AttendanceStatus | null) {
  return status ? formatAttendanceStatusLabel(status) : "未回答";
}

type FieldProps = {
  htmlFor?: string;
  label: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
};

function Field({
  htmlFor,
  label,
  description,
  children,
  className,
}: FieldProps) {
  return (
    <div className={className ?? "grid gap-2"}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {description ? (
        <p className="text-xs text-muted-foreground">{description}</p>
      ) : null}
      {children}
    </div>
  );
}

function normalizeSongTitle(value: string) {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase("ja-JP");
}

function formatSongWithKey(songTitle: string, keyName?: string | null) {
  return keyName ? `${songTitle}:${keyName}` : songTitle;
}

type MemberPortalSectionProps = {
  loading: boolean;
  currentUser: AuthUser | null;
  announcements: AnnouncementView[];
  members: MemberListView[];
  selectedMemberId: string;
  selectedMemberDetail: MemberDetailView | null;
  selectedMemberRatings: MemberRatingHistoryView[];
  archives: ArchiveView[];
  sessionEvents: SessionEventView[];
  sessionEntries: SessionEntryView[];
  memberSessionSets: SessionSetView[];
  publishedSessionSets: SessionSetView[];
  memberEventId: string;
  memberAttendanceStatus: AttendanceStatus;
  memberAfterPartyAttendanceStatus: AttendanceStatus;
  memberAllowForcedAssignment: boolean;
  memberRound1Song1: string;
  memberRound1Song2: string;
  memberRound1Song3: string;
  memberRound1Song4: string;
  memberRound2Songs: string[];
  memberRound1Key1: string;
  memberRound1Key2: string;
  memberRound1Key3: string;
  memberRound1Key4: string;
  round1SongOptions: string[];
  memberRatings: Record<string, number>;
  memberRatingComments: Record<string, string>;
  memberEventComment: string;
  entryState: EntryState;
  setSelectedMemberId: (value: string) => void;
  setMemberEventId: (value: string) => void;
  setMemberAttendanceStatus: (value: AttendanceStatus) => void;
  setMemberAfterPartyAttendanceStatus: (value: AttendanceStatus) => void;
  setMemberAllowForcedAssignment: (value: boolean) => void;
  setMemberRound1Song1: (value: string) => void;
  setMemberRound1Song2: (value: string) => void;
  setMemberRound1Song3: (value: string) => void;
  setMemberRound1Song4: (value: string) => void;
  setMemberRound2Songs: (value: string[]) => void;
  setMemberRound1Key1: (value: string) => void;
  setMemberRound1Key2: (value: string) => void;
  setMemberRound1Key3: (value: string) => void;
  setMemberRound1Key4: (value: string) => void;
  setMemberRatings: (
    updater: (current: Record<string, number>) => Record<string, number>,
  ) => void;
  setMemberRatingComments: (
    updater: (current: Record<string, string>) => Record<string, string>,
  ) => void;
  setMemberEventComment: (value: string) => void;
  onProfileDisplayNameChange: (value: string) => void;
  onProfileMainInstrumentChange: (value: Instrument) => void;
  onProfileNicknameChange: (value: string) => void;
  onProfileGenderChange: (value: string) => void;
  onProfileAgeRangeChange: (value: string) => void;
  onProfileAreaChange: (value: string) => void;
  onProfileBioChange: (value: string) => void;
  onProfileSubInstrumentChange: (value: string) => void;
  onProfileCurrentPasswordChange: (value: string) => void;
  onProfileNewPasswordChange: (value: string) => void;
  onProfileNewPasswordConfirmChange: (value: string) => void;
  profileDisplayName: string;
  profileMainInstrument: string;
  profileNickname: string;
  profileGender: string;
  profileAgeRange: string;
  profileArea: string;
  profileBio: string;
  profileSubInstrument: string;
  profileCurrentPassword: string;
  profileNewPassword: string;
  profileNewPasswordConfirm: string;
  onProfileUpdate: () => void;
  onSignOut: () => void;
  onSubmitEntry: (
    eventIdOrOptions?: string | RunPortalActionOptions,
    options?: RunPortalActionOptions,
  ) => Promise<void>;
  onSaveRating: (sessionSetId: string) => void;
  onSaveEventRatings: (sessionEventId: string) => void;
  onSaveEventComment: () => void;
};

export function MemberPortalSection(props: MemberPortalSectionProps) {
  const {
    loading,
    currentUser,
    announcements,
    members,
    selectedMemberDetail,
    selectedMemberId,
    selectedMemberRatings,
    archives,
    sessionEvents,
    sessionEntries,
    publishedSessionSets,
    memberEventId,
    memberAttendanceStatus,
    memberAfterPartyAttendanceStatus,
    memberAllowForcedAssignment,
    memberRound1Song1,
    memberRound1Song2,
    memberRound1Song3,
    memberRound1Song4,
    memberRound2Songs,
    memberRound1Key1,
    memberRound1Key2,
    memberRound1Key3,
    memberRound1Key4,
    round1SongOptions,
    memberRatings,
    memberRatingComments,
    entryState,
    setSelectedMemberId,
    setMemberEventId,
    setMemberAttendanceStatus,
    setMemberAfterPartyAttendanceStatus,
    setMemberAllowForcedAssignment,
    setMemberRound1Song1,
    setMemberRound1Song2,
    setMemberRound1Song3,
    setMemberRound1Song4,
    setMemberRound2Songs,
    setMemberRound1Key1,
    setMemberRound1Key2,
    setMemberRound1Key3,
    setMemberRound1Key4,
    setMemberRatings,
    setMemberRatingComments,
    onProfileDisplayNameChange,
    onProfileMainInstrumentChange,
    onProfileNicknameChange,
    onProfileGenderChange,
    onProfileAgeRangeChange,
    onProfileAreaChange,
    onProfileBioChange,
    onProfileSubInstrumentChange,
    onProfileCurrentPasswordChange,
    onProfileNewPasswordChange,
    onProfileNewPasswordConfirmChange,
    profileDisplayName,
    profileMainInstrument,
    profileNickname,
    profileGender,
    profileAgeRange,
    profileArea,
    profileBio,
    profileSubInstrument,
    profileCurrentPassword,
    profileNewPassword,
    profileNewPasswordConfirm,
    onProfileUpdate,
    onSignOut,
    onSubmitEntry,
    onSaveEventRatings,
  } = props;
  const [isRound1EntryDialogOpen, setIsRound1EntryDialogOpen] = useState(false);

  const handleProfileSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading) {
      return;
    }

    onProfileUpdate();
  };

  const isVocalMember = currentUser?.memberProfile?.mainInstrument === "vocal";

  const announcedEvents = sessionEvents.filter(
    (event) => event.status === "announced",
  );
  const round1RecruitingEvents = sessionEvents.filter(
    (event) => event.status === "recruiting_round1",
  );
  const round2RecruitingEvents = isVocalMember
    ? []
    : sessionEvents.filter((event) => event.status === "recruiting_round2");
  const publishedEvents = sessionEvents.filter(
    (event) => event.status === "published",
  );
  const ratingEvents = sessionEvents.filter(
    (event) => event.status === "rating",
  );

  // console.log('announcedEvents:', announcedEvents);
  // console.log("sessionEvent:", sessionEvents);
  // console.log('round2RecruitingEvents:', round2RecruitingEvents);
  // console.log('publishedEvents:', publishedEvents);
  // console.log('ratingEvents:', ratingEvents);
  // console.log('round2CandidateSongs:', round2CandidateSongs);
  const selectedRound1Event =
    round1RecruitingEvents.find((event) => event.id === memberEventId) ?? null;

  const isCurrentMemberAttendingEvent = (eventId: string) =>
    getSessionEntryForEvent(eventId)?.attendanceStatus === "attending";

  const getSessionEntryForEvent = (eventId: string) =>
    sessionEntries.find((entry) => entry.sessionEventId === eventId) ?? null;

  const getPublishedSessionSetsForEvent = (eventId: string) =>
    publishedSessionSets
      .filter((sessionSet) => sessionSet.sessionEventId === eventId)
      .sort((left, right) => {
        const leftOrder = left.setOrder ?? Number.MAX_SAFE_INTEGER;
        const rightOrder = right.setOrder ?? Number.MAX_SAFE_INTEGER;
        if (leftOrder !== rightOrder) {
          return leftOrder - rightOrder;
        }
        return left.songTitle.localeCompare(right.songTitle, "ja-JP");
      });

  const renderRatingStars = (sessionSetId: string) => {
    const currentRating = memberRatings[sessionSetId] ?? 0;

    return (
      <div className="flex flex-wrap items-center gap-1">
        {[1, 2, 3, 4, 5].map((rating) => {
          const isActive = currentRating >= rating;
          return (
            <Button
              key={rating}
              type="button"
              variant="ghost"
              size="icon"
              className="size-8 rounded-full"
              aria-label={`${rating} 星`}
              onClick={() =>
                setMemberRatings((current) => ({
                  ...current,
                  [sessionSetId]: rating,
                }))
              }
            >
              <Star
                className={
                  isActive
                    ? "size-5 fill-amber-400 text-amber-500"
                    : "size-5 text-muted-foreground"
                }
              />
            </Button>
          );
        })}
        <Button
          type="button"
          variant={currentRating ? "outline" : "secondary"}
          size="sm"
          onClick={() =>
            setMemberRatings((current) => ({
              ...current,
              [sessionSetId]: 0,
            }))
          }
        >
          なし
        </Button>
      </div>
    );
  };

  const getCurrentMemberAssignmentRoles = (sessionSet: SessionSetView) => {
    const memberProfile = currentUser?.memberProfile;
    if (!memberProfile) {
      return [] as string[];
    }

    const roles: string[] = [];
    const isCurrentMember = (member: { name: string } | null | undefined) =>
      member?.name === memberProfile.displayName;

    if (memberProfile.mainInstrument === "drum" && isCurrentMember(sessionSet.drum)) {
      roles.push("drum");
    }
    if (memberProfile.mainInstrument === "bass" && isCurrentMember(sessionSet.bass)) {
      roles.push("bass");
    }
    if (memberProfile.mainInstrument === "piano" && isCurrentMember(sessionSet.piano)) {
      roles.push("piano");
    }
    if (
      memberProfile.mainInstrument === "front" &&
      sessionSet.front?.some((member) => isCurrentMember(member))
    ) {
      roles.push(memberProfile.subInstrument?.trim() || "front");
    }
    if (
      memberProfile.mainInstrument === "vocal" &&
      sessionSet.vocal?.some((member) => isCurrentMember(member))
    ) {
      roles.push("vocal");
    }

    return roles;
  };

  const getCurrentMemberPlayedSessionSetsForEvent = (eventId: string) =>
    getPublishedSessionSetsForEvent(eventId)
      .map((sessionSet) => ({
        sessionSet,
        roles: getCurrentMemberAssignmentRoles(sessionSet),
      }))
      .filter((item) => item.roles.length > 0);

  const renderSessionSetPerformers = (sessionSet: SessionSetView) => (
    <div className="mt-2 grid gap-1 text-sm text-muted-foreground">
      <div className="flex flex-wrap items-start gap-2">
        <p>
          drum{" "}
          {sessionSet.drum
            ? renderSessionMemberName(
                sessionSet.drum.name,
                profileDisplayName,
                sessionSet.drum,
              )
            : "-"}
        </p>
        <p>
          bass{" "}
          {sessionSet.bass
            ? renderSessionMemberName(
                sessionSet.bass.name,
                profileDisplayName,
                sessionSet.bass,
              )
            : "-"}
        </p>
        <p>
          piano{" "}
          {sessionSet.piano
            ? renderSessionMemberName(
                sessionSet.piano.name,
                profileDisplayName,
                sessionSet.piano,
              )
            : "-"}
        </p>
      </div>
      <p>
        front{" "}
        {sessionSet.front?.length
          ? sessionSet.front.map((member, index) => (
              <span key={`${member.id}-${index}`}>
                {index > 0 ? ", " : null}
                {renderSessionMemberName(
                  member.name,
                  profileDisplayName,
                  member,
                )}
                {member.subInstrument ? ` (${member.subInstrument})` : null}
              </span>
            ))
          : "-"}
      </p>
      <p>
        vocal{" "}
        {sessionSet.vocal?.length
          ? sessionSet.vocal.map((member, index) => (
              <span key={`${member.id}-${index}`}>
                {index > 0 ? ", " : null}
                {renderSessionMemberName(
                  member.name,
                  profileDisplayName,
                  member,
                )}
                {sessionSet.key ? ` (key ${sessionSet.key})` : null}
              </span>
            ))
          : "-"}
      </p>
    </div>
  );

  const renderPublishedSessionSets = (sessionSets: SessionSetView[]) => (
    <ul className="mt-3 space-y-2">
      {sessionSets.map((sessionSet) => (
        <li
          key={sessionSet.id}
          className="rounded-lg border bg-background/50 p-3"
        >
          <div className="flex flex-wrap items-center gap-2">
            <strong className="text-sm text-foreground">
              {sessionSet.songTitle}
            </strong>
            {sessionSet.key ? (
              <Badge variant="outline">key {sessionSet.key}</Badge>
            ) : null}
          </div>
          {renderSessionSetPerformers(sessionSet)}
        </li>
      ))}
    </ul>
  );

  const getRound1RequestsForEvent = (eventId: string) =>
    getSessionEntryForEvent(eventId)
      ?.requests.filter((request) => request.round === 1)
      .sort((left, right) => left.priority - right.priority) ?? [];

  const getSelectedRound2SongsForEvent = (eventId: string) => {
    if (memberEventId === eventId) {
      return memberRound2Songs.filter(
        (songTitle) => songTitle.trim().length > 0,
      );
    }

    return (
      getSessionEntryForEvent(eventId)
        ?.requests.filter((request) => request.round === 2)
        .sort((left, right) => left.priority - right.priority)
        .map((request) =>
          formatRoundCandidateSong(request.songTitleSnapshot, request.keyName),
        )
        .filter((songTitle) => songTitle.trim().length > 0) ?? []
    );
  };

  const setSelectedRound2Songs = (songTitles: string[]) => {
    setMemberRound2Songs(songTitles);
  };

  const getAllowForcedAssignmentForEvent = (eventId: string) => {
    if (memberEventId === eventId) {
      return memberAllowForcedAssignment;
    }

    return getSessionEntryForEvent(eventId)?.allowForcedAssignment ?? true;
  };

  const handleAllowForcedAssignmentChange = (
    eventId: string,
    checked: boolean,
  ) => {
    if (memberEventId !== eventId) {
      setMemberEventId(eventId);
    }

    setMemberAllowForcedAssignment(checked);
  };

  const handleRound2SongToggle = (
    eventId: string,
    songTitle: string,
    checked: boolean,
  ) => {
    if (memberEventId !== eventId) {
      setMemberEventId(eventId);
    }

    const normalizedSongTitle = normalizeSongTitle(songTitle);
    const currentSelections = getSelectedRound2SongsForEvent(eventId);

    if (checked) {
      if (
        currentSelections.some(
          (selectedSong) =>
            normalizeSongTitle(selectedSong) === normalizedSongTitle,
        )
      ) {
        return;
      }

      setSelectedRound2Songs([...currentSelections, songTitle]);
      return;
    }

    setSelectedRound2Songs(
      currentSelections.filter(
        (selectedSong) =>
          normalizeSongTitle(selectedSong) !== normalizedSongTitle,
      ),
    );
  };

  const renderRound2SelectionBlock = (
    eventId: string,
    candidateSongs: string[],
    options?: { showSaveHint?: boolean; interactive?: boolean },
  ) => {
    const round1Requests = getRound1RequestsForEvent(eventId);
    const round1RequestSongSet = new Set(
      round1Requests.map((request) =>
        normalizeSongTitle(
          formatRoundCandidateSong(request.songTitleSnapshot, request.keyName),
        ),
      ),
    );
    const availableSongs = candidateSongs.filter(
      (songTitle) => !round1RequestSongSet.has(normalizeSongTitle(songTitle)),
    );
    const selectedSongs = getSelectedRound2SongsForEvent(eventId);
    const selectedSongSet = new Set(
      selectedSongs.map((songTitle) => normalizeSongTitle(songTitle)),
    );
    const interactive = options?.interactive ?? true;
    const allowForcedAssignment = getAllowForcedAssignmentForEvent(eventId);

    return (
      <div className="my-2">
        <p className="text-sm font-medium">Round2 追加リクエスト</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Round1 の名寄せ済み候補から、自分が Round1
          で選んだ曲を除いた曲を複数選択できます。
        </p>
        {options?.showSaveHint ? (
          <p className="mt-1 text-xs text-muted-foreground">
            選択した曲は、「エントリー保存」で確定されます。
          </p>
        ) : null}

        <div className="mt-2 rounded-lg border bg-background/80 p-3">
          <p className="text-xs font-medium text-muted-foreground">
            あなたの Round1 リクエスト
          </p>
          {round1Requests.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">
              Round1 のリクエストはまだありません。
            </p>
          ) : (
            <div className="mt-2 flex flex-wrap gap-2">
              {round1Requests.map((request) => (
                <Badge key={request.id} variant="secondary">
                  {formatSongWithKey(
                    request.songTitleSnapshot,
                    request.keyName,
                  )}
                </Badge>
              ))}
            </div>
          )}
        </div>

        <div className="mt-2 rounded-lg border bg-background/50 p-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-medium text-muted-foreground">
              選択可能な候補曲
            </p>
            <Badge variant="outline">選択中 {selectedSongs.length}曲</Badge>
          </div>
          {availableSongs.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">
              選択可能な候補曲はありません。
            </p>
          ) : (
            <div className="mt-3 grid gap-1 md:grid-cols-2">
              {availableSongs.map((songTitle, index) => {
                const checkboxId = `member-round2-${eventId}-${index}`;
                const checked = selectedSongSet.has(
                  normalizeSongTitle(songTitle),
                );

                return (
                  <label
                    key={songTitle}
                    htmlFor={checkboxId}
                    className={`flex cursor-pointer items-start gap-3 rounded-lg border p-1 ${checked ? "border-primary bg-primary/5" : "bg-background"}`}
                  >
                    <Checkbox
                      id={checkboxId}
                      checked={checked}
                      onCheckedChange={(nextChecked) => {
                        if (!interactive) {
                          return;
                        }
                        handleRound2SongToggle(
                          eventId,
                          songTitle,
                          nextChecked === true,
                        );
                      }}
                      disabled={!interactive}
                    />
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-5">
                        {songTitle}
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-3 rounded-lg border bg-background/70 p-3">
          <label className="flex cursor-pointer items-start gap-3">
            <Checkbox
              checked={allowForcedAssignment}
              onCheckedChange={(nextChecked) => {
                if (!interactive) {
                  return;
                }

                handleAllowForcedAssignmentChange(
                  eventId,
                  nextChecked === true,
                );
              }}
              disabled={!interactive}
            />
            <div className="space-y-1">
              <p className="text-sm font-medium leading-5">
                自動生成での強制参加を許可する
              </p>
              <p className="text-xs text-muted-foreground">
                オフにすると、不足パート補完の自動強制追加対象から外れます。管理者による手動割り当ては可能です。
              </p>
            </div>
          </label>
        </div>
      </div>
    );
  };

  const handleRound1EntryOpen = (eventId: string) => {
    setMemberEventId(eventId);
    setIsRound1EntryDialogOpen(true);
  };

  const handleRound1EntrySubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    if (loading) {
      return;
    }

    await onSubmitEntry({
      onSuccess: () => {
        setIsRound1EntryDialogOpen(false);
      },
    });
  };

  return (
    <>
      <div className="text-lg font-semibold text-secondary mb-4 px-4">
        ようこそ、{profileDisplayName}さん
      </div>
      <Card className="rounded-xl border bg-secondary/80 p-4 border-none">
        <CardTitle className="text-2xl font-semibold text-on-secondary">
          お知らせ
        </CardTitle>
        <CardDescription className="text-on-secondary">
          運営からのお知らせです。
        </CardDescription>

        {announcements.length === 0 ? (
          <p className="text-sm text-on-secondary">
            公開中のお知らせはありません。
          </p>
        ) : (
          <ul className="space-y-3">
            {announcements.map((announcement) => (
              <li
                key={announcement.id}
                className="rounded-xl border bg-neutral-100 p-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">お知らせ</Badge>
                  {announcement.publishedAt ? (
                    <span className="text-sm text-muted-foreground">
                      {new Date(announcement.publishedAt).toLocaleDateString(
                        "ja-JP",
                      )}
                    </span>
                  ) : null}
                </div>
                <strong className="mt-3 block text-base">
                  {announcement.title}
                </strong>
                <div className="mt-2 text-sm leading-7 text-muted-foreground">
                  {announcement.body}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card id="event-info" className="rounded-xl border bg-primary p-2 my-4">
        <CardTitle className="text-2xl font-semibold text-on-primary">
          イベント情報
        </CardTitle>

        <Card className="border p-2 bg-on-primary/5">
          <CardTitle className="text-sm font-semibold text-on-primary bg-neutral-50 px-4 py-1">
            開催予定イベント
          </CardTitle>
          <CardDescription
            className={announcedEvents.length === 0 ? "hidden" : ""}
          >
            開催を予定しているベントです。
            <br />
            ※日時は変更される場合があります。
          </CardDescription>

          {announcedEvents.length === 0 ? (
            <p className="text-sm text-gray-50 bg-gray-400 p-2">
              表示できる開催予定イベントはありません。
            </p>
          ) : (
            <ul className="space-y-3">
              {announcedEvents.map((event) => (
                <li
                  key={event.id}
                  className="rounded-xl border bg-background/60 p-4"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <strong className="text-sm text-slate-600">
                      {event.title}
                    </strong>
                    <Badge variant="outline">
                      {getSessionEventStatusLabel(event.status)}
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {formatEventSchedule(
                      event.eventDate,
                      event.startTime,
                      event.endTime,
                    )}{" "}
                    / {event.venue}
                  </p>
                  <EventMeta
                    participantLimit={event.participantLimit}
                    attendingEntryCount={event.attendingEntryCount}
                    remainingEntryCapacity={event.remainingEntryCapacity}
                    isEntryCapacityFull={event.isEntryCapacityFull}
                    participationFee={event.participationFee}
                    hasAfterParty={event.hasAfterParty}
                    afterPartyFee={event.afterPartyFee}
                    sessionEntries={event.sessionEntries}
                    notes={event.notes}
                  />
                  {event.entryReason ? (
                    <p className="mt-2 text-sm text-muted-foreground">
                      {event.entryReason}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="border p-2 bg-orange-100">
          <CardTitle className="text-sm font-semibold text-orange-600 bg-neutral-50 px-4 py-1">
            参加募集中イベント(ラウンド1)
          </CardTitle>
          <CardDescription
            className={round1RecruitingEvents.length === 0 ? "hidden" : ""}
          >
            参加可否とリクエスト曲を募っています。
          </CardDescription>
          {round1RecruitingEvents.length === 0 ? (
            <p className="text-sm text-gray-50 bg-gray-400 p-2">
              表示できる参加募集中イベントはありません。
            </p>
          ) : (
            <ul className="space-y-3">
              {round1RecruitingEvents.map((event) => (
                <li
                  key={event.id}
                  className="rounded-xl border bg-background/20 p-4"
                >
                  {(() => {
                    const eventEntry = sessionEntries.find(
                      (entry) => entry.sessionEventId === event.id,
                    );
                    const round1Requests = (eventEntry?.requests ?? [])
                      .filter((request) => request.round === 1)
                      .sort((a, b) => a.priority - b.priority);

                    return (
                      <>
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <strong className="text-sm text-orange-600">
                                {event.title}
                              </strong>
                              <Badge variant="outline">
                                {getSessionEventStatusLabel(event.status)}
                              </Badge>
                              <Badge
                                variant={eventEntry ? "default" : "secondary"}
                              >
                                エントリー: {eventEntry ? "済" : "未"}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {formatEventSchedule(
                                event.eventDate,
                                event.startTime,
                                event.endTime,
                              )}{" "}
                              / {event.venue}
                            </p>
                            <p>
                              ラウンド1募集期間:{" "}
                              {event.round1StartAt
                                ? formatEventDate(event.round1StartAt)
                                : ""}{" "}
                              ~{" "}
                              {event.round1EndAt
                                ? formatEventDate(event.round1EndAt)
                                : ""}
                            </p>
                            <EventMeta
                              participantLimit={event.participantLimit}
                              attendingEntryCount={event.attendingEntryCount}
                              remainingEntryCapacity={
                                event.remainingEntryCapacity
                              }
                              isEntryCapacityFull={event.isEntryCapacityFull}
                              participationFee={event.participationFee}
                              hasAfterParty={event.hasAfterParty}
                              afterPartyFee={event.afterPartyFee}
                              sessionEntries={event.sessionEntries}
                              notes={event.notes}
                            />
                            {event.entryReason ? (
                              <p className="text-sm text-muted-foreground">
                                {event.entryReason}
                              </p>
                            ) : null}
                            {eventEntry ? (
                              <div className="rounded-lg border bg-primary p-3 text-sm">
                                <h4 className="text-md font-semibold mb-2">
                                  あなたのエントリー情報
                                </h4>
                                <p className="font-medium text-foreground">
                                  参加可否:{" "}
                                  {formatAttendanceStatusLabel(
                                    eventEntry.attendanceStatus,
                                  )}
                                </p>
                                {event.hasAfterParty ? (
                                  <p className="mt-1 font-medium text-foreground">
                                    懇親会:{" "}
                                    {formatOptionalAttendanceStatusLabel(
                                      eventEntry.afterPartyAttendanceStatus,
                                    )}
                                  </p>
                                ) : null}
                                {round1Requests.length === 0 ? (
                                  <p className="mt-1 text-muted-foreground">
                                    リクエスト曲は未登録です。
                                  </p>
                                ) : (
                                  <ul className="mt-2 space-y-1 text-muted-foreground">
                                    {round1Requests.map((request) => (
                                      <li key={request.id}>
                                        第{request.priority}希望:{" "}
                                        {formatSongWithKey(
                                          request.songTitleSnapshot,
                                          request.keyName,
                                        )}
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            ) : null}
                          </div>
                        </div>
                        <div className="text-right mt-2">
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => handleRound1EntryOpen(event.id)}
                            disabled={loading}
                          >
                            エントリー
                          </Button>
                        </div>
                      </>
                    );
                  })()}
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Dialog
          open={isRound1EntryDialogOpen}
          onOpenChange={setIsRound1EntryDialogOpen}
        >
          <DialogContent className="sm:max-w-2xl bg-neutral-200">
            <DialogHeader>
              <DialogTitle>
                {selectedRound1Event
                  ? `${selectedRound1Event.title} のエントリー`
                  : "ラウンド1エントリー"}
              </DialogTitle>
              <DialogDescription>
                {isVocalMember
                  ? "参加可否とラウンド1のリクエスト4曲を登録できます。募集期間中は何度でも修正できます。"
                  : "参加可否とラウンド1のリクエスト2曲を登録できます。募集期間中は何度でも修正できます。"}
              </DialogDescription>
            </DialogHeader>

            {!selectedRound1Event ? (
              <Alert variant="destructive">
                <AlertTitle>イベントが選択されていません</AlertTitle>
                <AlertDescription>
                  参加募集中イベントの「エントリー」ボタンから開いてください。
                </AlertDescription>
              </Alert>
            ) : (
              <form className="grid gap-4" onSubmit={handleRound1EntrySubmit}>
                <Alert
                  variant={entryState.canSubmit ? "default" : "destructive"}
                >
                  <AlertTitle>
                    {entryState.canSubmit
                      ? "入力可能です"
                      : "現在は入力できません"}
                  </AlertTitle>
                  <AlertDescription>
                    {entryState.canSubmit
                      ? "ラウンド1の募集内容を保存できます。"
                      : entryState.reason}
                  </AlertDescription>
                </Alert>

                <Field
                  label="参加可否"
                  htmlFor="member-round1-attendance-status"
                >
                  <Select
                    value={memberAttendanceStatus}
                    onValueChange={(value) =>
                      setMemberAttendanceStatus(value as AttendanceStatus)
                    }
                  >
                    <SelectTrigger
                      id="member-round1-attendance-status"
                      className="w-full bg-background"
                    >
                      <SelectValue placeholder="参加可否を選択" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="attending">参加</SelectItem>
                      <SelectItem value="undecided">未定</SelectItem>
                      <SelectItem value="absent">不参加</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>

                {selectedRound1Event.hasAfterParty ? (
                  <Field
                    label="懇親会参加可否"
                    htmlFor="member-round1-after-party-attendance-status"
                    description={
                      selectedRound1Event.afterPartyFee != null
                        ? `懇親会参加料金は ${formatYen(selectedRound1Event.afterPartyFee)} です。`
                        : "懇親会の参加可否を選択してください。"
                    }
                  >
                    <Select
                      value={memberAfterPartyAttendanceStatus}
                      onValueChange={(value) =>
                        setMemberAfterPartyAttendanceStatus(
                          value as AttendanceStatus,
                        )
                      }
                    >
                      <SelectTrigger
                        id="member-round1-after-party-attendance-status"
                        className="w-full bg-background"
                      >
                        <SelectValue placeholder="懇親会参加可否を選択" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="attending">参加</SelectItem>
                        <SelectItem value="undecided">未定</SelectItem>
                        <SelectItem value="absent">不参加</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                ) : null}

                <div className="rounded-lg border bg-background/70 p-3">
                  <label className="flex cursor-pointer items-start gap-3">
                    <Checkbox
                      checked={memberAllowForcedAssignment}
                      onCheckedChange={(nextChecked) =>
                        setMemberAllowForcedAssignment(nextChecked === true)
                      }
                    />
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-5">
                        自動生成での強制参加を許可する
                      </p>
                      <p className="text-xs text-muted-foreground">
                        オフにすると、このイベントでは不足パート補完の自動強制追加対象から外れます。管理者による手動割り当ては可能です。
                      </p>
                    </div>
                  </label>
                </div>

                <div
                  className={
                    isVocalMember ? "grid gap-4 md:grid-cols-2" : "grid gap-4"
                  }
                >
                  <Field
                    htmlFor="member-round1-song1"
                    label="リクエスト1曲目"
                    description="黒本1 / 黒本2 の曲名を入力すると候補から選択できます。"
                  >
                    <SearchableCombobox
                      id="member-round1-song1"
                      value={memberRound1Song1}
                      onValueChange={setMemberRound1Song1}
                      options={round1SongOptions}
                      placeholder="曲名を選択"
                      searchPlaceholder="黒本1 / 黒本2 から検索"
                      emptyMessage="一致する曲がありません。"
                    />
                  </Field>
                  {isVocalMember ? (
                    <Field htmlFor="member-round1-key1" label="1曲目 key">
                      <Input
                        id="member-round1-key1"
                        type="text"
                        placeholder="例: F, Bb"
                        value={memberRound1Key1}
                        onChange={(event) =>
                          setMemberRound1Key1(event.target.value)
                        }
                        className="bg-background"
                      />
                    </Field>
                  ) : null}
                </div>

                <div
                  className={
                    isVocalMember ? "grid gap-4 md:grid-cols-2" : "grid gap-4"
                  }
                >
                  <Field
                    htmlFor="member-round1-song2"
                    label="リクエスト2曲目"
                    description="未入力でも保存できます。"
                  >
                    <SearchableCombobox
                      id="member-round1-song2"
                      value={memberRound1Song2}
                      onValueChange={setMemberRound1Song2}
                      options={round1SongOptions}
                      placeholder="曲名を選択"
                      searchPlaceholder="黒本1 / 黒本2 から検索"
                      emptyMessage="一致する曲がありません。"
                    />
                  </Field>
                  {isVocalMember ? (
                    <Field htmlFor="member-round1-key2" label="2曲目 key">
                      <Input
                        id="member-round1-key2"
                        type="text"
                        placeholder="例: Eb, G"
                        value={memberRound1Key2}
                        onChange={(event) =>
                          setMemberRound1Key2(event.target.value)
                        }
                        className="bg-background"
                      />
                    </Field>
                  ) : null}
                </div>

                {isVocalMember ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field
                      htmlFor="member-round1-song3"
                      label="リクエスト3曲目"
                      description="未入力でも保存できます。"
                    >
                      <SearchableCombobox
                        id="member-round1-song3"
                        value={memberRound1Song3}
                        onValueChange={setMemberRound1Song3}
                        options={round1SongOptions}
                        placeholder="曲名を選択"
                        searchPlaceholder="黒本1 / 黒本2 から検索"
                        emptyMessage="一致する曲がありません。"
                      />
                    </Field>
                    <Field htmlFor="member-round1-key3" label="3曲目 key">
                      <Input
                        id="member-round1-key3"
                        type="text"
                        placeholder="例: C, Ab"
                        value={memberRound1Key3}
                        onChange={(event) =>
                          setMemberRound1Key3(event.target.value)
                        }
                        className="bg-background"
                      />
                    </Field>
                  </div>
                ) : null}

                {isVocalMember ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field
                      htmlFor="member-round1-song4"
                      label="リクエスト4曲目"
                      description="未入力でも保存できます。"
                    >
                      <SearchableCombobox
                        id="member-round1-song4"
                        value={memberRound1Song4}
                        onValueChange={setMemberRound1Song4}
                        options={round1SongOptions}
                        placeholder="曲名を選択"
                        searchPlaceholder="黒本1 / 黒本2 から検索"
                        emptyMessage="一致する曲がありません。"
                      />
                    </Field>
                    <Field htmlFor="member-round1-key4" label="4曲目 key">
                      <Input
                        id="member-round1-key4"
                        type="text"
                        placeholder="例: D, F#"
                        value={memberRound1Key4}
                        onChange={(event) =>
                          setMemberRound1Key4(event.target.value)
                        }
                        className="bg-background"
                      />
                    </Field>
                  </div>
                ) : null}

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsRound1EntryDialogOpen(false)}
                    disabled={loading}
                  >
                    閉じる
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading || !entryState.canSubmit}
                  >
                    保存
                  </Button>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>

        {!isVocalMember ? (
          <Card className="border p-2 bg-pink-100">
            <CardTitle className="text-sm font-semibold text-pink-600 bg-neutral-50 px-4 py-1">
              追加リクエスト曲募集中イベント(ラウンド2)
            </CardTitle>
            <CardDescription
              className={round2RecruitingEvents.length === 0 ? "hidden" : ""}
            >
              ラウンド1のリクエスト曲に加えて追加のリクエスト曲を募っています。
            </CardDescription>
            {round2RecruitingEvents.length === 0 ? (
              <p className="text-sm text-gray-50 bg-gray-400 p-2">
                表示できる追加リクエスト曲募集中イベントはありません。
              </p>
            ) : (
              <ul className="space-y-3">
                {round2RecruitingEvents.map((event) => {
                  const round2EntryState = getEventEntryState(event);

                  return (
                    <li
                      key={event.id}
                      className="rounded-xl border bg-background/20 p-4"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <strong className="text-sm text-pink-600">
                          {event.title}
                        </strong>
                        <Badge variant="outline">
                          {getSessionEventStatusLabel(event.status)}
                        </Badge>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {formatEventSchedule(
                          event.eventDate,
                          event.startTime,
                          event.endTime,
                        )}{" "}
                        / {event.venue}
                      </p>
                      <p>
                        ラウンド2募集期間:{" "}
                        {event.round2StartAt
                          ? formatEventDate(event.round2StartAt)
                          : ""}{" "}
                        ~{" "}
                        {event.round2EndAt
                          ? formatEventDate(event.round2EndAt)
                          : ""}
                      </p>
                      <EventMeta
                        participantLimit={event.participantLimit}
                        attendingEntryCount={event.attendingEntryCount}
                        remainingEntryCapacity={event.remainingEntryCapacity}
                        isEntryCapacityFull={event.isEntryCapacityFull}
                        participationFee={event.participationFee}
                        hasAfterParty={event.hasAfterParty}
                        afterPartyFee={event.afterPartyFee}
                        sessionEntries={event.sessionEntries}
                        notes={event.notes}
                      />
                      {event.entryReason ? (
                        <p className="mt-2 text-sm text-muted-foreground">
                          {event.entryReason}
                        </p>
                      ) : null}
                      <div className="mt-4">
                        <>
                          <div className="md:col-span-2">
                            <Alert
                              variant={
                                round2EntryState.canSubmit
                                  ? "default"
                                  : "destructive"
                              }
                            >
                              <AlertTitle>
                                {round2EntryState.canSubmit
                                  ? "入力可能です"
                                  : "現在は入力できません"}
                              </AlertTitle>
                              <AlertDescription>
                                {round2EntryState.canSubmit
                                  ? "現在入力できるのは Round 2 です。"
                                  : round2EntryState.reason}
                              </AlertDescription>
                            </Alert>
                          </div>
                          <div className="md:col-span-2">
                            {renderRound2SelectionBlock(
                              event.id,
                              event.round2CandidateSongs ?? [],
                              { showSaveHint: true, interactive: true },
                            )}
                          </div>
                          <div className="md:col-span-2 text-right">
                            <Button
                              type="button"
                              onClick={() => {
                                void onSubmitEntry(event.id);
                              }}
                              disabled={loading || !round2EntryState.canSubmit}
                            >
                              エントリー保存
                            </Button>
                          </div>
                        </>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        ) : null}

        {/* <Section title="セッションエントリー" description="ラウンド2はここから追加リクエストを登録します。">
        <div className="mt-4 grid max-w-3xl gap-4 md:grid-cols-2">
          <Field label="イベント" htmlFor="member-event-id" className="md:col-span-2">
            <Select value={memberEventId || NONE_VALUE} onValueChange={(value) => setMemberEventId(value === NONE_VALUE ? '' : value)}>
              <SelectTrigger id="member-event-id" className="w-full">
                <SelectValue placeholder="イベントを選択" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE_VALUE}>イベントを選択</SelectItem>
                {scheduledEvents.map((event) => (
                  <SelectItem key={event.id} value={event.id}>{event.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          {entryState.round === 1 ? (
            <div className="md:col-span-2">
              <Alert>
                <AlertTitle>ラウンド1は上の一覧から登録します</AlertTitle>
                <AlertDescription>
                  参加募集中イベント(ラウンド1) の「エントリー」ボタンからモーダルを開いてください。募集期間中は何度でも修正できます。
                </AlertDescription>
              </Alert>
            </div>
          ) : null}
          {entryState.round === 2 ? (
            <>
              <div className="md:col-span-2">
                <Alert variant={entryState.canSubmit ? 'default' : 'destructive'}>
                  <AlertTitle>{entryState.canSubmit ? '入力可能です' : '現在は入力できません'}</AlertTitle>
                  <AlertDescription>{entryState.canSubmit ? '現在入力できるのは Round 2 です。' : entryState.reason}</AlertDescription>
                </Alert>
              </div>
              <Field label="参加可否" htmlFor="member-attendance-status" className="md:col-span-2">
                <Select value={memberAttendanceStatus} onValueChange={(value) => setMemberAttendanceStatus(value as AttendanceStatus)}>
                  <SelectTrigger id="member-attendance-status" className="w-full">
                    <SelectValue placeholder="参加可否を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="attending">参加</SelectItem>
                    <SelectItem value="undecided">未定</SelectItem>
                    <SelectItem value="absent">不参加</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <div className="md:col-span-2">
                {renderRound2SelectionBlock(memberEventId, round2CandidateSongs, { interactive: true })}
              </div>
              <div className="md:col-span-2">
                <Button type="button" onClick={() => { void onSubmitEntry(); }} disabled={loading || !entryState.canSubmit}>エントリー保存</Button>
              </div>
            </>
          ) : null}
        </div>
      </Section> */}

        <Card className="border p-2 bg-sky-100">
          <CardTitle className="text-sm font-semibold text-sky-600 bg-neutral-50 px-4 py-1">
            セッションセット確定イベント(公開)
          </CardTitle>
          <CardDescription
            className={publishedEvents.length === 0 ? "hidden" : ""}
          >
            演奏曲とメンバーが確定したイベントです。
          </CardDescription>
          {publishedEvents.length === 0 ? (
            <p className="text-sm text-gray-50 bg-gray-400 p-2">
              表示できる確定イベントはありません。
            </p>
          ) : (
            <ul className="space-y-3">
              {publishedEvents.map((event) => {
                const isAttending = isCurrentMemberAttendingEvent(event.id);
                const eventSessionSets = getPublishedSessionSetsForEvent(
                  event.id,
                );

                return (
                  <li
                    key={event.id}
                    className="rounded-xl border bg-background/20 p-4"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <strong className="text-sm text-sky-600">
                        {event.title}
                      </strong>
                      <Badge variant="outline">
                        {getSessionEventStatusLabel(event.status)}
                      </Badge>
                      {isAttending ? null : (
                        <strong className="text-red-400">
                          参加していません
                        </strong>
                      )}
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {formatEventSchedule(
                        event.eventDate,
                        event.startTime,
                        event.endTime,
                      )}{" "}
                      / {event.venue}
                    </p>
                    <EventMeta
                      participantLimit={event.participantLimit}
                      attendingEntryCount={event.attendingEntryCount}
                      remainingEntryCapacity={event.remainingEntryCapacity}
                      isEntryCapacityFull={event.isEntryCapacityFull}
                      participationFee={event.participationFee}
                      hasAfterParty={event.hasAfterParty}
                      afterPartyFee={event.afterPartyFee}
                      sessionEntries={event.sessionEntries}
                      notes={event.notes}
                    />
                    {event.entryReason ? (
                      <p className="mt-2 text-sm text-muted-foreground">
                        {event.entryReason}
                      </p>
                    ) : null}
                    {eventSessionSets.length > 0 ? (
                      <>
                        <Separator className="my-3 bg-sky-200" />
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm font-medium text-sky-700">
                            保存済み sessionSet
                          </p>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              downloadSessionSetPdf({
                                sessionEvent: event,
                                sessionSets: eventSessionSets,
                              })
                            }
                          >
                            <FileDown className="size-4" />
                            PDF
                          </Button>
                        </div>
                        {renderPublishedSessionSets(eventSessionSets)}
                      </>
                    ) : (
                      <p className="mt-3 text-sm text-muted-foreground">
                        保存済み sessionSet はありません。
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card className="border p-2 bg-emerald-50">
          <CardTitle className="text-sm font-semibold text-emerald-600 bg-neutral-50 px-4 py-1">
            レイティング受付中イベント
          </CardTitle>
          <CardDescription
            className={ratingEvents.length === 0 ? "hidden" : ""}
          >
            レイティングや感想をコメント出来るイベントです。
          </CardDescription>
          {ratingEvents.length === 0 ? (
            <p className="text-sm text-gray-50 bg-gray-400 p-2">
              表示できるレイティング受付中イベントはありません。
            </p>
          ) : (
            <ul className="space-y-3">
              {ratingEvents.map((event) => {
                const eventSessionSets = getPublishedSessionSetsForEvent(event.id);
                const ratingSummaryBySessionSetId = new Map(
                  (event.ratingSummaries ?? []).map((summary) => [
                    summary.sessionSetId,
                    summary,
                  ]),
                );
                const hasRatingInput = eventSessionSets.some((sessionSet) => {
                  const rating = memberRatings[sessionSet.id];
                  return Number.isInteger(rating) && rating >= 1 && rating <= 5;
                });

                return (
                  <li
                    key={event.id}
                    className="rounded-xl border bg-background/20 p-4"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <strong className="text-sm text-emerald-600">
                        {event.title}
                      </strong>
                      <Badge variant="outline">
                        {getSessionEventStatusLabel(event.status)}
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {formatEventSchedule(
                        event.eventDate,
                        event.startTime,
                        event.endTime,
                      )}{" "}
                      / {event.venue}
                    </p>
                    <EventMeta
                      participantLimit={event.participantLimit}
                      attendingEntryCount={event.attendingEntryCount}
                      remainingEntryCapacity={event.remainingEntryCapacity}
                      isEntryCapacityFull={event.isEntryCapacityFull}
                      participationFee={event.participationFee}
                      hasAfterParty={event.hasAfterParty}
                      afterPartyFee={event.afterPartyFee}
                      sessionEntries={event.sessionEntries}
                      notes={event.notes}
                    />
                    {event.entryReason ? (
                      <p className="mt-2 text-sm text-muted-foreground">
                        {event.entryReason}
                      </p>
                    ) : null}
                    <Separator className="my-4 bg-emerald-100" />
                    {eventSessionSets.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        評価対象の公開済み sessionSet はありません。
                      </p>
                    ) : (
                      <div className="space-y-3">
                        <ul className="space-y-3">
                          {eventSessionSets.map((sessionSet) => {
                            const summary = ratingSummaryBySessionSetId.get(sessionSet.id);
                            return (
                              <li
                                key={sessionSet.id}
                                className="rounded-lg border bg-background/70 p-3"
                              >
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                  <div>
                                    <div className="flex flex-wrap items-center gap-2">
                                      <span className="font-medium">
                                        {sessionSet.songTitle}
                                      </span>
                                      {sessionSet.key ? (
                                        <Badge variant="outline">
                                          key {sessionSet.key}
                                        </Badge>
                                      ) : null}
                                    </div>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                      集計 {summary?.ratingCount ?? 0} 件 / 平均{" "}
                                      {summary?.averageRating
                                        ? summary.averageRating.toFixed(1)
                                        : "-"}
                                    </p>
                                    {renderSessionSetPerformers(sessionSet)}
                                  </div>
                                  {renderRatingStars(sessionSet.id)}
                                </div>
                                <Field
                                  label="コメント"
                                  htmlFor={`rating-event-comment-${sessionSet.id}`}
                                  className="mt-3 grid gap-2"
                                >
                                  <Textarea
                                    id={`rating-event-comment-${sessionSet.id}`}
                                    rows={2}
                                    placeholder="任意でコメント"
                                    value={memberRatingComments[sessionSet.id] ?? ""}
                                    onChange={(event) =>
                                      setMemberRatingComments((current) => ({
                                        ...current,
                                        [sessionSet.id]: event.target.value,
                                      }))
                                    }
                                  />
                                </Field>
                              </li>
                            );
                          })}
                        </ul>
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <p className="text-xs text-muted-foreground">
                            星なしの曲は未評価として送信対象から外れます。
                          </p>
                          <Button
                            type="button"
                            onClick={() => onSaveEventRatings(event.id)}
                            disabled={loading || !hasRatingInput}
                          >
                            結果を送信
                          </Button>
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card className="border p-2">
          <CardTitle className="text-sm font-semibold text-neutral-600 bg-neutral-50 px-4 py-1">
            終了イベント
          </CardTitle>
          <CardDescription className={archives.length === 0 ? "hidden" : ""}>
            終了イベントのアーカイブです。項目を開くと参加者、sessionSet、レイティング結果を確認できます。
          </CardDescription>
          <ArchiveList
            archives={archives}
            emptyMessage="表示できる終了イベントのアーカイブはありません。"
          />
        </Card>
      </Card>

      <div className="hidden">
        <Section
          title="メンバー一覧 / 詳細"
          description="参加メンバーのプロフィールと最近の評価履歴を確認できます。"
        >
          <div className="grid gap-4 xl:grid-cols-[320px_1fr]">
            <ul className="space-y-2">
              {members.map((member) => (
                <li key={member.id}>
                  <Button
                    type="button"
                    variant={
                      selectedMemberId === member.id ? "default" : "ghost"
                    }
                    className="h-auto w-full justify-between px-3 py-3"
                    onClick={() => setSelectedMemberId(member.id)}
                  >
                    <span className="text-left">
                      <span className="block font-medium">
                        {member.displayName}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {member.mainInstrument}
                      </span>
                    </span>
                    <Badge variant="outline">{member.entryCount}件</Badge>
                  </Button>
                </li>
              ))}
            </ul>
            <div>
              {selectedMemberDetail ? (
                <div className="rounded-xl border bg-background/60 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-semibold">
                      {selectedMemberDetail.displayName}
                    </h3>
                    <Badge variant="outline">
                      {selectedMemberDetail.mainInstrument}
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {selectedMemberDetail.mainInstrument === "front" &&
                    selectedMemberDetail.subInstrument
                      ? `演奏楽器 ${selectedMemberDetail.subInstrument}`
                      : "サブ楽器未設定"}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {selectedMemberDetail.area || "地域未設定"} /{" "}
                    {selectedMemberDetail.gender || "性別未設定"} /{" "}
                    {selectedMemberDetail.ageRange || "年代未設定"}
                  </p>
                  <p className="mt-4 text-sm leading-7">
                    {selectedMemberDetail.bio || "自己紹介未設定"}
                  </p>
                  <p className="mt-4 text-sm text-muted-foreground">
                    活動件数: {selectedMemberDetail.sessionEntries.length}
                  </p>
                  <Separator className="my-4" />
                  <h4 className="font-medium">最近の評価</h4>
                  {selectedMemberRatings.length === 0 ? (
                    <p className="mt-3 text-sm text-muted-foreground">
                      評価履歴はありません。
                    </p>
                  ) : (
                    <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                      {selectedMemberRatings.slice(0, 5).map((rating) => (
                        <li key={rating.id}>
                          {rating.sessionEvent.title} /{" "}
                          {rating.sessionSet.title} / {rating.rating} 星
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  メンバーを選択してください。
                </p>
              )}
            </div>
          </div>
        </Section>
      </div>

      {/* <Section title="セッションエントリー" description="ラウンド1は上のイベント一覧から、ラウンド2はここから追加リクエストを登録します。">
        <div className="mt-4 grid max-w-3xl gap-4 md:grid-cols-2">
          <Field label="イベント" htmlFor="member-event-id" className="md:col-span-2">
            <Select value={memberEventId || NONE_VALUE} onValueChange={(value) => setMemberEventId(value === NONE_VALUE ? '' : value)}>
              <SelectTrigger id="member-event-id" className="w-full">
                <SelectValue placeholder="イベントを選択" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE_VALUE}>イベントを選択</SelectItem>
                {scheduledEvents.map((event) => (
                  <SelectItem key={event.id} value={event.id}>{event.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          {entryState.round === 1 ? (
            <div className="md:col-span-2">
              <Alert>
                <AlertTitle>ラウンド1は上の一覧から登録します</AlertTitle>
                <AlertDescription>
                  参加募集中イベント(ラウンド1) の「エントリー」ボタンからモーダルを開いてください。募集期間中は何度でも修正できます。
                </AlertDescription>
              </Alert>
            </div>
          ) : null}
          {entryState.round === 2 ? (
            <>
              <div className="md:col-span-2">
                <Alert variant={entryState.canSubmit ? 'default' : 'destructive'}>
                  <AlertTitle>{entryState.canSubmit ? '入力可能です' : '現在は入力できません'}</AlertTitle>
                  <AlertDescription>{entryState.canSubmit ? '現在入力できるのは Round 2 です。' : entryState.reason}</AlertDescription>
                </Alert>
              </div>
              <Field label="参加可否" htmlFor="member-attendance-status" className="md:col-span-2">
                <Select value={memberAttendanceStatus} onValueChange={(value) => setMemberAttendanceStatus(value as AttendanceStatus)}>
                  <SelectTrigger id="member-attendance-status" className="w-full">
                    <SelectValue placeholder="参加可否を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="attending">参加</SelectItem>
                    <SelectItem value="undecided">未定</SelectItem>
                    <SelectItem value="absent">不参加</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <div className="md:col-span-2">
                {renderRound2SelectionBlock(memberEventId, round2CandidateSongs, { interactive: true })}
              </div>
              <div className="md:col-span-2">
                <Button type="button" onClick={() => { void onSubmitEntry(); }} disabled={loading || !entryState.canSubmit}>エントリー保存</Button>
              </div>
            </>
          ) : null}
        </div>
      </Section> */}

      <Section
        title="自分の履歴 / 公開情報"
        description="過去エントリー、公開中イベントのコメント、レイティングを確認できます。"
      >
        <h3 className="font-medium">エントリー履歴</h3>
        {sessionEntries.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            まだエントリーはありません。
          </p>
        ) : (
          <ul className="mt-3 space-y-3">
            {sessionEntries.map((entry) => {
              const playedSessionSets =
                getCurrentMemberPlayedSessionSetsForEvent(entry.sessionEventId);

              return (
                <li
                  key={entry.id}
                  className="rounded-xl border bg-background/60 p-4 text-sm"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">
                      参加 {formatAttendanceStatusLabel(entry.attendanceStatus)}
                    </Badge>
                    {entry.sessionEvent.hasAfterParty ? (
                      <Badge variant="outline">
                        懇親会{" "}
                        {formatOptionalAttendanceStatusLabel(
                          entry.afterPartyAttendanceStatus,
                        )}
                      </Badge>
                    ) : null}
                    <span className="font-medium">
                      {entry.sessionEvent.title}
                    </span>
                  </div>
                  <p className="mt-2 text-muted-foreground">
                    {entry.requests.length} 曲 /{" "}
                    {formatEventSchedule(
                      entry.sessionEvent.eventDate,
                      entry.sessionEvent.startTime,
                      entry.sessionEvent.endTime,
                    )}
                  </p>
                  {playedSessionSets.length > 0 ? (
                    <div className="mt-3 rounded-lg border bg-background/70 p-3">
                      <p className="font-medium text-foreground">演奏曲</p>
                      <ul className="mt-2 space-y-2 text-muted-foreground">
                        {playedSessionSets.map(({ sessionSet, roles }) => (
                          <li
                            key={sessionSet.id}
                            className="flex flex-wrap items-center gap-2"
                          >
                            <span>{sessionSet.songTitle}</span>
                            {sessionSet.key ? (
                              <Badge variant="outline">key {sessionSet.key}</Badge>
                            ) : null}
                            {roles.map((role) => (
                              <Badge key={role} variant="secondary">
                                {role}
                              </Badge>
                            ))}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </Section>
      <Section
        title="プロフィール"
        description="プロフィール更新とパスワード変更をこの画面で行います。"
      >
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Badge variant="outline">{currentUser?.role ?? "member"}</Badge>
          <span className="text-sm text-muted-foreground">
            {currentUser?.email}
          </span>
        </div>
        <form
          className="grid max-w-3xl gap-4 md:grid-cols-2"
          onSubmit={handleProfileSubmit}
        >
          <Field
            htmlFor="member-profile-display-name"
            label="表示名"
            className="md:col-span-2"
          >
            <Input
              id="member-profile-display-name"
              type="text"
              placeholder="表示名"
              value={profileDisplayName}
              onChange={(event) =>
                onProfileDisplayNameChange(event.target.value)
              }
            />
          </Field>
          <Field label="メイン楽器" htmlFor="member-profile-main-instrument">
            <Select
              value={profileMainInstrument}
              onValueChange={(value) =>
                onProfileMainInstrumentChange(value as Instrument)
              }
            >
              <SelectTrigger
                id="member-profile-main-instrument"
                className="w-full"
              >
                <SelectValue placeholder="メイン楽器を選択" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="drum">drum</SelectItem>
                <SelectItem value="bass">bass</SelectItem>
                <SelectItem value="piano">piano</SelectItem>
                <SelectItem value="front">front</SelectItem>
                <SelectItem value="vocal">vocal</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field htmlFor="member-profile-nickname" label="ニックネーム">
            <Input
              id="member-profile-nickname"
              type="text"
              placeholder="ニックネーム"
              value={profileNickname}
              onChange={(event) => onProfileNicknameChange(event.target.value)}
            />
          </Field>
          {profileMainInstrument === "front" ? (
            <Field htmlFor="member-profile-sub-instrument" label="演奏楽器">
              <Input
                id="member-profile-sub-instrument"
                type="text"
                placeholder="演奏楽器"
                value={profileSubInstrument}
                onChange={(event) =>
                  onProfileSubInstrumentChange(event.target.value)
                }
              />
            </Field>
          ) : (
            <div className="hidden md:block" />
          )}
          <Field label="居住地域" htmlFor="member-profile-area">
            <Select
              value={profileArea || NONE_VALUE}
              onValueChange={(value) =>
                onProfileAreaChange(value === NONE_VALUE ? "" : value)
              }
            >
              <SelectTrigger id="member-profile-area" className="w-full">
                <SelectValue placeholder="居住地域を選択" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE_VALUE}>居住地域を選択</SelectItem>
                {PREFECTURE_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="性別" htmlFor="member-profile-gender">
            <Select
              value={profileGender || NONE_VALUE}
              onValueChange={(value) =>
                onProfileGenderChange(value === NONE_VALUE ? "" : value)
              }
            >
              <SelectTrigger id="member-profile-gender" className="w-full">
                <SelectValue placeholder="性別を選択" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE_VALUE}>性別を選択</SelectItem>
                {GENDER_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="年代" htmlFor="member-profile-age-range">
            <Select
              value={profileAgeRange || NONE_VALUE}
              onValueChange={(value) =>
                onProfileAgeRangeChange(value === NONE_VALUE ? "" : value)
              }
            >
              <SelectTrigger id="member-profile-age-range" className="w-full">
                <SelectValue placeholder="年代を選択" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE_VALUE}>年代を選択</SelectItem>
                {AGE_RANGE_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field
            htmlFor="member-profile-bio"
            label="自己紹介"
            className="md:col-span-2"
          >
            <Textarea
              id="member-profile-bio"
              rows={4}
              placeholder="自己紹介"
              value={profileBio}
              onChange={(event) => onProfileBioChange(event.target.value)}
            />
          </Field>
          <Field
            htmlFor="member-profile-current-password"
            label="現在のパスワード"
          >
            <Input
              id="member-profile-current-password"
              type="password"
              autoComplete="current-password"
              placeholder="現在のパスワード（変更時のみ）"
              value={profileCurrentPassword}
              onChange={(event) =>
                onProfileCurrentPasswordChange(event.target.value)
              }
            />
          </Field>
          <Field htmlFor="member-profile-new-password" label="新しいパスワード">
            <Input
              id="member-profile-new-password"
              type="password"
              autoComplete="new-password"
              placeholder="新しいパスワード（変更時のみ）"
              value={profileNewPassword}
              onChange={(event) =>
                onProfileNewPasswordChange(event.target.value)
              }
            />
          </Field>
          <Field
            htmlFor="member-profile-new-password-confirm"
            label="新しいパスワード確認"
            className="md:col-span-2"
          >
            <Input
              id="member-profile-new-password-confirm"
              type="password"
              autoComplete="new-password"
              placeholder="新しいパスワード確認"
              value={profileNewPasswordConfirm}
              onChange={(event) =>
                onProfileNewPasswordConfirmChange(event.target.value)
              }
            />
          </Field>
          <div className="flex flex-wrap gap-3 md:col-span-2">
            <Button type="submit" disabled={loading}>
              プロフィール保存
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onSignOut}
              disabled={loading}
            >
              サインアウト
            </Button>
          </div>
        </form>
      </Section>
    </>
  );
}
