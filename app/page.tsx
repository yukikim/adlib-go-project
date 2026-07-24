import { redirect } from 'next/navigation';
import { PublicHomePage } from '@/components/public/PublicHomePage';

type HomePageProps = {
  searchParams: Promise<{
    resetToken?: string | string[];
  }>;
};

export default async function HomePage({ searchParams }: HomePageProps) {
  const { resetToken } = await searchParams;
  const passwordResetToken = Array.isArray(resetToken) ? resetToken[0] : resetToken;

  if (passwordResetToken) {
    redirect(`/signin?resetToken=${encodeURIComponent(passwordResetToken)}#password-reset`);
  }

  return (
    <PublicHomePage />
  );
}
