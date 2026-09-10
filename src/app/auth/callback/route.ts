import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') || '/tr/dashboard'

  // Use NEXT_PUBLIC_APP_URL for redirects to avoid container hostname issues
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || requestUrl.origin

  if (code) {
    const cookieStore = await cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, options)
              })
            } catch (error) {
              // Cookie setting might fail in some contexts
            }
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Use HTML redirect to avoid Nginx buffer issues with large cookies
      const redirectUrl = new URL(next, baseUrl).toString()
      return new NextResponse(
        `<!DOCTYPE html>
<html>
<head>
  <meta http-equiv="refresh" content="0;url=${redirectUrl}">
  <script>window.location.href="${redirectUrl}";</script>
</head>
<body>
  <p>Redirecting...</p>
</body>
</html>`,
        {
          status: 200,
          headers: {
            'Content-Type': 'text/html',
          },
        }
      )
    }
  }

  // Use HTML redirect for error case too
  const loginUrl = new URL('/tr/login', baseUrl).toString()
  return new NextResponse(
    `<!DOCTYPE html>
<html>
<head>
  <meta http-equiv="refresh" content="0;url=${loginUrl}">
  <script>window.location.href="${loginUrl}";</script>
</head>
<body>
  <p>Redirecting to login...</p>
</body>
</html>`,
    {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
      },
    }
  )
}
