import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, Brain, Lightbulb, LayoutGrid, Sparkles } from 'lucide-react'
import { PostService } from '@/service/postService'
import { CategoryService } from '@/service/categoryService'
import { Button } from '@/components/ui/button'
import SectionHeading from '@/components/sectionHeading'
import { formatDate } from '@/components/articleCard'
import CategoryPill from '@/components/categoryPill'
import { NAV_ONLY_SLUGS } from '@/lib/siteConfig'
import CheckerCta from '@/components/checkerCta'
import Seo from '@/components/seo'

const EXPLORE_STYLES = [
  { bg: 'bg-rose-soft', icon: BookOpen },
  { bg: 'bg-sky-soft', icon: Lightbulb },
  { bg: 'bg-butter-soft', icon: Brain },
  { bg: 'bg-sage-soft', icon: Sparkles },
]

// The worries, written like sticky notes on a wall.
// rotate = how much each note is tilted. The "trash" note leans the most and hangs a bit lower.
const NOTES = [
  { text: "Something feels off in my story, but I can't tell what.", bg: 'bg-butter-soft', rotate: -2.5 },
  { text: "Maybe I'll take a walk, or a little nap, and work it out later.", bg: 'bg-sky-soft', rotate: 1.5 },
  { text: "This idea isn't working anymore. It's going in the trash.", bg: 'bg-rose-soft', rotate: 6, extra: 'sm:mt-8' },
  { text: 'Why do I keep losing interest in all my story ideas?', bg: 'bg-sage-soft', rotate: -1.5 },
  { text: "I just feel like my story isn't worth reading.", bg: 'bg-butter-soft', rotate: 2.5 },
]

const container = 'mx-auto max-w-7xl px-4 sm:px-6'

// Fades and slides an element in the first time it scrolls into view.
// People whose device is set to "reduce motion" just see it, with no movement.
function Reveal({ children, className = '', style, delay = 0 }) {
  const ref = useRef(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    let timer
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          timer = setTimeout(() => setShown(true), delay)
          observer.disconnect()
        }
      },
      { threshold: 0.2 }
    )
    observer.observe(el)
    return () => {
      observer.disconnect()
      clearTimeout(timer)
    }
  }, [delay])

  return (
    <div
      ref={ref}
      style={style}
      className={`transition-all duration-700 ease-out motion-reduce:translate-y-0 motion-reduce:opacity-100 motion-reduce:transition-none ${
        shown ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
      } ${className}`}
    >
      {children}
    </div>
  )
}

function StickyNote({ note, index }) {
  return (
    <Reveal
      delay={index * 250}
      style={{ rotate: `${note.rotate}deg` }}
      className={`relative w-full max-w-xs rounded-sm p-6 pt-8 shadow-md hover:scale-[1.04] hover:shadow-lg sm:w-72 ${note.bg} ${note.extra ?? ''}`}
    >
      {/* a little piece of tape */}
      <span
        aria-hidden="true"
        className="absolute -top-3 left-1/2 h-6 w-20 -translate-x-1/2 -rotate-3 bg-white/70 shadow-sm"
      />
      <p className="hand text-2xl leading-snug">{note.text}</p>
    </Reveal>
  )
}

