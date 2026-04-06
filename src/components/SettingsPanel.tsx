import { useEffect, useState } from 'react';
import { CheckCircle2, Cloud, CloudOff, CloudUpload, LoaderCircle, LogOut, UserRound, X } from 'lucide-react';
import { AuthDialog } from './auth/AuthDialog';
import type { Dictionary } from '../i18n/translations';
import type { AuthStatus, CloudSyncStatus, Language } from '../types/app';
import { getAuthErrorMessage } from '../hooks/useAuth';

type AuthMode = 'sign_in' | 'sign_up' | 'forgot_password' | 'reset_password';

interface SettingsPanelProps {
  dict: Dictionary;
  open: boolean;
  language: Language;
  cloudEnabled: boolean;
  authStatus: AuthStatus;
  userEmail: string | null;
  cloudStatus: CloudSyncStatus;
  cloudMessage: string | null;
  onClose: () => void;
  onSignIn: (payload: { email: string; password: string }) => Promise<void>;
  onSignUp: (payload: { email: string; password: string }) => Promise<void>;
  onVerifySignUpOtp: (payload: { email: string; token: string }) => Promise<void>;
  onResendSignUpOtp: (payload: { email: string }) => Promise<void>;
  onSendPasswordReset: (payload: { email: string }) => Promise<void>;
  onUpdatePassword: (payload: { password: string }) => Promise<void>;
  isRecoveryMode: boolean;
  onClearRecoveryMode: () => void;
  onSignOut: () => Promise<void>;
  onSaveCloud: () => Promise<void>;
}

