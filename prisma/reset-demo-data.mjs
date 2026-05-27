import './load-env.mjs';
import { PrismaClient } from '@prisma/client';
import { clearSeedTables } from './seed-snapshot-lib.mjs';

const prisma = new PrismaClient();

async function main() {
  await clearSeedTables(prisma);

  console.log(JSON.stringify({ reset: true }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });