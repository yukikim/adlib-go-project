import PortalWorkspace from '@/components/portal/PortalWorkspace';
import { requirePageUser } from '@/lib/pageAuth';

export default async function MemberPage() {
  await requirePageUser('member');
  return <PortalWorkspace view="member" />;
}