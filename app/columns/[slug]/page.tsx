import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { splitColumnBody } from '@/lib/columns';

export default async function ColumnDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const column = await prisma.column.findFirst({
    where: { slug, isPublished: true },
    select: {
      title: true,
      body: true,
      authorName: true,
      publishedAt: true,
    },
  });

  if (!column) {
    notFound();
  }

  const paragraphs = splitColumnBody(column.body);

  return (
    <main style={{ padding: '2rem', maxWidth: 860, margin: '0 auto' }}>
      <article style={{ padding: '1.5rem', border: '1px solid #ddd', borderRadius: '0.75rem' }}>
        <p style={{ color: '#666' }}>{column.publishedAt ? new Date(column.publishedAt).toLocaleDateString('ja-JP') : '-'} / {column.authorName}</p>
        <h1>{column.title}</h1>
        {paragraphs.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </article>
    </main>
  );
}