export default function Home() {
  const [posts, setPosts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [heroOk, setHeroOk] = useState(true)
  const [authorOk, setAuthorOk] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [list, cats] = await Promise.all([
          PostService.list({ page: 1, pageSize: 6, excludeCategorySlugs: NAV_ONLY_SLUGS }),
          CategoryService.list(),
        ])
        setPosts(list.posts)
        setCategories(cats)
      } catch (err) {
        console.error(err)
        setError(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const exploreCategories = categories.filter((c) => !NAV_ONLY_SLUGS.includes(c.slug)).slice(0, 3)

  return (
    <div>
      <Seo />

      {/* ---------- 1. Greeting and intro ---------- */}
      <section className="bg-gradient-to-b from-butter-soft/60 to-background">
        <div className={`${container} grid items-center gap-8 py-12 md:grid-cols-2 md:py-16`}>
          <div>
            <h1 className="hand text-4xl leading-tight text-sky md:text-5xl">
              Hi, I'm so glad you're here.
            </h1>
            <p className="mt-5 max-w-lg text-lg leading-relaxed text-foreground/85 md:text-xl">
              I'm Oyinade. I created this blog for writers who are tired of guessing why a story isn't working
              and want to use the psychology of storytelling to hook their readers and keep them turning
              the pages.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="rounded-full px-6">
                <Link to="/articles">Start reading</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-full border-sky px-6 text-sky hover:text-sky">
                <Link to="/about">About me</Link>
              </Button>
            </div>
          </div>

          {/* Put your hero illustration at public/hero-home.png */}
          {heroOk && (
            <img
              src="/hero-home.jpg"
              alt=""
              onError={() => setHeroOk(false)}
              className="mx-auto w-full max-w-lg rounded-2xl object-cover"
            />
          )}
        </div>
      </section>

      {/* ---------- 2. The hook + the sticky notes ---------- */}
      <section className="py-14 md:py-20">
        <div className={container}>
          <Reveal className="mx-auto max-w-3xl text-center">
            <p className="hand text-2xl text-sky">Did you know?</p>
            <h2 className="mt-2 text-3xl font-bold leading-tight md:text-4xl">
              Writing a good story is a skill, not a talent.
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-foreground/80">
              We're built for stories, but we aren't born knowing how to write them well. That part has to be
              learned, and I'm here to share what I'm learning.
            </p>
          </Reveal>

          <Reveal className="mt-14 text-center" delay={100}>
            <p className="hand text-3xl">Sound familiar?</p>
          </Reveal>

          <div className="mt-8 flex flex-wrap justify-center gap-6">
            {NOTES.map((note, i) => (
              <StickyNote key={note.text} note={note} index={i} />
            ))}
          </div>

          {/* The turn: from worry to hope */}
          <Reveal className="mx-auto mt-16 max-w-2xl text-center">
            <p className="text-xl text-foreground/80">
              If you've thought any of these, you're in the right place.
            </p>
            <p className="mt-3 font-heading text-2xl font-semibold leading-snug md:text-3xl">
              They aren't signs of a bad writer. They're signs that the story needs{' '}
              <span className="marker">better design</span>.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ---------- 3. What a good story is (and isn't) ---------- */}
      <section className="bg-sky-soft/50 py-14 md:py-20">
        <div className={container}>
          <div className="mx-auto max-w-3xl">
            <div className="space-y-3 font-heading text-2xl leading-snug md:text-3xl">
              <Reveal delay={0}>
                <p>
                  A good story <span className="text-primary">≠</span> a perfect outline.
                </p>
              </Reveal>
              <Reveal delay={150}>
                <p>
                  A good story <span className="text-primary">≠</span> fancy prose.
                </p>
              </Reveal>
              <Reveal delay={300}>
                <p>
                  A good story <span className="text-primary">≠</span> the best idea.
                </p>
              </Reveal>
              <Reveal delay={450}>
                <p className="font-bold">
                  A good story <span className="text-sky">=</span>{' '}
                  <span className="marker-yellow">careful story design</span>.
                </p>
              </Reveal>
            </div>

            <Reveal className="mt-10" delay={200}>
              <p className="text-lg leading-relaxed text-foreground/85 md:text-xl">
                That's why I say <strong>story design</strong>, not story development. A story isn't
                something you pile up. It's something you shape, the way a painter shapes a blank canvas,
                choosing every colour, every shadow and every line on purpose.
              </p>
              <p className="hand mt-4 text-3xl text-sky md:text-4xl">You're the artist here. Enjoy it.</p>
            </Reveal>
          </div>
        </div>
      </section>

      {loading && <p className={`${container} py-16 text-muted-foreground`}>Loading...</p>}
      {error && (
        <p className={`${container} py-16 text-destructive`}>
          Posts could not load. Check the console for details.
        </p>
      )}

      {!loading && !error && (
        <>
          {/* ---------- 4. Latest articles, then the newsletter underneath ---------- */}
          <section className={`${container} py-14`}>
            <SectionHeading title="Latest articles" to="/articles" linkLabel="See all articles" />

            {posts.length === 0 ? (
              <p className="text-muted-foreground">No posts yet. Check back soon.</p>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {posts.map((p) => (
                  <Link key={p.id} to={`/posts/${p.slug}`} className="group block">
                    <div className="aspect-[4/3] overflow-hidden rounded-lg bg-muted">
                      {p.cover_image && (
                        <img
                          src={p.cover_image}
                          alt=""
                          loading="lazy"
                          className="h-full w-full object-cover"
                        />
                      )}
                    </div>
                    <div className="mt-3">
                      <CategoryPill category={p.category} />
                    </div>
                    <h3 className="mt-2 text-base font-semibold leading-snug group-hover:text-primary">
                      {p.title}
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatDate(p.published_at)} &nbsp;·&nbsp; {p.read_minutes} min read
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section className={`${container} pb-14`}>
            <CheckerCta wide />
          </section>

          {/* ---------- 5. Explore the blog ---------- */}
          {exploreCategories.length > 0 && (
            <section className="bg-sky-soft/50 py-12">
              <div className={container}>
                <SectionHeading title="Explore the blog" />
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {exploreCategories.map((c, i) => {
                    const { bg, icon: Icon } = EXPLORE_STYLES[i % EXPLORE_STYLES.length]
                    return (
                      <Link
                        key={c.id}
                        to={`/category/${c.slug}`}
                        className={`${bg} flex flex-col rounded-xl border border-border p-6 transition-shadow hover:shadow-md`}
                      >
                        <Icon className="size-8 text-foreground/70" strokeWidth={1.5} />
                        <h3 className="mt-4 text-xl font-semibold">{c.name}</h3>
                        {c.description && (
                          <p className="mt-2 text-sm leading-relaxed text-foreground/75">{c.description}</p>
                        )}
                        <span className="mt-auto pt-5 text-sm font-semibold text-sky">Explore</span>
                      </Link>
                    )
                  })}

                  <Link
                    to="/articles"
                    className="flex flex-col rounded-xl border border-border bg-card p-6 transition-shadow hover:shadow-md"
                  >
                    <LayoutGrid className="size-8 text-foreground/70" strokeWidth={1.5} />
                    <h3 className="mt-4 text-xl font-semibold">All articles</h3>
                    <p className="mt-2 text-sm text-foreground/75">Just show me everything.</p>
                    <span className="mt-auto pt-5 text-sm font-semibold text-sky">Browse all</span>
                  </Link>
                </div>
              </div>
            </section>
          )}

          {/* ---------- 6. About strip ---------- */}
          <section className="bg-butter-soft/70">
            <div className={`${container} flex flex-col items-center gap-6 py-10 sm:flex-row`}>
              {/* Put your photo at public/oyin.jpg */}
              {authorOk ? (
                <img
                  src="/oyin.jpg"
                  alt="Oyin"
                  onError={() => setAuthorOk(false)}
                  className="size-28 shrink-0 rounded-full object-cover"
                />
              ) : (
                <div className="hand flex size-28 shrink-0 items-center justify-center rounded-full bg-primary/20 text-5xl">
                  O
                </div>
              )}
              <div className="text-center sm:text-left">
                <h2 className="hand text-3xl">Hi, I'm Oyinade</h2>
                <p className="mt-2 max-w-xl leading-relaxed text-foreground/80">
                  I'm a writer who studies storytelling, writes stories, and shares what I learn along the way.
                </p>
                <Button asChild variant="outline" className="mt-4 rounded-full border-sky text-sky hover:text-sky">
                  <Link to="/about">More about me</Link>
                </Button>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  )
}