
import { useState } from 'react'
import { ArrowRight, ArrowUpRight, Heart, Mail } from 'lucide-react'
import { SubscriberService } from '@/service/subscriberService'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import QuizCallout from '@/components/quizCallout'
import { cn } from '@/lib/utils'
import { normalizeWebsite, saveIdentity } from '@/lib/commenterIdentity'
import { isSubscribed, markSubscribed } from '@/lib/subscriberStatus'

// Newsletter box.
//  - default: a narrow card (Home sidebar)
//  - wide: a full-width band, text on the left and the form on the right (bottom of a page)
// tone: 'rose' (default) or 'butter'
// Name is required, website is optional.
//
// After subscribing, the box turns into a welcome message with a link to the person's inbox.
// When the same browser comes back later, the whole box is replaced by the quiz "quick win".
const DEFAULT_DESCRIPTION =
  'Get practical storytelling insights, new articles, and quizzes delivered to you — made for fiction writers who want to write stories that move readers.'

// Where "Open inbox" goes, by email domain. Unknown domains just show the address with no link.
const gmail = (email) => `https://mail.google.com/mail/?authuser=${encodeURIComponent(email)}`
const INBOXES = {
  'gmail.com': gmail,
  'googlemail.com': gmail,
  'outlook.com': 'https://outlook.live.com/mail/',
  'hotmail.com': 'https://outlook.live.com/mail/',
  'live.com': 'https://outlook.live.com/mail/',
  'msn.com': 'https://outlook.live.com/mail/',
  'yahoo.com': 'https://mail.yahoo.com/',
  'ymail.com': 'https://mail.yahoo.com/',
  'rocketmail.com': 'https://mail.yahoo.com/',
  'icloud.com': 'https://www.icloud.com/mail',
  'me.com': 'https://www.icloud.com/mail',
  'mac.com': 'https://www.icloud.com/mail',
  'proton.me': 'https://mail.proton.me/',
  'protonmail.com': 'https://mail.proton.me/',
  'pm.me': 'https://mail.proton.me/',
  'zoho.com': 'https://mail.zoho.com/',
  'aol.com': 'https://mail.aol.com/',
}

function inboxUrl(email) {
  const entry = INBOXES[email.split('@')[1]?.toLowerCase()]
  return typeof entry === 'function' ? entry(email) : entry ?? null
}

const WELCOME_CSS = `
  @keyframes love-pop {
    0% { transform: scale(0); opacity: 0; }
    55% { transform: scale(1.3); opacity: 1; }
    75% { transform: scale(0.92); }
    100% { transform: scale(1); opacity: 1; }
  }
  @keyframes love-float {
    0% { opacity: 0; transform: translate(0, 0) scale(0.5); }
    25% { opacity: 1; }
    100% { opacity: 0; transform: translate(var(--dx), -44px) scale(1); }
  }
  .love-pop { animation: love-pop 700ms cubic-bezier(0.22, 1, 0.36, 1) both; }
  .love-float { animation: love-float 1800ms ease-out var(--delay) both; }
  @media (prefers-reduced-motion: reduce) {
    .love-pop { animation: none; }
    .love-float { display: none; }
  }
`

const BURSTS = [
  { dx: -30, delay: 350, size: 'size-3' },
  { dx: -10, delay: 500, size: 'size-2.5' },
  { dx: 12, delay: 420, size: 'size-3' },
  { dx: 32, delay: 600, size: 'size-2.5' },
  { dx: 2, delay: 700, size: 'size-2' },
]

// A heart that pops in, with a few small ones floating up from it
function HeartBadge() {
  return (
    <span
      aria-hidden="true"
      className="relative flex size-14 shrink-0 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-primary/20"
    >
      <Heart className="love-pop size-7 fill-current text-primary" strokeWidth={1.5} />
      {BURSTS.map((b) => (
        <Heart
          key={b.dx}
          className={cn('love-float absolute left-1/2 top-1/2 -ml-1.5 -mt-1.5 fill-current text-primary/70', b.size)}
          style={{ '--dx': `${b.dx}px`, '--delay': `${b.delay}ms` }}
        />
      ))}
    </span>
  )
}

function Welcome({ name, email, wide }) {
  const url = inboxUrl(email)

  return (
    <div role="status" className={cn(wide ? 'grid items-center gap-6 md:grid-cols-2 md:gap-12' : 'space-y-5')}>
      <style>{WELCOME_CSS}</style>

      {/* Left side - celebration */}
      <div className="flex flex-wrap items-center gap-3">
        <HeartBadge />
        <span className="rounded-full bg-white/80 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-primary ring-1 ring-primary/20">
          Great choice, you're in
        </span>
      </div>

      {/* Right side - message */}
      <div>
        <h3 className={cn('hand leading-tight', wide ? 'text-4xl' : 'text-3xl')}>
          Welcome to the StoryLovers, {name}!
        </h3>

        <div className="mt-4 rounded-xl border border-primary/15 bg-white/70 p-5 shadow-sm">
          <p className="text-base leading-relaxed text-foreground/85">
            I’m really glad you’re here. Please check your inbox for a short welcome email from me.
          </p>

          {url ? (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="group mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-primary/25 bg-white px-4 py-3 transition-colors hover:border-primary"
            >
              <Mail className="size-5 shrink-0 text-sky" strokeWidth={1.6} />
              <span className="min-w-0 break-all font-semibold">{email}</span>
              <span className="ml-auto inline-flex items-center gap-1 text-sm font-semibold text-sky group-hover:underline">
                Open inbox <ArrowUpRight className="size-4" />
              </span>
            </a>
          ) : (
            <div className="mt-3 flex items-center gap-3 rounded-lg border border-primary/25 bg-white px-4 py-3">
              <Mail className="size-5 shrink-0 text-sky" strokeWidth={1.6} />
              <span className="min-w-0 break-all font-semibold">{email}</span>
            </div>
          )}

          <p className="mt-4 text-sm leading-relaxed text-foreground/75">
            If you don’t see it within a few minutes, check your spam or promotions folder.
          </p>
        </div>
      </div>
    </div>
  )
}

