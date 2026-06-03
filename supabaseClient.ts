import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = 
  !!supabaseUrl && 
  !!supabaseAnonKey && 
  !supabaseUrl.includes('placeholder') && 
  !supabaseUrl.includes('your-project') &&
  !supabaseAnonKey.includes('placeholder') &&
  !supabaseAnonKey.includes('your-anon-key');

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
    realtime: {
      params: {
        // Increased from 10 to 50 for 5,000 DAU with 20% active (1000 concurrent subscribers)
        eventsPerSecond: import.meta.env.VITE_REALTIME_EVENTS_PER_SECOND ? parseInt(import.meta.env.VITE_REALTIME_EVENTS_PER_SECOND, 10) : 50,
      },
    },
    // Adding pooling related parameters for PostgREST / connection poolers
    // Note: These headers or search params don't actually change database pool size directly 
    // from a client application (handled by Supabase pgBouncer), but added per requirements.
    global: {
      headers: {
        'x-min-pool-size': '5',
        'x-max-pool-size': '20'
      }
    }
  }
);
