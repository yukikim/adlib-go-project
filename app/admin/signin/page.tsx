import { Suspense } from 'react';
import AuthWorkspace from '@/components/portal/AuthWorkspace';

export default function AdminSignInPage() {
  return (
    <Suspense>
      <AuthWorkspace view="admin-signin" />
    </Suspense>
  );
}
