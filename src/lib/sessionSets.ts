import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

type SessionSetWithRelations = Prisma.SessionSetGetPayload<{
  include: {
    song: true;
    drum: true;
    bass: true;
    piano: true;
    members: {
      include: {
        participant: true;
      };
    };
  };
}>;

export function buildSessionSetDraftTitle(sessionEventTitle: string) {
  return `${sessionEventTitle} sessionSet`;
}

function normalizeSongTitle(value: string) {
  return value.trim().replace(/\s+/g, ' ').toLocaleLowerCase('ja-JP');
}

function buildRequestLookupKey(sessionEventId: string, displayName: string, instrument: string) {
  return `${sessionEventId}::${displayName}::${instrument}`;
}

export async function serializeSessionSets(sessionSets: SessionSetWithRelations[]) {
  const sessionEventIds = [...new Set(sessionSets.map((sessionSet) => sessionSet.sessionEventId).filter((value): value is string => Boolean(value)))];
  const frontNames = [...new Set(
    sessionSets.flatMap((sessionSet) =>
      sessionSet.members
        .filter((member) => member.role === 'front')
        .map((member) => member.participant.name),
    ),
  )];

  const frontProfiles = frontNames.length === 0
    ? []
    : await prisma.memberProfile.findMany({
        where: {
          displayName: { in: frontNames },
          mainInstrument: 'front',
        },
        select: {
          displayName: true,
          subInstrument: true,
        },
      });

  const sessionEntries = sessionEventIds.length === 0
    ? []
    : await prisma.sessionEntry.findMany({
        where: {
          sessionEventId: { in: sessionEventIds },
          attendanceStatus: 'attending',
        },
        select: {
          sessionEventId: true,
          memberProfile: {
            select: {
              displayName: true,
              mainInstrument: true,
            },
          },
          requests: {
            select: {
              songTitleSnapshot: true,
              round: true,
            },
          },
        },
      });

  const requestedSongKeysByMember = new Map<string, Set<string>>();
  const round1RequestedSongKeysByMember = new Map<string, Set<string>>();
  for (const entry of sessionEntries) {
    const lookupKey = buildRequestLookupKey(
      entry.sessionEventId,
      entry.memberProfile.displayName,
      entry.memberProfile.mainInstrument,
    );
    const requestedSongKeys = requestedSongKeysByMember.get(lookupKey) ?? new Set<string>();
    const round1RequestedSongKeys = round1RequestedSongKeysByMember.get(lookupKey) ?? new Set<string>();

    for (const request of entry.requests) {
      const normalizedTitle = normalizeSongTitle(request.songTitleSnapshot);
      if (normalizedTitle) {
        requestedSongKeys.add(normalizedTitle);
        if (request.round === 1) {
          round1RequestedSongKeys.add(normalizedTitle);
        }
      }
    }

    requestedSongKeysByMember.set(lookupKey, requestedSongKeys);
    round1RequestedSongKeysByMember.set(lookupKey, round1RequestedSongKeys);
  }

  const isForcedAssignment = (sessionEventId: string | null, participantName: string, instrument: string, songTitle: string) => {
    if (!sessionEventId) {
      return false;
    }

    const requestedSongs = requestedSongKeysByMember.get(
      buildRequestLookupKey(sessionEventId, participantName, instrument),
    );

    return !requestedSongs?.has(normalizeSongTitle(songTitle));
  };

  const isRequestedInRound1 = (sessionEventId: string | null, participantName: string, instrument: string, songTitle: string) => {
    if (!sessionEventId) {
      return false;
    }

    const requestedSongs = round1RequestedSongKeysByMember.get(
      buildRequestLookupKey(sessionEventId, participantName, instrument),
    );

    return requestedSongs?.has(normalizeSongTitle(songTitle)) ?? false;
  };

  const forcedCountByMember = new Map<string, number>();
  const countForcedAssignment = (
    sessionEventId: string | null,
    participantName: string,
    instrument: string,
    songTitle: string,
  ) => {
    if (!sessionEventId || !participantName) {
      return;
    }

    if (!isForcedAssignment(sessionEventId, participantName, instrument, songTitle)) {
      return;
    }

    const lookupKey = buildRequestLookupKey(sessionEventId, participantName, instrument);
    forcedCountByMember.set(lookupKey, (forcedCountByMember.get(lookupKey) ?? 0) + 1);
  };

  for (const sessionSet of sessionSets) {
    countForcedAssignment(sessionSet.sessionEventId, sessionSet.drum?.name ?? '', 'drum', sessionSet.song.title);
    countForcedAssignment(sessionSet.sessionEventId, sessionSet.bass?.name ?? '', 'bass', sessionSet.song.title);
    countForcedAssignment(sessionSet.sessionEventId, sessionSet.piano?.name ?? '', 'piano', sessionSet.song.title);

    for (const member of sessionSet.members) {
      countForcedAssignment(
        sessionSet.sessionEventId,
        member.participant.name,
        member.role === 'vocal' ? 'vocal' : 'front',
        sessionSet.song.title,
      );
    }
  }

  const getForcedCount = (sessionEventId: string | null, participantName: string, instrument: string) => {
    if (!sessionEventId) {
      return 0;
    }

    return forcedCountByMember.get(buildRequestLookupKey(sessionEventId, participantName, instrument)) ?? 0;
  };

  const subInstrumentByFrontName = new Map(
    frontProfiles.map((profile) => [profile.displayName, profile.subInstrument ?? null]),
  );

  return sessionSets.map((sessionSet) => ({
    id: sessionSet.id,
    sessionEventId: sessionSet.sessionEventId,
    songTitle: sessionSet.song.title,
    setOrder: sessionSet.setOrder,
    isPublished: sessionSet.isPublished,
    key: sessionSet.keyName,
    drum: sessionSet.drum ? {
      id: sessionSet.drum.id,
      name: sessionSet.drum.name,
      isForced: isForcedAssignment(sessionSet.sessionEventId, sessionSet.drum.name, 'drum', sessionSet.song.title),
      forcedCount: getForcedCount(sessionSet.sessionEventId, sessionSet.drum.name, 'drum'),
      requestedInRound1: isRequestedInRound1(sessionSet.sessionEventId, sessionSet.drum.name, 'drum', sessionSet.song.title),
    } : null,
    bass: sessionSet.bass ? {
      id: sessionSet.bass.id,
      name: sessionSet.bass.name,
      isForced: isForcedAssignment(sessionSet.sessionEventId, sessionSet.bass.name, 'bass', sessionSet.song.title),
      forcedCount: getForcedCount(sessionSet.sessionEventId, sessionSet.bass.name, 'bass'),
      requestedInRound1: isRequestedInRound1(sessionSet.sessionEventId, sessionSet.bass.name, 'bass', sessionSet.song.title),
    } : null,
    piano: sessionSet.piano ? {
      id: sessionSet.piano.id,
      name: sessionSet.piano.name,
      isForced: isForcedAssignment(sessionSet.sessionEventId, sessionSet.piano.name, 'piano', sessionSet.song.title),
      forcedCount: getForcedCount(sessionSet.sessionEventId, sessionSet.piano.name, 'piano'),
      requestedInRound1: isRequestedInRound1(sessionSet.sessionEventId, sessionSet.piano.name, 'piano', sessionSet.song.title),
    } : null,
    front: sessionSet.members
      .filter((member) => member.role === 'front')
      .map((member) => ({
        id: member.participant.id,
        name: member.participant.name,
        subInstrument: subInstrumentByFrontName.get(member.participant.name) ?? null,
        isForced: isForcedAssignment(sessionSet.sessionEventId, member.participant.name, 'front', sessionSet.song.title),
        forcedCount: getForcedCount(sessionSet.sessionEventId, member.participant.name, 'front'),
        requestedInRound1: isRequestedInRound1(sessionSet.sessionEventId, member.participant.name, 'front', sessionSet.song.title),
      })),
    vocal: sessionSet.members
      .filter((member) => member.role === 'vocal')
      .map((member) => ({
        id: member.participant.id,
        name: member.participant.name,
        isForced: isForcedAssignment(sessionSet.sessionEventId, member.participant.name, 'vocal', sessionSet.song.title),
        forcedCount: getForcedCount(sessionSet.sessionEventId, member.participant.name, 'vocal'),
        requestedInRound1: isRequestedInRound1(sessionSet.sessionEventId, member.participant.name, 'vocal', sessionSet.song.title),
      })),
  }));
}