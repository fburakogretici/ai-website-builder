import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';

const intlMiddleware = createMiddleware({
  locales: ['tr', 'en'],
  defaultLocale: 'en', // Default to English for all non-Turkish browsers
  localePrefix: 'always',
  localeDetection: true
});

export default function middleware(request: NextRequest) {
  // Skip middleware for auth callbacks
  if (request.nextUrl.pathname.startsWith('/auth/')) {
    return NextResponse.next();
  }

  // Get browser language from Accept-Language header
  const acceptLanguage = request.headers.get('accept-language');
  
  // If browser language includes Turkish (tr), use Turkish
  // Otherwise, use English (en) as default for all other languages
  if (acceptLanguage?.toLowerCase().includes('tr')) {
    // Turkish browser detected
    return intlMiddleware(request);
  }
  
  // All other languages -> English
  return intlMiddleware(request);
}

export const config = {
  matcher: ['/', '/(tr|en)/:path*', '/auth/:path*']
};
