import AuthWorkspace from '@/components/portal/AuthWorkspace';
import MainHeader from '@/components/portal/MainHeader';

export default function SignUpPage() {
  return (
    <>
      <MainHeader view="signup" />
      <AuthWorkspace view="signup" />
    </>
  );
}