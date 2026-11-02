import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const container = 'mx-auto max-w-7xl px-4 sm:px-6'

/**
 * A friendly error message for visitors. Reuse it anywhere something fails to load.
 *
 * Props:
 *  - title:       short heading (default: "Something went wrong")
 *  - message:     one or two calm sentences telling the reader what to do
 *  - onRetry:     function for the "Try again" button. Defaults to reloading the page.
 *                 Pass `false` to hide the button (e.g. for a "not found" message).
 *  - retryLabel:  text on the retry button (default: "Try again")
 *  - linkTo / linkLabel: optional link, e.g. back to all articles
 *  - variant:     'page'   -> roomy, centred block for a whole page
 *                 'inline' -> compact block to drop in the middle of a page (default)
 *
 * Examples:
 *   <ErrorMessage />
 *   <ErrorMessage variant="page" title="Post not found" message="It may have moved." onRetry={false}
 *                 linkTo="/articles" linkLabel="Back to all articles" />
 */
export default function ErrorMessage({
  title = 'Something went wrong',
  message = "We couldn't load this right now. Please check your connection and try again.",
  onRetry,
  retryLabel = 'Try again',
  linkTo,
  linkLabel,
  variant = 'inline',
  className,
}) {
  const isPage = variant === 'page'
  const showRetry = onRetry !== false
  const handleRetry = typeof onRetry === 'function' ? onRetry : () => window.location.reload()

  return (
    <div
      role="alert"
      className={cn(
        'text-center',
        isPage ? `${container} flex flex-col items-center py-20 sm:py-28` : 'py-10',
        className
      )}
    >
      <h2 className={cn('font-bold leading-tight', isPage ? 'text-3xl md:text-4xl' : 'text-xl')}>{title}</h2>
      <p className="mx-auto mt-3 max-w-md leading-relaxed text-muted-foreground">{message}</p>

      {(showRetry || linkTo) && (
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {showRetry && (
            <Button className="rounded-full px-6" onClick={handleRetry}>
              {retryLabel}
            </Button>
          )}
          {linkTo && (
            <Button asChild variant="outline" className="rounded-full border-sky px-6 text-sky hover:text-sky">
              <Link to={linkTo}>{linkLabel ?? 'Go back'}</Link>
            </Button>
          )}
        </div>
      )}
    </div>
  )
}