import { useState } from 'react'
import { Check, Link as LinkIcon } from 'lucide-react'
import {
  BlueskyIcon,
  FacebookIcon,
  LinkedinIcon,
  PinterestIcon,
  ThreadsIcon,
  TumblrIcon,
  XIcon,
} from '@/components/brandIcons'
import { cn } from '@/lib/utils'

// Reusable share buttons: Facebook, X, LinkedIn, Threads, Bluesky, Tumblr,
// Pinterest (only when there is an image) and Copy link.
//
// Use it anywhere:
//   <ShareButtons
//     url="https://storylover.com/posts/my-story"   // optional, defaults to the current page
//     title="My story"
//     excerpt="A short summary"                       // optional
//     image="https://.../cover.jpg"                   // optional, Pinterest only shows with an image
//     onShare={(platform) => AnalyticsService.share({ slug, platform })}
//   />
//
// Analytics stays with the page that uses it: this component only calls
// onShare(platform) on every click, so a post and a quiz can count shares differently.
// Platform names: facebook, x, linkedin, threads, bluesky, tumblr, pinterest, copy-link.
//
// On X, Facebook, LinkedIn, Threads and Bluesky the preview image comes from the
// page's Open Graph tags (see seo.jsx), so the page being shared needs <Seo />.

export const DEFAULT_HASHTAG = '#storyLoversCommunity'
export const DEFAULT_TAGLINE = 'Create a story that moves your readers.'

function clip(text, max) {
  if (!text || max <= 0) return ''
  if (text.length <= max) return text
  return text.slice(0, Math.max(0, max - 1)).replace(/\s+\S*$/, '').trimEnd() + '…'
}

// Joins the non-empty parts, so an empty tagline or hashtag leaves no blank line behind
const lines = (...parts) => parts.filter(Boolean).join('\n')

// title + excerpt + tail, trimmed so the whole thing fits the platform's limit.
// The excerpt is the part that gets shortened. It is dropped if there is hardly any room.
function compose({ title, excerpt, tail, max }) {
  const t = clip(title, 120)
  const room = max - t.length - tail.length - 4 // 4 = the two blank lines
  const e = room >= 25 ? clip(excerpt, room) : ''
  return [t, e, tail].filter(Boolean).join('\n\n')
}

// The share links and the copy-link logic. Exported in case you ever want your own layout.
export function useShare({
  url: urlProp,
  title = '',
  excerpt = '',
  image,
  tagline = DEFAULT_TAGLINE, // pass '' to leave it out
  hashtag = DEFAULT_HASHTAG, // with or without the # sign
  onShare,
}) {
  const [copied, setCopied] = useState(false)
  const enc = encodeURIComponent

  const url =
    urlProp ?? (typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}` : '')

  const tagName = (hashtag || '').replace(/^#/, '') // the tag without the # sign
  const tag = tagName ? `#${tagName}` : ''
  const summary = excerpt ?? ''

  // X: 280 characters, and the link always counts as about 23 of them
  const xText = compose({ title, excerpt: summary, tail: lines(tagline, tag), max: 280 - 24 })

  // Bluesky: 300 characters and no separate link field, so the link goes inside the text
  const blueskyText = compose({ title, excerpt: summary, tail: lines(tagline, tag, url), max: 300 })

  // Threads: the link is attached as a card and the hashtag goes in as the post's topic tag
  const threadsText = compose({ title, excerpt: summary, tail: tagline, max: 450 })

  const links = [
    {
      platform: 'facebook',
      label: 'Share on Facebook',
      // Facebook only takes the link (and a hashtag). The title, excerpt and image come from the page itself.
      href: `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}${tag ? `&hashtag=${enc(tag)}` : ''}`,
      icon: FacebookIcon,
    },
    {
      platform: 'x',
      label: 'Share on X',
      href: `https://twitter.com/intent/tweet?text=${enc(xText)}&url=${enc(url)}`,
      icon: XIcon,
    },
    {
      platform: 'linkedin',
      label: 'Share on LinkedIn',
      // LinkedIn only takes the link. The title, excerpt and image come from the page itself.
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${enc(url)}`,
      icon: LinkedinIcon,
    },
    {
      platform: 'threads',
      label: 'Share on Threads',
      href: `https://www.threads.com/intent/post?text=${enc(threadsText)}&url=${enc(url)}${
        tagName ? `&tag=${enc(tagName)}` : ''
      }`,
      icon: ThreadsIcon,
    },
    {
      platform: 'bluesky',
      label: 'Share on Bluesky',
      href: `https://bsky.app/intent/compose?text=${enc(blueskyText)}`,
      icon: BlueskyIcon,
    },
    {
      platform: 'tumblr',
      label: 'Share on Tumblr',
      href:
        `https://www.tumblr.com/widgets/share/tool?posttype=link&canonicalUrl=${enc(url)}` +
        `&title=${enc(title)}&caption=${enc([summary, tagline].filter(Boolean).join('\n\n'))}` +
        (tagName ? `&tags=${enc(tagName)}` : ''),
      icon: TumblrIcon,
    },
  ]

  // Pinterest needs a picture, so it only shows when there is an image
  if (image) {
    const pinText = compose({ title, excerpt: summary, tail: [tagline, tag].filter(Boolean).join(' '), max: 480 })
    links.push({
      platform: 'pinterest',
      label: 'Pin on Pinterest',
      href: `https://pinterest.com/pin/create/button/?url=${enc(url)}&media=${enc(image)}&description=${enc(pinText)}`,
      icon: PinterestIcon,
    })
  }

  async function copy() {
    onShare?.('copy-link')
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error(err)
    }
  }

  return { links, copied, copy }
}

export default function ShareButtons({ className, onShare, ...shareOptions }) {
  const { links, copied, copy } = useShare({ ...shareOptions, onShare })

  return (
    <div className={cn('flex flex-wrap items-center justify-center gap-3', className)}>
      {links.map(({ label, href, icon: Icon, platform }) => (
        <a
          key={platform}
          href={href}
          target="_blank"
          rel="noreferrer"
          aria-label={label}
          onClick={() => onShare?.(platform)}
          className="flex size-11 items-center justify-center rounded-full bg-sky text-white transition-opacity hover:opacity-85"
        >
          <Icon className="size-4" />
        </a>
      ))}
      <button
        type="button"
        onClick={copy}
        className="inline-flex h-11 items-center gap-2 rounded-full border border-sky bg-white px-5 text-sm font-semibold text-sky transition-colors hover:bg-sky hover:text-white"
      >
        {copied ? <Check className="size-4" /> : <LinkIcon className="size-4" />}
        {copied ? 'Link copied' : 'Copy link'}
      </button>
    </div>
  )
}