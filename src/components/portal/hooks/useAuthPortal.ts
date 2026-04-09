import { useState } from 'react';
import type { AuthUser, Instrument } from '../types';
import { parseJson, type RunPortalAction } from '../utils';

type UseAuthPortalArgs = {
  runAction: RunPortalAction;
  setCurrentUser: (user: AuthUser | null) => void;
  reloadShared: () => Promise<void>;
};

export function useAuthPortal({ runAction, setCurrentUser, reloadShared }: UseAuthPortalArgs) {
  const [authEmail, setAuthEmail] = useState('admin@adolib-go.local');
  const [authPassword, setAuthPassword] = useState('demo-admin-password');
  const [signupDisplayName, setSignupDisplayName] = useState('');
  const [signupInstrument, setSignupInstrument] = useState<Instrument>('front');
  const [resetEmail, setResetEmail] = useState('admin@adolib-go.local');
  const [resetToken, setResetToken] = useState('');
  const [resetPassword, setResetPassword] = useState('');
  const [issuedResetToken, setIssuedResetToken] = useState<string | null>(null);

  const handleSignIn = async (roleTarget: 'member' | 'admin') => runAction(async () => {
    const res = await fetch('/api/auth/signin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: authEmail, password: authPassword, roleTarget }),
    });
    const json = await parseJson(res);
    if (!res.ok) throw new Error(json.error ?? 'サインインに失敗しました');
    setCurrentUser(json.user ?? null);
    await reloadShared();
  }, 'サインインしました');

  const handleSignUp = async () => runAction(async () => {
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: authEmail,
        password: authPassword,
        displayName: signupDisplayName,
        mainInstrument: signupInstrument,
      }),
    });
    const json = await parseJson(res);
    if (!res.ok) throw new Error(json.error ?? 'サインアップに失敗しました');
    setCurrentUser(json.user ?? null);
    await reloadShared();
  }, 'サインアップしました');

  const handleSignOut = async () => runAction(async () => {
    await fetch('/api/auth/signout', { method: 'POST' });
    setCurrentUser(null);
    await reloadShared();
  }, 'サインアウトしました');

  const handleForgotPassword = async () => runAction(async () => {
    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: resetEmail }),
    });
    const json = await parseJson(res);
    if (!res.ok) throw new Error(json.error ?? '再設定トークン発行に失敗しました');
    setIssuedResetToken(json.resetToken ?? null);
    setResetToken(json.resetToken ?? '');
  }, '再設定トークンを発行しました');

  const handleResetPassword = async () => runAction(async () => {
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: resetToken, password: resetPassword }),
    });
    const json = await parseJson(res);
    if (!res.ok) throw new Error(json.error ?? 'パスワード更新に失敗しました');
    setResetToken('');
    setResetPassword('');
  }, 'パスワードを更新しました');

  return {
    authEmail,
    setAuthEmail,
    authPassword,
    setAuthPassword,
    signupDisplayName,
    setSignupDisplayName,
    signupInstrument,
    setSignupInstrument,
    resetEmail,
    setResetEmail,
    resetToken,
    setResetToken,
    resetPassword,
    setResetPassword,
    issuedResetToken,
    handleSignIn,
    handleSignUp,
    handleSignOut,
    handleForgotPassword,
    handleResetPassword,
  };
}