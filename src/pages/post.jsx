import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowRight, Lightbulb } from 'lucide-react'
import { PostService } from '@/service/postService'
import MarkdownContent from '@/components/markdownContent'
import CategoryPill from '@/components/categoryPill'
import ShareButtons from '@/components/shareButtons'
import { Button } from '@/components/ui/button'
import ArticleCard, { formatDate } from '@/components/articleCard'
import SectionHeading from '@/components/sectionHeading'
import Seo from '@/components/seo'
import ErrorMessage from '@/components/errorMessage'
import { PostSkeleton } from '@/components/skeletons'
import SubscribeForm from '@/components/subscribeForm'
import Comments from '@/components/comments'
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
  const [toc, setToc] = useState([]) // headings found in the article body
  const [activeId, setActiveId] = useState(null) // heading the reader is currently on

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

  // Table of contents: read the h2/h3 headings the markdown produced, give each an id, list them
  useEffect(() => {
    const root = bodyRef.current
    if (!root) return
    const nodes = Array.from(root.querySelectorAll('.article-body h2, .article-body h3'))
    const used = new Set()
    const items = nodes.map((node) => {
      let id = node.id
      if (!id) {
        const base = slugify(node.textContent)
        id = base
        let n = 2
        while (used.has(id) || document.getElementById(id)) id = `${base}-${n++}`
        node.id = id
      }
      used.add(id)
      node.classList.add('scroll-mt-24') // keeps the heading clear of the fixed header when jumped to
      return { id, text: node.textContent, level: node.tagName === 'H3' ? 3 : 2 }
    })
    setToc(items)
    setActiveId(items[0]?.id ?? null)

    // Highlight the section being read
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActiveId(entry.target.id)
        }
      },
      { rootMargin: '-90px 0px -70% 0px' }
    )
    nodes.forEach((n) => observer.observe(n))
    return () => observer.disconnect()
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
                By <strong className="text-foreground">Oyinade</strong>
              </span>
              <span>{formatDate(post.published_at)}</span>
              <span>{post.read_minutes} min read</span>
            </div>
          </div>

          {post.cover_image && (
            <img
              src={post.cover_image}
              alt=""
              className="aspect-[4/3] w-full rounded-none object-cover shadow-soft"
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

          {/* Phones and tablets: collapsible contents above the text (the sidebar one is desktop only) */}
          <div className="mb-8 lg:hidden">
            <TableOfContents items={toc} activeId={activeId} collapsible />
          </div>

          <MarkdownContent className="article-body" content={post.content} />

          {/* Optional exercise */}
          {post.exercise && (
            <section className="mt-10 flex gap-4 rounded-none border border-border bg-sky-soft p-6">
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

          {/* Share, right at the bottom of the post */}
          <div className="mt-10">
            <ShareBox title={post.title} excerpt={post.excerpt} image={post.cover_image} slug={post.slug} />
          </div>
        </div>

        {/* Contents: desktop only, sticks under the header while the reader scrolls.
            Phones get a collapsible one above the text instead. */}
        <aside className="hidden min-w-0 lg:block">
          <div className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto">
            <TableOfContents items={toc} activeId={activeId} />
          </div>
        </aside>
      </div>

      {/* ---------- Comments: their own coloured band ---------- */}
      <section className="bg-rose-soft/50 py-16">
        <div className={container}>
          <div className="mx-auto max-w-3xl">
            <Comments postId={post.id} />
          </div>
        </div>
      </section>

      {/* ---------- About the author: same look as the homepage strip ---------- */}
      <section className="bg-butter-soft/70">
        <div className={`${container} flex flex-col items-center gap-6 py-10 sm:flex-row`}>
          {authorOk ? (
            <img
              src="/oyin.jpg"
              alt="Oyinade"
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
            I’m a fiction writer who studies the psychology of storytelling — and I share what I learn to help you write stories that actually move readers.
            </p>
            <Button asChild variant="outline" className="mt-4 rounded-full border-sky text-sky hover:text-sky">
              <Link to="/about">More about me</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ---------- Related and next ---------- */}
      {(related.length > 0 || next) && (
      <section className={`${container} py-16`}>
        <div className="grid items-start gap-6 md:grid-cols-2">
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
        </div>
      </section>
      )}

      {/* ---------- More to read: a mix of categories ---------- */}
      {more.length > 0 && (
        <section className={`${container} ${related.length > 0 || next ? 'pb-16' : 'py-16'}`}>
          <SectionHeading title="More to read" to="/articles" linkLabel="See all articles" />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {more.map((m) => (
              <ArticleCard key={m.id} post={m} />
            ))}
          </div>
        </section>
      )}

      {/* ---------- Newsletter, last thing on the page ---------- */}
      <section className={`${container} pb-16`}>
        <SubscribeForm wide />
      </section>
    </article>
  )
}

function slugify(text) {
  return (
    text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-') || 'section'
  )
}

function jumpToHeading(e, id) {
  e.preventDefault()
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  window.history.replaceState(null, '', `#${id}`)
}

// Needs at least 2 headings to be worth showing.
// Main headings (##) are numbered; sub-headings (###) sit indented under them.
function TableOfContents({ items, activeId, collapsible = false }) {
  if (items.length < 2) return null

  let n = 0
  const list = (
    <ol className="border-l-2 border-border">
      {items.map((item) => {
        const active = activeId === item.id
        const sub = item.level === 3
        if (!sub) n += 1
        return (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              onClick={(e) => jumpToHeading(e, item.id)}
              className={`-ml-0.5 flex gap-2 border-l-2 py-2.5 pr-2 leading-snug transition-colors ${
                sub ? 'pl-9 text-[13px]' : 'pl-4 text-sm font-semibold'
              } ${
                active
                  ? 'border-primary text-primary'
                  : 'border-transparent text-foreground/75 hover:text-foreground'
              }`}
            >
              {!sub && <span className="shrink-0 text-muted-foreground">{n}.</span>}
              <span>{item.text}</span>
            </a>
          </li>
        )
      })}
    </ol>
  )

  if (collapsible) {
    return (
      <details className="card-soft !rounded-none p-5">
        <summary className="hand cursor-pointer text-2xl leading-none">In this article</summary>
        <div className="mt-4">{list}</div>
      </details>
    )
  }

  return (
    <nav aria-label="Table of contents" className="card-soft !rounded-none p-6">
      <h2 className="hand text-3xl leading-none">In this article</h2>
      <div className="mt-5">{list}</div>
    </nav>
  )
}

function MiniArticle({ post }) {
  return (
    <Link to={`/posts/${post.slug}`} className="group flex items-center gap-4">
      <div className="size-16 shrink-0 overflow-hidden rounded-none bg-muted">
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
// The buttons live in components/shareButtons.jsx. This box only adds the message
// around them and tells Umami which platform was clicked.
// The cover image is sent to Pinterest directly; on the other platforms the image
// comes from the page's Open Graph tags (see seo.jsx).
function ShareBox({ title, excerpt, image, slug }) {
  // The clean article address, built from the slug
  const url = `${window.location.origin}/posts/${slug}`
  return (
    <section className="rounded-none border border-border bg-sky-soft p-6 text-center sm:p-8">
      <h3 className="hand text-3xl leading-none">A writer might actually need this</h3>
      <p className="mx-auto mt-4 max-w-md leading-relaxed text-foreground/80">
        A friend or a fellow writer out there may be stuck on their story right now. Sharing this could be the help they need.
      </p>

      <ShareButtons
        className="mt-6"
        url={url}
        title={title}
        excerpt={excerpt}
        image={image}
        onShare={(platform) => AnalyticsService.share({ slug, platform })}
      />
    </section>
  )
}