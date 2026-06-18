import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

// The login page must NOT render inside the main dashboard layout (with sidebar etc.)
// We use a separate layout that renders nothing but children.
export default async function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Already logged in — send straight to dashboard
  if (user) {
    redirect('/')
  }

  return <>{children}</>
}
