import { useEffect, useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { Bookmark, ChevronDown, Coffee, Menu, Star } from 'lucide-react'
import { CategoryService } from '@/service/categoryService'
import { NAV_ONLY_SLUGS, OFF_THE_PAGE_SLUG, REVIEWS_SLUG } from '@/lib/siteConfig'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'

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
  const [categories, setCategories] = useState([])
  const { pathname } = useLocation()

  useEffect(() => {
    CategoryService.list()
      .then(setCategories)
      .catch((err) => console.error(err))
  }, [])

  // Start every page at the top when you navigate
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  const reviews = categories.find((c) => c.slug === REVIEWS_SLUG)
  const offThePage = categories.find((c) => c.slug === OFF_THE_PAGE_SLUG)

  // "Articles" stays lit on the list, on every article, and on the normal category pages
  const onNavOnlyCategory = NAV_ONLY_SLUGS.some((s) => pathname === `/category/${s}`)
  const articlesActive =
    pathname.startsWith('/articles') ||
    pathname.startsWith('/posts/') ||
    (pathname.startsWith('/category/') && !onNavOnlyCategory)

  const before = [
    { to: '/', label: 'Home', active: pathname === '/' },
    { to: '/articles', label: 'Articles', active: articlesActive },
  ]

  // The "More" menu: things that are not regular articles.
  const more = [
    {
      to: '/recommendations',
      label: 'Recommendations',
      hint: 'Books, films and tools I love',
      icon: Bookmark,
    },
    reviews && {
      to: `/category/${reviews.slug}`,
      label: reviews.name,
      hint: 'My honest takes on stories',
      icon: Star,
    },
    offThePage && {
      to: `/category/${offThePage.slug}`,
      label: offThePage.name,
      hint: 'Life beyond the writing',
      icon: Coffee,
    },
  ]
    .filter(Boolean)
    .map((m) => ({ ...m, active: pathname === m.to }))

  const moreActive = more.some((m) => m.active)

  const after = [{ to: '/about', label: 'About', active: pathname.startsWith('/about') }]

  const footerLinks = [...before, ...more, ...after]

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link to="/" aria-label="StoryLover home">
            <Logo className="text-2xl" />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-2 md:flex">
            {before.map((l) => (
              <Link key={l.to} to={l.to} className={linkClass(l.active)}>
                {l.label}
              </Link>
            ))}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={cn(linkClass(moreActive), 'inline-flex items-center gap-1 outline-none')}
                >
                  More <ChevronDown className="size-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-72 rounded-xl p-2">
                {more.map((m) => (
                  <DropdownMenuItem key={m.to} asChild className="cursor-pointer rounded-lg p-2.5">
                    <Link to={m.to} className="flex items-start gap-3">
                      <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent">
                        <m.icon className="size-4 text-foreground/70" />
                      </span>
                      <span>
                        <span className="block text-sm font-semibold">{m.label}</span>
                        <span className="block text-xs text-muted-foreground">{m.hint}</span>
                      </span>
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {after.map((l) => (
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
                {before.map((l) => (
                  <SheetClose asChild key={l.to}>
                    <Link to={l.to} className={mobileLinkClass(l.active)}>
                      {l.label}
                    </Link>
                  </SheetClose>
                ))}

                <Separator className="my-2" />
                <p className="px-3 text-xs font-bold text-muted-foreground">More</p>
                {more.map((m) => (
                  <SheetClose asChild key={m.to}>
                    <Link to={m.to} className={mobileLinkClass(m.active)}>
                      {m.label}
                    </Link>
                  </SheetClose>
                ))}
                <Separator className="my-2" />

                {after.map((l) => (
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
            {footerLinks.map((l) => (
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