import './load-env.mjs';
import { PrismaClient } from '@prisma/client';
import { jazzStandardBible1Titles, jazzStandardBible2Titles } from './black-book-song-catalog.mjs';

const prisma = new PrismaClient();

function normalizeTitle(title) {
  return title.trim().replace(/\s+/g, ' ');
}

function registerTitle(map, title, fieldName) {
  const normalizedTitle = normalizeTitle(title);
  if (!normalizedTitle) {
    return;
  }

  const current = map.get(normalizedTitle) ?? {
    title: normalizedTitle,
    isJazzStandardBible1: false,
    isJazzStandardBible2: false,
  };
  current[fieldName] = true;
  map.set(normalizedTitle, current);
}

async function main() {
  const songsByTitle = new Map();

  for (const title of jazzStandardBible1Titles) {
    registerTitle(songsByTitle, title, 'isJazzStandardBible1');
  }

  for (const title of jazzStandardBible2Titles) {
    registerTitle(songsByTitle, title, 'isJazzStandardBible2');
  }

  let upsertedCount = 0;

  for (const song of songsByTitle.values()) {
    await prisma.song.upsert({
      where: { title: song.title },
      update: {
        ...(song.isJazzStandardBible1 ? { isJazzStandardBible1: true } : {}),
        ...(song.isJazzStandardBible2 ? { isJazzStandardBible2: true } : {}),
      },
      create: song,
    });
    upsertedCount += 1;
  }

  console.log(JSON.stringify({
    volume1Count: jazzStandardBible1Titles.length,
    volume2Count: jazzStandardBible2Titles.length,
    uniqueSongCount: songsByTitle.size,
    upsertedCount,
  }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });