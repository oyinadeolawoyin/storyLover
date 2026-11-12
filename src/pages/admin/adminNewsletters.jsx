import { useEffect, useRef, useState } from 'react'
import { Film, ImagePlus, Link as LinkIcon } from 'lucide-react'
import { MediaService } from '@/service/mediaService'
import { NewsletterService } from '@/service/newsletterService'
import AdminShell from '@/components/adminShell'
import MarkdownContent from '@/components/markdownContent'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

const formatDate = (iso) =>
  new Date(iso).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })

export default function AdminNewsletter() {
  const [id, setId] = useState(null)
  const [subject, setSubject] = useState('')
  const [preview, setPreview] = useState('')
  const [body, setBody] = useState('')
  const [sentAt, setSentAt] = useState(null) // set when the loaded email has already gone out
  const [past, setPast] = useState([])
  const [tab, setTab] = useState('write')
  const [busy, setBusy] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [msg, setMsg] = useState({ type: '', text: '' })

  const bodyRef = useRef(null)
  const imageInputRef = useRef(null)
  const videoInputRef = useRef(null)

  const locked = Boolean(sentAt)

  async function refreshList() {
    try {
      setPast(await NewsletterService.list())
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    refreshList()
  }, [])

  function startNew() {
    setId(null)
    setSubject('')
    setPreview('')
    setBody('')
    setSentAt(null)
    setMsg({ type: '', text: '' })
  }

  async function openEmail(row) {
    try {
      const nl = await NewsletterService.getById(row.id)
      setId(nl.id)
      setSubject(nl.subject)
      setPreview(nl.preview_text ?? '')
      setBody(nl.body ?? '')
      setSentAt(nl.sent_at)
      setMsg({ type: '', text: '' })
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      console.error(err)
      setMsg({ type: 'error', text: 'Could not open that email.' })
    }
  }

  // ---------- Media (same buttons as the post form) ----------
  function insertIntoBody(text) {
    const el = bodyRef.current
    const start = el ? el.selectionStart : body.length
    const end = el ? el.selectionEnd : body.length
    setBody((b) => b.slice(0, start) + text + b.slice(end))
  }

  async function handleMediaUpload(e, kind) {
    const file = e.target.files[0]
    e.target.value = ''
    if (!file) return

    try {
      setUploading(true)
      setMsg({ type: '', text: '' })
      const url = await MediaService.upload(file, 'newsletters')
      if (kind === 'image') {
        const alt = window.prompt('Short description of the image (optional).') ?? ''
        insertIntoBody(`\n\n![${alt}](${url})\n\n`)
      } else {
        insertIntoBody(`\n\n[video](${url})\n\n`)
      }
    } catch (err) {
      console.error(err)
      setMsg({ type: 'error', text: err.message || 'Upload failed.' })
    } finally {
      setUploading(false)
    }
  }

  function handleVideoLink() {
    let url = window.prompt('Paste a YouTube or Vimeo link:')
    if (!url) return
    url = url.trim()
    if (!/^https?:\/\//i.test(url)) url = `https://${url}`
    insertIntoBody(`\n\n[video](${url})\n\n`)
  }

  // ---------- Save, test, send ----------
  async function saveDraft() {
    const saved = await NewsletterService.save({ id, subject: subject.trim(), preview_text: preview.trim(), body })
    setId(saved.id)
    return saved.id
  }

  async function run(okText, fn) {
    setBusy(true)
    setMsg({ type: '', text: '' })
    try {
      await fn()
      setMsg({ type: 'ok', text: okText })
      refreshList()
    } catch (err) {
      console.error(err)
      setMsg({ type: 'error', text: `Failed: ${err.message || 'check the console.'}` })
    } finally {
      setBusy(false)
    }
  }

  const handleSave = () => run('Draft saved.', saveDraft)

  const handleTest = () =>
    run('Test sent. Check your inbox (and spam) and open it on your phone.', async () => {
      await NewsletterService.send(await saveDraft(), 'test')
    })

  function handleSend() {
    if (!window.confirm('Send this to ALL subscribers? This cannot be undone.')) return
    run('Sent to your subscribers!', async () => {
      await NewsletterService.send(await saveDraft(), 'send')
      setSentAt(new Date().toISOString())
    })
  }

  const canAct = !busy && !uploading && !locked && subject.trim() && body.trim()

  return (
    <AdminShell
      title="Emails"
      subtitle="Write a note or question to your subscribers, separate from your posts."
      actions={
        <Button variant="outline" onClick={startNew}>
          New email
        </Button>
      }
    >
      {msg.text && (
        <p
          className={cn(
            'mb-6 rounded-lg px-4 py-3 text-sm',
            msg.type === 'error' ? 'bg-destructive/10 text-destructive' : 'bg-sage-soft text-emerald-700'
          )}
        >
          {msg.text}
        </p>
      )}

      {locked && (
        <p className="mb-6 rounded-lg bg-sky-soft px-4 py-3 text-sm">
          This email was sent on {formatDate(sentAt)}. It is kept here for reference. Press "New email" to write another.
        </p>
      )}

      <div className="card-soft space-y-4 p-6 sm:p-8">
        <Input
          placeholder="Subject"
          aria-label="Subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          disabled={locked}
          maxLength={120}
        />
        <Input
          placeholder="Preview text (the grey line next to the subject in the inbox)"
          aria-label="Preview text"
          value={preview}
          onChange={(e) => setPreview(e.target.value)}
          disabled={locked}
          maxLength={140}
        />

        <hr className="border-border" />

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
              disabled={uploading || locked}
              onClick={() => {
                setTab('write')
                imageInputRef.current.click()
              }}
            >
              <ImagePlus className="size-4" /> Image or GIF
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={uploading || locked}
              onClick={() => {
                setTab('write')
                videoInputRef.current.click()
              }}
            >
              <Film className="size-4" /> Video file
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={uploading || locked}
              onClick={() => {
                setTab('write')
                handleVideoLink()
              }}
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
          <textarea
            ref={bodyRef}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            disabled={locked}
            rows={16}
            placeholder="Write to your readers. Leave a blank line between paragraphs. **bold**, *italic* and ## Heading work."
            aria-label="Email body"
            className="block min-h-[40vh] w-full rounded-md border border-input bg-transparent p-4 text-base leading-7 outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          />
        ) : (
          <div className="min-h-[40vh] rounded-md border border-border p-4">
            {body.trim() ? (
              <MarkdownContent className="article-body" content={body} />
            ) : (
              <p className="text-sm text-muted-foreground">Nothing to preview yet.</p>
            )}
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          The email starts with "Hi (first name)," and ends with your "Happy storytelling, Oyin" sign-off automatically.
          In the email, videos show as a picture or button that opens the video, because inboxes can't play them.
        </p>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" disabled={busy || locked || !subject.trim()} onClick={handleSave}>
            Save draft
          </Button>
          <Button variant="outline" disabled={!canAct} onClick={handleTest}>
            Send test to me
          </Button>
          <Button disabled={!canAct} onClick={handleSend}>
            {busy ? 'Working...' : 'Send to everyone'}
          </Button>
        </div>
      </div>

      {past.length > 0 && (
        <div className="card-soft mt-8 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-semibold">Subject</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 text-right font-semibold"> </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {past.map((row) => (
                <tr key={row.id}>
                  <td className="px-4 py-3 font-semibold">{row.subject}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {row.sent_at ? `Sent ${formatDate(row.sent_at)}` : 'Draft'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="outline" size="sm" onClick={() => openEmail(row)}>
                      {row.sent_at ? 'View' : 'Edit'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminShell>
  )
}