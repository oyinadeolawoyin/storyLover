import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, Bookmark, ChevronLeft, ChevronRight, Coffee, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import SectionHeading from '@/components/sectionHeading'
import SubscribeForm from '@/components/subscribeForm'
import Seo from '@/components/seo'

const container = 'mx-auto max-w-7xl px-4 sm:px-6'

// The fun facts carousel. Edit the text here. Colours repeat in this order.
const FUN_FACTS = [
  {
    title: 'Pen and paper first',
    text: 'I write my stories by hand to find inspiration. If I stare at a blank screen, nothing comes. The funny part is that blog posts and articles flow fine on a keyboard.',
  },
  {
    title: 'Flowers before chapters',
    text: 'Before every chapter, I draw a few flowers at the top of my notebook page. It quiets my inner perfectionist so I can start.',
  },
  {
    title: 'Mystery, romance and a hidden identity',
    text: 'I enjoy writing and reading mystery and romance. I love historical stories too. Hidden identity is my favourite trope.',
  },
  {
    title: 'The book that changed everything',
    text: "Story Genius by Lisa Cron was the first book that showed me how storytelling really works. She's still my favourite story coach.",
  },
  {
    title: 'The story that gave me courage',
    text: "I used to write scripts because they felt easier. Then I read Married to the Devil's Son by Jasmine Joseph, a paranormal romance web serial, and it gave me the courage to try prose.",
  },
  {
    title: 'My favourites',
    text: "Kate Noble and Gillian Flynn are my favourite authors, and my favourite colour is blue.",
  },
  {
    title: 'Crying over fictional people',
    text: 'I love Indian films and K-dramas. I love how they can make their characters feel so real and get me completely invested in them.',
  },
  {
    title: 'Music came first',
    text: "Music was my first passion. I love hip hop, Afrobeats and especially guitar music. I write songs sometimes (my voice is not great). I wanted to become a musician before I wanted to become a writer.",
  },
  {
    title: 'Desk goblin',
    text: "I'm an introvert who spends a lot of time in my head and at my desk. Cameras are not my thing.",
  },
  {
    title: 'Writer with no rhythm',
    text: "I'm not really good at dancing, but I really admire people who can dance well.",
  },
  {
    title: 'The fourth of five',
    text: "I'm the fourth child in my family, with two older sisters, an older brother and a younger brother. My family gives me the motivation and courage to keep going.",
  },
  {
    title: 'May 20',
    text: "I was born on May 20. I'm a very shy person.",
  },
]

const FACT_COLORS = ['bg-butter-soft', 'bg-sky-soft', 'bg-rose-soft', 'bg-sage-soft']

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

// One fun fact at a time. Each new card slides in from the side you are moving towards.
// Works with the buttons, the dots, the left/right arrow keys, or a swipe on touch screens.
const SWIPE_DISTANCE = 50

