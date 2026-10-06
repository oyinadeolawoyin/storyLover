import { useEffect, useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { SubscriberService } from '@/service/subscriberService'
import AdminShell from '@/components/adminShell'
import SubscriberGrowth from '@/components/subscriberGrowth'
import { Button } from '@/components/ui/button'

export default function AdminSubscribers() {
  const [subscribers, setSubscribers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        setSubscribers(await SubscriberService.list())
      } catch (err) {
        console.error(err)
        setError('Could not load subscribers. Check the console.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  async function handleDelete(sub) {
    const sure = window.confirm(`Remove ${sub.email} from the list?`)
    if (!sure) return

    try {
      await SubscriberService.delete(sub.id)
      setSubscribers((current) => current.filter((s) => s.id !== sub.id))
    } catch (err) {
      console.error(err)
      alert('Could not remove. Check the console.')
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(subscribers.map((s) => s.email).join(', '))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error(err)
      alert('Could not copy. Check the console.')
    }
  }

  // Count the ones who joined in the last 7 days
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
  const newThisWeek = subscribers.filter((s) => new Date(s.created_at).getTime() >= weekAgo).length

  // ...and in the last 30 days
  const monthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000
  const newThisMonth = subscribers.filter((s) => new Date(s.created_at).getTime() >= monthAgo).length

  return (
    <AdminShell
      title="Subscribers"
      subtitle="The people who joined your newsletter."
      actions={
        subscribers.length > 0 && (
          <Button variant="outline" onClick={handleCopy}>
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
            {copied ? 'Copied' : 'Copy all emails'}
          </Button>
        )
      }
    >
      {loading && <p className="text-muted-foreground">Loading...</p>}
      {error && <p className="text-destructive">{error}</p>}

      {!loading && !error && (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-border bg-rose-soft p-5">
              <p className="text-sm text-foreground/70">Total subscribers</p>
              <p className="mt-1 font-heading text-4xl font-bold">{subscribers.length}</p>
            </div>
            <div className="rounded-xl border border-border bg-sky-soft p-5">
              <p className="text-sm text-foreground/70">New in the last 7 days</p>
              <p className="mt-1 font-heading text-4xl font-bold">{newThisWeek}</p>
            </div>
            <div className="rounded-xl border border-border bg-butter-soft p-5">
              <p className="text-sm text-foreground/70">New in the last 30 days</p>
              <p className="mt-1 font-heading text-4xl font-bold">{newThisMonth}</p>
            </div>
          </div>

          <SubscriberGrowth subscribers={subscribers} />

          {subscribers.length === 0 ? (
            <p className="card-soft p-8 text-center text-muted-foreground">No subscribers yet.</p>
          ) : (
            <div className="card-soft overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Email</th>
                      <th className="px-4 py-3 font-semibold">Joined</th>
                      <th className="px-4 py-3 text-right font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {subscribers.map((sub) => (
                      <tr key={sub.id}>
                        <td className="break-all px-4 py-3 font-semibold">{sub.email}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                          {new Date(sub.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDelete(sub)}
                          >
                            Remove
                          </Button>
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