import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  // Supabase can redirect with ?error=... when something goes wrong on their side
  // (e.g. our DB trigger rejected the signup because the email isn't pre-authorized)
  const supabaseError = searchParams.get('error')
  const supabaseErrorDescription = searchParams.get('error_description') ?? ''

  if (supabaseError) {
    console.error('[Auth Callback] Supabase error:', supabaseError, supabaseErrorDescription)
    const isInviteError =
      supabaseErrorDescription.toLowerCase().includes('invite') ||
      supabaseErrorDescription.toLowerCase().includes('not authorized') ||
      supabaseErrorDescription.toLowerCase().includes('email') ||
      supabaseError === 'access_denied'

    return NextResponse.redirect(
      `${origin}/auth/error?reason=${isInviteError ? 'not_invited' : 'oauth_failed'}`
    )
  }

  if (!code) {
    console.error('[Auth Callback] No code and no error param received.')
    return NextResponse.redirect(`${origin}/auth/error?reason=missing_code`)
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    console.error('[Auth Callback] Code exchange error:', error.message)
    const isUnauthorized =
      error.message.toLowerCase().includes('invite') ||
      error.message.toLowerCase().includes('not authorized') ||
      error.message.toLowerCase().includes('email')
    return NextResponse.redirect(
      `${origin}/auth/error?reason=${isUnauthorized ? 'not_invited' : 'oauth_failed'}`
    )
  }

  // Double-check: verify this user has a profile row
  if (data?.user) {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role, business_id')
      .eq('auth_user_id', data.user.id)
      .single()

    if (profileError || !profile) {
      await supabase.auth.signOut()
      return NextResponse.redirect(`${origin}/auth/error?reason=not_invited`)
    }
  }

  // Success
  const forwardedHost = request.headers.get('x-forwarded-host')
  const isLocalEnv = process.env.NODE_ENV === 'development'

  if (isLocalEnv) {
    return NextResponse.redirect(`${origin}${next}`)
  } else if (forwardedHost) {
    return NextResponse.redirect(`https://${forwardedHost}${next}`)
  } else {
    return NextResponse.redirect(`${origin}${next}`)
  }
}
