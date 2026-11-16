import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Reveal from '@/components/reveal'
import { cn } from '@/lib/utils'

// The "A quick win" quiz box. Used on the home page, and in place of the
// subscribe form for people who have already subscribed.
// compact = smaller text and padding, for narrow spaces like a sidebar.
export default function QuizCallout({ compact = false, className }) {
  return (
    <Reveal
      className={cn(
        'rounded-2xl border border-border bg-rose-soft text-center',
        compact ? 'px-5 py-8' : 'px-6 py-10 sm:px-10 md:py-12',
        className
      )}
    >
      <p className={cn('hand text-sky', compact ? 'text-xl' : 'text-2xl')}>A quick win</p>
      <h2 className={cn('mt-2 font-bold leading-tight', compact ? 'text-2xl' : 'text-3xl md:text-4xl')}>
        Learn something new about your story
      </h2>
      <p className={cn('mx-auto mt-4 max-w-xl leading-relaxed text-foreground/80', compact ? 'text-base' : 'text-lg')}>
        Check out my quizzes to help you uncover more about your story and your unique writing strengths.
      </p>
      <Button asChild size="lg" className="mt-7 rounded-full px-7">
        <Link to="/tools">
          Take a quiz
          <ArrowRight className="size-4" />
        </Link>
      </Button>
    </Reveal>
  )
}