import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Search } from 'lucide-react'
import { PostService } from '@/service/postService'
import { CategoryService } from '@/service/categoryService'
import { Input } from '@/components/ui/input'
import ArticleCard from '@/components/articleCard'
import AuthorCard from '@/components/authorCard'
import { categoryTone } from '@/components/categoryPill'
import Seo from '@/components/seo'
import { ArticleCardSkeleton } from '@/components/skeletons'
import SubscribeForm from '@/components/subscribeForm'
import { cn } from '@/lib/utils'

const PAGE_SIZE = 6
const container = 'mx-auto max-w-7xl px-4 sm:px-6'

export default function Articles() {
  const { slug } = useParams() // set on /category/:slug, empty on /articles
  const [searchParams, setSearchParams] = useSearchParams()

  const q = searchParams.get('q') ?? ''
  const sort = searchParams.get('sort') === 'oldest' ? 'oldest' : 'newest'
  const page = Math.max(1, Number(searchParams.get('page')) || 1)

  const [categories, setCategories] = useState([])
  const [counts, setCounts] = useState({})
  const [result, setResult] = useState({ posts: [], total: 0, totalPages: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchInput, setSearchInput] = useState(q)

  // Categories and counts only need to load once
  useEffect(() => {
    Promise.all([CategoryService.list(), PostService.countsByCategory()])
      .then(([cats, cnts]) => {
        setCategories(cats)
        setCounts(cnts)
      })
      .catch((err) => console.error(err))
  }, [])

  // Posts reload whenever the category, search, sort or page changes
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    PostService.list({
      page,
      pageSize: PAGE_SIZE,
      categorySlug: slug,
      search: q,
      sort,
    })
      .then((data) => {
        if (!cancelled) setResult(data)
      })
      .catch((err) => {
        console.error(err)
        if (!cancelled) setError(err)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [slug, q, sort, page])

  // Keep the search box in step with the address bar
  useEffect(() => setSearchInput(q), [q])

  const currentCategory = categories.find((c) => c.slug === slug)
  const unknownCategory = slug && categories.length > 0 && !currentCategory
  const title = slug ? currentCategory?.name ?? '' : 'All articles'

  function updateParams(changes) {
    const next = new URLSearchParams(searchParams)
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value)
      else next.delete(key)
    }
    if (!('page' in changes)) next.delete('page') // new search or sort goes back to page 1
    setSearchParams(next)
  }

  function handleSearch(e) {
    e.preventDefault()
    updateParams({ q: searchInput.trim() })
  }

  // Category rows (right sidebar): small rectangles, a soft colour per category, solid when chosen
  const rowClass = (active, tone) =>
    cn(
      'flex items-center justify-between rounded-md border px-4 py-2.5 text-[12px] font-bold uppercase tracking-[0.12em] transition-colors',
      active ? tone.active : cn(tone.chip, 'text-foreground/85')
    )
  const countClass = (active) => cn('text-xs font-bold tabular-nums', active ? 'opacity-80' : 'text-muted-foreground')
  const allTone = {
    chip: 'bg-card border-border hover:border-foreground/40',
    active: 'bg-foreground border-foreground text-background',
  }
  const totalCount = categories.reduce((sum, c) => sum + (counts[c.id] ?? 0), 0)

  const first = result.total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
  const last = Math.min(page * PAGE_SIZE, result.total)

  return (
    <div>
      <Seo
        title={slug ? currentCategory?.name || 'Articles' : 'All articles'}
        description="Tips, ideas, and honest thoughts about storytelling and the process of becoming a better writer."
      />
      {/* ---------- Hero ---------- */}
      <section className="bg-gradient-to-b from-butter-soft/60 to-background">
        <div className={`${container} py-14 text-center md:py-20`}>
          <h1 className="rise text-4xl font-bold leading-tight md:text-6xl">
            <span className="marker-yellow">{title}</span>
          </h1>
          {!slug && (
            <p
              className="rise mx-auto mt-6 max-w-xl text-lg leading-relaxed text-foreground/80"
              style={{ animationDelay: '150ms' }}
            >
              Tips, ideas, and thoughts about storytelling and the process of writing.
            </p>
          )}
        </div>
      </section>

      <div className={`${container} grid gap-10 pb-12 pt-8 lg:grid-cols-[minmax(0,1fr)_320px] xl:gap-12`}>
        {/* ---------- Main column ---------- */}
        <div className="min-w-0">
          {/* Count + sort */}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm">
            <p className="text-muted-foreground">
              {result.total > 0 ? `Showing ${first}-${last} of ${result.total} articles` : ''}
              {q && <span> for "{q}"</span>}
            </p>
            <label className="flex items-center gap-2 text-muted-foreground">
              Sort by
              <select
                value={sort}
                onChange={(e) => updateParams({ sort: e.target.value === 'newest' ? '' : e.target.value })}
                className="rounded-full border border-input bg-card px-3 py-1.5 text-foreground"
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
              </select>
            </label>
          </div>

          {/* Posts */}
          {error && <p className="mt-8 text-destructive">Articles could not load. Check the console.</p>}
          {unknownCategory && <p className="mt-8 text-muted-foreground">That category does not exist.</p>}

          {!error && !unknownCategory && (
            <>
              <div
                className={cn(
                  'mt-4 grid gap-6 transition-opacity sm:grid-cols-2',
                  loading && result.posts.length > 0 && 'opacity-50'
                )}
                aria-busy={loading}
              >
                {loading && result.posts.length === 0
                  ? Array.from({ length: PAGE_SIZE }).map((_, i) => <ArticleCardSkeleton key={i} />)
                  : result.posts.map((p) => <ArticleCard key={p.id} post={p} />)}
              </div>

              {!loading && result.posts.length === 0 && (
                <p className="mt-8 text-muted-foreground">
                  {q ? 'No articles match your search.' : 'No articles here yet.'}
                </p>
              )}

              <Pagination
                page={page}
                totalPages={result.totalPages}
                onChange={(p) => {
                  updateParams({ page: p > 1 ? String(p) : '' })
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
              />
            </>
          )}
        </div>

        {/* ---------- Sidebar: stays in view while you scroll ---------- */}
        <aside className="min-w-0 space-y-6 lg:sticky lg:top-24 lg:self-start">
          <form onSubmit={handleSearch} className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search articles"
              aria-label="Search articles"
              className="h-11 rounded-full bg-card pl-10"
            />
          </form>

          {/* Categories */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
            <h2 className="hand text-3xl leading-none">Categories</h2>
            <ul className="mt-4 space-y-2">
              <li>
                <Link to="/articles" className={rowClass(!slug, allTone)}>
                  All
                  <span className={countClass(!slug)}>{totalCount}</span>
                </Link>
              </li>
              {categories.map((c) => {
                const active = c.slug === slug
                return (
                  <li key={c.id}>
                    <Link to={`/category/${c.slug}`} className={rowClass(active, categoryTone(c.slug))}>
                      {c.name}
                      <span className={countClass(active)}>{counts[c.id] ?? 0}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>

          <AuthorCard />
        </aside>
      </div>

      {/* ---------- Newsletter ---------- */}
      <section className={`${container} pb-14`}>
        <SubscribeForm wide />
      </section>
    </div>
  )
}

function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null

  // Show at most 5 page numbers around the current page
  const start = Math.max(1, Math.min(page - 2, totalPages - 4))
  const end = Math.min(totalPages, start + 4)
  const numbers = []
  for (let n = start; n <= end; n++) numbers.push(n)

  const base = 'flex size-10 items-center justify-center rounded-full border text-sm font-semibold'

  return (
    <nav aria-label="Pages" className="mt-10 flex items-center justify-center gap-2">
      <button
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        aria-label="Previous page"
        className={cn(base, 'border-border bg-card disabled:opacity-40')}
      >
        <ChevronLeft className="size-4" />
      </button>
      {numbers.map((n) => (
        <button
          key={n}
          onClick={() => onChange(n)}
          aria-current={n === page ? 'page' : undefined}
          className={cn(base, n === page ? 'border-sky bg-sky text-white' : 'border-border bg-card hover:border-sky')}
        >
          {n}
        </button>
      ))}
      <button
        onClick={() => onChange(page + 1)}
        disabled={page === totalPages}
        aria-label="Next page"
        className={cn(base, 'border-border bg-card disabled:opacity-40')}
      >
        <ChevronRight className="size-4" />
      </button>
    </nav>
  )
}