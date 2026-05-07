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

export async function serializeSessionSets(sessionSets: SessionSetWithRelations[]) {
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
    drum: sessionSet.drum ? { id: sessionSet.drum.id, name: sessionSet.drum.name } : null,
    bass: sessionSet.bass ? { id: sessionSet.bass.id, name: sessionSet.bass.name } : null,
    piano: sessionSet.piano ? { id: sessionSet.piano.id, name: sessionSet.piano.name } : null,
    front: sessionSet.members
      .filter((member) => member.role === 'front')
      .map((member) => ({
        id: member.participant.id,
        name: member.participant.name,
        subInstrument: subInstrumentByFrontName.get(member.participant.name) ?? null,
      })),
    vocal: sessionSet.members
      .filter((member) => member.role === 'vocal')
      .map((member) => ({
        id: member.participant.id,
        name: member.participant.name,
      })),
  }));
}