import { createClient } from '@supabase/supabase-js'

// Singleton pattern - tek bir client instance kullan
let client: ReturnType<typeof createClient> | null = null;

export function createBrowserClient() {
  if (client) {
    return client;
  }

  client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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

  return client;
}
