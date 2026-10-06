import { forwardRef, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Film, ImagePlus, Link as LinkIcon, Plus, Trash2 } from 'lucide-react'
import { CategoryService } from '@/service/categoryService'
import { MediaService } from '@/service/mediaService'
import { PostService } from '@/service/postService'
import { slugify } from '@/utils/slugify'
import MarkdownContent from '@/components/markdownContent'
import AdminShell from '@/components/adminShell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

const EMPTY_FORM = {
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  cover_image: '',
  category_id: '',
  quote: '',
  exercise: '',
  resources: [],
  status: 'draft',
}

// Same look as the shadcn Input, for selects and text areas
const fieldClass =
  'w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50'
const textareaClass = `${fieldClass} py-2`
const selectClass = `${fieldClass} h-9`

// A text area with no scrollbar of its own: it grows with the text,
// so everything you wrote is always visible and the page itself scrolls.
const AutoTextarea = forwardRef(function AutoTextarea({ value, className, ...props }, forwardedRef) {
  const innerRef = useRef(null)

  const resize = useCallback(() => {
    const el = innerRef.current
    if (!el) return
    const y = window.scrollY // resizing can make the page jump, so remember where we were
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
    window.scrollTo(0, y)
  }, [])

  useLayoutEffect(resize, [value, resize])

  useEffect(() => {
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [resize])

  function setRefs(node) {
    innerRef.current = node
    if (typeof forwardedRef === 'function') forwardedRef(node)
    else if (forwardedRef) forwardedRef.current = node
  }

  return (
    <textarea
      ref={setRefs}
      value={value}
      className={cn('block w-full resize-none overflow-hidden outline-none', className)}
      {...props}
    />
  )
})

function Field({ label, hint, htmlFor, children }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="text-sm font-semibold">
        {label}
        {hint && <span className="font-normal text-muted-foreground"> {hint}</span>}
      </label>
      {children}
    </div>
  )
}

