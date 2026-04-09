import { Section } from './Section';
import type { Instrument } from './types';
import { AGE_RANGE_OPTIONS, GENDER_OPTIONS, PREFECTURE_OPTIONS } from '@/lib/memberProfile';

type AuthPortalSectionProps = {
  view: 'signin' | 'signup' | 'admin-signin';
  authTarget: 'member' | 'admin';
  loading: boolean;
  authEmail: string;
  authPassword: string;
  signupDisplayName: string;
  signupInstrument: Instrument;
  signupSubInstrument: string;
  signupGender: string;
  signupAgeRange: string;
  signupArea: string;
  resetEmail: string;
  resetToken: string;
  resetPassword: string;
  issuedResetToken: string | null;
  setAuthEmail: (value: string) => void;
  setAuthPassword: (value: string) => void;
  setSignupDisplayName: (value: string) => void;
  setSignupInstrument: (value: Instrument) => void;
  setSignupSubInstrument: (value: string) => void;
  setSignupGender: (value: string) => void;
  setSignupAgeRange: (value: string) => void;
  setSignupArea: (value: string) => void;
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
    signupSubInstrument,
    signupGender,
    signupAgeRange,
    signupArea,
    resetEmail,
    resetToken,
    resetPassword,
    issuedResetToken,
    setAuthEmail,
    setAuthPassword,
    setSignupDisplayName,
    setSignupInstrument,
    setSignupSubInstrument,
    setSignupGender,
    setSignupAgeRange,
    setSignupArea,
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
          <label style={{ display: 'grid', gap: '0.35rem' }}>
            <span>メールアドレス</span>
            <input type="email" value={authEmail} onChange={(event) => setAuthEmail(event.target.value)} />
          </label>
          <label style={{ display: 'grid', gap: '0.35rem' }}>
            <span>パスワード</span>
            <input type="password" value={authPassword} onChange={(event) => setAuthPassword(event.target.value)} />
          </label>
          {view === 'signup' && (
            <>
              <label style={{ display: 'grid', gap: '0.35rem' }}>
                <span>表示名</span>
                <input type="text" value={signupDisplayName} onChange={(event) => setSignupDisplayName(event.target.value)} />
              </label>
              <label style={{ display: 'grid', gap: '0.35rem' }}>
                <span>メイン楽器</span>
                <select value={signupInstrument} onChange={(event) => setSignupInstrument(event.target.value as Instrument)}>
                  <option value="drum">drum</option>
                  <option value="bass">bass</option>
                  <option value="piano">piano</option>
                  <option value="front">front</option>
                  <option value="vocal">vocal</option>
                </select>
              </label>
              {signupInstrument === 'front' && (
                <label style={{ display: 'grid', gap: '0.35rem' }}>
                  <span>演奏楽器</span>
                  <input type="text" value={signupSubInstrument} onChange={(event) => setSignupSubInstrument(event.target.value)} />
                </label>
              )}
              <label style={{ display: 'grid', gap: '0.35rem' }}>
                <span>居住地域</span>
                <select value={signupArea} onChange={(event) => setSignupArea(event.target.value)}>
                  <option value="">居住地域を選択</option>
                  {PREFECTURE_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </label>
              <label style={{ display: 'grid', gap: '0.35rem' }}>
                <span>性別</span>
                <select value={signupGender} onChange={(event) => setSignupGender(event.target.value)}>
                  <option value="">性別を選択</option>
                  {GENDER_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </label>
              <label style={{ display: 'grid', gap: '0.35rem' }}>
                <span>年代</span>
                <select value={signupAgeRange} onChange={(event) => setSignupAgeRange(event.target.value)}>
                  <option value="">年代を選択</option>
                  {AGE_RANGE_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </label>
            </>
          )}
          <div>
            <button type="button" onClick={view === 'signup' ? onSignUp : onSignIn} disabled={loading}>
              {view === 'signup' ? 'サインアップ' : 'サインイン'}
            </button>
          </div>
        </div>
      </Section>

      {view !== 'signup' && (
        <Section title="パスワード再設定">
          <div style={{ display: 'grid', gap: '0.75rem', maxWidth: 560 }}>
            <label style={{ display: 'grid', gap: '0.35rem' }}>
              <span>メールアドレス</span>
              <input type="email" value={resetEmail} onChange={(event) => setResetEmail(event.target.value)} />
            </label>
            <div>
              <button type="button" onClick={onForgotPassword} disabled={loading}>再設定トークンを発行</button>
            </div>
            {issuedResetToken && <p style={{ wordBreak: 'break-all', color: '#666' }}>開発用トークン: {issuedResetToken}</p>}
            <label style={{ display: 'grid', gap: '0.35rem' }}>
              <span>再設定トークン</span>
              <input type="text" value={resetToken} onChange={(event) => setResetToken(event.target.value)} />
            </label>
            <label style={{ display: 'grid', gap: '0.35rem' }}>
              <span>新しいパスワード</span>
              <input type="password" value={resetPassword} onChange={(event) => setResetPassword(event.target.value)} />
            </label>
            <div>
              <button type="button" onClick={onResetPassword} disabled={loading}>パスワード更新</button>
            </div>
          </div>
        </Section>
      )}
    </>
  );
}
