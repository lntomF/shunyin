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
  onSubmit: (payload: { email: string; password: string; mode: AuthMode }) => void | Promise<void>;
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
  onSubmit,
}: AuthDialogProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (!open) {
      setPassword('');
    }
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
              {mode === 'sign_in' ? dict.authWelcomeBack : dict.authCreateAccount}
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
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit({ email: email.trim(), password, mode });
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
              className="w-full rounded-xl border border-transparent bg-surface-container-high px-4 py-3 text-sm text-primary outline-none transition-colors focus:border-secondary/40"
            />
          </label>

          <label className="block space-y-2">
            <span className="block text-[10px] font-bold uppercase tracking-[0.22em] text-on-surface-variant">{dict.authPasswordLabel}</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={6}
              autoComplete={mode === 'sign_in' ? 'current-password' : 'new-password'}
              className="w-full rounded-xl border border-transparent bg-surface-container-high px-4 py-3 text-sm text-primary outline-none transition-colors focus:border-secondary/40"
            />
          </label>

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
            {pending ? dict.authProcessing : mode === 'sign_in' ? dict.authSubmitSignIn : dict.authSubmitSignUp}
          </button>

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