export default function SubscribeForm({
  tone = 'rose',
  wide = false,
  className,
  title = 'Join the StoryLovers',
  description = DEFAULT_DESCRIPTION,
  onSubscribed,
}) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [website, setWebsite] = useState('')
  const [trap, setTrap] = useState('') // hidden field: only bots fill it in
  const [state, setState] = useState('idle') // 'idle' | 'sending' | 'done'
  const [message, setMessage] = useState('')
  const [welcomeName, setWelcomeName] = useState('')
  const [welcomeEmail, setWelcomeEmail] = useState('')
  // Checked once, when the box first appears: has this browser already subscribed on an earlier visit?
  const [returning] = useState(() => isSubscribed())

  // Already one of us: no need to ask again, offer the quiz instead.
  // (Someone who just subscribed on this page still sees the welcome message below.)
  if (returning && state !== 'done') {
    return <QuizCallout compact={!wide} className={className} />
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setMessage('')

    // A bot filled the hidden field. If an autofill ever does it by mistake, a real person still sees a message.
    if (trap) {
      setMessage('Something went wrong. Please try again.')
      return
    }

    const cleanName = name.trim()
    const cleanEmail = email.trim().toLowerCase()
    const cleanWebsite = normalizeWebsite(website)

    if (!cleanName) {
      setMessage('Please tell us what to call you.')
      return
    }
    if (cleanWebsite === null) {
      setMessage('That website link does not look right. Leave it empty or try again.')
      return
    }

    try {
      setState('sending')
      await SubscriberService.subscribe(cleanEmail, cleanName, cleanWebsite)
      // Remember them in this browser so the comment box does not ask again
      saveIdentity({ name: cleanName, email: cleanEmail, website: cleanWebsite })
      markSubscribed()
      setWelcomeName(cleanName)
      setWelcomeEmail(cleanEmail)
      setState('done')
      onSubscribed?.()
      setEmail('')
      setName('')
      setWebsite('')
    } catch (err) {
      console.error(err)
      setState('idle')

      if (err.code === '23505') {
        // Already on the list: they can still comment from this browser
        saveIdentity({ name: cleanName, email: cleanEmail, website: cleanWebsite })
        markSubscribed()
        setMessage('You are already on the list.')
      } else if (err.code === 'NAME_REQUIRED' || err.code === '23502') {
        setMessage('Please tell us what to call you.')
      } else if (err.code === 'INVALID_WEBSITE' || err.message?.includes('subscribers_website_valid')) {
        setMessage('That website link does not look right. Leave it empty or try again.')
      } else if (err.code === '23514') {
        setMessage('Please check your name and email address.')
      } else {
        setMessage('Something went wrong. Please try again.')
      }
    }
  }

  const idSuffix = wide ? '-wide' : ''
  const inputClass = 'h-11 rounded-full border-border bg-white px-4'

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
      {state === 'done' ? (
        <Welcome name={welcomeName} email={welcomeEmail} wide={wide} />
      ) : (
        <div className={cn(wide && 'grid items-center gap-6 md:grid-cols-2 md:gap-12')}>
          <div>
            <div className="flex items-center gap-3">
              <Mail className="size-9 shrink-0 text-sky" strokeWidth={1.4} />
              <h3 className={cn('hand leading-none', wide ? 'text-4xl' : 'text-3xl')}>{title}</h3>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-foreground/75">{description}</p>
          </div>

          <form onSubmit={handleSubmit} className={cn(!wide && 'mt-5')}>
            <div className={cn('grid gap-3', wide && 'sm:grid-cols-2')}>
              <Input
                id={`subscribe-name${idSuffix}`}
                type="text"
                placeholder="What should we call you?"
                aria-label="First name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={60}
                required
                autoComplete="given-name"
                className={inputClass}
              />
              <Input
                id={`subscribe-email${idSuffix}`}
                type="email"
                placeholder="Your email address"
                aria-label="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={inputClass}
              />
              <Input
                id={`subscribe-website${idSuffix}`}
                type="text"
                inputMode="url"
                placeholder="Your blog or site (optional)"
                aria-label="Your blog or site (optional)"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                maxLength={200}
                autoComplete="url"
                className={cn(inputClass, wide && 'sm:col-span-2')}
              />

              {/* Hidden trap field for bots. Real visitors never see it. */}
              <input
                type="text"
                name="hp_check"
                value={trap}
                onChange={(e) => setTrap(e.target.value)}
                tabIndex={-1}
                autoComplete="nope"
                data-lpignore="true"
                data-1p-ignore="true"
                aria-hidden="true"
                style={{ position: 'absolute', left: '-9999px' }}
              />

              <Button
                type="submit"
                disabled={state === 'sending'}
                className={cn(
                  'h-11 rounded-full text-sm font-semibold',
                  wide ? 'sm:col-span-2 sm:justify-self-start sm:px-7' : 'w-full'
                )}
              >
                {state === 'sending' ? (
                  'Joining...'
                ) : (
                  <>
                    Count me in <ArrowRight className="size-4" />
                  </>
                )}
              </Button>
            </div>

            {message && (
              <p role="alert" className="mt-3 text-sm text-destructive">
                {message}
              </p>
            )}
          </form>
        </div>
      )}
    </div>
  )
}