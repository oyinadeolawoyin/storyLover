import { useState } from 'react'
import { ArrowRight, Mail } from 'lucide-react'
import { SubscriberService } from '@/service/subscriberService'
import { markSubscribed } from '@/lib/checkerState'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

// Newsletter box.
//  - default: a narrow card (Home sidebar)
//  - wide: a full-width band, text on the left and the form on the right (bottom of a page)
// tone: 'rose' (default) or 'butter'
export default function SubscribeForm({ tone = 'rose', wide = false, className }) {
  const [email, setEmail] = useState('')
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

    try {
      setState('sending')
      await SubscriberService.subscribe(email);
      markSubscribed()
      setState('done')
      setMessage('Thank you for subscribing!')
      setEmail('')
    } catch (err) {
      console.error(err)
      setState('idle')

      if (err.code === '23505') {
        setMessage('You are already on the list.')
      } else if (err.code === '23514') {
        markSubscribed()
        setMessage('Please enter a valid email address.')
      } else {
        setMessage('Something went wrong. Please try again.')
      }
    }
  }

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl border',
        wide ? 'p-6 sm:p-8 md:p-10' : 'p-6',
        tone === 'rose'
          ? 'border-primary/15 bg-gradient-to-br from-rose-soft via-rose-soft to-rose-soft/40'
          : 'border-butter/30 bg-gradient-to-br from-butter-soft via-butter-soft to-butter-soft/40',
        className
      )}
    >
      <div className={cn(wide && 'grid items-center gap-6 md:grid-cols-2 md:gap-12')}>
        <div>
          <div className="flex items-center gap-3">
            <Mail className="size-9 shrink-0 text-sky" strokeWidth={1.4} />
            <h3 className={cn('hand leading-none', wide ? 'text-4xl' : 'text-3xl')}>Stay in the story</h3>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-foreground/75">
            New articles and writing tips, straight to your inbox.
          </p>
        </div>

        {state === 'done' ? (
          <p className={cn('text-sm font-semibold text-emerald-700', !wide && 'mt-5')}>
            {message || 'Thank you for subscribing!'}
          </p>
        ) : (
          <form onSubmit={handleSubmit} className={cn(!wide && 'mt-5')}>
            <div className={cn(wide ? 'flex flex-col gap-3 sm:flex-row' : 'space-y-3')}>
              <Input
                id={wide ? 'subscribe-email-wide' : 'subscribe-email'}
                type="email"
                placeholder="Your email address"
                aria-label="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={cn('h-11 rounded-full border-border bg-white px-4', wide && 'flex-1')}
              />

              {/* Hidden trap field for bots. Real visitors never see it. */}
              <input
                type="text"
                name="website"
                value={trap}
                onChange={(e) => setTrap(e.target.value)}
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                style={{ position: 'absolute', left: '-9999px' }}
              />

              <Button
                type="submit"
                disabled={state === 'sending'}
                className={cn('h-11 rounded-full text-sm font-semibold', wide ? 'sm:px-7' : 'w-full')}
              >
                {state === 'sending' ? (
                  'Subscribing...'
                ) : (
                  <>
                    Join the newsletter <ArrowRight className="size-4" />
                  </>
                )}
              </Button>
            </div>

            {message && <p className="mt-3 text-sm text-destructive">{message}</p>}
          </form>
        )}
      </div>
    </div>
  )
}