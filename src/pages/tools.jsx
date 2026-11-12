import { Link } from 'react-router-dom'
import { ArrowRight, Compass, Lightbulb, PenLine, Sparkles } from 'lucide-react'
import Seo from '@/components/seo'
import { tools } from '@/tools'

const container = 'mx-auto max-w-7xl px-4 sm:px-6'

// Each quiz card gets the next colour and icon in this list
const TILES = [
  { bg: 'bg-rose-soft', icon: Sparkles },
  { bg: 'bg-sky-soft', icon: Lightbulb },
  { bg: 'bg-butter-soft', icon: PenLine },
  { bg: 'bg-sage-soft', icon: Compass },
]

// The /tools page: one wide, horizontal card for each quiz
export default function Tools() {
  return (
    <div>
      <Seo
        title="Writing quizzes"
        description="Short, practical quizzes to help you understand your own story."
      />

      {/* ---------- Hero ---------- */}
      <section className="bg-gradient-to-b from-butter-soft/60 to-background">
        <div className={`${container} py-14 text-center md:py-20`}>
          <h1 className="rise mt-3 text-4xl font-bold leading-tight md:text-6xl" style={{ animationDelay: '120ms' }}>
            <span className="marker-yellow">Writing quizzes</span>
          </h1>
          <p
            className="rise mx-auto mt-6 max-w-xl text-lg leading-relaxed text-foreground/80"
            style={{ animationDelay: '240ms' }}
          >
            Short, practical quizzes to help you understand your own story.
          </p>
        </div>
      </section>

      {/* ---------- Quiz cards ---------- */}
      <section className={`${container} pb-16 pt-4`}>
        <div className="mx-auto flex max-w-4xl flex-col gap-6">
          {tools.map((tool, i) => {
            const { bg, icon: Icon } = TILES[i % TILES.length]
            return (
              <Link
                key={tool.id}
                to={`/tools/${tool.id}`}
                className="card-soft group grid overflow-hidden transition-shadow hover:shadow-md sm:grid-cols-[200px_minmax(0,1fr)]"
              >
                <div className={`${bg} flex items-center justify-center p-8`}>
                  <Icon className="size-14 text-foreground/70" strokeWidth={1.3} />
                </div>
                <div className="flex flex-col gap-5 p-6 sm:p-8 md:flex-row md:items-center md:gap-8">
                  <div className="flex-1">
                    <h2 className="text-2xl font-semibold leading-tight md:text-3xl">{tool.title}</h2>
                    <p className="mt-3 leading-relaxed text-foreground/75">{tool.description}</p>
                    <p className="hand mt-3 text-xl text-sky">{tool.questions.length} questions</p>
                  </div>
                  <span className="inline-flex shrink-0 items-center gap-2 self-start rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-opacity group-hover:opacity-90 md:self-center">
                    Take the quiz
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      </section>
    </div>
  )
}