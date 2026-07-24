"use client";

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AuthPortalSection } from '@/components/portal/AuthPortalSection';
import { useAuthPortal } from '@/components/portal/hooks/useAuthPortal';
import type { AuthUser, PortalView } from '@/components/portal/types';
import { parseJson } from '@/components/portal/utils';

type AuthWorkspaceProps = {
  view: Extract<PortalView, 'signin' | 'signup' | 'admin-signin'>;
};

export default function AuthWorkspace({ view }: AuthWorkspaceProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const signupInvitationToken = searchParams.get('token') ?? '';
  const passwordResetToken = searchParams.get('resetToken') ?? '';
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
    } catch (error: unknown) {
      const nextMessage = error instanceof Error ? error.message : '処理に失敗しました';
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
    initialResetToken: passwordResetToken,
    // defaultAuthTarget: view === 'admin-signin' ? 'admin' : 'member',
    onSignInSuccess: (roleTarget) => {
      if (roleTarget === 'admin') {
        router.push('/admin');
        router.refresh();
        return;
      }
      router.push('/member');
      router.refresh();
    },
  });

  useEffect(() => {
    reloadCurrentUser().catch((error) => {
      console.error(error);
      setMessage('データ取得に失敗しました');
    });
  }, []);

  return (
    <main className="mx-auto flex max-w-4xl min-h-[calc(100svh-96px)] flex-col px-6 py-8 md:px-8 mt-24">
      <Badge variant="outline" className="w-fit">
        Auth
      </Badge>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">
        {view === 'signup'
          ? 'メンバーサインアップ(テスト中)'
          : view === 'admin-signin'
            ? '管理者サインイン(テスト中)'
            : 'メンバーサインイン(テスト中)'}
      </h1>
      {message && (
        <Alert className="brand-success-surface mt-4">
          <AlertTitle>ステータス</AlertTitle>
          <AlertDescription className="text-red-500">{message}</AlertDescription>
        </Alert>
      )}
      {loading && <p className="mt-4 text-sm text-muted-foreground">処理中...</p>}

      <AuthPortalSection
        view={view}
        authTarget={view === 'admin-signin' ? 'admin' : 'member'}
        loading={loading}
        authEmail={auth.authEmail}
        authPassword={auth.authPassword}
        signupPasswordConfirmation={auth.signupPasswordConfirmation}
        signupInvitationToken={signupInvitationToken}
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
        setSignupPasswordConfirmation={auth.setSignupPasswordConfirmation}
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
