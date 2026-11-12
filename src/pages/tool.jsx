import { Link, useParams } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import StoryTool from '@/components/storyTool'
import Seo from '@/components/seo'
import { getTool } from '@/tools'
import NotFound from './notFound'

const container = 'mx-auto max-w-7xl px-4 sm:px-6'

// /tools/:id shows one quiz. A wrong id shows the normal "not found" page.
export default function Tool() {
  const { id } = useParams()
  const config = getTool(id)

  if (!config) return <NotFound />

  return (
    <div>
      <Seo title={config.title} description={config.description} />

      {/* ---------- Hero ---------- */}
      <section className="bg-gradient-to-b from-butter-soft/60 to-background">
        <div className={`${container} py-12 text-center md:py-16`}>
          <p className="rise hand text-2xl text-sky">A quick quiz for your story</p>
          <h1 className="rise mt-3 text-4xl font-bold leading-tight md:text-6xl" style={{ animationDelay: '120ms' }}>
            <span className="marker-yellow">{config.title}</span>
          </h1>
          {config.description && (
            <p
              className="rise mx-auto mt-6 max-w-xl text-lg leading-relaxed text-foreground/80"
              style={{ animationDelay: '240ms' }}
            >
              {config.description}
            </p>
          )}
        </div>
      </section>

      {/* ---------- The quiz (key = starts fresh when you switch quizzes) ---------- */}
      <section className={`${container} pb-16 pt-2`}>
        <StoryTool key={config.id} config={config} />

        <p className="mt-10 text-center">
          <Link to="/tools" className="inline-flex items-center gap-1 text-sm font-semibold text-sky hover:underline">
            <ChevronLeft className="size-4" />
            See all quizzes
          </Link>
        </p>
      </section>
    </div>
  )
}