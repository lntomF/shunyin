import { useState } from 'react';
import { Camera, CheckCircle2, CloudUpload, LoaderCircle, LogOut, Settings, UserRound } from 'lucide-react';
import { AuthDialog } from './auth/AuthDialog';
import type { Dictionary } from '../i18n/translations';
import type { AuthStatus, CloudSyncStatus, Language } from '../types/app';
import { getAuthErrorMessage } from '../hooks/useAuth';

interface HeaderProps {
  dict: Dictionary;
  language: Language;
  setLanguage: (lang: Language) => void;
  brandName: string;
  settingsLabel: string;
  authStatus: AuthStatus;
  userEmail: string | null;
  cloudStatus: CloudSyncStatus;
  cloudMessage: string | null;
  onRequestOtp: (payload: { email: string; mode: 'sign_in' | 'sign_up' }) => Promise<void>;
  onVerifyOtp: (payload: { email: string; token: string }) => Promise<void>;
  onSignOut: () => Promise<void>;
  onSaveCloud: () => Promise<void>;
}

export function Header({
  dict,
  language,
  setLanguage,
  brandName,
  settingsLabel,
  authStatus,
  userEmail,
  cloudStatus,
  cloudMessage,
  onRequestOtp,
  onVerifyOtp,
  onSignOut,
  onSaveCloud,
}: HeaderProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'sign_in' | 'sign_up'>('sign_in');
  const [pending, setPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const openDialog = (mode: 'sign_in' | 'sign_up') => {
    setDialogMode(mode);
    setErrorMessage(null);
    setSuccessMessage(null);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setPending(false);
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const handleRequestOtp = async ({ email, mode }: { email: string; mode: 'sign_in' | 'sign_up' }) => {
    setPending(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await onRequestOtp({ email, mode });
      setSuccessMessage(dict.authOtpSent);
    } catch (error) {
      setErrorMessage(getAuthErrorMessage(error) ?? dict.authGenericError);
    } finally {
      setPending(false);
    }
  };

  const handleVerifyOtp = async ({ email, token }: { email: string; token: string }) => {
    setPending(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await onVerifyOtp({ email, token });
      closeDialog();
    } catch (error) {
      setErrorMessage(getAuthErrorMessage(error) ?? dict.authGenericError);
    } finally {
      setPending(false);
    }
  };

  const handleSignOut = async () => {
    setPending(true);

    try {
      await onSignOut();
    } catch (error) {
      setErrorMessage(getAuthErrorMessage(error) ?? dict.authGenericError);
      setDialogMode('sign_in');
      setDialogOpen(true);
    } finally {
      setPending(false);
    }
  };

  const handleSaveCloud = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await onSaveCloud();
      setSuccessMessage(dict.cloudWorkspaceSaved);
    } catch (error) {
      setErrorMessage(getAuthErrorMessage(error) ?? cloudMessage ?? dict.cloudSaveFailed);
    }
  };

  const cloudButtonLabel = cloudStatus === 'saving'
    ? dict.cloudSavingLabel
    : cloudStatus === 'saved'
      ? dict.cloudSavedLabel
      : dict.cloudSaveLabel;
  const cloudActionDisabled = cloudStatus === 'loading' || cloudStatus === 'saving';

  return (
    <>
      <header className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-md bg-gradient-to-b from-surface-container-low to-transparent">
      <div className="flex justify-between items-center px-6 py-4 w-full max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <button aria-label={brandName} className="text-primary hover:text-secondary shutter-transition active:scale-95">
            <Camera size={24} strokeWidth={1.5} />
          </button>
          <h1 className="text-primary font-headline tracking-[0.2em] font-black text-lg hidden sm:block">
            {brandName}
          </h1>
        </div>

        <div className="flex items-center gap-4">
          {authStatus === 'authenticated' ? (
            <div className="flex items-center gap-2 md:hidden">
              <button
                type="button"
                onClick={handleSaveCloud}
                disabled={cloudActionDisabled}
                className="flex items-center justify-center rounded-full bg-surface-container-high/60 p-2 text-primary ghost-border disabled:cursor-wait disabled:opacity-60"
                aria-label={dict.cloudSaveLabel}
              >
                {cloudStatus === 'saving' ? <LoaderCircle size={16} className="animate-spin" /> : cloudStatus === 'saved' ? <CheckCircle2 size={16} className="text-secondary" /> : <CloudUpload size={16} />}
              </button>
              <button
                type="button"
                onClick={handleSignOut}
                className="flex items-center justify-center rounded-full bg-surface-container-high/60 p-2 text-primary ghost-border"
                aria-label={dict.signOutLabel}
              >
                {pending ? <LoaderCircle size={16} className="animate-spin" /> : <LogOut size={16} />}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => openDialog('sign_in')}
              className="flex items-center justify-center rounded-full bg-surface-container-high/60 p-2 text-primary ghost-border md:hidden"
              aria-label={dict.accountLabel}
            >
              <UserRound size={16} />
            </button>
          )}

          {authStatus === 'authenticated' && userEmail ? (
            <div className="hidden items-center gap-2 rounded-full bg-surface-container-high/60 px-3 py-2 ghost-border md:flex">
              <UserRound size={14} className="text-secondary" />
              <div className="max-w-[180px] truncate text-[11px] font-medium tracking-wide text-primary">
                <span className="mr-2 text-outline">{dict.authSignedInAs}</span>
                {userEmail}
              </div>
              <button
                type="button"
                onClick={handleSaveCloud}
                disabled={cloudActionDisabled}
                className="inline-flex items-center gap-1 rounded-full bg-surface-bright px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-primary transition-colors hover:text-secondary disabled:cursor-wait disabled:opacity-60"
                aria-label={dict.cloudSaveLabel}
              >
                {cloudStatus === 'saving' ? <LoaderCircle size={12} className="animate-spin" /> : cloudStatus === 'saved' ? <CheckCircle2 size={12} className="text-secondary" /> : <CloudUpload size={12} />}
                {cloudButtonLabel}
              </button>
              <button
                type="button"
                onClick={handleSignOut}
                className="rounded-full p-1 text-outline transition-colors hover:text-primary"
                aria-label={dict.signOutLabel}
              >
                {pending ? <LoaderCircle size={14} className="animate-spin" /> : <LogOut size={14} />}
              </button>
            </div>
          ) : authStatus === 'loading' ? (
            <div className="hidden items-center gap-2 rounded-full bg-surface-container-high/60 px-3 py-2 ghost-border md:flex">
              <LoaderCircle size={14} className="animate-spin text-secondary" />
              <span className="text-[11px] font-medium tracking-wide text-on-surface-variant">{dict.authLoading}</span>
            </div>
          ) : (
            <div className="hidden items-center gap-2 md:flex">
              <button
                type="button"
                onClick={() => openDialog('sign_in')}
                className="rounded-full border border-outline-variant/20 bg-surface-container-high/60 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.22em] text-primary transition-colors hover:border-secondary/40 hover:text-secondary"
              >
                {dict.signInLabel}
              </button>
              <button
                type="button"
                onClick={() => openDialog('sign_up')}
                className="rounded-full bg-primary px-4 py-2 text-[10px] font-bold uppercase tracking-[0.22em] text-surface transition-colors hover:bg-white"
              >
                {dict.signUpLabel}
              </button>
            </div>
          )}

          <div className="flex items-center gap-1 mr-2 bg-surface-container-high/50 rounded-full p-1 ghost-border">
            <button
              onClick={() => setLanguage('en')}
              className={`px-2 py-0.5 text-[10px] font-bold rounded-full shutter-transition tracking-widest ${
                language === 'en' ? 'bg-surface-bright text-primary' : 'text-outline hover:text-on-surface-variant'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => setLanguage('zh')}
              className={`px-2 py-0.5 text-[10px] font-bold rounded-full shutter-transition tracking-widest ${
                language === 'zh' ? 'bg-surface-bright text-primary' : 'text-outline hover:text-on-surface-variant'
              }`}
            >
              ZH
            </button>
          </div>
          <button aria-label={settingsLabel} className="text-primary hover:text-secondary shutter-transition active:scale-95">
            <Settings size={20} strokeWidth={1.5} />
          </button>
        </div>
      </div>
      {(successMessage || cloudMessage || errorMessage) && authStatus === 'authenticated' && (
        <div className="mx-auto mt-1 flex w-full max-w-7xl px-6">
          <div className={`rounded-full px-4 py-2 text-[10px] font-bold uppercase tracking-[0.18em] ${
            cloudStatus === 'error' || errorMessage ? 'bg-[#2a1616] text-[#f0b5b5]' : 'bg-secondary/10 text-secondary'
          }`}>
            {errorMessage ?? successMessage ?? cloudMessage}
          </div>
        </div>
      )}
      </header>

      <AuthDialog
        dict={dict}
        open={dialogOpen}
        mode={dialogMode}
        pending={pending}
        errorMessage={errorMessage}
        successMessage={successMessage}
        onClose={closeDialog}
        onSwitchMode={(mode) => {
          setDialogMode(mode);
          setErrorMessage(null);
          setSuccessMessage(null);
        }}
        onRequestOtp={handleRequestOtp}
        onVerifyOtp={handleVerifyOtp}
      />
    </>
  );
}
