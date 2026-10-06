import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

// A small reusable box to add, rename and delete categories.
// It works with any service that has list, create, update and delete.
export default function CategoryManager({ title, service }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState('')
  const [error, setError] = useState('')

  async function load() {
    try {
      setItems(await service.list())
    } catch (err) {
      console.error(err)
      setError('Could not load categories. Check the console.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function explain(err) {
    return err.code === '23505'
      ? 'A category with that name already exists.'
      : 'Something went wrong. Check the console.'
  }

  async function handleAdd(e) {
    e.preventDefault()
    setError('')
    const name = newName.trim()
    if (!name) return

    try {
      await service.create(name)
      setNewName('')
      await load()
    } catch (err) {
      console.error(err)
      setError(explain(err))
    }
  }

  async function handleSaveEdit(id) {
    setError('')
    const name = editName.trim()
    if (!name) return

    try {
      await service.update(id, name)
      setEditingId(null)
      await load()
    } catch (err) {
      console.error(err)
      setError(explain(err))
    }
  }

  async function handleDelete(item) {
    const sure = window.confirm(
      `Delete the category "${item.name}"? Items in it will not be deleted, they will just have no category.`
    )
    if (!sure) return

    try {
      await service.delete(item.id)
      await load()
    } catch (err) {
      console.error(err)
      setError(explain(err))
    }
  }

  return (
    <section className="card-soft p-6">
      <h2 className="hand text-3xl leading-none">{title}</h2>

      <form onSubmit={handleAdd} className="mt-5 flex gap-2">
        <Input
          type="text"
          placeholder="New category name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          aria-label="New category name"
        />
        <Button type="submit">Add</Button>
      </form>

      {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
      {loading && <p className="mt-4 text-sm text-muted-foreground">Loading...</p>}
      {!loading && items.length === 0 && <p className="mt-4 text-sm text-muted-foreground">No categories yet.</p>}

      <ul className="mt-4 divide-y divide-border">
        {items.map((item) => (
          <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
            {editingId === item.id ? (
              <>
                <Input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="min-w-40 flex-1"
                  aria-label="Category name"
                />
                <span className="flex gap-1">
                  <Button size="sm" onClick={() => handleSaveEdit(item.id)}>
                    Save
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                    Cancel
                  </Button>
                </span>
              </>
            ) : (
              <>
                <span className="font-semibold">{item.name}</span>
                <span className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setEditingId(item.id)
                      setEditName(item.name)
                    }}
                  >
                    Rename
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDelete(item)}
                  >
                    Delete
                  </Button>
                </span>
              </>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}