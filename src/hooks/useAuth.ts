import { useCallback, useEffect, useState } from 'react';
import type { AuthError, Session, User } from '@supabase/supabase-js';
import type { AuthStatus } from '../types/app';
import { cloudUnavailableErrorMessage, supabase } from '../lib/supabase';

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

function requireAuthClient() {
  if (!supabase) {
    throw new Error(cloudUnavailableErrorMessage);
  }

  return supabase;
}

export function useAuth() {
  const [status, setStatus] = useState<AuthStatus>(supabase ? 'loading' : 'anonymous');
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);

  useEffect(() => {
    let isMounted = true;

    if (!supabase) {
      setSession(null);
      setUser(null);
      setStatus('anonymous');
      setIsRecoveryMode(false);
      return;
    }

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
    const client = requireAuthClient();
    const { error } = await client.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }
  }, []);

  const signUp = useCallback(async ({ email, password }: AuthCredentials) => {
    const client = requireAuthClient();
    const { error } = await client.auth.signUp({
      email,
      password,
    });

    if (error) {
      throw error;
    }
  }, []);

  const verifySignupOtp = useCallback(async ({ email, token }: VerifySignupOtpPayload) => {
    const client = requireAuthClient();
    const { error } = await client.auth.verifyOtp({
      email,
      token,
      type: 'email',
    });

    if (error) {
      throw error;
    }
  }, []);

  const resendSignupOtp = useCallback(async ({ email }: ResendSignupOtpPayload) => {
    const client = requireAuthClient();
    const { error } = await client.auth.resend({
      type: 'signup',
      email,
    });

    if (error) {
      throw error;
    }
  }, []);

  const sendPasswordReset = useCallback(async ({ email }: { email: string }) => {
    const client = requireAuthClient();
    const redirectTo = typeof window === 'undefined'
      ? undefined
      : `${window.location.origin}${window.location.pathname}${window.location.search}`;

    const { error } = await client.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    if (error) {
      throw error;
    }
  }, []);

  const updatePassword = useCallback(async ({ password }: UpdatePasswordPayload) => {
    const client = requireAuthClient();
    const { error } = await client.auth.updateUser({
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
    const client = requireAuthClient();
    const { error } = await client.auth.signOut();
    if (error) {
      throw error;
    }
  }, []);

  return {
    status,
    session,
    user,
    isAvailable: Boolean(supabase),
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
