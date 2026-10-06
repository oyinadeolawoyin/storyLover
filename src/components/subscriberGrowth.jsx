// A line chart with peaks: new subscribers per week for the last 8 weeks.
// Use it on the admin subscribers page:
//   <SubscriberGrowth subscribers={subscribers} />

const DAY = 24 * 60 * 60 * 1000
const WEEKS = 8

export default function SubscriberGrowth({ subscribers }) {
  if (!subscribers.length) return null

  const now = Date.now()
  const times = subscribers.map((s) => new Date(s.created_at).getTime())

  // New sign-ups for each of the last 8 weeks, oldest first
  const weeks = Array.from({ length: WEEKS }, (_, i) => {
    const end = now - (WEEKS - 1 - i) * 7 * DAY
    const start = end - 7 * DAY
    return {
      label: new Date(end).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      count: times.filter((t) => t > start && t <= end).length,
    }
  })

  const max = Math.max(1, ...weeks.map((w) => w.count))

  // Position of each point, as percentages of the chart area.
  // x sits in the middle of each week's column so it lines up with the labels below.
  const points = weeks.map((w, i) => ({
    ...w,
    x: ((i + 0.5) / WEEKS) * 100,
    y: 96 - (w.count / max) * 88, // 96 = the bottom, 8 = the top
  }))

  const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ')
  const area = `${line} L${points[points.length - 1].x},100 L${points[0].x},100 Z`

  return (
    <div className="card-soft mb-6 p-5">
      <p className="text-sm text-foreground/70">New subscribers per week</p>

      {/* Chart area */}
      <div className="relative mt-4 h-44">
        <div className="absolute inset-x-0 bottom-2 top-6">
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="absolute inset-0 h-full w-full overflow-visible"
            aria-hidden="true"
          >
            <path d={area} className="fill-sky/15" />
            <path
              d={line}
              fill="none"
              className="stroke-sky"
              strokeWidth="3"
              strokeLinejoin="round"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>

          {/* Dots and numbers sit on top, so they stay round and sharp */}
          {points.map((p) => {
            const isPeak = p.count === max && p.count > 0
            return (
              <div key={p.label}>
                <span
                  className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-sky ring-2 ring-white ${
                    isPeak ? 'size-4' : 'size-3'
                  }`}
                  style={{ left: `${p.x}%`, top: `${p.y}%` }}
                />
                <span
                  className={`absolute -translate-x-1/2 -translate-y-full pb-2.5 text-xs ${
                    isPeak ? 'font-bold' : 'font-semibold'
                  }`}
                  style={{ left: `${p.x}%`, top: `${p.y}%` }}
                >
                  {p.count}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Week labels */}
      <div className="mt-2 flex">
        {weeks.map((w) => (
          <span key={w.label} className="flex-1 text-center text-xs text-muted-foreground">
            {w.label}
          </span>
        ))}
      </div>
    </div>
  )
}