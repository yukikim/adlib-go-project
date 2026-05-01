import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { AuthUser, Instrument } from '../types';
import { parseJson, type RunPortalAction } from '../utils';

type UseAuthPortalArgs = {
  runAction: RunPortalAction;
  setCurrentUser: (user: AuthUser | null) => void;
  reloadShared: () => Promise<void>;
  onSignInSuccess?: (roleTarget: 'member' | 'admin') => void;
  defaultAuthTarget?: 'member' | 'admin';
};

export function useAuthPortal({ runAction, setCurrentUser, reloadShared, onSignInSuccess, defaultAuthTarget = 'member' }: UseAuthPortalArgs) {
  const router = useRouter();
  // const defaultAuthEmail = defaultAuthTarget === 'admin' ? 'admin@adlib-go.local' : 'member01@adlib-go.local';
  // const defaultAuthPassword = defaultAuthTarget === 'admin' ? 'demo-admin-password' : 'demo-member-password';
  const defaultAuthEmail = '';
  const defaultAuthPassword = '';

  const [authEmail, setAuthEmail] = useState(defaultAuthEmail);
  const [authPassword, setAuthPassword] = useState(defaultAuthPassword);
  const [signupDisplayName, setSignupDisplayName] = useState('');
  const [signupInstrument, setSignupInstrument] = useState<Instrument>('front');
  const [signupSubInstrument, setSignupSubInstrument] = useState('');
  const [signupGender, setSignupGender] = useState('');
  const [signupAgeRange, setSignupAgeRange] = useState('');
  const [signupArea, setSignupArea] = useState('');
  const [resetEmail, setResetEmail] = useState(defaultAuthEmail);
  const [resetToken, setResetToken] = useState('');
  const [resetPassword, setResetPassword] = useState('');
  const [issuedResetToken, setIssuedResetToken] = useState<string | null>(null);

  useEffect(() => {
    setAuthEmail(defaultAuthEmail);
    setAuthPassword(defaultAuthPassword);
    setResetEmail(defaultAuthEmail);
  }, [defaultAuthEmail, defaultAuthPassword]);

  useEffect(() => {
    if (signupInstrument !== 'front') {
      setSignupSubInstrument('');
    }
  }, [signupInstrument]);

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
    onSignInSuccess?.(roleTarget);
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
        subInstrument: signupInstrument === 'front' ? signupSubInstrument : null,
        gender: signupGender,
        ageRange: signupAgeRange,
        area: signupArea,
      }),
    });
    const json = await parseJson(res);
    if (!res.ok) throw new Error(json.error ?? 'サインアップに失敗しました');
  }, '確認メールを送信しました。メール内のリンクから認証してください。');

  const handleSignOut = async () => runAction(async () => {
    await fetch('/api/auth/signout', { method: 'POST' });
    setCurrentUser(null);
    await reloadShared();
    router.push('/');
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
    signupSubInstrument,
    setSignupSubInstrument,
    signupGender,
    setSignupGender,
    signupAgeRange,
    setSignupAgeRange,
    signupArea,
    setSignupArea,
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