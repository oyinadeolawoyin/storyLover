import { useState } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, Bookmark, Coffee, Star } from 'lucide-react'
import SubscribeForm from '@/components/subscribeForm'
import Seo from '@/components/seo'

const container = 'mx-auto max-w-7xl px-4 sm:px-6'

// What readers will find on the site. Edit the text here.
const FIND_HERE = [
  {
    to: '/articles',
    title: 'Articles',
    text: 'Practical ways to understand your story and write a first draft that works.',
    icon: BookOpen,
    bg: 'bg-rose-soft',
  },
  {
    to: '/recommendations',
    title: 'Recommendations',
    text: 'Books, films, stories and tools I have found helpful or just really loved.',
    icon: Bookmark,
    bg: 'bg-sky-soft',
  },
  {
    to: '/category/reviews',
    title: 'Reviews',
    text: 'My honest takes on the stories I watch and read.',
    icon: Star,
    bg: 'bg-butter-soft',
  },
  {
    to: '/category/off-the-page',
    title: 'Off the Page',
    text: 'Life beyond the writing.',
    icon: Coffee,
    bg: 'bg-sage-soft',
  },
]

export default function About() {
  const [photoOk, setPhotoOk] = useState(true)

  return (
    <div>
      <Seo
        title="About"
        description="I'm Oyin, a writer who studies storytelling, writes stories and shares what I learn along the way."
      />
      {/* ---------- Intro ---------- */}
      <section className="bg-gradient-to-b from-butter-soft/60 to-background">
        <div className={`${container} grid items-center gap-10 py-12 md:grid-cols-2 md:py-16`}>
          <div>
            <p className="hand text-2xl text-sky">Nice to meet you</p>
            <h1 className="mt-2 text-4xl font-bold leading-tight md:text-6xl">
              <span className="marker-yellow">Hi, I'm Oyin</span>
            </h1>
            <div className="mt-6 max-w-lg space-y-4 text-lg leading-relaxed text-foreground/80">
              <p>
                I'm a writer who studies storytelling, writes stories, experiments with ideas, and shares
                what I learn along the way.
              </p>
              <p>I'm learning this too. Let's figure it out together.</p>
            </div>
          </div>

          {/* Put your photo at public/oyin.jpg */}
          {photoOk ? (
            <img
              src="/oyin.jpg"
              alt="Oyin"
              onError={() => setPhotoOk(false)}
              className="mx-auto aspect-[4/5] w-full max-w-sm rounded-2xl object-cover shadow-soft md:ml-auto"
            />
          ) : (
            <div className="hand mx-auto flex aspect-[4/5] w-full max-w-sm items-center justify-center rounded-2xl bg-primary/15 text-8xl md:ml-auto">
              O
            </div>
          )}
        </div>
      </section>

      {/* ---------- What you will find here ---------- */}
      <section className={`${container} py-12`}>
        <h2 className="hand mb-6 text-3xl md:text-4xl">
          <span className="marker">What you'll find here</span>
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FIND_HERE.map(({ to, title, text, icon: Icon, bg }) => (
            <Link
              key={to}
              to={to}
              className={`${bg} flex flex-col rounded-xl border border-border p-6 transition-shadow hover:shadow-md`}
            >
              <Icon className="size-8 text-foreground/70" strokeWidth={1.5} />
              <h3 className="mt-4 text-xl font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-foreground/75">{text}</p>
              <span className="mt-auto pt-5 text-sm font-semibold text-sky">Take a look</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ---------- Newsletter ---------- */}
      <section className={`${container} pb-16`}>
        <SubscribeForm wide />
      </section>
    </div>
  )
}