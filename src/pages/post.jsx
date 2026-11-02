import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowRight, Check, Lightbulb, Link as LinkIcon } from 'lucide-react'
import { PostService } from '@/service/postService'
import MarkdownContent from '@/components/markdownContent'
import CategoryPill from '@/components/categoryPill'
import {
  BlueskyIcon,
  FacebookIcon,
  LinkedinIcon,
  PinterestIcon,
  ThreadsIcon,
  TumblrIcon,
  XIcon,
} from '@/components/brandIcons'
import AuthorCard from '@/components/authorCard'
import ArticleCard, { formatDate } from '@/components/articleCard'
import SectionHeading from '@/components/sectionHeading'
import Seo from '@/components/seo'
import ErrorMessage from '@/components/errorMessage'
import { PostSkeleton } from '@/components/skeletons'
import SubscribeForm from '@/components/subscribeForm'
import { useReadTracking } from '@/hooks/useReadTracking'
import { AnalyticsService } from '@/service/analyticsService'

const container = 'mx-auto max-w-7xl px-4 sm:px-6'

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

  if (loading && !post) return <PostSkeleton />

  if (error || !post) {
    // Supabase returns code PGRST116 when .single() finds no row, meaning the post really isn't there.
    // Anything else (network trouble, server error) is a loading problem, not a missing post.
    const notFound = !error || error.code === 'PGRST116'
    return notFound ? (
      <ErrorMessage
        variant="page"
        title="Post not found"
        message="It may have moved or been unpublished."
        onRetry={false}
        linkTo="/articles"
        linkLabel="Back to all articles"
      />
    ) : (
      <ErrorMessage
        variant="page"
        title="We couldn't load this post"
        message="Something went wrong on our end. Please check your connection and try again."
        linkTo="/articles"
        linkLabel="Back to all articles"
      />
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
          <ShareBox title={post.title} excerpt={post.excerpt} image={post.cover_image} slug={post.slug} />
        </div>

        <aside className="min-w-0 space-y-6">
          {/* On phones the share box at the end of the article is enough, so this one is desktop only */}
          <div className="hidden lg:block">
            <ShareCard title={post.title} excerpt={post.excerpt} image={post.cover_image} slug={post.slug} />
          </div>

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
        <div className="mb-8 text-center">
          <p className="hand text-3xl text-foreground/80">You made it to the end. Thank you for reading!</p>
          <p className="mt-3 text-sm text-foreground/70">
            Have thoughts or questions about this post? Come talk to me on{' '}
            <a
              href="https://x.com/Tolageek"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-sky underline-offset-4 hover:underline"
            >
              X
            </a>
            ,{' '}
            <a
              href="https://www.instagram.com/oyinade_storylover/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-sky underline-offset-4 hover:underline"
            >
              Instagram
            </a>
            , or{' '}
            <a
              href="https://www.tumblr.com/oyinade-storylover"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-sky underline-offset-4 hover:underline"
            >
              Tumblr
            </a>
            {' '}— I’d love to hear from you.
          </p>
        </div>
      </section>

      {/* ---------- Newsletter ---------- */}
      <section className={`${container} pb-16`}>
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

// ---------- Sharing ----------
// What every share carries: the post link (its slug), the title, the excerpt,
// the tagline and #storyLoversCommunity. The cover image is sent to Pinterest directly;
// on X, Facebook, LinkedIn, Threads and Bluesky the image comes from the page's Open Graph tags (see seo.jsx).
const HASHTAG = '#storyLoversCommunity'
const TAG_NAME = 'storyLoversCommunity' // the same tag without the # sign
const TAGLINE = 'Create a story that moves your readers.'

function clip(text, max) {
  if (!text || max <= 0) return ''
  if (text.length <= max) return text
  return text.slice(0, Math.max(0, max - 1)).replace(/\s+\S*$/, '').trimEnd() + '…'
}

// title + excerpt + tail, trimmed so the whole thing fits the platform's limit.
// The excerpt is the part that gets shortened. It is dropped if there is hardly any room.
function compose({ title, excerpt, tail, max }) {
  const t = clip(title, 120)
  const room = max - t.length - tail.length - 4 // 4 = the two blank lines
  const e = room >= 25 ? clip(excerpt, room) : ''
  return [t, e, tail].filter(Boolean).join('\n\n')
}

// Shared by the sidebar card and the end-of-article box
function useShare({ title, excerpt, image, slug }) {
  const [copied, setCopied] = useState(false)
  // The clean article address, built from the slug
  const url = typeof window !== 'undefined' ? `${window.location.origin}/posts/${slug}` : ''
  const enc = encodeURIComponent
  const summary = excerpt ?? ''

  // X: 280 characters, and the link always counts as about 23 of them
  const xText = compose({ title, excerpt: summary, tail: `${TAGLINE}\n${HASHTAG}`, max: 280 - 24 })

  // Bluesky: 300 characters and no separate link field, so the link goes inside the text
  const blueskyText = compose({ title, excerpt: summary, tail: `${TAGLINE}\n${HASHTAG}\n${url}`, max: 300 })

  // Threads: the link is attached as a card and the hashtag goes in as the post's topic tag
  const threadsText = compose({ title, excerpt: summary, tail: TAGLINE, max: 450 })

  const links = [
    {
      platform: 'facebook',
      label: 'Share on Facebook',
      // Facebook only takes the link (and a hashtag). The title, excerpt and image come from the page itself.
      href: `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}&hashtag=${enc(HASHTAG)}`,
      icon: FacebookIcon,
    },
    {
      platform: 'x',
      label: 'Share on X',
      href: `https://twitter.com/intent/tweet?text=${enc(xText)}&url=${enc(url)}`,
      icon: XIcon,
    },
    {
      platform: 'linkedin',
      label: 'Share on LinkedIn',
      // LinkedIn only takes the link. The title, excerpt and image come from the page itself.
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${enc(url)}`,
      icon: LinkedinIcon,
    },
    {
      platform: 'threads',
      label: 'Share on Threads',
      href: `https://www.threads.com/intent/post?text=${enc(threadsText)}&url=${enc(url)}&tag=${enc(TAG_NAME)}`,
      icon: ThreadsIcon,
    },
    {
      platform: 'bluesky',
      label: 'Share on Bluesky',
      href: `https://bsky.app/intent/compose?text=${enc(blueskyText)}`,
      icon: BlueskyIcon,
    },
    {
      platform: 'tumblr',
      label: 'Share on Tumblr',
      href:
        `https://www.tumblr.com/widgets/share/tool?posttype=link&canonicalUrl=${enc(url)}` +
        `&title=${enc(title)}&caption=${enc([summary, TAGLINE].filter(Boolean).join('\n\n'))}` +
        `&tags=${enc(TAG_NAME)}`,
      icon: TumblrIcon,
    },
  ]

  // Pinterest needs a picture, so it only shows when the post has a cover image
  if (image) {
    const pinText = compose({ title, excerpt: summary, tail: `${TAGLINE} ${HASHTAG}`, max: 480 })
    links.push({
      platform: 'pinterest',
      label: 'Pin on Pinterest',
      href: `https://pinterest.com/pin/create/button/?url=${enc(url)}&media=${enc(image)}&description=${enc(pinText)}`,
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
function ShareCard({ title, excerpt, image, slug }) {
  const { links, copied, copy } = useShare({ title, excerpt, image, slug })
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
function ShareBox({ title, excerpt, image, slug }) {
  const { links, copied, copy } = useShare({ title, excerpt, image, slug })
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