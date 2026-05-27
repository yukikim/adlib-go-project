import { PrismaClient } from '@prisma/client';
import {
  buildSnapshotCounts,
  exportSnapshot,
  resolveSnapshotPath,
} from './seed-snapshot-lib.mjs';

const prisma = new PrismaClient();

async function main() {
  const snapshotPath = resolveSnapshotPath(process.argv[2]);
  const snapshot = await exportSnapshot(prisma, snapshotPath);

  console.log(
    JSON.stringify(
      {
        saved: true,
        snapshotPath,
        exportedAt: snapshot.exportedAt,
        counts: buildSnapshotCounts(snapshot),
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