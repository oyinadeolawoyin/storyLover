import { useState } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

// "Know the author" box for the sidebars. Photo lives at public/oyin.jpg
export default function AuthorCard({ className }) {
  const [photoOk, setPhotoOk] = useState(true)

  return (
    <div className={cn('rounded-xl border border-butter/30 bg-butter-soft p-6', className)}>
      <h3 className="hand text-3xl leading-none">Know the author</h3>

      <div className="mt-4 flex items-start gap-4">
        {photoOk ? (
          <img
            src="/oyin.jpg"
            alt="Oyin"
            onError={() => setPhotoOk(false)}
            className="size-16 shrink-0 rounded-full object-cover"
          />
        ) : (
          <div className="hand flex size-16 shrink-0 items-center justify-center rounded-full bg-primary/20 text-3xl">
            O
          </div>
        )}
        <p className="text-sm leading-relaxed text-foreground/80">
          I'm <strong>Oyin</strong>, a writer learning how stories work by writing, studying and experimenting.
        </p>
      </div>

      <Link to="/about" className="mt-4 inline-block text-sm font-semibold text-sky hover:underline">
        Read more about me
      </Link>
    </div>
  )
}