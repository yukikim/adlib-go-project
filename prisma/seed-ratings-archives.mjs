import './load-env.mjs';
import { PrismaClient } from '@prisma/client';
import { archiveSeed, demoSessionEvent, ratingComments } from './demo-data.mjs';

const prisma = new PrismaClient();

function buildDistribution(ratings) {
  const base = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const rating of ratings) {
    base[rating] += 1;
  }
  return base;
}

async function main() {
  const event = await prisma.sessionEvent.findFirstOrThrow({
    where: { title: demoSessionEvent.title },
    select: { id: true, eventDate: true, venue: true, title: true },
  });

  const admin = await prisma.userAccount.findUniqueOrThrow({
    where: { email: 'admin@adlib-go.local' },
    select: { id: true },
  });

  const memberUsers = await prisma.userAccount.findMany({
    where: { role: 'member', status: 'active' },
    orderBy: { email: 'asc' },
    select: { id: true, email: true },
  });
  const sessionSets = await prisma.sessionSet.findMany({
    where: { sessionEventId: event.id },
    include: {
      drum: true,
      bass: true,
      piano: true,
      members: { include: { participant: true } },
    },
    orderBy: [{ setOrder: 'asc' }, { title: 'asc' }],
  });
  const attendingEntries = await prisma.sessionEntry.findMany({
    where: {
      sessionEventId: event.id,
      attendanceStatus: 'attending',
    },
    include: { memberProfile: true },
    orderBy: { memberProfile: { displayName: 'asc' } },
  });

  for (const [setIndex, sessionSet] of sessionSets.entries()) {
    const raters = memberUsers.slice(setIndex % 5, (setIndex % 5) + 5);

    for (const [userIndex, user] of raters.entries()) {
      const rating = 3 + ((setIndex + userIndex) % 3);

      await prisma.sessionSetRating.upsert({
        where: {
          sessionSetId_userAccountId: {
            sessionSetId: sessionSet.id,
            userAccountId: user.id,
          },
        },
        update: {
          rating,
          comment: ratingComments[(setIndex + userIndex) % ratingComments.length],
          sessionEventId: event.id,
        },
        create: {
          sessionEventId: event.id,
          sessionSetId: sessionSet.id,
          userAccountId: user.id,
          rating,
          comment: ratingComments[(setIndex + userIndex) % ratingComments.length],
        },
      });
    }
  }

  const archive = await prisma.sessionArchive.create({
    data: {
      sessionEventId: event.id,
      version: 1,
      title: archiveSeed.title,
      eventDate: event.eventDate,
      venue: event.venue,
      participantCount: attendingEntries.length,
      note: archiveSeed.note,
      createdById: admin.id,
    },
  });

  for (const entry of attendingEntries) {
    await prisma.sessionArchiveParticipant.create({
      data: {
        sessionArchiveId: archive.id,
        displayName: entry.memberProfile.displayName,
        mainInstrument: entry.memberProfile.mainInstrument,
      },
    });
  }

  for (const sessionSet of sessionSets) {
    const setRatings = await prisma.sessionSetRating.findMany({
      where: { sessionSetId: sessionSet.id },
      select: { rating: true },
    });

    const archiveSet = await prisma.sessionArchiveSet.create({
      data: {
        sessionArchiveId: archive.id,
        songTitle: sessionSet.title,
        setOrder: sessionSet.setOrder,
        drumName: sessionSet.drum?.name ?? null,
        bassName: sessionSet.bass?.name ?? null,
        pianoName: sessionSet.piano?.name ?? null,
        frontSnapshot: sessionSet.members
          .filter((member) => member.role === 'front')
          .map((member) => member.participant.name),
        vocalSnapshot: sessionSet.members
          .filter((member) => member.role === 'vocal')
          .map((member) => member.participant.name),
        keyName: sessionSet.keyName,
      },
    });

    const values = setRatings.map((entry) => entry.rating);
    const ratingCount = values.length;
    const averageRating = ratingCount === 0 ? null : values.reduce((sum, value) => sum + value, 0) / ratingCount;

    await prisma.sessionArchiveRatingSummary.create({
      data: {
        sessionArchiveSetId: archiveSet.id,
        ratingCount,
        averageRating,
        minRating: ratingCount === 0 ? null : Math.min(...values),
        maxRating: ratingCount === 0 ? null : Math.max(...values),
        distributionJson: buildDistribution(values),
      },
    });
  }

  await prisma.adminAuditLog.create({
    data: {
      action: 'archive_created',
      targetType: 'SessionArchive',
      targetId: archive.id,
      summary: 'Demo archive created by seed',
      payload: {
        sessionEventId: event.id,
        version: archive.version,
        title: archive.title,
      },
      performedById: admin.id,
      sessionArchiveId: archive.id,
    },
  });

  console.log(
    JSON.stringify(
      {
        sessionEventId: event.id,
        ratingCount: await prisma.sessionSetRating.count({ where: { sessionEventId: event.id } }),
        archiveId: archive.id,
        archiveSetCount: await prisma.sessionArchiveSet.count({ where: { sessionArchiveId: archive.id } }),
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
