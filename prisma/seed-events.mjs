import './load-env.mjs';
import { PrismaClient } from '@prisma/client';
import { demoSessionEvent } from './demo-data.mjs';

const prisma = new PrismaClient();

function chooseParticipantsForSong(requestsBySong, participantsByInstrument, songId, instrument) {
  const songRequests = requestsBySong.get(songId) ?? [];
  const matching = songRequests.filter((request) => request.participant.instrument === instrument);

  if (matching.length > 0) {
    return matching.map((request) => request.participant);
  }

  return participantsByInstrument.get(instrument) ?? [];
}

async function main() {
  const event = await prisma.sessionEvent.create({
    data: {
      title: demoSessionEvent.title,
      description: demoSessionEvent.description,
      venue: demoSessionEvent.venue,
      eventDate: new Date(demoSessionEvent.eventDate),
      startTime: new Date(demoSessionEvent.startTime),
      endTime: new Date(demoSessionEvent.endTime),
      round1StartAt: new Date(demoSessionEvent.round1StartAt),
      round1EndAt: new Date(demoSessionEvent.round1EndAt),
      round2StartAt: new Date(demoSessionEvent.round2StartAt),
      round2EndAt: new Date(demoSessionEvent.round2EndAt),
      status: 'published',
    },
  });

  const participants = await prisma.participant.findMany({
    orderBy: [{ instrument: 'asc' }, { name: 'asc' }],
    select: { id: true, name: true, instrument: true },
  });
  const memberProfiles = await prisma.memberProfile.findMany({
    include: { userAccount: { select: { email: true } } },
    orderBy: { displayName: 'asc' },
  });
  const songs = await prisma.song.findMany({
    orderBy: { title: 'asc' },
    select: { id: true, title: true },
  });
  const requests = await prisma.participantSongRequest.findMany({
    include: {
      participant: { select: { id: true, name: true, instrument: true } },
      song: { select: { id: true, title: true } },
    },
    orderBy: [{ round: 'asc' }, { song: { title: 'asc' } }, { participant: { name: 'asc' } }],
  });

  const memberByName = new Map(memberProfiles.map((profile) => [profile.displayName, profile]));

  for (const participant of participants) {
    const memberProfile = memberByName.get(participant.name);
    if (!memberProfile) {
      continue;
    }

    const entry = await prisma.sessionEntry.create({
      data: {
        sessionEventId: event.id,
        memberProfileId: memberProfile.id,
        attendanceStatus: 'attending',
      },
    });

    const participantRequests = requests.filter((request) => request.participantId === participant.id);
    const roundCounters = new Map();

    for (const request of participantRequests) {
      const current = roundCounters.get(request.round) ?? 0;
      const priority = current + 1;
      roundCounters.set(request.round, priority);

      await prisma.sessionEntryRequest.create({
        data: {
          sessionEntryId: entry.id,
          songId: request.songId,
          songTitleSnapshot: request.song.title,
          keyName: request.keyName,
          round: request.round,
          priority,
        },
      });
    }
  }

  const requestsBySong = new Map();
  for (const request of requests) {
    const current = requestsBySong.get(request.songId) ?? [];
    current.push(request);
    requestsBySong.set(request.songId, current);
  }

  const participantsByInstrument = new Map();
  for (const participant of participants) {
    const current = participantsByInstrument.get(participant.instrument) ?? [];
    current.push(participant);
    participantsByInstrument.set(participant.instrument, current);
  }

  let setOrder = 1;

  for (const song of songs) {
    const drumCandidates = chooseParticipantsForSong(requestsBySong, participantsByInstrument, song.id, 'drum');
    const bassCandidates = chooseParticipantsForSong(requestsBySong, participantsByInstrument, song.id, 'bass');
    const pianoCandidates = chooseParticipantsForSong(requestsBySong, participantsByInstrument, song.id, 'piano');
    const frontCandidates = chooseParticipantsForSong(requestsBySong, participantsByInstrument, song.id, 'front');
    const vocalCandidates = chooseParticipantsForSong(requestsBySong, participantsByInstrument, song.id, 'vocal');

    const vocalParticipant = vocalCandidates[0] ?? null;
    const frontLimit = vocalParticipant ? 1 : 2;
    const frontParticipants = frontCandidates.slice(0, frontLimit);
    const vocalKey = (requestsBySong.get(song.id) ?? []).find((request) => request.participant.instrument === 'vocal')?.keyName ?? null;

    const sessionSet = await prisma.sessionSet.create({
      data: {
        sessionEventId: event.id,
        title: song.title,
        songId: song.id,
        setOrder,
        isPublished: true,
        drumId: drumCandidates[0]?.id ?? null,
        bassId: bassCandidates[0]?.id ?? null,
        pianoId: pianoCandidates[0]?.id ?? null,
        keyName: vocalKey,
      },
    });

    for (const participant of frontParticipants) {
      await prisma.sessionSetMember.create({
        data: {
          sessionSetId: sessionSet.id,
          participantId: participant.id,
          role: 'front',
        },
      });
    }

    if (vocalParticipant) {
      await prisma.sessionSetMember.create({
        data: {
          sessionSetId: sessionSet.id,
          participantId: vocalParticipant.id,
          role: 'vocal',
        },
      });
    }

    setOrder += 1;
  }

  const summary = {
    eventId: event.id,
    entryCount: await prisma.sessionEntry.count({ where: { sessionEventId: event.id } }),
    requestCount: await prisma.sessionEntryRequest.count({ where: { sessionEntry: { sessionEventId: event.id } } }),
    sessionSetCount: await prisma.sessionSet.count({ where: { sessionEventId: event.id } }),
  };

  console.log(JSON.stringify(summary, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });