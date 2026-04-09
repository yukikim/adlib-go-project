import { prisma } from '@/lib/prisma';

export default async function ColumnsPage() {
  const columns = await prisma.column.findMany({
    where: { isPublished: true },
    orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
    select: {
      id: true,
      slug: true,
      title: true,
      summary: true,
      authorName: true,
      publishedAt: true,
    },
  });

  return (
    <main style={{ padding: '2rem', maxWidth: 1000, margin: '0 auto' }}>
      <section style={{ padding: '1.5rem', border: '1px solid #ddd', borderRadius: '0.75rem' }}>
        <h1>コラム一覧</h1>
        <p>運営からの案内やセッション参加のヒントを掲載します。</p>
      </section>
      <div style={{ marginTop: '1.5rem', display: 'grid', gap: '1rem' }}>
        {columns.map((column) => (
          <article key={column.slug} style={{ padding: '1rem', border: '1px solid #ddd', borderRadius: '0.75rem' }}>
            <p style={{ color: '#666', marginBottom: '0.35rem' }}>{column.publishedAt ? new Date(column.publishedAt).toLocaleDateString('ja-JP') : '-'} / {column.authorName}</p>
            <h2 style={{ marginTop: 0 }}>{column.title}</h2>
            <p>{column.summary}</p>
            <a href={`/columns/${column.slug}`}>詳細を見る</a>
          </article>
        ))}
      </div>
    </main>
  );
}