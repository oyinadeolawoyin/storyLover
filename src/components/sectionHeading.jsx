import { Link } from 'react-router-dom'

// Handwritten title with a marker underline, optional subtitle and "see all" link.
export default function SectionHeading({ title, subtitle, to, linkLabel, as: Tag = 'h2' }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div>
        <Tag className="hand text-3xl md:text-4xl">
          <span className="marker">{title}</span>
        </Tag>
        {subtitle && <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {to && (
        <Link to={to} className="shrink-0 text-sm font-semibold text-sky hover:underline">
          {linkLabel ?? 'See all'}
        </Link>
      )}
    </div>
  )
}