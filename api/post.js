// Vercel function for /posts/:slug (see the rewrite in vercel.json).
// It loads the post from Supabase, then sends your normal index.html with that post's
// title, excerpt, cover image and link filled into the <head>. Social sites such as
// Facebook, X, LinkedIn, Threads and Bluesky do not run JavaScript, so this is what
// makes their preview cards show the right post. Visitors still get the normal site.

const SITE_NAME = 'StoryLover'

const escapeHtml = (text = '') =>
  String(text)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

async function getPost(slug) {
  // Same Supabase values your site already uses. Add them in Vercel > Settings > Environment Variables.
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const supabaseKey =
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY
  if (!supabaseUrl || !supabaseKey) return null

  // Only live posts (published, date reached). The database rules apply here too.
  const query =
    `select=title,excerpt,cover_image,published_at,slug` +
    `&slug=eq.${encodeURIComponent(slug)}` +
    `&status=eq.published` +
    `&published_at=lte.${encodeURIComponent(new Date().toISOString())}` +
    `&limit=1`

  const res = await fetch(`${supabaseUrl}/rest/v1/posts?${query}`, {
    headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
  })
  if (!res.ok) return null
  const rows = await res.json()
  return rows[0] ?? null
}

export default async function handler(req, res) {
  const slug = String(req.query.slug ?? '')
  const host = req.headers['x-forwarded-host'] || req.headers.host
  const origin = `https://${host}`

  // Your built index.html (a static file, so it is not caught by the rewrite)
  const indexRes = await fetch(`${origin}/index.html`)
  let html = await indexRes.text()

  let post = null
  try {
    post = slug ? await getPost(slug) : null
  } catch (err) {
    console.error(err)
  }

  // No such post: send the normal page, the site will show its own "not found"
  if (!post) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.setHeader('Cache-Control', 'public, s-maxage=60')
    return res.status(404).send(html)
  }

  const url = `${origin}/posts/${post.slug}`
  const title = escapeHtml(post.title)
  const fullTitle = escapeHtml(`${post.title} | ${SITE_NAME}`)
  const description = escapeHtml(post.excerpt || 'Learn storytelling and write a first draft that works.')
  const image = escapeHtml(post.cover_image || `${origin}/og-default.png`)

  // Take out the default tags from index.html so each one appears only once
  html = html
    .replace(/<title>[\s\S]*?<\/title>/i, '')
    .replace(/<link\s+[^>]*rel=["']canonical["'][^>]*>/gi, '')
    .replace(/<meta\s+[^>]*(?:property|name)=["'](?:og:[^"']*|twitter:[^"']*|description|robots)["'][^>]*>/gi, '')

  const tags = `
    <title>${fullTitle}</title>
    <meta name="description" content="${description}" />
    <meta name="robots" content="index, follow" />
    <link rel="canonical" href="${url}" />
    <meta property="og:site_name" content="${SITE_NAME}" />
    <meta property="og:type" content="article" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:url" content="${url}" />
    <meta property="og:image" content="${image}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="${image}" />
  `

  html = html.replace('</head>', `${tags}</head>`)

  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  // Shared for 5 minutes, then refreshed in the background
  res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600')
  return res.status(200).send(html)
}