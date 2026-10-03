import { createClient, SupabaseClient } from '@supabase/supabase-js';

const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const envAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Fallback dummy URL to prevent createClient crash if env vars are missing
const DEFAULT_URL = 'https://placeholder-project.supabase.co';
const DEFAULT_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder';

export function getSupabaseCredentials() {
  if (typeof window !== 'undefined') {
    const localUrl = localStorage.getItem('badminton_supabase_url');
    const localKey = localStorage.getItem('badminton_supabase_key');
    if (localUrl && localKey) {
      return { url: localUrl, key: localKey, isCustom: true };
    }
  }

  const isConfigured = Boolean(
    envUrl && 
    envAnonKey && 
    envUrl !== 'https://your-project-id.supabase.co' &&
    envAnonKey !== 'your-anon-key'
  );

  return {
    url: isConfigured ? envUrl : DEFAULT_URL,
    key: isConfigured ? envAnonKey : DEFAULT_ANON_KEY,
    isCustom: false,
    isConfigured,
  };
}

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (supabaseInstance) return supabaseInstance;

  const creds = getSupabaseCredentials();
  supabaseInstance = createClient(creds.url, creds.key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });
  return supabaseInstance;
}

export const supabase = getSupabaseClient();

export function isSupabaseConfigured(): boolean {
  if (typeof window !== 'undefined') {
    const localUrl = localStorage.getItem('badminton_supabase_url');
    const localKey = localStorage.getItem('badminton_supabase_key');
    if (localUrl && localKey) return true;
  }
  return Boolean(
    envUrl && 
    envAnonKey && 
    !envUrl.includes('placeholder') && 
    !envUrl.includes('your-project')
  );
}

export function saveCustomSupabaseCredentials(url: string, key: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('badminton_supabase_url', url.trim());
    localStorage.setItem('badminton_supabase_key', key.trim());
    supabaseInstance = createClient(url.trim(), key.trim());
  }
}

export function clearCustomSupabaseCredentials() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('badminton_supabase_url');
    localStorage.removeItem('badminton_supabase_key');
    supabaseInstance = null;
  }
}
