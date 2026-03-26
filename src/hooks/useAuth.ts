import { useCallback, useEffect, useState } from 'react';
import type { AuthError, Session, User } from '@supabase/supabase-js';
import type { AuthStatus } from '../types/app';
import { supabase } from '../lib/supabase';

interface AuthOtpRequest {
  email: string;
  mode: 'sign_in' | 'sign_up';
}

interface AuthOtpVerify {
  email: string;
  token: string;
}

export function useAuth() {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    let isMounted = true;

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
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!isMounted) {
        return;
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

  const requestOtp = useCallback(async ({ email, mode }: AuthOtpRequest) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: mode === 'sign_up',
      },
    });

    if (error) {
      throw error;
    }
  }, []);

  const verifyOtp = useCallback(async ({ email, token }: AuthOtpVerify) => {
    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email',
    });

    if (error) {
      throw error;
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
    requestOtp,
    verifyOtp,
    signOut,
  };
}

export function getAuthErrorMessage(error: unknown) {
  if (typeof error === 'object' && error && 'message' in error && typeof (error as AuthError).message === 'string') {
    return (error as AuthError).message;
  }

  return null;
}
