import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { PostService } from '@/service/postService'
import { CategoryService } from '@/service/categoryService'
import AdminShell from '@/components/adminShell'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export default function Admin() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all') // all | published | draft
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

  async function handleToggleStatus(post) {
    const newStatus = post.status === 'published' ? 'draft' : 'published'
    try {
      const updated = await PostService.setStatus(post.id, newStatus)
      // Update just this row in the list, no need to reload everything
      setPosts((current) =>
        current.map((p) =>
          p.id === post.id ? { ...p, status: updated.status, published_at: updated.published_at } : p
        )
      )
    } catch (err) {
      console.error(err)
      alert('Could not change the status. Check the console.')
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
  const publishedCount = inCategory.filter((p) => p.status === 'published').length
  const draftCount = inCategory.length - publishedCount
  const shown = filter === 'all' ? inCategory : inCategory.filter((p) => p.status === filter)

  const tabs = [
    { id: 'all', label: 'All', count: inCategory.length },
    { id: 'published', label: 'Published', count: publishedCount },
    { id: 'draft', label: 'Drafts', count: draftCount },
  ]

  return (
    <AdminShell
      title="Posts"
      subtitle="Write, publish and tidy up your articles."
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
                    {shown.map((post) => (
                      <tr key={post.id} className="align-middle">
                        <td className="min-w-48 px-4 py-3 font-semibold">{post.title}</td>
                        <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">
                          {post.category?.name ?? '-'}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              'rounded-full px-2.5 py-1 text-xs font-bold',
                              post.status === 'published'
                                ? 'bg-sage-soft text-emerald-700'
                                : 'bg-butter-soft text-amber-700'
                            )}
                          >
                            {post.status === 'published' ? 'Published' : 'Draft'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap justify-end gap-1">
                            <Button asChild variant="outline" size="sm">
                              <Link to={`/admin/posts/${post.id}/edit`}>Edit</Link>
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleToggleStatus(post)}>
                              {post.status === 'published' ? 'Unpublish' : 'Publish'}
                            </Button>
                            {post.status === 'published' && (
                              <Button asChild variant="ghost" size="sm">
                                <Link to={`/posts/${post.slug}`} target="_blank">
                                  View
                                </Link>
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleDelete(post)}
                            >
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
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