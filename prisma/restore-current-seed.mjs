import { PrismaClient } from '@prisma/client';
import {
  buildSnapshotCounts,
  readSnapshot,
  resolveSnapshotPath,
  restoreSnapshot,
} from './seed-snapshot-lib.mjs';

const prisma = new PrismaClient();

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const customPath = args.find((arg) => arg !== '--dry-run');
  const snapshotPath = resolveSnapshotPath(customPath);
  const snapshot = await readSnapshot(snapshotPath);

  if (dryRun) {
    console.log(
      JSON.stringify(
        {
          dryRun: true,
          snapshotPath,
          exportedAt: snapshot.exportedAt ?? null,
          counts: buildSnapshotCounts(snapshot),
        },
        null,
        2,
      ),
    );
    return;
  }

  await restoreSnapshot(prisma, snapshot);

  console.log(
    JSON.stringify(
      {
        restored: true,
        snapshotPath,
        exportedAt: snapshot.exportedAt ?? null,
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