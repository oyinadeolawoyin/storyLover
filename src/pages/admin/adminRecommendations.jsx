import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ImagePlus } from 'lucide-react'
import { RecommendationService } from '@/service/recommendationService'
import { RecommendationCategoryService } from '@/service/recommendationCategoryService'
import { MediaService } from '@/service/mediaService'
import { RECOMMENDATION_LINK_COLUMN } from '@/lib/siteConfig'
import AdminShell from '@/components/adminShell'
import CategoryPill from '@/components/categoryPill'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

const EMPTY = { name: '', image_url: '', link: '', category_id: '' }

// Adds https:// if it was pasted without it. Empty stays empty.
function normalizeLink(value) {
  const raw = value.trim()
  if (!raw) return null
  return /^https?:\/\//i.test(raw) ? raw : `https://${raw}`
}

export default function AdminRecommendations() {
  const [items, setItems] = useState([])
  const [categories, setCategories] = useState([])
  const [form, setForm] = useState(EMPTY)
  const [editingId, setEditingId] = useState(null)
  const [categoryFilter, setCategoryFilter] = useState('all') // all | none | a category id
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const imageInputRef = useRef(null)

  async function load() {
    try {
      const [recs, cats] = await Promise.all([
        RecommendationService.list(),
        RecommendationCategoryService.list(),
      ])
      setItems(recs)
      setCategories(cats)
    } catch (err) {
      console.error(err)
      setError('Could not load recommendations. Check the console.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  function setField(name, value) {
    setForm((f) => ({ ...f, [name]: value }))
  }

  function startEdit(item) {
    setEditingId(item.id)
    setForm({
      name: item.name ?? '',
      image_url: item.image_url ?? '',
      link: item[RECOMMENDATION_LINK_COLUMN] ?? '',
      category_id: item.category_id ?? '',
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function cancelEdit() {
    setEditingId(null)
    setForm(EMPTY)
    setError('')
  }

  async function handleImageUpload(e) {
    const file = e.target.files[0]
    e.target.value = ''
    if (!file) return

    try {
      setUploading(true)
      setError('')
      const url = await MediaService.upload(file, 'recommendations')
      setField('image_url', url)
    } catch (err) {
      console.error(err)
      setError(err.message || 'Upload failed.')
    } finally {
      setUploading(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!form.name.trim()) return setError('Please add a name.')

    const payload = {
      name: form.name.trim(),
      image_url: form.image_url || null,
      [RECOMMENDATION_LINK_COLUMN]: normalizeLink(form.link),
      category_id: form.category_id || null,
    }

    try {
      setSaving(true)
      if (editingId) {
        await RecommendationService.update(editingId, payload)
      } else {
        await RecommendationService.create(payload)
      }
      cancelEdit()
      await load()
    } catch (err) {
      console.error(err)
      setError('Could not save. Check the console.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(item) {
    const sure = window.confirm(`Delete "${item.name}"? This cannot be undone.`)
    if (!sure) return

    try {
      await RecommendationService.delete(item.id)
      setItems((current) => current.filter((i) => i.id !== item.id))
      if (editingId === item.id) cancelEdit()
    } catch (err) {
      console.error(err)
      alert('Could not delete. Check the console.')
    }
  }

  const shown = items.filter((i) => {
    if (categoryFilter === 'all') return true
    if (categoryFilter === 'none') return !i.category_id
    return i.category_id === categoryFilter
  })

  const selectClass = 'h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs'

  return (
    <AdminShell title="Recommendations" subtitle="The books, films, stories and tools you love.">
      <div className="grid gap-8 lg:grid-cols-[360px_minmax(0,1fr)]">
        {/* ---------- Add / edit form ---------- */}
        <form onSubmit={handleSubmit} className="card-soft h-fit space-y-5 p-6">
          <h2 className="hand text-3xl leading-none">
            {editingId ? 'Edit recommendation' : 'Add a recommendation'}
          </h2>

          <div className="space-y-1.5">
            <label htmlFor="name" className="text-sm font-semibold">
              Name
            </label>
            <Input id="name" type="text" value={form.name} onChange={(e) => setField('name', e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="link" className="text-sm font-semibold">
              Link <span className="font-normal text-muted-foreground">(optional)</span>
            </label>
            <Input
              id="link"
              type="text"
              placeholder="https://..."
              value={form.link}
              onChange={(e) => setField('link', e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="category" className="text-sm font-semibold">
              Category
            </label>
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
            <Link to="/admin/categories" className="text-sm font-semibold text-sky hover:underline">
              Manage categories
            </Link>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold">
              Image <span className="font-normal text-muted-foreground">(optional)</span>
            </p>
            {form.image_url && (
              <img
                src={form.image_url}
                alt="Preview"
                className="aspect-[3/4] w-32 rounded-lg border border-border object-cover"
              />
            )}
            <input
              ref={imageInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleImageUpload}
              hidden
            />
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => imageInputRef.current.click()}
                disabled={uploading}
              >
                <ImagePlus className="size-4" />
                {uploading ? 'Uploading...' : form.image_url ? 'Change image' : 'Upload image'}
              </Button>
              {form.image_url && (
                <Button type="button" variant="ghost" size="sm" onClick={() => setField('image_url', '')}>
                  Remove
                </Button>
              )}
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex gap-2">
            <Button type="submit" disabled={saving || uploading} className="flex-1">
              {saving ? 'Saving...' : editingId ? 'Save changes' : 'Add recommendation'}
            </Button>
            {editingId && (
              <Button type="button" variant="ghost" onClick={cancelEdit}>
                Cancel
              </Button>
            )}
          </div>
        </form>

        {/* ---------- The list ---------- */}
        <section className="min-w-0">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="hand text-3xl leading-none">
              All recommendations <span className="text-lg text-muted-foreground">({shown.length})</span>
            </h2>
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              Category
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="rounded-full border border-input bg-card px-3 py-1.5 text-foreground"
              >
                <option value="all">All categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
                <option value="none">No category</option>
              </select>
            </label>
          </div>

          {loading && <p className="text-muted-foreground">Loading...</p>}
          {!loading && shown.length === 0 && (
            <p className="card-soft p-8 text-center text-muted-foreground">
              {items.length === 0 ? 'No recommendations yet. Add your first one.' : 'Nothing in this category.'}
            </p>
          )}

          {shown.length > 0 && (
            <ul className="card-soft divide-y divide-border overflow-hidden">
              {shown.map((item) => {
                const href = item[RECOMMENDATION_LINK_COLUMN]
                return (
                  <li
                    key={item.id}
                    className={cn(
                      'flex flex-wrap items-center gap-4 p-4',
                      editingId === item.id && 'bg-butter-soft/60'
                    )}
                  >
                    <div className="h-16 w-12 shrink-0 overflow-hidden rounded-md bg-muted">
                      {item.image_url && (
                        <img src={item.image_url} alt="" className="h-full w-full object-cover" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="break-words font-semibold">{item.name}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                        {item.category ? (
                          <CategoryPill category={item.category} />
                        ) : (
                          <span className="text-xs text-muted-foreground">No category</span>
                        )}
                        {href && (
                          <a
                            href={href}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs font-semibold text-sky hover:underline"
                          >
                            Open link
                          </a>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-1">
                      <Button variant="outline" size="sm" onClick={() => startEdit(item)}>
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(item)}
                      >
                        Delete
                      </Button>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      </div>
    </AdminShell>
  )
}