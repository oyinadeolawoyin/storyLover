import { useEffect } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { Menu } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { InstagramIcon, TumblrIcon, XIcon } from '@/components/brandIcons'
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

const SOCIALS = [
  { label: 'X', href: 'https://x.com/Tolageek', icon: XIcon },
  { label: 'Instagram', href: 'https://www.instagram.com/oyinade_storylover/', icon: InstagramIcon },
  { label: 'Tumblr', href: 'https://www.tumblr.com/oyinade-storylover', icon: TumblrIcon },
]

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

      <footer className="border-t border-border bg-background">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <Logo className="text-2xl" />
            <p className="hand mt-2 text-xl leading-none text-sky">Create a story that moves your readers.</p>
          </div>

          <nav aria-label="Footer">
            <h2 className="font-sans text-xs font-bold uppercase tracking-[0.18em] text-foreground/60">Explore</h2>
            <ul className="mt-4 space-y-2 text-sm">
              {links.map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="text-foreground/75 hover:text-primary">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h2 className="font-sans text-xs font-bold uppercase tracking-[0.18em] text-foreground/60">Connect</h2>
            <div className="mt-4 flex items-center gap-4">
              {SOCIALS.map(({ label, href, icon: Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="text-foreground/60 transition-colors hover:text-primary"
                >
                  <Icon className="size-5" />
                </a>
              ))}
            </div>
            <a
              href="mailto:oyinadeolawoyin72@gmail.com"
              className="mt-4 inline-block break-all text-sm text-foreground/75 hover:text-primary"
            >
              oyinadeolawoyin72@gmail.com
            </a>
          </div>
        </div>

        <div className="border-t border-border">
          <div className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p>&copy; {new Date().getFullYear()} StoryLover</p>
            <p>#StoryLoversCommunity</p>
          </div>
        </div>
      </footer>
    </div>
  )
}