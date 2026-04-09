import { Section } from './Section';
import type { Instrument } from './types';

type AuthPortalSectionProps = {
  view: 'signin' | 'signup' | 'admin-signin';
  authTarget: 'member' | 'admin';
  loading: boolean;
  authEmail: string;
  authPassword: string;
  signupDisplayName: string;
  signupInstrument: Instrument;
  resetEmail: string;
  resetToken: string;
  resetPassword: string;
  issuedResetToken: string | null;
  setAuthEmail: (value: string) => void;
  setAuthPassword: (value: string) => void;
  setSignupDisplayName: (value: string) => void;
  setSignupInstrument: (value: Instrument) => void;
  setResetEmail: (value: string) => void;
  setResetToken: (value: string) => void;
  setResetPassword: (value: string) => void;
  onSignIn: () => void;
  onSignUp: () => void;
  onForgotPassword: () => void;
  onResetPassword: () => void;
};

export function AuthPortalSection(props: AuthPortalSectionProps) {
  const {
    view,
    authTarget,
    loading,
    authEmail,
    authPassword,
    signupDisplayName,
    signupInstrument,
    resetEmail,
    resetToken,
    resetPassword,
    issuedResetToken,
    setAuthEmail,
    setAuthPassword,
    setSignupDisplayName,
    setSignupInstrument,
    setResetEmail,
    setResetToken,
    setResetPassword,
    onSignIn,
    onSignUp,
    onForgotPassword,
    onResetPassword,
  } = props;

  return (
    <>
      <Section title={authTarget === 'admin' ? '管理者認証' : 'メンバー認証'}>
        <p style={{ color: '#666' }}>
          {authTarget === 'admin'
            ? '管理者専用サインインです。デモ管理者: admin@adolib-go.local / demo-admin-password'
            : 'メンバー専用サインインです。管理者は /admin/signin からサインインしてください。'}
        </p>
        <div style={{ display: 'grid', gap: '0.75rem', maxWidth: 560 }}>
          <input type="email" placeholder="メールアドレス" value={authEmail} onChange={(event) => setAuthEmail(event.target.value)} />
          <input type="password" placeholder="パスワード" value={authPassword} onChange={(event) => setAuthPassword(event.target.value)} />
          {view === 'signup' && (
            <>
              <input type="text" placeholder="表示名" value={signupDisplayName} onChange={(event) => setSignupDisplayName(event.target.value)} />
              <select value={signupInstrument} onChange={(event) => setSignupInstrument(event.target.value as Instrument)}>
                <option value="drum">drum</option>
                <option value="bass">bass</option>
                <option value="piano">piano</option>
                <option value="front">front</option>
                <option value="vocal">vocal</option>
              </select>
            </>
          )}
          <div>
            <button type="button" onClick={view === 'signup' ? onSignUp : onSignIn} disabled={loading}>
              {view === 'signup' ? 'サインアップ' : 'サインイン'}
            </button>
          </div>
        </div>
      </Section>

      <Section title="パスワード再設定">
        <div style={{ display: 'grid', gap: '0.75rem', maxWidth: 560 }}>
          <input type="email" placeholder="メールアドレス" value={resetEmail} onChange={(event) => setResetEmail(event.target.value)} />
          <div>
            <button type="button" onClick={onForgotPassword} disabled={loading}>再設定トークンを発行</button>
          </div>
          {issuedResetToken && <p style={{ wordBreak: 'break-all', color: '#666' }}>開発用トークン: {issuedResetToken}</p>}
          <input type="text" placeholder="再設定トークン" value={resetToken} onChange={(event) => setResetToken(event.target.value)} />
          <input type="password" placeholder="新しいパスワード" value={resetPassword} onChange={(event) => setResetPassword(event.target.value)} />
          <div>
            <button type="button" onClick={onResetPassword} disabled={loading}>パスワード更新</button>
          </div>
        </div>
      </Section>
    </>
  );
}
