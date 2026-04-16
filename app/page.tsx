import { PublicHomePage } from '@/components/public/PublicHomePage';
import MainHeader from '@/components/portal/MainHeader';

export default async function HomePage() {

  return (
    <>
      <MainHeader  view="public" />
      <PublicHomePage />
    </>
  );
}
