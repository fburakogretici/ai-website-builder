import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') || '/tr/dashboard'

  if (code) {
    const cookieStore = await cookies()
    
    // Create the response first
    const response = NextResponse.redirect(new URL(next, requestUrl.origin))
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            // Set cookie in both places
            response.cookies.set(name, value, options)
          },
          remove(name: string, options: CookieOptions) {
            // Remove cookie in both places
            response.cookies.set(name, '', { ...options, maxAge: 0 })
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    console.log('Exchange code result:', { error, next })
    
    if (!error) {
      // Return the response with cookies set
      return response
    }
    
    console.error('Auth callback error:', error)
  }

  // If no code or error, redirect to login
  return NextResponse.redirect(new URL('/tr/login', requestUrl.origin))
}
