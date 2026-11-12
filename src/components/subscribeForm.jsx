import { useState } from 'react'
import { ArrowRight, Mail } from 'lucide-react'
import { SubscriberService } from '@/service/subscriberService'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { normalizeWebsite, saveIdentity } from '@/lib/commenterIdentity'

// Newsletter box.
//  - default: a narrow card (Home sidebar)
//  - wide: a full-width band, text on the left and the form on the right (bottom of a page)
// tone: 'rose' (default) or 'butter'
// Name is required, website is optional.
const DEFAULT_DESCRIPTION =
  'New articles, writing tips, and community updates, delivered to the people who love stories most. Join the inner circle.'

export default function SubscribeForm({
  tone = 'rose',
  wide = false,
  className,
  title = 'Stay in the story',
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

  async function handleSubmit(e) {
    e.preventDefault()
    setMessage('')

    // A bot filled the hidden field: pretend it worked and do nothing
    if (trap) {
      setState('done')
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
      setWelcomeName(cleanName)
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
      <div className={cn(wide && 'grid items-center gap-6 md:grid-cols-2 md:gap-12')}>
        <div>
          <div className="flex items-center gap-3">
            <Mail className="size-9 shrink-0 text-sky" strokeWidth={1.4} />
            <h3 className={cn('hand leading-none', wide ? 'text-4xl' : 'text-3xl')}>{title}</h3>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-foreground/75">
            {description}
          </p>
        </div>

        {state === 'done' ? (
          <div role="status" className={cn('space-y-1', !wide && 'mt-5')}>
            <p className="text-sm font-semibold text-emerald-700">
              Thank you{welcomeName ? `, ${welcomeName}` : ''}! 🌱
            </p>
            <p className="text-sm leading-relaxed text-foreground/75">
              Please check your inbox for a welcome email from us. If it isn't
              there within a few minutes, have a look in your spam or promotions
              folder.
            </p>
          </div>
        ) : (
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
                name="company"
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
        )}
      </div>
    </div>
  )
}