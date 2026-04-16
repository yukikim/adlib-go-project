import PortalWorkspace from '@/components/portal/PortalWorkspace';
import { requirePageUser } from '@/lib/pageAuth';
import MainHeader from '@/components/portal/MainHeader';

export default async function AdminPage() {
  await requirePageUser('admin', '/admin/signin');
  return (
    <>
      <MainHeader view="admin" />
      <PortalWorkspace view="admin" />
    </>
  );
}