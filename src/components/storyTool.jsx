import { useEffect, useRef, useState } from 'react'
import { ArrowRight, ChevronLeft, RotateCcw, Star } from 'lucide-react'
import { AnalyticsService } from '@/service/analyticsService'
import { QuizFeedbackService } from '@/service/quizFeedbackService'
import SubscribeForm from '@/components/subscribeForm'
import ShareButtons from '@/components/shareButtons'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// Renders **bold** and *italic* from config text without dangerouslySetInnerHTML
function inline(text) {
  return text
    .split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g)
    .filter(Boolean)
    .map((part, i) => {
      if (part.startsWith('**')) return <strong key={i}>{part.slice(2, -2)}</strong>
      if (part.startsWith('*')) return <em key={i}>{part.slice(1, -1)}</em>
      return part
    })
}

const pad = (n) => String(n).padStart(2, '0')

// Colour of the left panel. Set `tone` on a card or result in the config.
const TONES = {
  story: 'bg-rose-soft',
  situation: 'bg-sky-soft',
  sage: 'bg-sage-soft',
  butter: 'bg-butter-soft',
}
const toneClass = (tone) => TONES[tone] ?? TONES.butter

const inputClass =
  'w-full rounded-2xl border border-input bg-background px-4 py-3 text-base outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const textareaClass =
  'w-full resize-y rounded-2xl border border-input bg-background p-4 text-base leading-relaxed outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring'

// One wide card: a coloured panel on the left, the content on the right.
// On phones the panel sits on top. A piece of tape holds it to the page, like the sticky notes on Home.
function Stage({ railClass, rail, dir, children }) {
  return (
    <div className="relative">
      <span
        aria-hidden="true"
        className="absolute -top-3 left-1/2 z-10 h-6 w-20 -translate-x-1/2 -rotate-3 bg-white/70 shadow-sm"
      />
      <div
        className={cn(
          'card-soft grid overflow-hidden md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]',
          dir === 1 ? 'tool-in-next' : 'tool-in-prev'
        )}
      >
        <div className={cn('flex flex-col p-7 md:p-10', railClass)}>{rail}</div>
        <div className="flex flex-col gap-4 p-7 md:p-10">{children}</div>
      </div>
    </div>
  )
}

// Star rating + optional review. Saved in the quiz_feedback table.
function FeedbackBox({ toolId, result }) {
  const [rating, setRating] = useState(0)
  const [review, setReview] = useState('')
  const [name, setName] = useState('') // optional
  const [email, setEmail] = useState('') // required
  const [trap, setTrap] = useState('') // hidden field: only bots fill it in
  const [state, setState] = useState('idle') // 'idle' | 'sending' | 'done'
  const [message, setMessage] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setMessage('')

    // A bot filled the hidden field: pretend it worked and do nothing
    if (trap) {
      setState('done')
      return
    }
    if (!rating) {
      setMessage('Please pick a star rating first.')
      return
    }
    if (!EMAIL_PATTERN.test(email.trim())) {
      setMessage('Please enter a valid email address.')
      return
    }

    try {
      setState('sending')
      await QuizFeedbackService.submit({ toolId, result, rating, review, name, email })
      AnalyticsService.quizFeedback({ tool: toolId, rating })
      setState('done')
    } catch (err) {
      console.error(err)
      setState('idle')
      setMessage('Something went wrong. Please try again.')
    }
  }

  if (state === 'done') {
    return (
      <div role="status" className="card-soft mt-8 p-6 text-center md:p-8">
        <p className="hand text-3xl">Thank you!</p>
        <p className="mt-1 text-foreground/80">Your feedback helps me make better quizzes.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="card-soft relative mt-8 p-6 md:p-8">
      <div className="md:flex md:items-end md:justify-between md:gap-6">
        <h3 className="hand text-3xl leading-none md:text-4xl">How was this quiz?</h3>
        <div className="mt-3 flex gap-1 md:mt-0" role="group" aria-label="Rating out of 5">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              aria-label={`${n} star${n > 1 ? 's' : ''}`}
              aria-pressed={n === rating}
              onClick={() => setRating(n)}
              className="rounded-md p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Star
                className={cn('size-8 transition-colors', n <= rating ? 'fill-butter text-butter' : 'text-border')}
              />
            </button>
          ))}
        </div>
      </div>

      <textarea
        value={review}
        onChange={(e) => setReview(e.target.value)}
        maxLength={1000}
        rows={3}
        placeholder="Leave a short review (optional)"
        aria-label="Review (optional)"
        className={cn(textareaClass, 'mt-5')}
      />

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <input
          type="text"
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={80}
          autoComplete="name"
          placeholder="Your name (optional)"
          aria-label="Your name (optional)"
          className={inputClass}
        />
        <input
          type="email"
          name="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          maxLength={254}
          autoComplete="email"
          required
          placeholder="Your email"
          aria-label="Your email"
          className={inputClass}
        />
      </div>
      <p className="mt-2 text-xs text-muted-foreground">I will only use your email to reply to your feedback.</p>

      {/* Hidden trap field for bots. Real visitors never see it. */}
      <input
        type="text"
        name="company"
        value={trap}
        onChange={(e) => setTrap(e.target.value)}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        style={{ position: 'absolute', left: '-9999px' }}
      />

      <div className="mt-4 flex flex-wrap items-center gap-4">
        <Button type="submit" disabled={state === 'sending'} className="rounded-full px-6">
          {state === 'sending' ? 'Sending...' : 'Send feedback'}
        </Button>
        {message && (
          <p role="alert" className="text-sm text-destructive">
            {message}
          </p>
        )}
      </div>
    </form>
  )
}

