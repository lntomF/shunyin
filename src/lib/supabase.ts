import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();

export const isSupabaseConfigured = Boolean(supabaseUrl && supabasePublishableKey);
export const cloudUnavailableErrorMessage = 'Cloud sync is not configured for this environment.';

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabasePublishableKey!)
  : null;

export function requireSupabaseClient() {
  if (!supabase) {
    throw new Error(cloudUnavailableErrorMessage);
  }

  return supabase;
}
