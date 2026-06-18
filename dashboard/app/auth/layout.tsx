// Layout for /auth/* routes — no sidebar, no header, just the page
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
