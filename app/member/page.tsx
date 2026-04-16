import PortalWorkspace from '@/components/portal/PortalWorkspace';
import { requirePageUser } from '@/lib/pageAuth';
import MainHeader from '@/components/portal/MainHeader';

export default async function MemberPage() {
  await requirePageUser('member');
  return (
    <>
      <MainHeader view="member" />
      <PortalWorkspace view="member" />
    </>
  );
}