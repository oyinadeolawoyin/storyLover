import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, ExternalLink, LogOut } from 'lucide-react'
import { AuthService } from '@/service/authService'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import Seo from '@/components/seo'

const NAV = [
  { to: '/admin', label: 'Posts', match: (p) => p === '/admin' || p.startsWith('/admin/posts') },
  { to: '/admin/recommendations', label: 'Recommendations', match: (p) => p.startsWith('/admin/recommendations') },
  { to: '/admin/categories', label: 'Categories', match: (p) => p.startsWith('/admin/categories') },
  { to: '/admin/subscribers', label: 'Subscribers', match: (p) => p.startsWith('/admin/subscribers') },
]

/**
 * The frame around every admin page: header, menu, page title.
 * Props: title, subtitle, actions (buttons shown on the right), back ({ to, label }), children
 */
export default function AdminShell({ title, subtitle, actions, back, children }) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')

  useEffect(() => {
    AuthService.getSession()
      .then((s) => setEmail(s?.user?.email ?? ''))
      .catch((err) => console.error(err))
  }, [])

  async function handleLogout() {
    await AuthService.signOut()
    navigate('/admin/login')
  }

  return (
    <div className="min-h-screen bg-background">
      <Seo title={`${title} | Admin`} noindex />
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link to="/admin" className="flex items-baseline gap-2">
            <span className="font-heading text-xl font-bold">
              Story<span className="rounded-md bg-primary/90 px-1.5 text-primary-foreground">Lover</span>
            </span>
            <span className="hand text-xl text-sky">admin</span>
          </Link>

          <div className="flex items-center gap-2">
            {email && <span className="hidden text-sm text-muted-foreground lg:block">{email}</span>}
            <Button asChild variant="ghost" size="sm">
              <Link to="/" target="_blank">
                <ExternalLink className="size-4" /> View site
              </Link>
            </Button>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="size-4" /> Log out
            </Button>
          </div>
        </div>

        <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 pb-2 sm:px-6" aria-label="Admin">
          {NAV.map((item) => {
            const active = item.match(pathname)
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  'shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold transition-colors',
                  active ? 'bg-foreground text-background' : 'text-foreground/70 hover:bg-accent'
                )}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {back && (
          <Link
            to={back.to}
            className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-sky hover:underline"
          >
            <ArrowLeft className="size-4" /> {back.label}
          </Link>
        )}

        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold md:text-4xl">{title}</h1>
            {subtitle && <p className="mt-2 text-muted-foreground">{subtitle}</p>}
          </div>
          {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
        </div>

        {children}
      </main>
    </div>
  )
}