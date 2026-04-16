export const participants = [
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

export const songTitles = [
  'Autumn Leaves',
  'Blue Bossa',
  'All The Things You Are',
  'Stella By Starlight',
  'There Will Never Be Another You',
  'On Green Dolphin Street',
  'Take The A Train',
  'Misty',
  'Satin Doll',
  'My Funny Valentine',
  'Fly Me To The Moon',
  'Days Of Wine And Roses',
  'Solar',
  'Softly, As In A Morning Sunrise',
  'Just Friends',
  'There Is No Greater Love',
  'Someday My Prince Will Come',
  'How High The Moon',
  'Beautiful Love',
  'Night And Day',
];

export const vocalKeys = ['C', 'Eb', 'F', 'G', 'Bb', 'D'];

export const adminSeedUsers = [
  {
    email: 'admin@adlib-go.local',
    passwordHash: 'demo-admin-password',
    displayName: '運営 管理者',
  },
];

export const demoSessionEvent = {
  title: '2026年5月 KICK-OFF セッション',
  description: 'KICK-OFF 向けの検証用デモセッションです。',
  venue: '渋谷 Jazz Spot',
  eventDate: '2026-05-17T00:00:00.000Z',
  startTime: '2026-05-17T13:00:00.000Z',
  endTime: '2026-05-17T18:00:00.000Z',
  round1StartAt: '2026-04-20T00:00:00.000Z',
  round1EndAt: '2026-04-27T14:59:59.000Z',
  round2StartAt: '2026-04-28T00:00:00.000Z',
  round2EndAt: '2026-05-03T14:59:59.000Z',
};

export const archiveSeed = {
  title: '2026年5月 KICK-OFF セッション アーカイブ',
  note: 'デモ用に保存した sessionSet スナップショットです。',
};

export const ratingComments = [
  'まとまりが良かったです',
  'アンサンブルが安定していました',
  'ソロ回しが自然でした',
  '雰囲気がとても良かったです',
  'またこの編成で聴きたいです',
];

export const announcements = [
  {
    title: '5月セッション募集開始',
    body: 'Round 1 の希望曲登録を開始しました。期限内の入力をお願いします。',
    isPublished: true,
  },
  {
    title: '当日の集合案内',
    body: '開場は 12:30、集合は 12:45 です。譜面と必要機材を忘れずに持参してください。',
    isPublished: true,
  },
];

export const columnSeedEntries = [
  {
    slug: 'kickoff-guide',
    title: 'KICK-OFF セッションの歩き方',
    summary: '初参加メンバー向けに、当日までの流れと準備物を整理しました。',
    authorName: 'Adlib-go 運営',
    thumbnailLabel: 'Guide',
    displayOrder: 10,
    isPublished: true,
    publishedAt: '2026-04-09T00:00:00.000Z',
    body: [
      'Adlib-go KICK-OFF では、Round 1 と Round 2 のエントリーを通じて sessionSet を編成します。まずは募集期間中に参加可否と希望曲を登録してください。',
      'vocal パートは key 指定が重要です。エントリー時に必ず入力してください。front 楽器は vocal 参加時に人数制限があるため、公開された sessionSet を確認しながら当日の準備を進めます。',
      '当日は譜面、必要機材、連絡可能な端末を持参し、公開済み sessionSet に対して演奏後のレイティングも入力してください。',
    ],
  },
  {
    slug: 'session-request-tips',
    title: '希望曲登録のコツ',
    summary: 'sessionSet に採用されやすい登録の考え方を運営視点でまとめています。',
    authorName: 'Adlib-go 運営',
    thumbnailLabel: 'Tips',
    displayOrder: 20,
    isPublished: true,
    publishedAt: '2026-04-08T00:00:00.000Z',
    body: [
      'Round 1 では、drum、bass、piano の希望者が揃いやすい曲を選ぶと生成対象になりやすくなります。',
      '既に人気が集中している曲でも、key や編成の相性が良ければ採用される可能性があります。vocal の場合は key 指定を忘れないでください。',
      '未生成曲の理由は管理画面で可視化されているため、次回以降は不足しやすいパートを意識して選曲すると全体の成立率が上がります。',
    ],
  },
  {
    slug: 'rating-and-archive',
    title: 'レイティングとアーカイブの見方',
    summary: '演奏後のレイティング入力と、アーカイブ保存の目的を説明します。',
    authorName: 'Adlib-go 運営',
    thumbnailLabel: 'Archive',
    displayOrder: 30,
    isPublished: true,
    publishedAt: '2026-04-07T00:00:00.000Z',
    body: [
      '公開済み sessionSet はメンバーが星 1 から 5 で評価できます。コメントも残せるため、次回編成の参考情報として活用されます。',
      '管理者は集計結果を確認し、任意のタイミングでアーカイブを作成します。アーカイブにはセット情報とレイティング集計が保存されます。',
      'アーカイブは削除可能ですが、運営上重要なスナップショットとして扱う前提です。削除時は監査ログとの整合に注意してください。',
    ],
  },
  {
    slug: 'next-month-preview',
    title: '次回 KICK-OFF の準備メモ',
    summary: '次回募集開始に合わせて公開される予定の案内記事です。',
    authorName: 'Adlib-go 運営',
    thumbnailLabel: 'Preview',
    displayOrder: 40,
    isPublished: true,
    publishedAt: '2026-04-20T00:00:00.000Z',
    body: [
      'このコラムは予約公開サンプルです。公開日時までは public 側に表示されません。',
      '管理ダッシュボードでは公開日時と表示順を指定しながらプレビュー確認できます。',
    ],
  },
];