/**
 * Reusable explanation -> quiz -> result tool.
 *
 * Props:
 *  config      required. See storyOrSituation.config.js for the shape.
 *  onComplete  optional. ({ toolId, result, idea, answers }) => void
 *
 * Umami events sent (see AnalyticsService):
 *  quiz_step      each step the reader reaches, once per attempt (drop-off)
 *  quiz_complete  the quiz was finished, with the result
 *  quiz_share     a share button was clicked (method = the platform, e.g. 'whatsapp', 'x', 'copy-link')
 *  quiz_feedback  a rating was sent
 *  quiz_subscribe the subscribe form at the end was used
 */
export default function StoryTool({ config, onComplete }) {
  const { cards, questions, results } = config

  const [stage, setStage] = useState('cards') // cards | idea | quiz | result
  const [ci, setCi] = useState(0) // card index
  const [qi, setQi] = useState(0) // question index
  const [dir, setDir] = useState(1) // 1 = moving forward, -1 = moving back
  const [idea, setIdea] = useState('')
  const [answers, setAnswers] = useState({})
  const [outcome, setOutcome] = useState(null) // { resultId, closeCall }

  // Which steps this attempt has already reached, so Back/Next does not double count
  const reached = useRef(new Set())

  // Step number and name, e.g. 06 / "06-question-1"
  let stepNumber
  let stepLabel
  if (stage === 'cards') {
    stepNumber = ci + 1
    stepLabel = `card-${ci + 1}`
  } else if (stage === 'idea') {
    stepNumber = cards.length + 1
    stepLabel = 'idea'
  } else if (stage === 'quiz') {
    stepNumber = cards.length + 2 + qi
    stepLabel = `question-${qi + 1}`
  } else {
    stepNumber = cards.length + 2 + questions.length
    stepLabel = 'result'
  }
  const stepName = `${pad(stepNumber)}-${stepLabel}`

  useEffect(() => {
    if (reached.current.has(stepName)) return
    reached.current.add(stepName)
    AnalyticsService.quizStep({ tool: config.id, step: stepName, n: stepNumber })
  }, [stepName, stepNumber, config.id])

  const goCard = (i) => {
    if (i === ci) return
    setDir(i > ci ? 1 : -1)
    setCi(i)
  }

  const restart = () => {
    reached.current = new Set()
    setDir(-1)
    setStage('cards')
    setCi(0)
    setQi(0)
    setIdea('')
    setAnswers({})
    setOutcome(null)
  }

  const choose = (question, option) => {
    setDir(1)
    const next = { ...answers, [question.id]: option.points }
    setAnswers(next)
    if (qi < questions.length - 1) {
      setQi(qi + 1)
      return
    }
    const total = Object.values(next).reduce((a, b) => a + b, 0)
    const done = config.resolve(total, next)
    setOutcome(done)
    setStage('result')
    AnalyticsService.quizComplete({ tool: config.id, result: done.resultId })
    onComplete?.({ toolId: config.id, result: done.resultId, idea, answers: next })
  }

  const card = cards[ci]
  const lastCard = ci === cards.length - 1
  const question = questions[qi]
  const result = outcome ? results[outcome.resultId] : null

  return (
    <section aria-label={config.title} className="mx-auto w-full max-w-4xl overflow-x-clip px-1 pb-2 pt-4">
      <style>{`
        @keyframes tool-in-next { from { opacity: 0; transform: translateX(40px); } to { opacity: 1; transform: none; } }
        @keyframes tool-in-prev { from { opacity: 0; transform: translateX(-40px); } to { opacity: 1; transform: none; } }
        .tool-in-next { animation: tool-in-next 450ms cubic-bezier(0.22, 1, 0.36, 1) both; }
        .tool-in-prev { animation: tool-in-prev 450ms cubic-bezier(0.22, 1, 0.36, 1) both; }
        @media (prefers-reduced-motion: reduce) { .tool-in-next, .tool-in-prev { animation: none; } }
      `}</style>

      {/* ---------- 1. Explanation, one card at a time ---------- */}
      {stage === 'cards' && (
        <Stage
          key={stepName}
          dir={dir}
          railClass={toneClass(card.tone)}
          rail={
            <>
              <p className="hand text-2xl text-sky">
                {ci + 1} of {cards.length}
              </p>
              <h2 className="mt-3 text-3xl font-bold leading-tight md:text-4xl">{card.title}</h2>
              <div className="mt-auto flex items-center pt-8">
                {cards.map((c, i) => (
                  <button
                    key={c.title}
                    type="button"
                    onClick={() => goCard(i)}
                    aria-label={`Go to card ${i + 1}`}
                    aria-current={i === ci}
                    className="p-1"
                  >
                    <span
                      className={cn(
                        'block h-2.5 rounded-full transition-all duration-300',
                        i === ci ? 'w-6 bg-primary' : 'w-2.5 bg-foreground/20'
                      )}
                    />
                  </button>
                ))}
              </div>
            </>
          }
        >
          <div className="space-y-4 text-lg leading-relaxed text-foreground/85 md:text-xl md:leading-relaxed">
            {card.body.map((p, i) => (
              <p key={i}>{inline(p)}</p>
            ))}
          </div>
          <div className="mt-auto flex items-center gap-3 pt-6">
            {ci > 0 && (
              <Button
                variant="outline"
                size="icon"
                className="rounded-full"
                onClick={() => goCard(ci - 1)}
                aria-label="Previous card"
              >
                <ChevronLeft className="size-5" />
              </Button>
            )}
            <Button
              size="lg"
              className="rounded-full px-7"
              onClick={() => {
                if (lastCard) {
                  setDir(1)
                  setStage('idea')
                } else {
                  goCard(ci + 1)
                }
              }}
            >
              {lastCard ? config.startLabel || 'Check my idea' : 'Next'}
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </Stage>
      )}

      {/* ---------- 2. The reader's idea ---------- */}
      {stage === 'idea' && (
        <Stage
          key={stepName}
          dir={dir}
          railClass="bg-butter-soft"
          rail={
            <>
              <p className="hand text-2xl text-sky">Your turn</p>
              <h2 className="mt-3 text-3xl font-bold leading-tight md:text-4xl">{config.idea.title}</h2>
              <p className="mt-4 text-lg leading-relaxed text-foreground/75">{config.idea.prompt}</p>
            </>
          }
        >
          <textarea
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            placeholder={config.idea.placeholder}
            aria-label={config.idea.title}
            rows={6}
            className={textareaClass}
          />
          <div className="mt-auto flex items-center gap-3 pt-2">
            <Button
              variant="outline"
              size="icon"
              className="rounded-full"
              onClick={() => {
                setDir(-1)
                setStage('cards')
              }}
              aria-label="Back to the explanation"
            >
              <ChevronLeft className="size-5" />
            </Button>
            <Button
              size="lg"
              className="rounded-full px-7"
              onClick={() => {
                setDir(1)
                setQi(0)
                setAnswers({})
                setStage('quiz')
              }}
            >
              {config.idea.button}
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </Stage>
      )}

      {/* ---------- 3. The questions ---------- */}
      {stage === 'quiz' && (
        <Stage
          key={stepName}
          dir={dir}
          railClass="bg-butter-soft"
          rail={
            <>
              <p className="hand text-2xl text-sky">
                Question {qi + 1} of {questions.length}
              </p>
              <div className="mt-4 flex gap-1.5" aria-hidden="true">
                {questions.map((_, i) => (
                  <span
                    key={i}
                    className={cn('h-2 flex-1 rounded-full', i <= qi ? 'bg-primary' : 'bg-foreground/15')}
                  />
                ))}
              </div>
              {question.hint && <p className="mt-6 text-lg leading-relaxed text-foreground/75">{question.hint}</p>}
            </>
          }
        >
          <h2 className="text-2xl font-semibold leading-snug md:text-3xl">{question.text}</h2>
          <div className="mt-2 grid gap-3">
            {question.options.map((opt) => (
              <button
                key={opt.label}
                type="button"
                onClick={() => choose(question, opt)}
                className="group flex w-full items-center justify-between gap-4 rounded-2xl border-2 border-border bg-background px-5 py-4 text-left text-base font-semibold leading-snug transition-colors hover:border-primary hover:bg-rose-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {opt.label}
                <ArrowRight className="size-4 shrink-0 text-primary opacity-0 transition-opacity group-hover:opacity-100" />
              </button>
            ))}
          </div>
        </Stage>
      )}

      {/* ---------- 4. The result, then feedback and subscribe ---------- */}
      {stage === 'result' && result && (
        <>
          <Stage
            key={stepName}
            dir={dir}
            railClass={toneClass(result.tone)}
            rail={
              <>
                <p className="hand text-2xl text-sky">Your result</p>
                <h2 className="mt-3 text-5xl font-bold leading-tight md:text-6xl">
                  <span className="marker-yellow">{result.title}</span>
                </h2>
                <p className="mt-5 text-lg leading-relaxed text-foreground/85">{result.body}</p>
              </>
            }
          >
            {outcome.closeCall && config.closeCallNote && (
              <div className="rounded-xl border border-border bg-background p-4 text-sm leading-relaxed">
                <strong>Close call.</strong> {config.closeCallNote}
              </div>
            )}
            <div className="rounded-xl bg-butter-soft p-5">
              <p className="hand text-2xl leading-none text-sky">Tip</p>
              <p className="mt-2 leading-relaxed text-foreground/85">{result.tip}</p>
            </div>
            {idea && (
              <div className="rounded-xl border border-dashed border-border p-5">
                <p className="hand text-2xl leading-none text-sky">Your idea</p>
                <p className="mt-2 break-words leading-relaxed text-foreground/85">{idea}</p>
              </div>
            )}
            <div className="mt-auto space-y-5 pt-4">
              <Button size="lg" className="rounded-full px-6" onClick={restart}>
                <RotateCcw className="size-4" />
                Check another idea
              </Button>

              <div className="border-t border-border pt-5">
                <p className="hand text-2xl leading-none text-sky">Share my result</p>
                <ShareButtons
                  className="mt-3 justify-start"
                  // No url: it shares this page, so the link opens the tool
                  title={`I got “${result.title}” on ${config.title}`}
                  hashtag={config.hashtag}
                  tagline=""
                  onShare={(platform) =>
                    AnalyticsService.quizShare({ tool: config.id, result: outcome.resultId, method: platform })
                  }
                />
              </div>
            </div>
          </Stage>

          <FeedbackBox toolId={config.id} result={outcome.resultId} />

          {config.subscribe && (
            <SubscribeForm
              wide
              tone="butter"
              className="mt-8"
              title={config.subscribe.title}
              description={config.subscribe.description}
              onSubscribed={() => AnalyticsService.quizSubscribe({ tool: config.id })}
            />
          )}
        </>
      )}

      {config.credit && (
        <p className="mx-auto mt-8 max-w-xl text-center text-xs leading-relaxed text-muted-foreground">
          {config.credit.text}
          {config.credit.url && (
            <>
              {' '}
              <a
                href={config.credit.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-sky underline-offset-4 hover:underline"
              >
                {config.credit.linkLabel || 'Read the source'}
              </a>
            </>
          )}
        </p>
      )}
    </section>
  )
}