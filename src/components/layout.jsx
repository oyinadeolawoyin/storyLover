import { useEffect } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { Menu } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'

// Active link gets a straight pink line under it.
const linkClass = (active) =>
  cn(
    'relative px-3 py-2 text-sm font-semibold transition-colors hover:text-primary',
    active
      ? 'text-foreground after:absolute after:inset-x-3 after:-bottom-0.5 after:h-0.5 after:rounded-full after:bg-primary'
      : 'text-foreground/75'
  )

const mobileLinkClass = (active) =>
  cn(
    'rounded-lg px-3 py-2 text-base font-semibold',
    active ? 'bg-accent text-accent-foreground' : 'text-foreground/80'
  )

function Logo({ className }) {
  return (
    <span className={cn('font-heading font-bold', className)}>
      Story<span className="rounded-md bg-primary/90 px-1.5 text-primary-foreground">Lover</span>
    </span>
  )
}

export default function Layout() {
  const { pathname } = useLocation()

  // Start every page at the top when you navigate
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  // "Articles" stays lit on the list, on every article, and on every category page
  const articlesActive =
    pathname.startsWith('/articles') ||
    pathname.startsWith('/posts/') ||
    pathname.startsWith('/category/')

  const links = [
    { to: '/', label: 'Home', active: pathname === '/' },
    { to: '/articles', label: 'Articles', active: articlesActive },
    { to: '/about', label: 'About', active: pathname.startsWith('/about') },
  ]

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link to="/" aria-label="StoryLover home">
            <Logo className="text-2xl" />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-2 md:flex">
            {links.map((l) => (
              <Link key={l.to} to={l.to} className={linkClass(l.active)}>
                {l.label}
              </Link>
            ))}
          </nav>

          <p className="hand hidden text-lg leading-none text-sky xl:block">Create a story that moves your readers.</p>

          {/* Mobile nav */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
                <Menu className="size-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="bg-background" aria-describedby={undefined}>
              <SheetHeader>
                <SheetTitle>
                  <Logo className="text-2xl" />
                </SheetTitle>
              </SheetHeader>

              <nav className="flex flex-col gap-1 px-4">
                {links.map((l) => (
                  <SheetClose asChild key={l.to}>
                    <Link to={l.to} className={mobileLinkClass(l.active)}>
                      {l.label}
                    </Link>
                  </SheetClose>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-border bg-secondary/70">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-center md:justify-between">
          <div>
            <Logo className="text-xl" />
            <p className="hand mt-1 text-lg leading-none text-sky">Create a story that moves your readers.</p>
          </div>

          <nav className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-foreground/75">
            {links.map((l) => (
              <Link key={l.to} to={l.to} className="hover:text-primary">
                {l.label}
              </Link>
            ))}
          </nav>

          <p className="text-xs text-muted-foreground">&copy; {new Date().getFullYear()} StoryLover</p>
        </div>
      </footer>
    </div>
  )
}