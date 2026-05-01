import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Section } from './Section';
import type { Instrument } from './types';
import { AGE_RANGE_OPTIONS, GENDER_OPTIONS, PREFECTURE_OPTIONS } from '@/lib/memberProfile';

const NONE_VALUE = '__none__';

type FieldProps = {
  htmlFor?: string;
  label: string;
  children: React.ReactNode;
  description?: string;
  className?: string;
};

function Field({ htmlFor, label, children, description, className }: FieldProps) {
  return (
    <div className={className ?? 'grid gap-2'}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
    </div>
  );
}

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

  const handleAuthSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading) {
      return;
    }

    if (view === 'signup') {
      onSignUp();
      return;
    }

    onSignIn();
  };

  const handleForgotPasswordSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading) {
      return;
    }

    onForgotPassword();
  };

  const handleResetPasswordSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading) {
      return;
    }

    onResetPassword();
  };

  return (
    <>
      <Section
        title={authTarget === 'admin' ? '管理者認証' : 'メンバー認証'}
        description={authTarget === 'admin'
          ? '管理者専用サインインです。デモ管理者: admin@adlib-go.local / demo-admin-password'
          : 'メンバー専用サインインです。デモメンバー: member01@adlib-go.local / demo-member-password。管理者は /admin/signin を利用してください。'}
      >
        <form className="grid max-w-2xl gap-4 md:grid-cols-2" onSubmit={handleAuthSubmit}>
          <Field htmlFor="auth-email" label="メールアドレス" className="md:col-span-2">
            <Input id="auth-email" type="email" autoComplete="username" value={authEmail} onChange={(event) => setAuthEmail(event.target.value)} />
          </Field>
          <Field htmlFor="auth-password" label="パスワード" className="md:col-span-2">
            <Input id="auth-password" type="password" autoComplete="current-password" value={authPassword} onChange={(event) => setAuthPassword(event.target.value)} />
          </Field>
          {view === 'signup' && (
            <>
              <Field htmlFor="signup-display-name" label="表示名" className="md:col-span-2">
                <Input id="signup-display-name" type="text" value={signupDisplayName} onChange={(event) => setSignupDisplayName(event.target.value)} />
              </Field>
              <Field label="メイン楽器" htmlFor="signup-instrument">
                <Select value={signupInstrument} onValueChange={(value) => setSignupInstrument(value as Instrument)}>
                  <SelectTrigger id="signup-instrument" className="w-full">
                    <SelectValue placeholder="メイン楽器を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="drum">drum</SelectItem>
                    <SelectItem value="bass">bass</SelectItem>
                    <SelectItem value="piano">piano</SelectItem>
                    <SelectItem value="front">front</SelectItem>
                    <SelectItem value="vocal">vocal</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              {signupInstrument === 'front' && (
                <Field htmlFor="signup-sub-instrument" label="演奏楽器">
                  <Input id="signup-sub-instrument" type="text" value={signupSubInstrument} onChange={(event) => setSignupSubInstrument(event.target.value)} />
                </Field>
              )}
              <Field label="居住地域" htmlFor="signup-area">
                <Select value={signupArea || NONE_VALUE} onValueChange={(value) => setSignupArea(value === NONE_VALUE ? '' : value)}>
                  <SelectTrigger id="signup-area" className="w-full">
                    <SelectValue placeholder="居住地域を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE_VALUE}>居住地域を選択</SelectItem>
                    {PREFECTURE_OPTIONS.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="性別" htmlFor="signup-gender">
                <Select value={signupGender || NONE_VALUE} onValueChange={(value) => setSignupGender(value === NONE_VALUE ? '' : value)}>
                  <SelectTrigger id="signup-gender" className="w-full">
                    <SelectValue placeholder="性別を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE_VALUE}>性別を選択</SelectItem>
                    {GENDER_OPTIONS.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="年代" htmlFor="signup-age-range">
                <Select value={signupAgeRange || NONE_VALUE} onValueChange={(value) => setSignupAgeRange(value === NONE_VALUE ? '' : value)}>
                  <SelectTrigger id="signup-age-range" className="w-full">
                    <SelectValue placeholder="年代を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE_VALUE}>年代を選択</SelectItem>
                    {AGE_RANGE_OPTIONS.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
            </>
          )}
          <div className="md:col-span-2">
            <Button type="submit" disabled={loading}>
              {view === 'signup' ? 'サインアップ' : 'サインイン'}
            </Button>
          </div>
        </form>
      </Section>

      {view !== 'signup' && (
        <Section className="hidden" title="パスワード再設定" description="パスワード再設定トークンの発行と更新を行います。">
          <div className="grid max-w-2xl gap-4">
            <form className="grid gap-4" onSubmit={handleForgotPasswordSubmit}>
              <Field htmlFor="reset-email" label="メールアドレス">
                <Input id="reset-email" type="email" autoComplete="email" value={resetEmail} onChange={(event) => setResetEmail(event.target.value)} />
              </Field>
              <div>
                <Button type="submit" variant="outline" disabled={loading}>再設定トークンを発行</Button>
              </div>
            </form>
            {issuedResetToken && (
              <Alert>
                <AlertTitle>開発用トークン</AlertTitle>
                <AlertDescription className="break-all">{issuedResetToken}</AlertDescription>
              </Alert>
            )}
            <form className="grid gap-4" onSubmit={handleResetPasswordSubmit}>
              <Input
                type="email"
                value={resetEmail}
                autoComplete="username"
                readOnly
                tabIndex={-1}
                aria-hidden="true"
                className="hidden"
              />
              <Field htmlFor="reset-token" label="再設定トークン">
                <Input id="reset-token" type="text" autoComplete="one-time-code" value={resetToken} onChange={(event) => setResetToken(event.target.value)} />
              </Field>
              <Field htmlFor="reset-password" label="新しいパスワード">
                <Input id="reset-password" type="password" autoComplete="new-password" value={resetPassword} onChange={(event) => setResetPassword(event.target.value)} />
              </Field>
              <div>
                <Button type="submit" disabled={loading}>パスワード更新</Button>
              </div>
            </form>
          </div>
        </Section>
      )}
    </>
  );
}
