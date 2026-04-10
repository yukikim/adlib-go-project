import Link from 'next/link';
import { verifyEmailByToken } from '@/lib/auth';

type VerifyEmailPageProps = {
  searchParams: Promise<{ token?: string }>;
};

export default async function VerifyEmailPage({ searchParams }: VerifyEmailPageProps) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <main style={{ padding: '2rem', maxWidth: 720, margin: '0 auto' }}>
        <h1>メール認証</h1>
        <p>認証トークンが見つかりませんでした。</p>
        <p><Link href="/signin">メンバーサインインへ戻る</Link></p>
      </main>
    );
  }

  const user = await verifyEmailByToken(token);

  return (
    <main style={{ padding: '2rem', maxWidth: 720, margin: '0 auto' }}>
      <h1>メール認証</h1>
      {user ? (
        <>
          <p>{user.email} のメール認証が完了しました。</p>
          <p><Link href="/signin">メンバーサインインへ進む</Link></p>
        </>
      ) : (
        <>
          <p>認証リンクが無効か、期限切れです。</p>
          <p><Link href="/signup">メンバーサインアップへ戻る</Link></p>
        </>
      )}
    </main>
  );
}