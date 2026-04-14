"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthPortalSection } from '@/components/portal/AuthPortalSection';
import { useAuthPortal } from '@/components/portal/hooks/useAuthPortal';
import type { AuthUser, PortalView } from '@/components/portal/types';
import { parseJson } from '@/components/portal/utils';

type AuthWorkspaceProps = {
  view: Extract<PortalView, 'signin' | 'signup' | 'admin-signin'>;
};

export default function AuthWorkspace({ view }: AuthWorkspaceProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [, setCurrentUser] = useState<AuthUser | null>(null);

  const runAction = async (
    action: () => Promise<void>,
    successMessage?: string,
    options?: {
      onSuccess?: (message?: string) => void;
      onError?: (message: string) => void;
      skipGlobalMessage?: boolean;
    },
  ) => {
    setLoading(true);
    if (!options?.skipGlobalMessage) {
      setMessage(null);
    }
    try {
      await action();
      if (successMessage && !options?.skipGlobalMessage) {
        setMessage(successMessage);
      }
      options?.onSuccess?.(successMessage);
    } catch (error: any) {
      const nextMessage = error?.message ?? '処理に失敗しました';
      if (!options?.skipGlobalMessage) {
        setMessage(nextMessage);
      }
      options?.onError?.(nextMessage);
    } finally {
      setLoading(false);
    }
  };

  const reloadCurrentUser = async () => {
    const meRes = await fetch('/api/auth/me');
    const meJson = await parseJson(meRes);
    setCurrentUser(meJson.user ?? null);
  };

  const auth = useAuthPortal({
    runAction,
    setCurrentUser,
    reloadShared: reloadCurrentUser,
    onSignInSuccess: (roleTarget) => {
      if (roleTarget === 'admin') {
        router.push('/admin');
        return;
      }
      router.push('/member');
    },
  });

  useEffect(() => {
    reloadCurrentUser().catch((error) => {
      console.error(error);
      setMessage('データ取得に失敗しました');
    });
  }, []);

  return (
    <main style={{ padding: '2rem', maxWidth: 1000, margin: '0 auto' }}>
      <h1>
        {view === 'signup'
          ? 'メンバーサインアップ'
          : view === 'admin-signin'
            ? '管理者サインイン'
            : 'メンバーサインイン'}
      </h1>
      {message && <p style={{ color: 'darkgreen' }}>{message}</p>}
      {loading && <p style={{ color: '#666' }}>処理中...</p>}

      <AuthPortalSection
        view={view}
        authTarget={view === 'admin-signin' ? 'admin' : 'member'}
        loading={loading}
        authEmail={auth.authEmail}
        authPassword={auth.authPassword}
        signupDisplayName={auth.signupDisplayName}
        signupInstrument={auth.signupInstrument}
        signupSubInstrument={auth.signupSubInstrument}
        signupGender={auth.signupGender}
        signupAgeRange={auth.signupAgeRange}
        signupArea={auth.signupArea}
        resetEmail={auth.resetEmail}
        resetToken={auth.resetToken}
        resetPassword={auth.resetPassword}
        issuedResetToken={auth.issuedResetToken}
        setAuthEmail={auth.setAuthEmail}
        setAuthPassword={auth.setAuthPassword}
        setSignupDisplayName={auth.setSignupDisplayName}
        setSignupInstrument={auth.setSignupInstrument}
        setSignupSubInstrument={auth.setSignupSubInstrument}
        setSignupGender={auth.setSignupGender}
        setSignupAgeRange={auth.setSignupAgeRange}
        setSignupArea={auth.setSignupArea}
        setResetEmail={auth.setResetEmail}
        setResetToken={auth.setResetToken}
        setResetPassword={auth.setResetPassword}
        onSignIn={() => auth.handleSignIn(view === 'admin-signin' ? 'admin' : 'member')}
        onSignUp={auth.handleSignUp}
        onForgotPassword={auth.handleForgotPassword}
        onResetPassword={auth.handleResetPassword}
      />
    </main>
  );
}