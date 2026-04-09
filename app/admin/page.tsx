import PortalWorkspace from '@/components/portal/PortalWorkspace';
import { requirePageUser } from '@/lib/pageAuth';

export default async function AdminPage() {
  await requirePageUser('admin', '/admin/signin');
  return <PortalWorkspace view="admin" />;
}