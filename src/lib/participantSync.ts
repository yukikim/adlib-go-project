import { Prisma, type Instrument, type Participant } from '@prisma/client';

type ParticipantSyncTx = Prisma.TransactionClient;

type SyncParticipantInput = {
  previousDisplayName?: string | null;
  previousMainInstrument?: Instrument | null;
  nextDisplayName: string;
  nextMainInstrument: Instrument;
};

async function findParticipantByIdentity(
  tx: ParticipantSyncTx,
  name: string,
  instrument: Instrument,
) {
  return tx.participant.findFirst({
    where: { name, instrument },
    orderBy: { id: 'asc' },
  });
}

async function mergeParticipantReferences(
  tx: ParticipantSyncTx,
  sourceParticipantId: string,
  targetParticipantId: string,
) {
  if (sourceParticipantId === targetParticipantId) {
    return;
  }

  const [sourceRequests, targetRequests, sourceSessionMembers, targetSessionMembers] = await Promise.all([
    tx.participantSongRequest.findMany({
      where: { participantId: sourceParticipantId },
      select: { songId: true },
    }),
    tx.participantSongRequest.findMany({
      where: { participantId: targetParticipantId },
      select: { songId: true },
    }),
    tx.sessionSetMember.findMany({
      where: { participantId: sourceParticipantId },
      select: { id: true, sessionSetId: true, role: true },
    }),
    tx.sessionSetMember.findMany({
      where: { participantId: targetParticipantId },
      select: { sessionSetId: true, role: true },
    }),
  ]);

  const duplicateSourceSongIds = sourceRequests
    .filter((request) => targetRequests.some((targetRequest) => targetRequest.songId === request.songId))
    .map((request) => request.songId);

  if (duplicateSourceSongIds.length > 0) {
    await tx.participantSongRequest.deleteMany({
      where: {
        participantId: sourceParticipantId,
        songId: { in: duplicateSourceSongIds },
      },
    });
  }

  const targetSessionMemberKeys = new Set(
    targetSessionMembers.map((member) => `${member.sessionSetId}::${member.role}`),
  );
  const duplicateSourceSessionMemberIds = sourceSessionMembers
    .filter((member) => targetSessionMemberKeys.has(`${member.sessionSetId}::${member.role}`))
    .map((member) => member.id);

  if (duplicateSourceSessionMemberIds.length > 0) {
    await tx.sessionSetMember.deleteMany({
      where: { id: { in: duplicateSourceSessionMemberIds } },
    });
  }

  await Promise.all([
    tx.participantSongRequest.updateMany({
      where: { participantId: sourceParticipantId },
      data: { participantId: targetParticipantId },
    }),
    tx.sessionSetMember.updateMany({
      where: { participantId: sourceParticipantId },
      data: { participantId: targetParticipantId },
    }),
    tx.sessionSet.updateMany({
      where: { drumId: sourceParticipantId },
      data: { drumId: targetParticipantId },
    }),
    tx.sessionSet.updateMany({
      where: { bassId: sourceParticipantId },
      data: { bassId: targetParticipantId },
    }),
    tx.sessionSet.updateMany({
      where: { pianoId: sourceParticipantId },
      data: { pianoId: targetParticipantId },
    }),
  ]);

  await tx.participant.delete({ where: { id: sourceParticipantId } });
}

export async function syncParticipantForMemberProfile(
  tx: ParticipantSyncTx,
  input: SyncParticipantInput,
): Promise<Participant> {
  const previousDisplayName = input.previousDisplayName?.trim();
  const currentParticipant = previousDisplayName && input.previousMainInstrument
    ? await findParticipantByIdentity(tx, previousDisplayName, input.previousMainInstrument)
    : null;

  const targetParticipant = await findParticipantByIdentity(
    tx,
    input.nextDisplayName,
    input.nextMainInstrument,
  );

  if (currentParticipant && targetParticipant && currentParticipant.id !== targetParticipant.id) {
    await mergeParticipantReferences(tx, currentParticipant.id, targetParticipant.id);
    return targetParticipant;
  }

  if (currentParticipant) {
    if (
      currentParticipant.name !== input.nextDisplayName
      || currentParticipant.instrument !== input.nextMainInstrument
    ) {
      return tx.participant.update({
        where: { id: currentParticipant.id },
        data: {
          name: input.nextDisplayName,
          instrument: input.nextMainInstrument,
        },
      });
    }

    return currentParticipant;
  }

  if (targetParticipant) {
    return targetParticipant;
  }

  return tx.participant.create({
    data: {
      name: input.nextDisplayName,
      instrument: input.nextMainInstrument,
    },
  });
}