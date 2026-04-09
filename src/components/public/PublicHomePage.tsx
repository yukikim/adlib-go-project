import { prisma } from '@/lib/prisma';

export async function PublicHomePage() {
  const upcomingEvent = await prisma.sessionEvent.findFirst({
    where: {
      eventDate: {
        gte: new Date(),
      },
    },
    orderBy: [{ eventDate: 'asc' }],
  });
  const columns = await prisma.column.findMany({
    where: { isPublished: true },
    orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
    take: 3,
    select: {
      slug: true,
      title: true,
      summary: true,
      thumbnailLabel: true,
      publishedAt: true,
    },
  });

  return (
    <main style={{ padding: '2rem', maxWidth: 1000, margin: '0 auto' }}>
      <section style={{ padding: '1.5rem', border: '1px solid #ddd', borderRadius: '0.75rem' }}>
        <p style={{ color: '#666', marginBottom: '0.5rem' }}>Adolib-go KICK-OFF</p>
        <h1 style={{ marginTop: 0 }}>公開ページ、メンバーサイト、管理サイトを分けた入口</h1>
        <p>
          セッション告知、参加登録、sessionSet 公開、レイティング、アーカイブ管理までを一貫して扱うためのポータルです。
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '1rem' }}>
          <a href="/signin">サインイン</a>
          <a href="/signup">サインアップ</a>
          <a href="/columns">コラム一覧</a>
          <a href="/about">adolib-go について</a>
        </div>
      </section>

      <section style={{ marginTop: '1.5rem', padding: '1.5rem', border: '1px solid #ddd', borderRadius: '0.75rem' }}>
        <h2>セッション告知</h2>
        {upcomingEvent ? (
          <div>
            <p style={{ color: '#666' }}>{new Date(upcomingEvent.eventDate).toLocaleDateString('ja-JP')} / {upcomingEvent.venue}</p>
            <h3 style={{ marginBottom: '0.5rem' }}>{upcomingEvent.title}</h3>
            <p>{upcomingEvent.description || '次回セッションの募集情報はメンバー画面から確認できます。'}</p>
          </div>
        ) : (
          <p>現在、公開中の開催告知はありません。</p>
        )}
      </section>

      <section style={{ marginTop: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <h2 style={{ margin: 0 }}>コラム</h2>
          <a href="/columns">一覧を見る</a>
        </div>
        <div style={{ marginTop: '1rem', display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
          {columns.map((column) => (
            <article key={column.slug} style={{ padding: '1rem', border: '1px solid #ddd', borderRadius: '0.75rem' }}>
              <div style={{ color: '#666', fontSize: '0.9rem' }}>{column.thumbnailLabel || 'Column'}</div>
              <h3>{column.title}</h3>
              <p style={{ color: '#666' }}>{column.publishedAt ? new Date(column.publishedAt).toLocaleDateString('ja-JP') : '-'}</p>
              <p>{column.summary}</p>
              <a href={`/columns/${column.slug}`}>続きを読む</a>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}