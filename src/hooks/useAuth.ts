import { useCallback, useEffect, useState } from 'react';
import type { AuthError, Session, User } from '@supabase/supabase-js';
import type { AuthStatus } from '../types/app';
import { supabase } from '../lib/supabase';

interface AuthCredentials {
  email: string;
  password: string;
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
    signOut,
  };
}

export function getAuthErrorMessage(error: unknown) {
  if (typeof error === 'object' && error && 'message' in error && typeof (error as AuthError).message === 'string') {
    return (error as AuthError).message;
  }

  return null;
}