export function SettingsPanel({
  dict,
  open,
  cloudEnabled,
  authStatus,
  userEmail,
  cloudStatus,
  cloudMessage,
  onClose,
  onSignIn,
  onSignUp,
  onVerifySignUpOtp,
  onResendSignUpOtp,
  onSendPasswordReset,
  onUpdatePassword,
  isRecoveryMode,
  onClearRecoveryMode,
  onSignOut,
  onSaveCloud,
}: SettingsPanelProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<AuthMode>('sign_in');
  const [pending, setPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!cloudEnabled) {
      setPending(false);
      setDialogOpen(false);
      setErrorMessage(null);
      setSuccessMessage(null);
      return;
    }

    if (!isRecoveryMode) {
      return;
    }

    setDialogMode('reset_password');
    setDialogOpen(true);
    setErrorMessage(null);
    setSuccessMessage(null);
  }, [cloudEnabled, isRecoveryMode]);

  const openDialog = (mode: AuthMode) => {
    if (!cloudEnabled) {
      return;
    }

    setDialogMode(mode);
    setErrorMessage(null);
    setSuccessMessage(null);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    if (dialogMode === 'reset_password') {
      onClearRecoveryMode();
    }

    setDialogOpen(false);
    setPending(false);
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const handleSignIn = async ({ email, password }: { email: string; password: string }) => {
    setPending(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await onSignIn({ email, password });
      closeDialog();
    } catch (error) {
      setErrorMessage(getAuthErrorMessage(error) ?? dict.authGenericError);
    } finally {
      setPending(false);
    }
  };

  const handleSignUp = async ({ email, password }: { email: string; password: string }) => {
    setPending(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await onSignUp({ email, password });
      setSuccessMessage(dict.authOtpSent);
    } catch (error) {
      setErrorMessage(getAuthErrorMessage(error) ?? dict.authGenericError);
    } finally {
      setPending(false);
    }
  };

  const handleVerifySignUpOtp = async ({ email, token }: { email: string; token: string }) => {
    setPending(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await onVerifySignUpOtp({ email, token });
      closeDialog();
    } catch (error) {
      setErrorMessage(getAuthErrorMessage(error) ?? dict.authGenericError);
    } finally {
      setPending(false);
    }
  };

  const handleResendSignUpOtp = async ({ email }: { email: string }) => {
    setPending(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await onResendSignUpOtp({ email });
      setSuccessMessage(dict.authOtpSent);
    } catch (error) {
      setErrorMessage(getAuthErrorMessage(error) ?? dict.authGenericError);
    } finally {
      setPending(false);
    }
  };

  const handleSendPasswordReset = async ({ email }: { email: string }) => {
    setPending(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await onSendPasswordReset({ email });
      setSuccessMessage(dict.authResetEmailSent);
    } catch (error) {
      setErrorMessage(getAuthErrorMessage(error) ?? dict.authGenericError);
    } finally {
      setPending(false);
    }
  };

  const handleUpdatePassword = async ({ password }: { password: string }) => {
    setPending(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await onUpdatePassword({ password });
      onClearRecoveryMode();
      closeDialog();
    } catch (error) {
      setErrorMessage(getAuthErrorMessage(error) ?? dict.authGenericError);
    } finally {
      setPending(false);
    }
  };

  const handleSaveCloud = async () => {
    if (!cloudEnabled) {
      setErrorMessage(dict.cloudUnavailableMessage);
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await onSaveCloud();
      setSuccessMessage(dict.cloudWorkspaceSaved);
    } catch (error) {
      setErrorMessage(getAuthErrorMessage(error) ?? cloudMessage ?? dict.cloudSaveFailed);
    }
  };

  const handleSignOut = async () => {
    if (!cloudEnabled) {
      return;
    }

    setPending(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await onSignOut();
      setSuccessMessage(dict.settingsSignedOut);
    } catch (error) {
      setErrorMessage(getAuthErrorMessage(error) ?? dict.authGenericError);
    } finally {
      setPending(false);
    }
  };

  const cloudButtonLabel = cloudStatus === 'saving'
    ? dict.cloudSavingLabel
    : cloudStatus === 'saved'
      ? dict.cloudSavedLabel
      : dict.cloudSaveLabel;
  const cloudActionDisabled = !cloudEnabled || authStatus !== 'authenticated' || cloudStatus === 'loading' || cloudStatus === 'saving';
  const statusMessage = errorMessage ?? successMessage ?? cloudMessage;
  const statusToneClass = errorMessage || cloudStatus === 'error'
    ? 'border-[#7f3f3f]/40 bg-[#26171c] text-[#f0b5b5]'
    : 'border-secondary/15 bg-secondary/10 text-secondary';

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-[65] flex items-center justify-center bg-[#02060f]/78 px-4 backdrop-blur-md">
          <div className="relative w-full max-w-2xl overflow-hidden rounded-[2rem] border border-secondary/15 bg-surface-container-lowest/90 shadow-[0_30px_100px_rgba(0,0,0,0.55)]">
            <div className="console-grid absolute inset-0 opacity-20" />
            <div className="pointer-events-none absolute -left-10 top-10 h-44 w-44 rounded-full bg-secondary/12 blur-3xl" />
            <div className="pointer-events-none absolute bottom-0 right-0 h-52 w-52 rounded-full bg-tertiary/10 blur-3xl" />
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-secondary/70 to-transparent" />

            <div className="relative flex items-start justify-between gap-4 border-b border-outline-variant/10 px-6 py-5 md:px-7">
              <div className="max-w-xl">
                <div className="text-[10px] font-bold uppercase tracking-[0.26em] text-secondary">{dict.settingsBetaLabel}</div>
                <h2 className="mt-3 font-headline text-2xl font-bold tracking-[-0.03em] text-primary md:text-[2rem]">{dict.settingsTitle}</h2>
                <p className="mt-3 max-w-lg text-sm leading-7 text-on-surface-variant">{dict.settingsDescription}</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label={dict.settingsCloseLabel}
                className="console-panel flex h-10 w-10 items-center justify-center rounded-full text-outline shutter-transition hover:text-primary"
              >
                <X size={16} />
              </button>
            </div>

            <div className="relative space-y-5 px-6 py-6 md:px-7 md:py-7">
              <section className="console-panel relative overflow-hidden rounded-[1.75rem] p-5 md:p-6">
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-secondary/60 to-transparent" />

                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[1.1rem] border border-secondary/15 bg-surface-container-high/85 text-secondary">
                    <Cloud size={18} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] font-bold uppercase tracking-[0.24em] text-secondary">{dict.settingsExperimentalLabel}</div>
                    <h3 className="mt-2 font-headline text-xl font-bold tracking-[-0.03em] text-primary">{dict.settingsCloudSectionTitle}</h3>
                    <p className="mt-3 text-sm leading-7 text-on-surface-variant">{dict.settingsCloudSectionDescription}</p>
                  </div>
                </div>

                {!cloudEnabled && (
                  <div className="mt-5 flex items-center gap-3 rounded-[1.3rem] border border-outline-variant/15 bg-surface/65 px-4 py-4 text-sm text-on-surface-variant">
                    <CloudOff size={16} className="shrink-0 text-outline" />
                    <span>{dict.cloudUnavailableMessage}</span>
                  </div>
                )}

                {cloudEnabled && authStatus === 'authenticated' ? (
                  <div className="mt-6 space-y-4">
                    <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px]">
                      <div className="rounded-[1.4rem] border border-secondary/10 bg-surface/65 p-4">
                        <div className="text-[10px] font-bold uppercase tracking-[0.24em] text-on-surface-variant">{dict.accountLabel}</div>
                        <div className="mt-3 flex items-center gap-3 text-sm text-on-surface">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-secondary/15 bg-surface-container-high/80 text-secondary">
                            <UserRound size={15} />
                          </div>
                          <span className="truncate font-mono text-[13px]">{userEmail ?? dict.settingsUnknownEmail}</span>
                        </div>
                      </div>

                      <div className="rounded-[1.4rem] border border-secondary/10 bg-surface/65 p-4">
                        <div className="text-[10px] font-bold uppercase tracking-[0.24em] text-on-surface-variant">{dict.statusLabel}</div>
                        <div className="mt-3 flex items-center gap-3 text-sm text-on-surface">
                          <span className={`h-2.5 w-2.5 rounded-full ${
                            cloudStatus === 'saved'
                              ? 'bg-tertiary shadow-[0_0_12px_rgba(110,231,200,0.7)]'
                              : cloudStatus === 'saving'
                                ? 'bg-secondary shadow-[0_0_12px_rgba(121,216,255,0.7)]'
                                : 'bg-outline'
                          }`}
                          />
                          <span>{cloudButtonLabel}</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      <button
                        type="button"
                        onClick={handleSaveCloud}
                        disabled={cloudActionDisabled}
                        className="group flex items-center justify-between rounded-[1.3rem] border border-secondary/20 bg-primary px-4 py-4 text-sm font-headline font-bold uppercase tracking-[0.18em] text-surface shadow-[0_12px_30px_rgba(121,216,255,0.18)] shutter-transition hover:bg-white disabled:cursor-wait disabled:opacity-60"
                      >
                        <span>{cloudButtonLabel}</span>
                        {cloudStatus === 'saving'
                          ? <LoaderCircle size={16} className="animate-spin" />
                          : cloudStatus === 'saved'
                            ? <CheckCircle2 size={16} />
                            : <CloudUpload size={16} className="shutter-transition group-hover:-translate-y-0.5" />}
                      </button>

                      <button
                        type="button"
                        onClick={handleSignOut}
                        disabled={pending}
                        className="console-panel flex items-center justify-between rounded-[1.3rem] px-4 py-4 text-sm font-headline font-bold uppercase tracking-[0.18em] text-primary shutter-transition hover:border-secondary/30 hover:text-secondary disabled:cursor-wait disabled:opacity-60"
                      >
                        <span>{dict.signOutLabel}</span>
                        {pending ? <LoaderCircle size={16} className="animate-spin" /> : <LogOut size={16} />}
                      </button>
                    </div>
                  </div>
                ) : cloudEnabled ? (
                  <div className="mt-6 space-y-4">
                    <div className="rounded-[1.4rem] border border-secondary/10 bg-surface/65 px-4 py-4 text-sm leading-7 text-on-surface-variant">
                      {dict.settingsCloudBetaHint}
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <button
                        type="button"
                        onClick={() => openDialog('sign_in')}
                        className="console-panel rounded-[1.3rem] px-4 py-4 text-sm font-headline font-bold uppercase tracking-[0.18em] text-primary shutter-transition hover:border-secondary/30 hover:text-secondary"
                      >
                        {dict.signInLabel}
                      </button>
                      <button
                        type="button"
                        onClick={() => openDialog('sign_up')}
                        className="rounded-[1.3rem] border border-secondary/20 bg-primary px-4 py-4 text-sm font-headline font-bold uppercase tracking-[0.18em] text-surface shadow-[0_12px_30px_rgba(121,216,255,0.18)] shutter-transition hover:bg-white"
                      >
                        {dict.signUpLabel}
                      </button>
                    </div>
                  </div>
                ) : null}
              </section>

              {statusMessage && (
                <div className={`rounded-[1.3rem] border px-4 py-4 text-sm leading-7 ${statusToneClass}`}>
                  {statusMessage}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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
        onSignIn={handleSignIn}
        onSignUp={handleSignUp}
        onVerifySignUpOtp={handleVerifySignUpOtp}
        onResendSignUpOtp={handleResendSignUpOtp}
        onSendPasswordReset={handleSendPasswordReset}
        onUpdatePassword={handleUpdatePassword}
      />
    </>
  );
}
