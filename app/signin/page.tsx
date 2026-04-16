import AuthWorkspace from '@/components/portal/AuthWorkspace';
import MainHeader from '@/components/portal/MainHeader';

export default function SignInPage() {
  return (
    <>
      <MainHeader view="signin" />
      <AuthWorkspace view="signin" />
    </>
  );
}