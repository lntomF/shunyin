import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import type { Dictionary } from '../../i18n/translations';

type AuthMode = 'sign_in' | 'sign_up' | 'forgot_password' | 'reset_password';

interface AuthDialogProps {
  dict: Dictionary;
  open: boolean;
  mode: AuthMode;
  pending: boolean;
  errorMessage: string | null;
  successMessage: string | null;
  onClose: () => void;
  onSwitchMode: (mode: AuthMode) => void;
  onSignIn: (payload: { email: string; password: string }) => void | Promise<void>;
  onSignUp: (payload: { email: string; password: string }) => void | Promise<void>;
  onVerifySignUpOtp: (payload: { email: string; token: string }) => void | Promise<void>;
  onResendSignUpOtp: (payload: { email: string }) => void | Promise<void>;
  onSendPasswordReset: (payload: { email: string }) => void | Promise<void>;
  onUpdatePassword: (payload: { password: string }) => void | Promise<void>;
}

export function AuthDialog({
  dict,
  open,
  mode,
  pending,
  errorMessage,
  successMessage,
  onClose,
  onSwitchMode,
  onSignIn,
  onSignUp,
  onVerifySignUpOtp,
  onResendSignUpOtp,
  onSendPasswordReset,
  onUpdatePassword,
}: AuthDialogProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [token, setToken] = useState('');
  const [signUpStep, setSignUpStep] = useState<'credentials' | 'verify'>('credentials');

  useEffect(() => {
    if (!open) {
      setPassword('');
      setConfirmPassword('');
      setToken('');
      setSignUpStep('credentials');
      return;
    }

    if (mode !== 'sign_up') {
      setToken('');
      setSignUpStep('credentials');
    }

    if (mode !== 'reset_password') {
      setConfirmPassword('');
    }
  }, [open, mode]);

  if (!open) {
    return null;
  }

  const isSignIn = mode === 'sign_in';
  const isSignUp = mode === 'sign_up';
  const isForgotPassword = mode === 'forgot_password';
  const isResetPassword = mode === 'reset_password';
  const isVerifyStep = isSignUp && signUpStep === 'verify';

  const title = isSignIn
    ? dict.authDialogSignInTitle
    : isSignUp
      ? dict.authDialogSignUpTitle
      : isForgotPassword
        ? dict.authForgotPasswordTitle
        : dict.authResetPasswordTitle;

  const description = isSignIn
    ? dict.authWelcomeBack
    : isSignUp
      ? (isVerifyStep ? dict.authOtpStepDesc : dict.authCreateAccount)
      : isForgotPassword
        ? dict.authForgotPasswordDesc
        : dict.authResetPasswordDesc;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/65 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-outline-variant/20 bg-surface-container-low shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-outline-variant/10 px-6 py-5">
          <div>
            <h2 className="font-headline text-xl font-black tracking-tight text-primary">{title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">{description}</p>
          </div>
          <button
            type="button"
            aria-label="Close auth dialog"
            onClick={onClose}
            className="rounded-full bg-surface-container-high p-2 text-outline transition-colors hover:text-primary"
          >
            <X size={16} />
          </button>
        </div>

        <form
          className="space-y-4 px-6 py-6"
          onSubmit={async (event) => {
            event.preventDefault();

            if (isSignIn) {
              await onSignIn({ email: email.trim(), password });
              return;
            }

            if (isForgotPassword) {
              await onSendPasswordReset({ email: email.trim() });
              return;
            }

            if (isResetPassword) {
              if (password !== confirmPassword) {
                return;
              }

              await onUpdatePassword({ password });
              return;
            }

            if (!isVerifyStep) {
              await onSignUp({ email: email.trim(), password });
              setSignUpStep('verify');
              return;
            }

            await onVerifySignUpOtp({ email: email.trim(), token: token.trim() });
          }}
        >
          {!isResetPassword && (
            <label className="block space-y-2">
              <span className="block text-[10px] font-bold uppercase tracking-[0.22em] text-on-surface-variant">{dict.authEmailLabel}</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                autoComplete="email"
                disabled={pending || isVerifyStep}
                className="w-full rounded-xl border border-transparent bg-surface-container-high px-4 py-3 text-sm text-primary outline-none transition-colors focus:border-secondary/40 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </label>
          )}

          {(isSignIn || (isSignUp && !isVerifyStep) || isResetPassword) && (
            <label className="block space-y-2">
              <span className="block text-[10px] font-bold uppercase tracking-[0.22em] text-on-surface-variant">{dict.authPasswordLabel}</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                minLength={6}
                autoComplete={isSignIn ? 'current-password' : 'new-password'}
                className="w-full rounded-xl border border-transparent bg-surface-container-high px-4 py-3 text-sm text-primary outline-none transition-colors focus:border-secondary/40"
              />
            </label>
          )}

          {isResetPassword && (
            <label className="block space-y-2">
              <span className="block text-[10px] font-bold uppercase tracking-[0.22em] text-on-surface-variant">{dict.authConfirmPasswordLabel}</span>
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
                className="w-full rounded-xl border border-transparent bg-surface-container-high px-4 py-3 text-sm text-primary outline-none transition-colors focus:border-secondary/40"
              />
            </label>
          )}

          {isVerifyStep && (
            <label className="block space-y-2">
              <span className="block text-[10px] font-bold uppercase tracking-[0.22em] text-on-surface-variant">{dict.authOtpLabel}</span>
              <input
                type="text"
                value={token}
                onChange={(event) => setToken(event.target.value.replace(/\s+/g, ''))}
                required
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder={dict.authOtpPlaceholder}
                className="w-full rounded-xl border border-transparent bg-surface-container-high px-4 py-3 text-sm tracking-[0.35em] text-primary outline-none transition-colors focus:border-secondary/40"
              />
            </label>
          )}

          {isSignIn && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => onSwitchMode('forgot_password')}
                className="text-sm font-medium text-secondary transition-colors hover:text-primary"
              >
                {dict.authForgotPassword}
              </button>
            </div>
          )}

          {isResetPassword && password && confirmPassword && password !== confirmPassword && (
            <div className="rounded-2xl border border-[#7f3f3f]/40 bg-[#2a1616] px-4 py-3 text-sm text-[#f0b5b5]">
              {dict.authPasswordMismatch}
            </div>
          )}

          {errorMessage && (
            <div className="rounded-2xl border border-[#7f3f3f]/40 bg-[#2a1616] px-4 py-3 text-sm text-[#f0b5b5]">
              {errorMessage}
            </div>
          )}

          {successMessage && (
            <div className="rounded-2xl border border-secondary/20 bg-secondary/10 px-4 py-3 text-sm text-secondary">
              {successMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={pending || (isResetPassword && password !== confirmPassword)}
            className="w-full rounded-xl bg-primary px-5 py-4 text-sm font-headline font-black uppercase tracking-[0.2em] text-surface transition-transform hover:bg-white active:scale-[0.98] disabled:cursor-wait disabled:opacity-60"
          >
            {pending
              ? dict.authProcessing
              : isSignIn
                ? dict.authSubmitSignIn
                : isForgotPassword
                  ? dict.authSendResetEmail
                  : isResetPassword
                    ? dict.authUpdatePassword
                    : isVerifyStep
                      ? dict.authVerifyCode
                      : dict.authSubmitSignUp}
          </button>

          {isVerifyStep && (
            <button
              type="button"
              disabled={pending}
              onClick={async () => {
                await onResendSignUpOtp({ email: email.trim() });
              }}
              className="w-full rounded-xl border border-outline-variant/20 bg-surface-container-high px-5 py-4 text-sm font-headline font-black uppercase tracking-[0.2em] text-primary transition-colors hover:border-secondary/40 hover:text-secondary disabled:cursor-wait disabled:opacity-60"
            >
              {dict.authResendCode}
            </button>
          )}

          {!isResetPassword && (
            <div className="text-center text-sm text-on-surface-variant">
              {isSignIn || isForgotPassword ? dict.authNoAccount : dict.authHasAccount}{' '}
              <button
                type="button"
                onClick={() => onSwitchMode(isSignIn || isForgotPassword ? 'sign_up' : 'sign_in')}
                className="font-medium text-secondary transition-colors hover:text-primary"
              >
                {isSignIn || isForgotPassword ? dict.authSwitchToSignUp : dict.authSwitchToSignIn}
              </button>
            </div>
          )}

          {isForgotPassword && (
            <div className="text-center text-sm text-on-surface-variant">
              <button
                type="button"
                onClick={() => onSwitchMode('sign_in')}
                className="font-medium text-secondary transition-colors hover:text-primary"
              >
                {dict.authBackToSignIn}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
