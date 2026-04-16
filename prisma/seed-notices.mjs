import './load-env.mjs';
import { PrismaClient } from '@prisma/client';
import { announcements } from './demo-data.mjs';

const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.userAccount.findUniqueOrThrow({
    where: { email: 'admin@adlib-go.local' },
    select: { id: true },
  });

  for (const announcement of announcements) {
    await prisma.announcement.create({
      data: {
        title: announcement.title,
        body: announcement.body,
        isPublished: announcement.isPublished,
        publishedAt: announcement.isPublished ? new Date() : null,
        createdById: admin.id,
      },
    });
  }

  console.log(JSON.stringify({ announcementCount: announcements.length }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });