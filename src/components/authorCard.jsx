import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { InstagramIcon, TumblrIcon, XIcon } from '@/components/brandIcons'
import { cn } from '@/lib/utils'

const SOCIALS = [
  { label: 'X', href: 'https://x.com/Tolageek', icon: XIcon },
  { label: 'Instagram', href: 'https://www.instagram.com/oyinade_storylover/', icon: InstagramIcon },
  { label: 'Tumblr', href: 'https://www.tumblr.com/oyinade-storylover', icon: TumblrIcon },
]

// "About the author" card for the sidebars. Photo lives at public/oyin.jpg
export default function AuthorCard({ className }) {
  const [photoOk, setPhotoOk] = useState(true)

  return (
    <div className={cn('overflow-hidden rounded-2xl border border-butter/30 bg-butter-soft', className)}>
      {/* thin pink-to-blue band along the top */}
      <div className="h-1 bg-gradient-to-r from-primary via-primary/50 to-sky" />

      <div className="p-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-sky">About the author</p>

        <div className="mt-5 flex items-center gap-4">
          <div className="shrink-0 rounded-full p-1 ring-1 ring-primary/30">
            {photoOk ? (
              <img
                src="/oyin.jpg"
                alt="Oyinade"
                onError={() => setPhotoOk(false)}
                className="size-16 rounded-full object-cover"
              />
            ) : (
              <div className="flex size-16 items-center justify-center rounded-full bg-rose-soft font-heading text-2xl italic text-primary">
                O
              </div>
            )}
          </div>
          <div>
            <h3 className="font-heading text-2xl font-semibold leading-tight">Oyinade</h3>
            <p className="mt-0.5 text-sm text-muted-foreground">Writer &amp; story student</p>
          </div>
        </div>

        <p className="mt-5 text-sm leading-relaxed text-foreground/80">
          I study storytelling, write stories, and share what I learn along the way.
        </p>

        <div className="mt-6 flex items-center justify-between border-t border-butter/40 pt-4">
          <div className="flex items-center gap-3">
            {SOCIALS.map(({ label, href, icon: Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="text-foreground/55 transition-colors hover:text-primary"
              >
                <Icon className="size-[18px]" />
              </a>
            ))}
          </div>
          <Link
            to="/about"
            className="group inline-flex items-center gap-1 text-sm font-semibold text-sky hover:underline"
          >
            More about me
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </div>
  )
}