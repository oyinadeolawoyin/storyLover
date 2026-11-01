import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { MoreHorizontal, Pin, PinOff, Plus } from 'lucide-react'
import { PostService } from '@/service/postService'
import { CategoryService } from '@/service/categoryService'
import AdminShell from '@/components/adminShell'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

// A post is "scheduled" when it is published but its date is still in the future.
const isScheduled = (p) =>
  p.status === 'published' && p.published_at && new Date(p.published_at) > new Date()

// One word for what the post is right now.
function stateOf(p) {
  if (p.status === 'archived') return 'archived'
  if (p.status === 'draft') return 'draft'
  return isScheduled(p) ? 'scheduled' : 'published'
}

const formatDate = (iso) =>
  new Date(iso).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })

const badgeStyles = {
  published: 'bg-sage-soft text-emerald-700',
  scheduled: 'bg-sky-100 text-sky-700',
  draft: 'bg-butter-soft text-amber-700',
  archived: 'bg-muted text-muted-foreground',
}

const badgeLabels = {
  published: 'Published',
  scheduled: 'Scheduled',
  draft: 'Draft',
  archived: 'Archived',
}

export default function Admin() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all') // all | published | scheduled | draft | archived
  const [categories, setCategories] = useState([])
  const [categoryFilter, setCategoryFilter] = useState('all') // all | none | a category id

  useEffect(() => {
    async function loadData() {
      try {
        const [all, cats] = await Promise.all([PostService.listAll(), CategoryService.list()])
        setPosts(all)
        setCategories(cats)
      } catch (err) {
        console.error(err)
        setError('Could not load posts. Check the console.')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  // Update just one row in the list, no need to reload everything
  function patchPost(id, changes) {
    setPosts((current) => current.map((p) => (p.id === id ? { ...p, ...changes } : p)))
  }

  async function changeStatus(post, status, extra = {}) {
    try {
      const updated = await PostService.setStatus(post.id, status, extra)
      patchPost(post.id, {
        status: updated.status,
        published_at: updated.published_at,
        pinned: updated.pinned,
      })
    } catch (err) {
      console.error(err)
      alert('Could not change the status. Check the console.')
    }
  }

  // Draft -> publish, live -> unpublish, scheduled -> publish now, archived -> restore to draft
  function handleMainAction(post) {
    const state = stateOf(post)
    if (state === 'published') return changeStatus(post, 'draft')
    if (state === 'scheduled') return changeStatus(post, 'published', { published_at: new Date().toISOString() })
    if (state === 'archived') return changeStatus(post, 'draft')
    return changeStatus(post, 'published')
  }

  const handleArchive = (post) => changeStatus(post, 'archived')

  async function handleTogglePin(post) {
    try {
      const updated = await PostService.setPinned(post.id, !post.pinned)
      patchPost(post.id, { pinned: updated.pinned })
    } catch (err) {
      console.error(err)
      alert('Could not pin the post. Check the console.')
    }
  }

  async function handleDelete(post) {
    const sure = window.confirm(`Delete "${post.title}"? This cannot be undone.`)
    if (!sure) return

    try {
      await PostService.delete(post.id)
      setPosts((current) => current.filter((p) => p.id !== post.id))
    } catch (err) {
      console.error(err)
      alert('Could not delete the post. Check the console.')
    }
  }

  // First narrow by category, then by status
  const inCategory = posts.filter((p) => {
    if (categoryFilter === 'all') return true
    if (categoryFilter === 'none') return !p.category_id
    return p.category_id === categoryFilter
  })

  const count = (state) => inCategory.filter((p) => stateOf(p) === state).length
  const notArchived = inCategory.filter((p) => p.status !== 'archived')

  // "All" leaves out archived posts so they stay out of the way
  const shown = (filter === 'all' ? notArchived : inCategory.filter((p) => stateOf(p) === filter))
    .slice()
    .sort((a, b) => Number(b.pinned) - Number(a.pinned)) // pinned first, otherwise keep the loaded order

  const tabs = [
    { id: 'all', label: 'All', count: notArchived.length },
    { id: 'published', label: 'Published', count: count('published') },
    { id: 'scheduled', label: 'Scheduled', count: count('scheduled') },
    { id: 'draft', label: 'Drafts', count: count('draft') },
    { id: 'archived', label: 'Archived', count: count('archived') },
  ]

  return (
    <AdminShell
      title="Posts"
      subtitle="Write, schedule, pin and tidy up your articles."
      actions={
        <Button asChild>
          <Link to="/admin/posts/new">
            <Plus className="size-4" /> New post
          </Link>
        </Button>
      }
    >
      {loading && <p className="text-muted-foreground">Loading...</p>}
      {error && <p className="text-destructive">{error}</p>}

      {!loading && !error && (
        <>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setFilter(t.id)}
                  className={cn(
                    'inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors',
                    filter === t.id
                      ? 'border-foreground bg-foreground text-background'
                      : 'border-border bg-card hover:border-foreground/40'
                  )}
                >
                  {t.label}
                  <span className="text-xs opacity-70">{t.count}</span>
                </button>
              ))}
            </div>

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

          {shown.length === 0 ? (
            <p className="card-soft p-8 text-center text-muted-foreground">
              {posts.length === 0 ? 'No posts yet. Write your first one.' : 'Nothing here.'}
            </p>
          ) : (
            <div className="card-soft overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Title</th>
                      <th className="hidden px-4 py-3 font-semibold sm:table-cell">Category</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 text-right font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {shown.map((post) => {
                      const state = stateOf(post)
                      const mainLabel = {
                        draft: 'Publish',
                        published: 'Unpublish',
                        scheduled: 'Publish now',
                        archived: 'Restore',
                      }[state]

                      return (
                        <tr key={post.id} className="align-middle">
                          <td className="min-w-48 px-4 py-3 font-semibold">
                            <span className="inline-flex items-center gap-2">
                              {post.pinned && <Pin className="size-3.5 shrink-0 text-primary" aria-label="Pinned" />}
                              {post.title}
                            </span>
                          </td>
                          <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">
                            {post.category?.name ?? '-'}
                          </td>
                          <td className="px-4 py-3">
                            <span className={cn('rounded-full px-2.5 py-1 text-xs font-bold', badgeStyles[state])}>
                              {badgeLabels[state]}
                            </span>
                            {state === 'scheduled' && (
                              <span className="mt-1 block text-xs text-muted-foreground">
                                {formatDate(post.published_at)}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap items-center justify-end gap-1">
                              <Button asChild variant="outline" size="sm">
                                <Link to={`/admin/posts/${post.id}/edit`}>Edit</Link>
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => handleMainAction(post)}>
                                {mainLabel}
                              </Button>

                              {state !== 'archived' && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-8"
                                  aria-label={post.pinned ? 'Unpin post' : 'Pin post'}
                                  title={post.pinned ? 'Unpin' : 'Pin to the top'}
                                  onClick={() => handleTogglePin(post)}
                                >
                                  {post.pinned ? <PinOff className="size-4" /> : <Pin className="size-4" />}
                                </Button>
                              )}

                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="size-8" aria-label="More actions">
                                    <MoreHorizontal className="size-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  {state === 'published' && (
                                    <DropdownMenuItem asChild>
                                      <Link to={`/posts/${post.slug}`} target="_blank">
                                        View
                                      </Link>
                                    </DropdownMenuItem>
                                  )}
                                  {state !== 'archived' && (
                                    <DropdownMenuItem onClick={() => handleArchive(post)}>Archive</DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem
                                    className="text-destructive focus:text-destructive"
                                    onClick={() => handleDelete(post)}
                                  >
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </AdminShell>
  )
}