import { Link } from 'react-router-dom'
import CategoryPill from '@/components/categoryPill'
import { cn } from '@/lib/utils'

export function formatDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

/**
 * One article card. Three layouts:
 *  - "grid"    : big image on top, text below (articles page)
 *  - "compact" : image on the left, text on the right (home featured side cards)
 *  - "feature" : big image, big title (home featured article)
 */
export default function ArticleCard({ post, variant = 'grid', className }) {
  const href = `/posts/${post.slug}`

  const image = post.cover_image ? (
    <img src={post.cover_image} alt="" loading="lazy" className="h-full w-full object-cover" />
  ) : (
    <div className="h-full w-full bg-gradient-to-br from-sky-soft to-butter-soft" />
  )

  if (variant === 'compact') {
    return (
      <Link
        to={href}
        className={cn('card-soft flex items-center gap-4 p-4 transition-shadow hover:shadow-md', className)}
      >
        <div className="h-28 w-28 shrink-0 overflow-hidden rounded-lg sm:w-36">{image}</div>
        <div className="min-w-0">
          <CategoryPill category={post.category} />
          <h3 className="mt-2 line-clamp-3 break-words text-base font-semibold leading-snug sm:text-lg">
            {post.title}
          </h3>
          <p className="mt-2 text-xs text-muted-foreground">{post.read_minutes} min read</p>
        </div>
      </Link>
    )
  }

  if (variant === 'feature') {
    return (
      <Link
        to={href}
        className={cn('card-soft block overflow-hidden p-4 transition-shadow hover:shadow-md', className)}
      >
        <div className="aspect-[16/10] overflow-hidden rounded-lg">{image}</div>
        <div className="px-1 pb-2 pt-5">
          <CategoryPill category={post.category} />
          <h3 className="mt-3 text-2xl font-semibold leading-snug md:text-3xl">{post.title}</h3>
          {post.excerpt && (
            <p className="mt-3 line-clamp-3 text-base leading-relaxed text-muted-foreground">{post.excerpt}</p>
          )}
          <p className="mt-4 text-sm text-muted-foreground">{post.read_minutes} min read</p>
        </div>
      </Link>
    )
  }

  // grid (default)
  return (
    <Link
      to={href}
      className={cn('card-soft group flex flex-col overflow-hidden p-4 transition-shadow hover:shadow-md', className)}
    >
      <div className="aspect-[16/10] overflow-hidden rounded-lg">{image}</div>
      <div className="flex flex-1 flex-col px-1 pb-1 pt-5">
        <div>
          <CategoryPill category={post.category} />
        </div>
        <h3 className="mt-3 break-words text-2xl font-semibold leading-snug group-hover:text-primary">
          {post.title}
        </h3>
        {post.excerpt && (
          <p className="mt-3 line-clamp-3 text-base leading-relaxed text-muted-foreground">{post.excerpt}</p>
        )}
        <p className="mt-auto pt-5 text-sm text-muted-foreground">
          {formatDate(post.published_at)} &nbsp;·&nbsp; {post.read_minutes} min read
        </p>
      </div>
    </Link>
  )
}