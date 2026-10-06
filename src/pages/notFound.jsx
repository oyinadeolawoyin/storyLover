import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import Seo from '@/components/seo'

export default function NotFound() {
  return (
    <div className="bg-gradient-to-b from-butter-soft/60 to-background">
      <Seo title="Page not found" noindex />
      <div className="mx-auto flex max-w-2xl flex-col items-center px-4 py-20 text-center sm:py-28">
        <p className="hand text-3xl text-sky">Oh no, a missing page</p>
        <h1 className="mt-3 text-4xl font-bold leading-tight md:text-6xl">
          <span className="marker-yellow">Page not found</span>
        </h1>
        <p className="mt-6 max-w-md text-lg leading-relaxed text-foreground/80">
          This page may have moved, or the address has a small typo. Let's get you back to the story.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg" className="rounded-full px-6">
            <Link to="/">Back home</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="rounded-full border-sky px-6 text-sky hover:text-sky">
            <Link to="/articles">Read the articles</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}