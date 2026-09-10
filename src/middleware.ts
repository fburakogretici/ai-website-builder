import { createServerClient } from '@supabase/ssr';
import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';

const intlMiddleware = createMiddleware({
  locales: ['tr', 'en'],
  defaultLocale: 'en',
  localePrefix: 'always',
  localeDetection: true
});

export default async function middleware(request: NextRequest) {
  // 1. Skip middleware for auth callbacks and static files
  if (
    request.nextUrl.pathname.startsWith('/auth/') ||
    request.nextUrl.pathname.startsWith('/_next/') ||
    request.nextUrl.pathname.includes('.') // files like favicon.ico, robots.txt
  ) {
    return NextResponse.next();
  }

  // 2. Custom Domain & Path-based Routing Logic
  const hostname = request.headers.get('host')!;
  const pathname = request.nextUrl.pathname;

  // Handle /s/ routes (Path-based routing)
  // Rewrite /s/[subdomain] -> /en/s/[subdomain] to hide locale from public URL
  if (pathname.startsWith('/s/')) {
    const url = request.nextUrl.clone();
    url.pathname = `/en${pathname}`;
    return NextResponse.rewrite(url);
  }

  // Define allowed system domains
  // localhost:3000, localhost:3001, etc.
  // *.vercel.app (preview deployments)
  // nocodepage.tech (production)
  const isSystemDomain =
    hostname.includes('localhost') ||
    hostname.includes('vercel.app') ||
    hostname.includes('nocodepage.tech');

  if (!isSystemDomain) {
    // This is a custom domain (e.g. burakogretici.com)
    try {
      // Create a Supabase client to resolve the domain
      // NOTE: We use ANON_KEY here. Ensure 'custom_domains' table has a public RLS policy 
      // OR use SUPABASE_SERVICE_ROLE_KEY if available in env vars for bypassing RLS.
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() { return request.cookies.getAll() },
            setAll(cookiesToSet) {
              // Middleware can't set cookies on the request directly in this way for the client,
              // but we only need read access here.
            },
          },
        }
      );

      // Find the website associated with this domain
      const { data } = await supabase
        .from('custom_domains')
        .select('website_id, websites!inner(subdomain)')
        .eq('domain', hostname)
        .eq('verification_status', 'verified') // Only allow verified domains
        .single();

      if (data && data.websites) {
        // Rewrite the request to the path-based URL
        // Example: burakogretici.com/about -> /en/s/burak-site/about
        // Since 's' is now inside [locale], we must include a locale.
        // We use 'en' as the default internal locale for custom domains, 
        // or we could infer it from the user's settings if we had that info here.
        const url = request.nextUrl.clone();
        url.pathname = `/en/s/${(data.websites as any).subdomain}${url.pathname}`;
        return NextResponse.rewrite(url);
      }
    } catch (error) {
      console.error('Middleware domain resolution error:', error);
      // Fallthrough to 404 or main app if error
    }
  }

  // 3. i18n Middleware (for system domains)
  return intlMiddleware(request);
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)']
};
