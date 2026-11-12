// Remembers who the visitor is (name, email, website) in this browser, so after
// they subscribe or comment once they are not asked again.
// The email stays in their own browser and is never shown on the site.

const KEY = 'storylover:commenter'
const MINE_KEY = 'storylover:my-comments'

export function loadIdentity() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const value = JSON.parse(raw)
    if (value?.email && value?.name) return value
  } catch {
    // storage blocked or broken data: act as if nobody is remembered
  }
  return null
}

export function saveIdentity({ name, email, website = '' }) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ name, email, website }))
  } catch {
    // private mode etc.: not a problem, they will just be asked again
  }
}

export function clearIdentity() {
  try {
    localStorage.removeItem(KEY)
    localStorage.removeItem(MINE_KEY) // a different person is commenting now, so these are no longer theirs
  } catch {
    // ignore
  }
}

// The ids of the comments written in this browser, so only those show an Edit button.
export function loadMyCommentIds() {
  try {
    const list = JSON.parse(localStorage.getItem(MINE_KEY) || '[]')
    return Array.isArray(list) ? list : []
  } catch {
    return []
  }
}

export function rememberMyComment(id) {
  try {
    const list = loadMyCommentIds().filter((x) => x !== id)
    list.push(id)
    localStorage.setItem(MINE_KEY, JSON.stringify(list.slice(-300)))
  } catch {
    // private mode etc.: they just won't see Edit after a reload
  }
}

export const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

/**
 * Cleans a website the visitor typed.
 *  ''    -> nothing typed (fine, it is optional)
 *  null  -> typed but not a usable link
 *  other -> a clean http(s) link ("mysite.com" becomes "https://mysite.com")
 */
export function normalizeWebsite(input) {
  const raw = (input ?? '').trim()
  if (!raw) return ''
  const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(raw) ? raw : `https://${raw}`
  try {
    const url = new URL(withScheme)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null
    if (!url.hostname.includes('.')) return null
    if (withScheme.length > 200) return null
    return withScheme
  } catch {
    return null
  }
}