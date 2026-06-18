'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'

const ERROR_MESSAGES: Record<string, { title: string; body: string }> = {
  not_invited: {
    title: 'Access Denied',
    body: "Your Google account isn't authorized to access this platform. This is invite-only software — contact your admin to request an invite.",
  },
  oauth_failed: {
    title: 'Sign-In Failed',
    body: 'Something went wrong during Google sign-in. Please try again. If the issue persists, contact support.',
  },
  missing_code: {
    title: 'Invalid Request',
    body: 'The authentication link appears to be broken or expired. Please return to the login page and try again.',
  },
}

function AuthErrorContent() {
  const params = useSearchParams()
  const reason = params.get('reason') ?? 'oauth_failed'
  const info = ERROR_MESSAGES[reason] ?? ERROR_MESSAGES.oauth_failed

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
      {/* Ambient glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-red-600/8 blur-[100px]" />
      </div>

      <div className="relative w-full max-w-md text-center">
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-10 backdrop-blur-xl shadow-2xl shadow-black/40">
          {/* Icon */}
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-red-500/10 border border-red-500/20 mb-6">
            <svg
              className="w-7 h-7 text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.8}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
              />
            </svg>
          </div>

          <h1 className="text-xl font-semibold text-white mb-3">{info.title}</h1>
          <p className="text-sm text-white/50 leading-relaxed mb-8">{info.body}</p>

          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg
              bg-white/[0.06] hover:bg-white/[0.10] border border-white/[0.10]
              text-white text-sm font-medium transition-all duration-150
              focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 focus:ring-offset-[#0a0a0a]"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
              />
            </svg>
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function AuthErrorPage() {
  return (
    <Suspense>
      <AuthErrorContent />
    </Suspense>
  )
}
