import { createClient } from '@supabase/supabase-js'

// Singleton pattern - tek bir client instance kullan
let client: ReturnType<typeof createClient> | null = null;

export function createBrowserClient() {
  // Server-side rendering sırasında client oluşturma
  if (typeof window === 'undefined') {
    return null as any;
  }

  if (client) {
    return client;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Environment variables kontrolü
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase environment variables are not set');
    return null as any;
  }

  try {
    client = createClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          storageKey: 'nocodepage-auth',
          storage: typeof window !== 'undefined' ? window.localStorage : undefined,
          flowType: 'pkce' // Daha güvenli ve hızlı
        },
        global: {
          headers: {
            'x-application-name': 'nocodepage-ai'
          }
        }
      }
    );
  } catch (error) {
    console.error('Failed to create Supabase client:', error);
    return null as any;
  }

  return client;
}
