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
          },
          fetch: (url, options = {}) => {
            // Normal fetch çağrısı yap
            return fetch(url, options).catch(error => {
              // URL'i string'e çevir
              const urlString = typeof url === 'string' ? url : url.toString();
              
              // Sadece SSL/Certificate hatalarını sessizce handle et
              // OAuth ve diğer kritik işlemler için hataları fırlat
              const isCertError = error.message?.includes('CERT') || 
                                 error.message?.includes('SSL') ||
                                 error.message?.includes('certificate');
              
              if (isCertError && urlString.includes('/auth/v1/token?grant_type=refresh_token')) {
                // Sadece token refresh hatalarını bastır
                console.warn('Token refresh failed (suppressed):', error.message);
                return new Response(JSON.stringify({ error: 'Token refresh failed' }), {
                  status: 401,
                  headers: { 'Content-Type': 'application/json' }
                });
              }
              
              // Diğer tüm hatalar (OAuth, sign in, vb.) için hatayı fırlat
              throw error;
            });
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
