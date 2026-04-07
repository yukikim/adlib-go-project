import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const participants = [
  { name: '佐藤 匠', instrument: 'drum' },
  { name: '田中 恒一', instrument: 'drum' },
  { name: '森 悠太', instrument: 'drum' },
  { name: '藤田 直樹', instrument: 'drum' },
  { name: '西田 亮', instrument: 'drum' },
  { name: '新井 大地', instrument: 'bass' },
  { name: '近藤 陽翔', instrument: 'bass' },
  { name: '石井 健太', instrument: 'bass' },
  { name: '上田 蒼真', instrument: 'bass' },
  { name: '岡田 蓮', instrument: 'bass' },
  { name: '山本 俊', instrument: 'piano' },
  { name: '原 翼', instrument: 'piano' },
  { name: '酒井 優希', instrument: 'piano' },
  { name: '三浦 隼人', instrument: 'piano' },
  { name: '久米 聡', instrument: 'piano' },
  { name: '松田 玲', instrument: 'piano' },
  { name: '木村 葵', instrument: 'front' },
  { name: '鈴木 陽向', instrument: 'front' },
  { name: '小林 湊', instrument: 'front' },
  { name: '井上 恒一', instrument: 'front' },
  { name: '中村 樹', instrument: 'front' },
  { name: '清水 悠成', instrument: 'front' },
  { name: '林 陸', instrument: 'front' },
  { name: '中野 星那', instrument: 'front' },
  { name: '山田 陽', instrument: 'front' },
  { name: '渡辺 莉央', instrument: 'front' },
  { name: '森田 朝陽', instrument: 'front' },
  { name: '加藤 美優', instrument: 'vocal' },
  { name: '杉山 莉奈', instrument: 'vocal' },
  { name: '高橋 希空', instrument: 'vocal' },
];

async function main() {
  let createdCount = 0;

  for (const participant of participants) {
    const existing = await prisma.participant.findFirst({
      where: {
        name: participant.name,
        instrument: participant.instrument,
      },
      select: { id: true },
    });

    if (existing) {
      continue;
    }

    await prisma.participant.create({ data: participant });
    createdCount += 1;
  }

  const summary = await prisma.participant.groupBy({
    by: ['instrument'],
    _count: { _all: true },
    orderBy: { instrument: 'asc' },
  });

  console.log(JSON.stringify({ createdCount, summary }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });