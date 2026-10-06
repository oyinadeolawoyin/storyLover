import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

// Each category gets one colour family, picked from its slug so it never changes.
// pill = small label on a card, chip = filter button, active = chosen filter button.
const TONES = [
  {
    pill: 'bg-rose-soft text-primary',
    chip: 'bg-rose-soft border-primary/25 hover:border-primary',
    active: 'bg-primary border-primary text-primary-foreground',
  },
  {
    pill: 'bg-sky-soft text-sky',
    chip: 'bg-sky-soft border-sky/25 hover:border-sky',
    active: 'bg-sky border-sky text-white',
  },
  {
    pill: 'bg-butter-soft text-amber-700',
    chip: 'bg-butter-soft border-butter/40 hover:border-butter',
    active: 'bg-butter border-butter text-foreground',
  },
  {
    pill: 'bg-sage-soft text-emerald-700',
    chip: 'bg-sage-soft border-emerald-600/25 hover:border-emerald-600',
    active: 'bg-emerald-600 border-emerald-600 text-white',
  },
]

export function categoryTone(slug = '') {
  let sum = 0
  for (const ch of slug) sum += ch.charCodeAt(0)
  return TONES[sum % TONES.length]
}

export default function CategoryPill({ category, link = false, className }) {
  if (!category) return null
  const classes = cn(
    'inline-block rounded-md px-2.5 py-1 text-xs font-bold',
    categoryTone(category.slug).pill,
    className
  )
  return link ? (
    <Link to={`/category/${category.slug}`} className={classes}>
      {category.name}
    </Link>
  ) : (
    <span className={classes}>{category.name}</span>
  )
}