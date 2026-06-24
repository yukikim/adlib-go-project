import { Suspense } from 'react';
import AuthWorkspace from '@/components/portal/AuthWorkspace';

export default function SignUpPage() {
  return (
    <Suspense>
      <AuthWorkspace view="signup" />
    </Suspense>
  );
}