export default function PostForm() {
  const { id } = useParams() // present when editing, missing when creating
  const isEditing = Boolean(id)
  const navigate = useNavigate()

  const [form, setForm] = useState(EMPTY_FORM)
  const [categories, setCategories] = useState([])
  const [slugTouched, setSlugTouched] = useState(false)
  const [tab, setTab] = useState('write') // 'write' or 'preview'
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const contentRef = useRef(null)
  const imageInputRef = useRef(null)
  const videoInputRef = useRef(null)
  const coverInputRef = useRef(null)

  // Load categories (and the post, when editing)
  useEffect(() => {
    async function loadData() {
      try {
        const cats = await CategoryService.list()
        setCategories(cats)

        if (isEditing) {
          const post = await PostService.getById(id)
          setForm({
            title: post.title ?? '',
            slug: post.slug ?? '',
            excerpt: post.excerpt ?? '',
            content: post.content ?? '',
            cover_image: post.cover_image ?? '',
            category_id: post.category_id ?? '',
            quote: post.quote ?? '',
            exercise: post.exercise ?? '',
            resources: post.resources ?? [],
            status: post.status ?? 'draft',
          })
          setSlugTouched(true) // do not change the slug of an existing post by accident
        }
      } catch (err) {
        console.error(err)
        setError('Could not load the form. Check the console.')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [id, isEditing])

  function setField(name, value) {
    setForm((f) => ({ ...f, [name]: value }))
  }

  function handleTitleChange(value) {
    setForm((f) => ({
      ...f,
      title: value,
      slug: slugTouched ? f.slug : slugify(value),
    }))
  }

  // ---------- Resources (title + link pairs) ----------
  function addResource() {
    setForm((f) => ({ ...f, resources: [...f.resources, { title: '', url: '' }] }))
  }

  function updateResource(index, field, value) {
    setForm((f) => ({
      ...f,
      resources: f.resources.map((r, i) => (i === index ? { ...r, [field]: value } : r)),
    }))
  }

  function removeResource(index) {
    setForm((f) => ({ ...f, resources: f.resources.filter((_, i) => i !== index) }))
  }

  // ---------- Uploads ----------
  async function handleCoverUpload(e) {
    const file = e.target.files[0]
    e.target.value = '' // lets you pick the same file again later
    if (!file) return

    try {
      setUploading(true)
      setError('')
      const url = await MediaService.upload(file, 'covers')
      setField('cover_image', url)
    } catch (err) {
      console.error(err)
      setError(err.message || 'Upload failed.')
    } finally {
      setUploading(false)
    }
  }

  // Puts text into the content box at the cursor
  function insertIntoContent(text) {
    const el = contentRef.current
    const start = el ? el.selectionStart : null
    const end = el ? el.selectionEnd : null

    setForm((f) => {
      const s = start ?? f.content.length
      const e = end ?? f.content.length
      return { ...f, content: f.content.slice(0, s) + text + f.content.slice(e) }
    })
  }

  async function handleMediaUpload(e, kind) {
    const file = e.target.files[0]
    e.target.value = ''
    if (!file) return

    try {
      setUploading(true)
      setError('')
      const url = await MediaService.upload(file, 'posts')

      if (kind === 'image') {
        const alt = window.prompt('Short description of the image (for screen readers). You can leave it empty.') ?? ''
        insertIntoContent(`\n\n![${alt}](${url})\n\n`)
      } else {
        insertIntoContent(`\n\n[video](${url})\n\n`)
      }
    } catch (err) {
      console.error(err)
      setError(err.message || 'Upload failed.')
    } finally {
      setUploading(false)
    }
  }

  function handleVideoLink() {
    let url = window.prompt('Paste a YouTube or Vimeo link:')
    if (!url) return
    url = url.trim()
    if (!/^https?:\/\//i.test(url)) url = `https://${url}`
    insertIntoContent(`\n\n[video](${url})\n\n`)
  }

  // ---------- Save ----------
  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!form.title.trim()) return setError('Please add a title.')
    const slug = slugify(form.slug)
    if (!slug) return setError('Please add a slug (the end of the web address).')

    const payload = {
      title: form.title.trim(),
      slug,
      excerpt: form.excerpt.trim() || null,
      content: form.content,
      cover_image: form.cover_image || null,
      category_id: form.category_id || null,
      quote: form.quote.trim() || null,
      exercise: form.exercise.trim() || null,
      // drop any resource rows left empty
      resources: form.resources
        .map((r) => ({ title: r.title.trim(), url: r.url.trim() }))
        .filter((r) => r.title && r.url),
      status: form.status,
    }

    try {
      setSaving(true)
      if (isEditing) {
        await PostService.update(id, payload)
      } else {
        await PostService.create(payload)
      }
      navigate('/admin')
    } catch (err) {
      console.error(err)
      if (err.code === '23505') {
        setError('That slug is already used by another post. Please change it.')
      } else {
        setError('Could not save the post. Check the console.')
      }
    } finally {
      setSaving(false)
    }
  }

  const wordCount = form.content.trim() ? form.content.trim().split(/\s+/).length : 0

  const saveLabel = saving ? 'Saving...' : isEditing ? 'Save changes' : 'Create post'

  const shellProps = {
    title: isEditing ? 'Edit post' : 'New post',
    back: { to: '/admin', label: 'Back to posts' },
  }

  if (loading) {
    return (
      <AdminShell {...shellProps}>
        <p className="text-muted-foreground">Loading...</p>
      </AdminShell>
    )
  }

  return (
    <AdminShell
      {...shellProps}
      actions={
        <Button type="submit" form="post-form" disabled={saving || uploading}>
          {saveLabel}
        </Button>
      }
    >
      <form id="post-form" onSubmit={handleSubmit}>
        {error && (
          <p className="mb-6 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>
        )}

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
          {/* ---------- Main column: the writing ---------- */}
          <div className="min-w-0 space-y-6">
            {/* ---------- The writing page: no boxes, it just grows ---------- */}
            <div className="card-soft p-6 sm:p-10">
              <input
                id="title"
                type="text"
                value={form.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Post title"
                aria-label="Title"
                className="w-full bg-transparent font-heading text-3xl font-bold outline-none placeholder:text-muted-foreground/40 sm:text-5xl"
              />

              <div className="mt-3 flex items-center gap-1 text-sm text-muted-foreground">
                <label htmlFor="slug" className="shrink-0">
                  /posts/
                </label>
                <input
                  id="slug"
                  type="text"
                  value={form.slug}
                  onChange={(e) => {
                    setSlugTouched(true)
                    setField('slug', e.target.value)
                  }}
                  placeholder="the-end-of-the-web-address"
                  className="min-w-0 flex-1 border-b border-dashed border-transparent bg-transparent outline-none focus:border-border"
                />
              </div>

              <AutoTextarea
                id="excerpt"
                rows={1}
                value={form.excerpt}
                onChange={(e) => setField('excerpt', e.target.value)}
                placeholder="A short summary that shows on the cards..."
                aria-label="Excerpt"
                className="mt-6 bg-transparent text-lg leading-relaxed text-foreground/80 placeholder:text-muted-foreground/40"
              />

              <hr className="my-6 border-border" />

              {/* Insert buttons and the Write / Preview switch */}
              <input
                ref={imageInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={(e) => handleMediaUpload(e, 'image')}
                hidden
              />
              <input
                ref={videoInputRef}
                type="file"
                accept="video/mp4,video/webm"
                onChange={(e) => handleMediaUpload(e, 'video')}
                hidden
              />

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setTab('write')
                      imageInputRef.current.click()
                    }}
                    disabled={uploading}
                  >
                    <ImagePlus className="size-4" /> Image
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setTab('write')
                      videoInputRef.current.click()
                    }}
                    disabled={uploading}
                  >
                    <Film className="size-4" /> Video file
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setTab('write')
                      handleVideoLink()
                    }}
                    disabled={uploading}
                  >
                    <LinkIcon className="size-4" /> YouTube / Vimeo
                  </Button>
                  {uploading && <span className="text-sm text-muted-foreground">Uploading...</span>}
                </div>

                <div className="flex rounded-full border border-border bg-muted/60 p-1">
                  {['write', 'preview'].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTab(t)}
                      className={cn(
                        'rounded-full px-4 py-1 text-sm font-semibold capitalize transition-colors',
                        tab === t ? 'bg-card shadow-soft' : 'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {tab === 'write' ? (
                <>
                  <AutoTextarea
                    ref={contentRef}
                    value={form.content}
                    onChange={(e) => setField('content', e.target.value)}
                    placeholder="Start writing your story..."
                    aria-label="Content"
                    className="mt-6 min-h-[60vh] bg-transparent text-lg leading-8 placeholder:text-muted-foreground/40"
                  />
                  <p className="mt-6 border-t border-border pt-3 text-xs text-muted-foreground">
                    {wordCount} {wordCount === 1 ? 'word' : 'words'} &middot; Leave a blank line between
                    paragraphs. **bold**, *italic* and ## Heading work.
                  </p>
                </>
              ) : (
                <div className="mt-6 min-h-[60vh]">
                  {form.content.trim() ? (
                    <MarkdownContent className="article-body" content={form.content} />
                  ) : (
                    <p className="text-sm text-muted-foreground">Nothing to preview yet.</p>
                  )}
                </div>
              )}
            </div>

            {/* Quote and exercise */}
            <div className="card-soft space-y-5 p-6">
              <Field label="Quote" hint="(optional, shown above the article)" htmlFor="quote">
                <AutoTextarea
                  id="quote"
                  rows={1}
                  value={form.quote}
                  onChange={(e) => setField('quote', e.target.value)}
                  placeholder="A line that sums up the article..."
                  className="bg-transparent font-heading text-xl italic leading-relaxed placeholder:text-muted-foreground/40"
                />
              </Field>

              <hr className="border-border" />

              <Field label="Exercise" hint='(optional, shown in the "Try this" box)' htmlFor="exercise">
                <AutoTextarea
                  id="exercise"
                  rows={1}
                  value={form.exercise}
                  onChange={(e) => setField('exercise', e.target.value)}
                  placeholder="Give readers something to try..."
                  className="bg-transparent text-lg leading-relaxed placeholder:text-muted-foreground/40"
                />
              </Field>
            </div>

            {/* Resources */}
            <div className="card-soft p-6">
              <h2 className="hand text-3xl leading-none">
                Helpful resources <span className="text-lg text-muted-foreground">(optional)</span>
              </h2>

              <div className="mt-4 space-y-3">
                {form.resources.map((r, i) => (
                  <div key={i} className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
                    <Input
                      type="text"
                      placeholder="Title"
                      aria-label="Resource title"
                      value={r.title}
                      onChange={(e) => updateResource(i, 'title', e.target.value)}
                      className="sm:max-w-56"
                    />
                    <Input
                      type="url"
                      placeholder="https://..."
                      aria-label="Resource link"
                      value={r.url}
                      onChange={(e) => updateResource(i, 'url', e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label="Remove resource"
                      className="text-destructive hover:text-destructive"
                      onClick={() => removeResource(i)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <Button type="button" variant="outline" size="sm" className="mt-4" onClick={addResource}>
                <Plus className="size-4" /> Add resource
              </Button>
            </div>
          </div>

          {/* ---------- Side column: publishing details ---------- */}
          <aside className="min-w-0 space-y-6">
            <div className="card-soft space-y-5 p-6">
              <h2 className="hand text-3xl leading-none">Publish</h2>

              <Field label="Status" htmlFor="status">
                <select
                  id="status"
                  value={form.status}
                  onChange={(e) => setField('status', e.target.value)}
                  className={selectClass}
                >
                  <option value="draft">Draft (hidden)</option>
                  <option value="published">Published (visible)</option>
                </select>
              </Field>

              <Field label="Category" htmlFor="category">
                <select
                  id="category"
                  value={form.category_id}
                  onChange={(e) => setField('category_id', e.target.value)}
                  className={selectClass}
                >
                  <option value="">No category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </Field>

              <Button type="submit" disabled={saving || uploading} className="w-full">
                {saveLabel}
              </Button>
            </div>

            <div className="card-soft p-6">
              <h2 className="hand text-3xl leading-none">
                Cover image <span className="text-lg text-muted-foreground">(optional)</span>
              </h2>

              {form.cover_image && (
                <img
                  src={form.cover_image}
                  alt="Cover preview"
                  className="mt-4 aspect-[16/10] w-full rounded-lg border border-border object-cover"
                />
              )}

              <input
                ref={coverInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleCoverUpload}
                hidden
              />
              <div className="mt-4 flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => coverInputRef.current.click()}
                  disabled={uploading}
                >
                  <ImagePlus className="size-4" />
                  {form.cover_image ? 'Change cover' : 'Upload cover'}
                </Button>
                {form.cover_image && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => setField('cover_image', '')}>
                    Remove
                  </Button>
                )}
              </div>
            </div>
          </aside>
        </div>
      </form>
    </AdminShell>
  )
}