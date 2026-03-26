import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import type { Dictionary } from '../../i18n/translations';

type AuthMode = 'sign_in' | 'sign_up';

interface AuthDialogProps {
  dict: Dictionary;
  open: boolean;
  mode: AuthMode;
  pending: boolean;
  errorMessage: string | null;
  successMessage: string | null;
  onClose: () => void;
  onSwitchMode: (mode: AuthMode) => void;
  onRequestOtp: (payload: { email: string; mode: AuthMode }) => void | Promise<void>;
  onVerifyOtp: (payload: { email: string; token: string }) => void | Promise<void>;
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
  onRequestOtp,
  onVerifyOtp,
}: AuthDialogProps) {
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [step, setStep] = useState<'request' | 'verify'>('request');

  useEffect(() => {
    if (!open) {
      setToken('');
      setStep('request');
      return;
    }

    setToken('');
    setStep('request');
  }, [open, mode]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/65 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-outline-variant/20 bg-surface-container-low shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-outline-variant/10 px-6 py-5">
          <div>
            <h2 className="font-headline text-xl font-black tracking-tight text-primary">
              {mode === 'sign_in' ? dict.authDialogSignInTitle : dict.authDialogSignUpTitle}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">
              {step === 'request'
                ? (mode === 'sign_in' ? dict.authWelcomeBack : dict.authCreateAccount)
                : dict.authOtpStepDesc}
            </p>
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

            if (step === 'request') {
              await onRequestOtp({ email: email.trim(), mode });
              setStep('verify');
              return;
            }

            await onVerifyOtp({ email: email.trim(), token: token.trim() });
          }}
        >
          <label className="block space-y-2">
            <span className="block text-[10px] font-bold uppercase tracking-[0.22em] text-on-surface-variant">{dict.authEmailLabel}</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              autoComplete="email"
              disabled={pending || step === 'verify'}
              className="w-full rounded-xl border border-transparent bg-surface-container-high px-4 py-3 text-sm text-primary outline-none transition-colors focus:border-secondary/40 disabled:cursor-not-allowed disabled:opacity-60"
            />
          </label>

          {step === 'verify' && (
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
            disabled={pending}
            className="w-full rounded-xl bg-primary px-5 py-4 text-sm font-headline font-black uppercase tracking-[0.2em] text-surface transition-transform hover:bg-white active:scale-[0.98] disabled:cursor-wait disabled:opacity-60"
          >
            {pending ? dict.authProcessing : step === 'request' ? dict.authSendCode : dict.authVerifyCode}
          </button>

          {step === 'verify' && (
            <button
              type="button"
              disabled={pending}
              onClick={async () => {
                await onRequestOtp({ email: email.trim(), mode });
              }}
              className="w-full rounded-xl border border-outline-variant/20 bg-surface-container-high px-5 py-4 text-sm font-headline font-black uppercase tracking-[0.2em] text-primary transition-colors hover:border-secondary/40 hover:text-secondary disabled:cursor-wait disabled:opacity-60"
            >
              {dict.authResendCode}
            </button>
          )}

          <div className="text-center text-sm text-on-surface-variant">
            {mode === 'sign_in' ? dict.authNoAccount : dict.authHasAccount}{' '}
            <button
              type="button"
              onClick={() => onSwitchMode(mode === 'sign_in' ? 'sign_up' : 'sign_in')}
              className="font-medium text-secondary transition-colors hover:text-primary"
            >
              {mode === 'sign_in' ? dict.authSwitchToSignUp : dict.authSwitchToSignIn}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
