import { useCallback, useEffect, useState } from 'react';
import type { AuthError, Session, User } from '@supabase/supabase-js';
import type { AuthStatus } from '../types/app';
import { supabase } from '../lib/supabase';

interface AuthCredentials {
  email: string;
  password: string;
}

interface VerifySignupOtpPayload {
  email: string;
  token: string;
}

interface ResendSignupOtpPayload {
  email: string;
}

interface UpdatePasswordPayload {
  password: string;
}

export function useAuth() {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);

  useEffect(() => {
    let isMounted = true;

    if (typeof window !== 'undefined' && window.location.hash.includes('type=recovery')) {
      setIsRecoveryMode(true);
    }

    supabase.auth.getSession().then(({ data, error }) => {
      if (!isMounted) {
        return;
      }

      if (error) {
        setSession(null);
        setUser(null);
        setStatus('anonymous');
        return;
      }

      setSession(data.session ?? null);
      setUser(data.session?.user ?? null);
      setStatus(data.session ? 'authenticated' : 'anonymous');
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!isMounted) {
        return;
      }

      if (event === 'PASSWORD_RECOVERY') {
        setIsRecoveryMode(true);
      }

      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setStatus(nextSession ? 'authenticated' : 'anonymous');
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async ({ email, password }: AuthCredentials) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }
  }, []);

  const signUp = useCallback(async ({ email, password }: AuthCredentials) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      throw error;
    }
  }, []);

  const verifySignupOtp = useCallback(async ({ email, token }: VerifySignupOtpPayload) => {
    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email',
    });

    if (error) {
      throw error;
    }
  }, []);

  const resendSignupOtp = useCallback(async ({ email }: ResendSignupOtpPayload) => {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
    });

    if (error) {
      throw error;
    }
  }, []);

  const sendPasswordReset = useCallback(async ({ email }: { email: string }) => {
    const redirectTo = typeof window === 'undefined'
      ? undefined
      : `${window.location.origin}${window.location.pathname}${window.location.search}`;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    if (error) {
      throw error;
    }
  }, []);

  const updatePassword = useCallback(async ({ password }: UpdatePasswordPayload) => {
    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      throw error;
    }

    setIsRecoveryMode(false);

    if (typeof window !== 'undefined' && window.location.hash) {
      const cleanUrl = `${window.location.pathname}${window.location.search}`;
      window.history.replaceState({}, document.title, cleanUrl);
    }
  }, []);

  const clearRecoveryMode = useCallback(() => {
    setIsRecoveryMode(false);

    if (typeof window !== 'undefined' && window.location.hash) {
      const cleanUrl = `${window.location.pathname}${window.location.search}`;
      window.history.replaceState({}, document.title, cleanUrl);
    }
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }
  }, []);

  return {
    status,
    session,
    user,
    signIn,
    signUp,
    verifySignupOtp,
    resendSignupOtp,
    sendPasswordReset,
    updatePassword,
    isRecoveryMode,
    clearRecoveryMode,
    signOut,
  };
}

export function getAuthErrorMessage(error: unknown) {
  if (typeof error === 'object' && error && 'message' in error && typeof (error as AuthError).message === 'string') {
    return (error as AuthError).message;
  }

  return null;
}