function FunFactsCarousel() {
  const [index, setIndex] = useState(0)
  const [direction, setDirection] = useState(1) // 1 = moving forward, -1 = moving back
  const touchStartX = useRef(null)
  const total = FUN_FACTS.length
  const fact = FUN_FACTS[index]

  const step = (dir) => {
    setDirection(dir)
    setIndex((i) => (i + dir + total) % total)
  }

  const goTo = (i) => {
    if (i === index) return
    setDirection(i > index ? 1 : -1)
    setIndex(i)
  }

  const onKeyDown = (e) => {
    if (e.key === 'ArrowRight') step(1)
    if (e.key === 'ArrowLeft') step(-1)
  }

  const onTouchEnd = (e) => {
    if (touchStartX.current === null) return
    const diff = e.changedTouches[0].clientX - touchStartX.current
    touchStartX.current = null
    if (Math.abs(diff) > SWIPE_DISTANCE) step(diff < 0 ? 1 : -1)
  }

  return (
    <div role="region" aria-roledescription="carousel" aria-label="Fun facts about me" onKeyDown={onKeyDown}>
      <style>{`
        @keyframes fact-in-next {
          from { opacity: 0; transform: translateX(56px) rotate(3deg); }
          to { opacity: 1; transform: none; }
        }
        @keyframes fact-in-prev {
          from { opacity: 0; transform: translateX(-56px) rotate(-3deg); }
          to { opacity: 1; transform: none; }
        }
        .fact-card-next { animation: fact-in-next 450ms cubic-bezier(0.22, 1, 0.36, 1) both; }
        .fact-card-prev { animation: fact-in-prev 450ms cubic-bezier(0.22, 1, 0.36, 1) both; }
        @media (prefers-reduced-motion: reduce) {
          .fact-card-next, .fact-card-prev { animation: none; }
        }
      `}</style>

      <SectionHeading title={`${total} fun facts about me`} />

      {/* overflow-hidden keeps the sliding card from making the page scroll sideways */}
      <div
        className="mx-auto max-w-2xl overflow-hidden px-1 py-4"
        onTouchStart={(e) => (touchStartX.current = e.touches[0].clientX)}
        onTouchEnd={onTouchEnd}
      >
        <article
          key={index}
          aria-live="polite"
          className={`${FACT_COLORS[index % FACT_COLORS.length]} ${
            direction === 1 ? 'fact-card-next' : 'fact-card-prev'
          } flex min-h-64 flex-col justify-center rounded-xl border border-border p-8 shadow-md md:p-10`}
        >
          <h3 className="hand text-3xl leading-snug md:text-4xl">{fact.title}</h3>
          <p className="mt-4 text-lg leading-relaxed text-foreground/80 md:text-xl">{fact.text}</p>
        </article>
      </div>

      <div className="mt-4 flex flex-col items-center gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            className="rounded-full"
            onClick={() => step(-1)}
            aria-label="Previous fun fact"
          >
            <ChevronLeft className="size-5" />
          </Button>

          <div className="flex items-center">
            {FUN_FACTS.map((f, i) => (
              <button
                key={f.title}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Go to fun fact ${i + 1}`}
                aria-current={i === index}
                className="p-1"
              >
                <span
                  className={`block h-2.5 rounded-full transition-all duration-300 ${
                    i === index ? 'w-6 bg-primary' : 'w-2.5 bg-foreground/20'
                  }`}
                />
              </button>
            ))}
          </div>

          <Button
            variant="outline"
            size="icon"
            className="rounded-full"
            onClick={() => step(1)}
            aria-label="Next fun fact"
          >
            <ChevronRight className="size-5" />
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          {index + 1} of {total}
        </p>
      </div>
    </div>
  )
}

export default function About() {
  const [photoOk, setPhotoOk] = useState(true)

  return (
    <div>
      <Seo
        title="About"
        description="I'm Oyinade, a mystery romance writer who studies how stories work and shares what I learn along the way."
      />
      {/* ---------- Intro ---------- */}
      <section className="bg-gradient-to-b from-butter-soft/60 to-background">
        <div className={`${container} grid items-center gap-10 py-12 md:grid-cols-2 md:py-16`}>
          <div>
            <p className="hand text-2xl text-sky">Nice to meet you</p>
            <h1 className="mt-2 text-4xl font-bold leading-tight md:text-6xl">
              <span className="marker-yellow">Hi, I'm Oyinade</span>
            </h1>
            <div className="mt-6 max-w-lg space-y-4 text-lg leading-relaxed text-foreground/80">
              <p>
                I'm a mystery romance writer who loves exploring deep emotions, quiet moments, and the beauty of human connection. 
              </p>
              <p>I'm always curious about how stories work. How can we use science and psychology to pull readers into a story
                world? How do we make readers root for our characters and cry with them? I love searching for the answers and sharing what I discover with writers who are as passionate as I am.
              </p>
              <p>
                What fascinates me most is how deeply stories are tied to human nature. As writers, we can use stories to explore the darkest corners of the human heart, brighten someone's day, or simply help someone see the world a little differently.
              </p>
              <p>
                I'd love to hear why you love stories. Share it with me using{' '}
                <strong className="text-foreground">#StoryLovers</strong> on X, Threads, Tumblr and
                Instagram.
              </p>
            </div>
          </div>

          {/* Your handwritten name art lives at public/oyin.jpg.
              It is tilted and taped like the sticky notes on the home page, and straightens when you hover. */}
          <div className="relative mx-auto w-full max-w-xl rotate-2 transition-transform duration-300 hover:rotate-0 motion-reduce:transition-none md:ml-auto">
            {/* a little piece of tape */}
            <span
              aria-hidden="true"
              className="absolute -top-3 left-1/2 z-10 h-7 w-28 -translate-x-1/2 -rotate-3 border border-amber-300/50 bg-amber-200/80 shadow-sm"
            />
            {photoOk ? (
              <img
                src="/oyin.jpg"
                alt="Oyinade written in handwritten lettering, surrounded by small drawings of flowers, a crown, a coffee cup, a moon and stars"
                width="855"
                height="730"
                onError={() => setPhotoOk(false)}
                className="h-auto w-full rounded-2xl shadow-soft"
              />
            ) : (
              <div className="hand flex aspect-[7/6] w-full items-center justify-center rounded-2xl bg-primary/15 text-8xl">
                Oyinade
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ---------- Fun facts ---------- */}
      <section className={`${container} py-12`}>
        <FunFactsCarousel />
      </section>

      {/* ---------- What you will find here ---------- */}
      <section className="bg-sky-soft/50 py-12">
        <div className={container}>
          <SectionHeading title="What you'll find here" />
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
        </div>
      </section>

      {/* ---------- Newsletter ---------- */}
      <section className={`${container} py-16`}>
        <SubscribeForm wide />
      </section>
    </div>
  )
}