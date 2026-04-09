import { PrismaClient } from '@prisma/client';
import { columnSeedEntries } from './demo-data.mjs';

const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.userAccount.findUniqueOrThrow({
    where: { email: 'admin@adolib-go.local' },
    select: { id: true },
  });

  for (const column of columnSeedEntries) {
    await prisma.column.create({
      data: {
        slug: column.slug,
        title: column.title,
        summary: column.summary,
        body: column.body.join('\n\n'),
        thumbnailLabel: column.thumbnailLabel,
        authorName: column.authorName,
        displayOrder: column.displayOrder ?? 0,
        isPublished: column.isPublished,
        publishedAt: column.publishedAt ? new Date(column.publishedAt) : null,
        createdById: admin.id,
      },
    });
  }

  console.log(JSON.stringify({ columnCount: columnSeedEntries.length }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });