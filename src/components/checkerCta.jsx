import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SubscriberService } from '@/service/subscriberService'
import { hasTried, isSubscribed, markSubscribed } from '@/lib/checkerState'
import { cn } from '@/lib/utils'

// A small email form that also remembers, in this browser, that the visitor has subscribed.
export function InlineSubscribe({ onDone, buttonLabel = 'Subscribe' }) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('idle') // idle | sending | error

  async function submit(e) {
    e.preventDefault()
    if (status === 'sending') return
    setStatus('sending')
    try {
      await SubscriberService.subscribe(email)
    } catch (err) {
      // 23505 means this email is already on the list, which counts as subscribed
      if (err?.code !== '23505') {
        console.error(err)
        setStatus('error')
        return
      }
    }
    markSubscribed()
    onDone?.()
  }

  return (
    <div>
      <form onSubmit={submit} className="flex flex-col gap-3 sm:flex-row">
        <Input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Your email"
          aria-label="Your email"
          className="h-11 rounded-full bg-card px-5"
        />
        <Button type="submit" size="lg" disabled={status === 'sending'} className="rounded-full px-6">
          {status === 'sending' ? 'Subscribing...' : buttonLabel}
        </Button>
      </form>
      {status === 'error' && (
        <p role="alert" className="mt-2 text-sm text-destructive">
          That didn't go through. Check your email address and try again.
        </p>
      )}
    </div>
  )
}

// One card, three moods, depending on what this visitor has already done.
//   hasn't tried the checker      -> invite them to try it
//   tried it, not subscribed      -> offer the PDF for subscribing
//   tried it and subscribed       -> invite them to run it again
export default function CheckerCta({ wide = false, className = '' }) {
  const [tried] = useState(hasTried)
  const [subscribed, setSubscribed] = useState(isSubscribed)

  const shell = cn(
    'card-soft bg-butter-soft/70 p-6 md:p-8',
    !wide && 'mx-auto max-w-3xl',
    className
  )

  if (!tried) {
    return (
      <div className={cn(shell, 'flex flex-col gap-5 md:flex-row md:items-center md:justify-between')}>
        <div className="max-w-xl">
          <p className="hand flex items-center gap-2 text-2xl text-sky">
            <Sparkles className="size-5" aria-hidden="true" />
            A 10-minute quick win
          </p>
          <h2 className="mt-1 text-2xl font-bold leading-snug md:text-3xl">
            Is your story as clear as you think it is?
          </h2>
          <p className="mt-2 leading-relaxed text-foreground/80">
            Answer fifteen short questions in about 10 minutes and see your story so far: your protagonist, conflict, arc and theme. Any blank you find is the next thing to work on.
          </p>
        </div>
        <Button asChild size="lg" className="shrink-0 rounded-full px-6">
          <Link to="/story-clarity-checker">Try the Story Clarity Checker</Link>
        </Button>
      </div>
    )
  }

  if (!subscribed) {
    return (
      <div className={shell}>
        <p className="hand text-2xl text-sky">Nice work on your premise</p>
        <h2 className="mt-1 text-2xl font-bold leading-snug md:text-3xl">
          Keep it. Subscribe to download it as a PDF.
        </h2>
        <p className="mt-2 max-w-xl leading-relaxed text-foreground/80">
          You also get new posts and writing tools by email, nothing else.
        </p>
        <div className="mt-5 max-w-xl">
          <InlineSubscribe onDone={() => setSubscribed(true)} />
        </div>
      </div>
    )
  }

  return (
    <div className={cn(shell, 'flex flex-col gap-5 md:flex-row md:items-center md:justify-between')}>
      <div className="max-w-xl">
        <h2 className="text-2xl font-bold leading-snug md:text-3xl">Got another story idea?</h2>
        <p className="mt-2 leading-relaxed text-foreground/80">
          Run the checker again for a new character or a new story. Your PDF download is unlocked.
        </p>
      </div>
      <Button asChild size="lg" variant="outline" className="shrink-0 rounded-full border-sky px-6 text-sky hover:text-sky">
        <Link to="/story-clarity-checker">Open the checker</Link>
      </Button>
    </div>
  )
}