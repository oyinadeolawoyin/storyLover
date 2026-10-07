import { useEffect } from 'react'

const SITE_NAME = 'StoryLover'
const DEFAULT_DESCRIPTION = 'Learn storytelling, understand your story, and write a first draft that works.'

// Finds a <meta> tag in the page head (or makes it) and sets its content.
function setMeta(attr, key, content) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

/**
 * Sets the browser tab title and the page's meta tags.
 * Put <Seo title="..." /> at the top of a page. No title gives the home page title.
 * Props: title, description, image (full web address), type ('website' | 'article'), noindex
 */
export default function Seo({ title, description = DEFAULT_DESCRIPTION, image, type = 'website', noindex = false }) {
  useEffect(() => {
    const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} | Create a story that moves your readers`
    const url = window.location.origin + window.location.pathname
    const img = image || `${window.location.origin}/og-default.png`

    document.title = fullTitle

    setMeta('name', 'description', description)
    setMeta('name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow')

    setMeta('property', 'og:site_name', SITE_NAME)
    setMeta('property', 'og:type', type)
    setMeta('property', 'og:title', title || fullTitle)
    setMeta('property', 'og:description', description)
    setMeta('property', 'og:url', url)
    setMeta('property', 'og:image', img)

    setMeta('name', 'twitter:card', 'summary_large_image')
    setMeta('name', 'twitter:title', title || fullTitle)
    setMeta('name', 'twitter:description', description)
    setMeta('name', 'twitter:image', img)

    let canonical = document.head.querySelector('link[rel="canonical"]')
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.setAttribute('rel', 'canonical')
      document.head.appendChild(canonical)
    }
    canonical.setAttribute('href', url)
  }, [title, description, image, type, noindex])

  return null
}