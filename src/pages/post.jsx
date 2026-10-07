import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowRight, Check, Lightbulb, Link as LinkIcon } from 'lucide-react'
import { PostService } from '@/service/postService'
import MarkdownContent from '@/components/markdownContent'
import CategoryPill from '@/components/categoryPill'
import SubscribeForm from '@/components/subscribeForm'
import AuthorCard from '@/components/authorCard'
import ArticleCard, { formatDate } from '@/components/articleCard'
import SectionHeading from '@/components/sectionHeading'
import Seo from '@/components/seo'
import { useReadTracking } from '@/hooks/useReadTracking'
import { AnalyticsService } from '@/service/analyticsService'

const container = 'mx-auto max-w-7xl px-4 sm:px-6'

// Brand icons are drawn here because newer versions of lucide-react no longer include them.
function XIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

function WhatsappIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}

function PinterestIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.39 18.592.026 11.985.026L12.017 0z" />
    </svg>
  )
}

function FacebookIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  )
}

function LinkedinIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0z" />
    </svg>
  )
}

export default function Post() {
  const { slug } = useParams() // the part of the address like /posts/my-first-story
  const [post, setPost] = useState(null)
  const [related, setRelated] = useState([])
  const [next, setNext] = useState(null)
  const [more, setMore] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [progress, setProgress] = useState(0)
  const [authorOk, setAuthorOk] = useState(true)
  const bodyRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    async function loadPost() {
      setLoading(true)
      setError(null)
      setRelated([])
      setNext(null)
      setMore([])
      try {
        const data = await PostService.getBySlug(slug)
        if (cancelled) return
        setPost(data)

        // Extras: if these fail the article still shows
        try {
          const [rel, nxt] = await Promise.all([
            PostService.related({ categoryId: data.category_id, excludeId: data.id, limit: 3 }),
            PostService.next({
              categoryId: data.category_id,
              publishedAt: data.published_at,
              excludeId: data.id,
            }),
          ])
          if (cancelled) return
          setRelated(rel)
          setNext(nxt)

          const mixed = await PostService.mixed({
            excludeIds: [data.id, ...rel.map((r) => r.id)],
            categoryId: data.category_id,
            limit: 3,
          })
          if (!cancelled) setMore(mixed)
        } catch (extrasError) {
          console.error(extrasError)
        }
      } catch (err) {
        console.error(err)
        if (!cancelled) setError(err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    loadPost()
    return () => {
      cancelled = true
    }
  }, [slug])

  // Reading progress: 0% when the text starts, 100% near its end
  useEffect(() => {
    function onScroll() {
      const el = bodyRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const total = rect.height - window.innerHeight * 0.6
      const done = total > 0 ? -rect.top / total : 0
      setProgress(Math.round(Math.min(Math.max(done, 0), 1) * 100))
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [post])

  // Analytics: counts the post as "read" when the reader reaches the end and stays long enough
  const endRef = useReadTracking({
    enabled: Boolean(post),
    slug: post?.slug,
    category: post?.category?.name,
    readMinutes: post?.read_minutes,
  })

  if (loading && !post) return <p className={`${container} py-16 text-muted-foreground`}>Loading...</p>

  if (error || !post) {
    return (
      <div className={`${container} py-16`}>
        <h1 className="text-3xl font-bold">Post not found</h1>
        <p className="mt-3 text-muted-foreground">It may have moved or been unpublished.</p>
        <Link to="/articles" className="mt-6 inline-block font-semibold text-sky hover:underline">
          Back to all articles
        </Link>
      </div>
    )
  }

  const resources = post.resources ?? []

  return (
    <article>
      <Seo
        title={post.title}
        description={post.excerpt || undefined}
        image={post.cover_image || undefined}
        type="article"
      />
      {/* Reading progress, sits under the header */}
      <div className="fixed inset-x-0 top-16 z-30 h-1">
        <div className="h-full bg-sky transition-[width] duration-100" style={{ width: `${progress}%` }} />
      </div>

      {/* ---------- Top: title on the left, cover on the right ---------- */}
      <header className="bg-gradient-to-b from-butter-soft/60 to-background">
        <div
          className={`${container} grid items-center gap-8 py-10 md:py-14 ${
            post.cover_image ? 'lg:grid-cols-2' : ''
          }`}
        >
          <div>
            {post.category && <CategoryPill category={post.category} link />}
            <h1 className="mt-4 text-4xl font-bold leading-tight md:text-5xl">{post.title}</h1>
            {post.excerpt && (
              <p className="mt-5 max-w-xl text-lg leading-relaxed text-foreground/80">{post.excerpt}</p>
            )}

            <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                {authorOk ? (
                  <img
                    src="/oyin.jpg"
                    alt=""
                    onError={() => setAuthorOk(false)}
                    className="size-9 rounded-full object-cover"
                  />
                ) : (
                  <span className="hand flex size-9 items-center justify-center rounded-full bg-primary/20 text-lg">
                    O
                  </span>
                )}
                By <strong className="text-foreground">Oyin</strong>
              </span>
              <span>{formatDate(post.published_at)}</span>
              <span>{post.read_minutes} min read</span>
            </div>
          </div>

          {post.cover_image && (
            <img
              src={post.cover_image}
              alt=""
              className="aspect-[4/3] w-full rounded-2xl object-cover shadow-soft"
            />
          )}
        </div>
      </header>

      {/* ---------- Body + sidebar ---------- */}
      <div className={`${container} grid gap-12 pb-12 pt-8 lg:grid-cols-[minmax(0,1fr)_320px]`}>
        <div className="min-w-0 max-w-3xl" ref={bodyRef}>
          {/* Optional quote: only shows if the post has one */}
          {post.quote && (
            <blockquote className="mb-8 border-l-4 border-primary pl-5 font-heading text-2xl italic leading-snug">
              {post.quote}
            </blockquote>
          )}

          <MarkdownContent className="article-body" content={post.content} />

          {/* Optional exercise */}
          {post.exercise && (
            <section className="mt-10 flex gap-4 rounded-xl border border-border bg-sky-soft p-6">
              <Lightbulb className="mt-1 size-7 shrink-0 text-sky" strokeWidth={1.5} />
              <div>
                <h3 className="hand text-3xl leading-none">Try this</h3>
                <p className="mt-3 leading-relaxed">{post.exercise}</p>
              </div>
            </section>
          )}

          {/* Optional resources: only shows if the list has items */}
          {resources.length > 0 && (
            <section className="mt-10">
              <h3 className="hand text-3xl leading-none">Helpful resources</h3>
              <ul className="mt-4 space-y-2">
                {resources.map((r) => (
                  <li key={r.url}>
                    <a
                      href={r.url}
                      target="_blank"
                      rel="noreferrer"
                      className="font-semibold text-sky underline-offset-4 hover:underline"
                    >
                      {r.title}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Analytics marker: when this scrolls into view the reader has reached the end */}
          <div ref={endRef} aria-hidden="true" />

          {/* After the reading is done */}
          <ShareBox title={post.title} image={post.cover_image} slug={post.slug} />
        </div>

        <aside className="min-w-0 space-y-6">
          <ShareCard title={post.title} image={post.cover_image} slug={post.slug} />

          {related.length > 0 && (
            <div className="card-soft p-6">
              <h2 className="hand text-3xl leading-none">Related articles</h2>
              <ul className="mt-4 space-y-4">
                {related.map((p) => (
                  <li key={p.id}>
                    <MiniArticle post={p} />
                  </li>
                ))}
              </ul>
            </div>
          )}

          {next && (
            <div className="rounded-xl border border-border bg-sky-soft/60 p-6">
              <h2 className="hand flex items-center justify-between text-3xl leading-none">
                Next article <ArrowRight className="size-5 text-sky" />
              </h2>
              <div className="mt-4">
                <MiniArticle post={next} />
              </div>
            </div>
          )}

          <AuthorCard />
        </aside>
      </div>

      {/* ---------- End of the article ---------- */}
      <section className={`${container} pb-16`}>
        <p className="hand mb-8 text-center text-3xl text-foreground/80">
          You made it to the end. Thank you for reading.
        </p>
        <SubscribeForm wide />
      </section>

      {/* ---------- More to read: a mix of categories ---------- */}
      {more.length > 0 && (
        <section className={`${container} pb-16`}>
          <SectionHeading title="More to read" to="/articles" linkLabel="See all articles" />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {more.map((m) => (
              <ArticleCard key={m.id} post={m} />
            ))}
          </div>
        </section>
      )}
    </article>
  )
}

function MiniArticle({ post }) {
  return (
    <Link to={`/posts/${post.slug}`} className="group flex items-center gap-4">
      <div className="size-16 shrink-0 overflow-hidden rounded-lg bg-muted">
        {post.cover_image && (
          <img src={post.cover_image} alt="" loading="lazy" className="h-full w-full object-cover" />
        )}
      </div>
      <div className="min-w-0">
        <CategoryPill category={post.category} />
        <h3 className="mt-1.5 line-clamp-2 break-words text-sm font-semibold leading-snug group-hover:text-primary">
          {post.title}
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">{post.read_minutes} min read</p>
      </div>
    </Link>
  )
}

// Shared by the sidebar card and the end-of-article box
function useShare(title, image, slug) {
  const [copied, setCopied] = useState(false)
  // The clean article address, without anything extra on the end
  const url = typeof window !== 'undefined' ? window.location.origin + window.location.pathname : ''
  const u = encodeURIComponent(url)
  const t = encodeURIComponent(title)

  const links = [
    { platform: 'x', label: 'Share on X', href: `https://twitter.com/intent/tweet?url=${u}&text=${t}`, icon: XIcon },
    { platform: 'facebook', label: 'Share on Facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${u}`, icon: FacebookIcon },
    { platform: 'linkedin', label: 'Share on LinkedIn', href: `https://www.linkedin.com/sharing/share-offsite/?url=${u}`, icon: LinkedinIcon },
    { platform: 'whatsapp', label: 'Share on WhatsApp', href: `https://wa.me/?text=${t}%20${u}`, icon: WhatsappIcon },
  ]

  // Pinterest needs a picture, so it only shows when the post has a cover image
  if (image) {
    links.push({
      platform: 'pinterest',
      label: 'Pin on Pinterest',
      href: `https://pinterest.com/pin/create/button/?url=${u}&media=${encodeURIComponent(image)}&description=${t}`,
      icon: PinterestIcon,
    })
  }

  async function copy() {
    AnalyticsService.share({ slug, platform: 'copy-link' })
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error(err)
    }
  }

  return { links, copied, copy }
}

const roundBtn =
  'flex size-10 items-center justify-center rounded-full bg-sky text-white transition-opacity hover:opacity-85'

// Right panel, above Related articles
function ShareCard({ title, image, slug }) {
  const { links, copied, copy } = useShare(title, image, slug)
  return (
    <div className="card-soft p-6">
      <h2 className="hand text-3xl leading-none">Share this article</h2>
      <div className="mt-4 flex flex-wrap gap-3">
        {links.map(({ label, href, icon: Icon, platform }) => (
          <a
            key={label}
            href={href}
            target="_blank"
            rel="noreferrer"
            aria-label={label}
            className={roundBtn}
            onClick={() => AnalyticsService.share({ slug, platform })}
          >
            <Icon className="size-4" />
          </a>
        ))}
        <button onClick={copy} aria-label="Copy link" className={roundBtn}>
          {copied ? <Check className="size-4" /> : <LinkIcon className="size-4" />}
        </button>
      </div>
    </div>
  )
}

// After the reading is done
function ShareBox({ title, image, slug }) {
  const { links, copied, copy } = useShare(title, image, slug)
  return (
    <section className="mt-12 rounded-xl border border-border bg-sky-soft p-6 text-center sm:p-8">
      <h2 className="hand text-4xl leading-none">Know a writer who needs this?</h2>
      <p className="mx-auto mt-3 max-w-md leading-relaxed text-foreground/80">
        A friend or a fellow writer out there may be stuck on their story right now. Sharing this could be the help they need.
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        {links.map(({ label, href, icon: Icon, platform }) => (
          <a
            key={label}
            href={href}
            target="_blank"
            rel="noreferrer"
            aria-label={label}
            onClick={() => AnalyticsService.share({ slug, platform })}
            className="flex size-11 items-center justify-center rounded-full bg-sky text-white transition-opacity hover:opacity-85"
          >
            <Icon className="size-4" />
          </a>
        ))}
        <button
          onClick={copy}
          className="inline-flex h-11 items-center gap-2 rounded-full border border-sky bg-white px-5 text-sm font-semibold text-sky transition-colors hover:bg-sky hover:text-white"
        >
          {copied ? <Check className="size-4" /> : <LinkIcon className="size-4" />}
          {copied ? 'Link copied' : 'Copy link'}
        </button>
      </div>
    </section>
  )
}