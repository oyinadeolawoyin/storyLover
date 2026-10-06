import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, Brain, Lightbulb, LayoutGrid, Sparkles } from 'lucide-react'
import { PostService } from '@/service/postService'
import { CategoryService } from '@/service/categoryService'
import { Button } from '@/components/ui/button'
import SectionHeading from '@/components/sectionHeading'
import ArticleCard, { formatDate } from '@/components/articleCard'
import CategoryPill from '@/components/categoryPill'
import { NAV_ONLY_SLUGS } from '@/lib/siteConfig'
import SubscribeForm from '@/components/subscribeForm'
import Seo from '@/components/seo'

const EXPLORE_STYLES = [
  { bg: 'bg-rose-soft', icon: BookOpen },
  { bg: 'bg-sky-soft', icon: Lightbulb },
  { bg: 'bg-butter-soft', icon: Brain },
  { bg: 'bg-sage-soft', icon: Sparkles },
]

const container = 'mx-auto max-w-7xl px-4 sm:px-6'

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
          PostService.list({ page: 1, pageSize: 8, excludeCategorySlugs: NAV_ONLY_SLUGS }),
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
  const featured = posts[0]
  const featuredSide = posts.slice(1, 5)
  const latest = posts.slice(5, 8)

  return (
    <div>
      <Seo />
      {/* ---------- Hero ---------- */}
      <section className="bg-gradient-to-b from-butter-soft/60 to-background">
        <div className={`${container} grid items-center gap-8 py-12 md:grid-cols-2 md:py-16`}>
          <div>
            <p className="hand text-2xl text-sky">Hi, I'm so glad you're here</p>
            <h1 className="mt-3 text-4xl font-bold leading-tight md:text-5xl">
              Writing good stories is a skill, not a talent.
            </h1>
            <p className="mt-5 max-w-md text-lg leading-relaxed text-foreground/80">
              Learn storytelling, understand your story, and write a first draft that works.
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
              src="/hero-home.png"
              alt=""
              onError={() => setHeroOk(false)}
              className="mx-auto w-full max-w-lg rounded-2xl object-cover"
            />
          )}
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
          {/* ---------- Explore the blog ---------- */}
          {exploreCategories.length > 0 && (
            <section className="bg-sky-soft/50 py-12">
              <div className={container}>
                <SectionHeading
                  title="Explore the blog"
                  subtitle="Different parts of storytelling, one messy writer brain at a time."
                />
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

          {/* ---------- Featured articles ---------- */}
          {featured && (
            <section className={`${container} py-14`}>
              <SectionHeading title="Featured articles" to="/articles" linkLabel="See all articles" />
              <div className="grid gap-6 lg:grid-cols-2">
                <ArticleCard post={featured} variant="feature" />
                {featuredSide.length > 0 && (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                    {featuredSide.map((p) => (
                      <ArticleCard key={p.id} post={p} variant="compact" />
                    ))}
                  </div>
                )}
              </div>
            </section>
          )}

          {/* ---------- Latest articles + newsletter ---------- */}
          <section className={`${container} pb-14`}>
            <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
              <div>
                {latest.length > 0 && (
                  <>
                    <SectionHeading title="Latest articles" to="/articles" linkLabel="Browse the archive" />
                    <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
                      {latest.map((p) => (
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
                  </>
                )}
                {posts.length === 0 && <p className="text-muted-foreground">No posts yet. Check back soon.</p>}
              </div>

              <SubscribeForm className="self-start" />
            </div>
          </section>

          {/* ---------- About strip ---------- */}
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
                <h2 className="hand text-3xl">Hi, I'm Oyin</h2>
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