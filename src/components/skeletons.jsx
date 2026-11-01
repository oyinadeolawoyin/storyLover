import { cn } from '@/lib/utils'

const container = 'mx-auto max-w-7xl px-4 sm:px-6'

// One grey block that gently pulses while content loads.
export function Skeleton({ className, style }) {
  return (
    <div
      aria-hidden="true"
      style={style}
      className={cn('animate-pulse rounded-md bg-foreground/10 motion-reduce:animate-none', className)}
    />
  )
}

// Placeholder for the white article card (articles page)
export function ArticleCardSkeleton() {
  return (
    <div className="card-soft overflow-hidden p-4">
      <Skeleton className="aspect-[16/10] w-full rounded-lg" />
      <div className="px-1 pb-1 pt-5">
        <Skeleton className="h-5 w-28" />
        <Skeleton className="mt-4 h-7 w-11/12" />
        <Skeleton className="mt-2 h-7 w-2/3" />
        <Skeleton className="mt-4 h-4 w-full" />
        <Skeleton className="mt-2 h-4 w-5/6" />
        <Skeleton className="mt-6 h-4 w-40" />
      </div>
    </div>
  )
}

// Placeholder for the plain article teaser (home page, latest articles)
export function TeaserSkeleton() {
  return (
    <div>
      <Skeleton className="aspect-[4/3] w-full rounded-lg" />
      <Skeleton className="mt-4 h-5 w-24" />
      <Skeleton className="mt-3 h-5 w-11/12" />
      <Skeleton className="mt-2 h-5 w-3/5" />
      <Skeleton className="mt-3 h-3 w-32" />
    </div>
  )
}

// Placeholder for a whole post page: centred heading, then text and a sidebar
export function PostSkeleton() {
  return (
    <div role="status" aria-busy="true">
      <span className="sr-only">Loading article...</span>

      <div className="bg-gradient-to-b from-butter-soft/60 to-background">
        <div className={`${container} grid items-center gap-8 py-10 md:py-14 lg:grid-cols-2`}>
          <div>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="mt-5 h-10 w-full md:h-12" />
            <Skeleton className="mt-3 h-10 w-11/12 md:h-12" />
            <Skeleton className="mt-3 h-10 w-2/3 md:h-12" />
            <Skeleton className="mt-7 h-5 w-5/6" />
            <Skeleton className="mt-2 h-5 w-2/3" />
            <div className="mt-7 flex items-center gap-3">
              <Skeleton className="size-9 rounded-full" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
          <Skeleton className="hidden aspect-[4/3] w-full rounded-2xl lg:block" />
        </div>
      </div>

      <div className={`${container} grid gap-12 pb-16 pt-8 lg:grid-cols-[minmax(0,1fr)_320px]`}>
        <div className="max-w-3xl space-y-3">
          {[100, 96, 92, 98, 60].map((w, i) => (
            <Skeleton key={i} className="h-5" style={{ width: `${w}%` }} />
          ))}
          <Skeleton className="!mt-10 h-8 w-1/2" />
          {[98, 94, 100, 90, 55].map((w, i) => (
            <Skeleton key={`b${i}`} className="h-5" style={{ width: `${w}%` }} />
          ))}
          <Skeleton className="!mt-10 h-8 w-2/5" />
          {[96, 100, 92, 70].map((w, i) => (
            <Skeleton key={`c${i}`} className="h-5" style={{ width: `${w}%` }} />
          ))}
        </div>
        <div className="hidden space-y-6 lg:block">
          <div className="card-soft p-6">
            <Skeleton className="h-8 w-40" />
            <div className="mt-5 flex flex-wrap gap-2">
              {Array.from({ length: 7 }).map((_, i) => (
                <Skeleton key={i} className="size-10 rounded-full" />
              ))}
            </div>
          </div>
          <div className="card-soft p-6">
            <Skeleton className="h-4 w-32" />
            <div className="mt-5 flex items-center gap-4">
              <Skeleton className="size-16 rounded-full" />
              <Skeleton className="h-6 w-28" />
            </div>
            <Skeleton className="mt-5 h-4 w-full" />
            <Skeleton className="mt-2 h-4 w-4/5" />
          </div>
        </div>
      </div>
    </div>
  )
}