import { Suspense } from 'react';
import AuthWorkspace from '@/components/portal/AuthWorkspace';

export default function SignInPage() {
  return (
    <Suspense>
      <AuthWorkspace view="signin" />
    </Suspense>
  );
}
