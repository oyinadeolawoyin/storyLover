import { useEffect, useMemo, useState } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { RecommendationService } from '@/service/recommendationService'
import { RECOMMENDATION_LINK_COLUMN } from '@/lib/siteConfig'
import { categoryTone } from '@/components/categoryPill'
import SectionHeading from '@/components/sectionHeading'
import SubscribeForm from '@/components/subscribeForm'
import Seo from '@/components/seo'
import { cn } from '@/lib/utils'

const container = 'mx-auto max-w-7xl px-4 sm:px-6'
const OTHER = 'other'

export default function Recommendations() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [active, setActive] = useState('all') // 'all' or a category slug
  const [heroOk, setHeroOk] = useState(true)

  useEffect(() => {
    async function loadItems() {
      try {
        setItems(await RecommendationService.list())
      } catch (err) {
        console.error(err)
        setError(err)
      } finally {
        setLoading(false)
      }
    }
    loadItems()
  }, [])

  // Group by category, A to Z, with "Other" always last
  const groups = useMemo(() => {
    const map = new Map()
    for (const item of items) {
      const slug = item.category?.slug ?? OTHER
      const name = item.category?.name ?? 'Other'
      if (!map.has(slug)) map.set(slug, { slug, name, items: [] })
      map.get(slug).items.push(item)
    }
    return [...map.values()].sort((a, b) => {
      if (a.slug === OTHER) return 1
      if (b.slug === OTHER) return -1
      return a.name.localeCompare(b.name)
    })
  }, [items])

  const visibleGroups = active === 'all' ? groups : groups.filter((g) => g.slug === active)

  const chipClass = (isActive, tone) =>
    cn(
      'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-all',
      isActive ? cn(tone.active, 'shadow-soft') : cn(tone.chip, 'text-foreground/85 hover:-translate-y-0.5')
    )
  const countClass = (isActive) =>
    cn('rounded-full px-2 py-0.5 text-xs font-bold', isActive ? 'bg-white/30' : 'bg-white/80 text-muted-foreground')
  const allTone = {
    chip: 'bg-card border-border hover:border-foreground/40',
    active: 'bg-foreground border-foreground text-background',
  }

  return (
    <div>
      <Seo
        title="Recommendations"
        description="Books, films, stories and tools I have found helpful, inspiring, or just really loved."
      />
      {/* ---------- Hero ---------- */}
      <section className="bg-gradient-to-b from-butter-soft/60 to-background">
        <div className={`${container} grid items-center gap-8 py-10 md:grid-cols-2 md:py-14`}>
          <div>
            <h1 className="text-4xl font-bold leading-tight md:text-6xl">
              <span className="marker-yellow">Recommendations</span>
            </h1>
            <p className="mt-5 max-w-md text-lg leading-relaxed text-foreground/80">
              Books, films, stories and tools I have found helpful, inspiring, or just really loved.
            </p>
          </div>
          {/* Put your hero illustration at public/hero-recommendations.png */}
          {heroOk && (
            <img
              src="/hero-recommendations.png"
              alt=""
              onError={() => setHeroOk(false)}
              className="mx-auto w-full max-w-lg rounded-2xl object-cover"
            />
          )}
        </div>
      </section>

      <div className={`${container} pb-12 pt-8`}>
        {loading && <p className="text-muted-foreground">Loading...</p>}
        {error && <p className="text-destructive">Recommendations could not load. Check the console.</p>}
        {!loading && !error && items.length === 0 && (
          <p className="text-muted-foreground">No recommendations yet. Check back soon.</p>
        )}

        {items.length > 0 && (
          <>
            {/* ---------- Category chips ---------- */}
            <div className="flex flex-wrap gap-3">
              <button onClick={() => setActive('all')} className={chipClass(active === 'all', allTone)}>
                All
                <span className={countClass(active === 'all')}>{items.length}</span>
              </button>
              {groups.map((g) => (
                <button
                  key={g.slug}
                  onClick={() => setActive(g.slug)}
                  className={chipClass(active === g.slug, categoryTone(g.slug))}
                >
                  {g.name}
                  <span className={countClass(active === g.slug)}>{g.items.length}</span>
                </button>
              ))}
            </div>

            {/* ---------- One section per category ---------- */}
            <div className="mt-10 space-y-14">
              {visibleGroups.map((g) => (
                <section key={g.slug}>
                  <SectionHeading title={g.name} />
                  <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                    {g.items.map((item) => (
                      <PickCard key={item.id} item={item} slug={g.slug} />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ---------- Newsletter ---------- */}
      <section className={`${container} pb-16`}>
        <SubscribeForm wide />
      </section>
    </div>
  )
}

// A poster-style card: big image, the name underneath, and a small arrow when it has a link.
function PickCard({ item, slug }) {
  const href = item[RECOMMENDATION_LINK_COLUMN]
  const tone = categoryTone(slug)

  const inner = (
    <>
      <div className="aspect-[3/4] overflow-hidden rounded-lg bg-muted">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt=""
            loading="lazy"
            className={cn('h-full w-full object-cover', href && 'transition-transform duration-300 group-hover:scale-105')}
          />
        ) : (
          <div className={cn('hand flex h-full w-full items-center justify-center text-6xl', tone.pill)}>
            {item.name?.[0]?.toUpperCase()}
          </div>
        )}
      </div>

      <div className="flex items-start justify-between gap-2 px-1 pb-1 pt-3">
        <h3 className="break-words font-heading text-base font-semibold leading-snug group-hover:text-primary sm:text-lg">
          {item.name}
        </h3>
        {href && <ArrowUpRight className="mt-1 size-4 shrink-0 text-sky" aria-hidden="true" />}
      </div>
    </>
  )

  const classes = 'card-soft group block p-3 transition-all'

  return href ? (
    <a href={href} target="_blank" rel="noreferrer" className={cn(classes, 'hover:-translate-y-1 hover:shadow-md')}>
      {inner}
    </a>
  ) : (
    <div className={classes}>{inner}</div>
  )
}