import AuthWorkspace from '@/components/portal/AuthWorkspace';
import MainHeader from '@/components/portal/MainHeader';

export default function AdminSignInPage() {
  return (
    <>
      <MainHeader view="admin-signin" />
      <AuthWorkspace view="admin-signin" />
    </>
  );
}