import { createBrowserClient as createSupabaseBrowserClient } from '@supabase/ssr'

let client: ReturnType<typeof createSupabaseBrowserClient> | null = null;

export function createBrowserClient() {
  if (client) {
    return client;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase environment variables are not set');
    return null as any;
  }

  client = createSupabaseBrowserClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      global: {
        headers: {
          'x-application-name': 'nocodepage-ai'
        },
        fetch: (url, options = {}) => {
          return fetch(url, options).catch(error => {
            // URL'i string'e çevir
            const urlString = typeof url === 'string' ? url : url.toString();

            // Sadece SSL/Certificate hatalarını sessizce handle et
            const isCertError = error.message?.includes('CERT') ||
              error.message?.includes('SSL') ||
              error.message?.includes('certificate');

            if (isCertError && urlString.includes('/auth/v1/token?grant_type=refresh_token')) {
              console.warn('Token refresh failed (suppressed):', error.message);
              return new Response(JSON.stringify({ error: 'Token refresh failed' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
              });
            }

            throw error;
          });
        }
      }
    }
  );

  return client;
}

export { createBrowserClient as createClient };
export default createBrowserClient;
