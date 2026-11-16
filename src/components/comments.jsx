import { useEffect, useMemo, useRef, useState } from 'react'
import { MessageCircle, Pencil, Reply, Send, Trash2, X } from 'lucide-react'
import { CommentService } from '@/service/commentService'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import {
  EMAIL_PATTERN,
  clearIdentity,
  loadIdentity,
  loadMyCommentIds,
  rememberMyComment,
  saveIdentity,
} from '@/lib/commenterIdentity'

// Comment section, Discord style:
//  - one flat list, oldest first (no nesting)
//  - a reply shows the comment it answers on top, with a curved line down to the reply
//  - clicking that quoted comment scrolls up to it and flashes it
//  - the box is at the bottom; "Reply" scrolls to it and quotes the comment
//  - name and email are both optional; no name means "Anonymous", and commenting never subscribes anyone
//  - people can edit their own comments (the Edit button shows only in the browser that wrote it;
//    a secret edit token saved in that browser is what proves it to the database)
//  - a link ending in #comment-<id> (like the ones in the notification emails) scrolls to that comment

const ANONYMOUS = 'Anonymous'
const TOKENS_KEY = 'comment_edit_tokens'

function loadEditTokens() {
  try {
    return JSON.parse(localStorage.getItem(TOKENS_KEY)) || {}
  } catch {
    return {}
  }
}

function getEditToken(commentId) {
  return loadEditTokens()[commentId] || ''
}

function rememberEditToken(commentId, token) {
  try {
    localStorage.setItem(TOKENS_KEY, JSON.stringify({ ...loadEditTokens(), [commentId]: token }))
  } catch {
    // storage blocked: the comment still posts, it just cannot be edited later
  }
}

const AVATAR_COLORS = ['bg-primary/20', 'bg-sky-soft', 'bg-butter-soft', 'bg-rose-soft']

function colorFor(name) {
  let hash = 0
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0
  return AVATAR_COLORS[hash % AVATAR_COLORS.length]
}

function Avatar({ name, className }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'flex shrink-0 select-none items-center justify-center rounded-full font-semibold text-foreground/80 ring-1 ring-foreground/10',
        colorFor(name),
        className
      )}
    >
      {name.trim().charAt(0).toUpperCase() || '?'}
    </span>
  )
}

function timeAgo(iso) {
  const seconds = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000))
  if (seconds < 60) return 'just now'
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} h ago`
  const days = Math.round(hours / 24)
  if (days < 30) return `${days} d ago`
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}

const snippet = (text) => text.replace(/\s+/g, ' ').trim()

export default function Comments({ postId }) {
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  const [replyTo, setReplyTo] = useState(null)
  const [highlightId, setHighlightId] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [mine, setMine] = useState(() => new Set(loadMyCommentIds()))
  const composerRef = useRef(null)
  const textareaRef = useRef(null)
  const highlightTimer = useRef(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setFailed(false)
      setComments([])
      setReplyTo(null)
      try {
        const data = await CommentService.list(postId)
        if (!cancelled) setComments(data)
      } catch (err) {
        console.error(err)
        if (!cancelled) setFailed(true)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [postId])

  useEffect(() => () => clearTimeout(highlightTimer.current), [])

  // Only the admin gets Delete buttons
  useEffect(() => {
    let cancelled = false
    CommentService.isAdmin().then((ok) => {
      if (!cancelled) setIsAdmin(ok)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const byId = useMemo(() => new Map(comments.map((c) => [c.id, c])), [comments])

  function jumpTo(id) {
    const el = document.getElementById(`comment-${id}`)
    if (!el) return
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    setHighlightId(id)
    clearTimeout(highlightTimer.current)
    highlightTimer.current = setTimeout(() => setHighlightId(null), 1800)
  }

  // Opened from a link like /posts/my-post#comment-<id>: scroll to that comment once the list is on screen
  useEffect(() => {
    if (loading || failed) return
    const match = window.location.hash.match(/^#comment-(.+)$/)
    if (!match || !byId.has(match[1])) return
    const timer = setTimeout(() => jumpTo(match[1]), 300)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, failed])

  function startReply(comment) {
    setReplyTo(comment)
    composerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    setTimeout(() => textareaRef.current?.focus({ preventScroll: true }), 350)
  }

  function handlePosted(comment) {
    setComments((prev) => [...prev, comment])
    rememberMyComment(comment.id)
    setMine((prev) => new Set(prev).add(comment.id))
    setReplyTo(null)
    // wait for the new comment to render, then show it
    setTimeout(() => jumpTo(comment.id), 60)
  }

  // Throws when it fails, so the comment's own edit box can show the message
  async function handleEdit(comment, text) {
    const email = loadIdentity()?.email || ''
    const editToken = getEditToken(comment.id)
    if (!email && !editToken) throw new Error('not_allowed')
    const updated = await CommentService.update({ id: comment.id, email, editToken, body: text })
    setComments((prev) => prev.map((c) => (c.id === updated.id ? { ...c, ...updated } : c)))
  }

  async function handleDelete(comment) {
    if (!window.confirm('Delete this comment? This cannot be undone.')) return
    try {
      await CommentService.delete(comment.id)
      setComments((prev) => prev.filter((c) => c.id !== comment.id))
      setReplyTo((current) => (current?.id === comment.id ? null : current))
    } catch (err) {
      console.error(err)
      window.alert('Could not delete the comment. Make sure you are logged in as admin.')
    }
  }

  const count = comments.length

  return (
    <section id="comments" className="scroll-mt-24" aria-labelledby="comments-title">
      <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-foreground/10 pb-5">
        <div className="flex items-center gap-3.5">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-white text-sky shadow-soft ring-1 ring-foreground/5">
            <MessageCircle className="size-5" strokeWidth={1.6} />
          </span>
          <h2 id="comments-title" className="hand text-4xl leading-none">
            Have thoughts about this article? I’d love to hear from you.
          </h2>
        </div>
        {!loading && !failed && count > 0 && (
          <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold tracking-wide text-foreground/70 ring-1 ring-foreground/10">
            {count} {count === 1 ? 'comment' : 'comments'}
          </span>
        )}
      </header>

      {loading && (
        <div className="mt-8 space-y-6" aria-busy="true" aria-label="Loading comments">
          {[0, 1].map((i) => (
            <div key={i} className="flex gap-3 animate-pulse">
              <div className="size-10 rounded-full bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-32 rounded bg-muted" />
                <div className="h-3 w-full rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      )}

      {failed && (
        <p className="mt-6 text-sm text-foreground/75">
          Comments could not load. Check your connection and{' '}
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="font-medium text-sky underline-offset-4 hover:underline"
          >
            reload the page
          </button>
          .
        </p>
      )}

      {!loading && !failed && count === 0 && (
        <div className="mt-8 rounded-2xl border border-dashed border-foreground/15 px-6 py-10 text-center">
          <p className="text-sm leading-relaxed text-foreground/75">
            No comments yet. Be the first to share your thoughts below.
          </p>
        </div>
      )}

      {!loading && !failed && count > 0 && (
        <ol className="divide-y divide-foreground/10">
          {comments.map((c) => (
            <CommentItem
              key={c.id}
              comment={c}
              // reply_to_id is set but the original is missing = it was deleted
              parent={c.reply_to_id ? byId.get(c.reply_to_id) ?? null : undefined}
              highlighted={highlightId === c.id}
              onReply={startReply}
              onJump={jumpTo}
              isAdmin={isAdmin}
              onDelete={handleDelete}
              canEdit={mine.has(c.id)}
              onEdit={handleEdit}
            />
          ))}
        </ol>
      )}

      {!loading && !failed && (
        <div ref={composerRef} className="mt-10 scroll-mt-24">
          <Composer
            postId={postId}
            replyTo={replyTo}
            textareaRef={textareaRef}
            onCancelReply={() => setReplyTo(null)}
            onPosted={handlePosted}
            onSwitchPerson={() => setMine(new Set())}
          />
        </div>
      )}
    </section>
  )
}

// parent: undefined = not a reply, null = a reply whose original was deleted, object = the original
function CommentItem({ comment, parent, highlighted, onReply, onJump, isAdmin, onDelete, canEdit, onEdit }) {
  const isReply = parent !== undefined || Boolean(comment.reply_to_id)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(comment.body)
  const [saving, setSaving] = useState(false)
  const [editError, setEditError] = useState('')

  function startEdit() {
    setDraft(comment.body)
    setEditError('')
    setEditing(true)
  }

  async function saveEdit() {
    const text = draft.trim()
    if (!text) return setEditError('A comment cannot be empty.')
    if (text === comment.body.trim()) return setEditing(false) // nothing changed
    try {
      setSaving(true)
      setEditError('')
      await onEdit(comment, text)
      setEditing(false)
    } catch (err) {
      console.error(err)
      if (err.message?.includes('not_allowed')) {
        setEditError('You can only edit comments you wrote from this browser.')
      } else if (err.code === '23514') {
        setEditError('A comment must be between 1 and 2000 characters.')
      } else {
        setEditError('Something went wrong. Please try again.')
      }
    } finally {
      setSaving(false)
    }
  }

  function handleEditKeyDown(e) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') saveEdit()
    if (e.key === 'Escape') setEditing(false)
  }

  return (
    <li
      id={`comment-${comment.id}`}
      className={cn(
        'group scroll-mt-28 px-2 py-6 transition-colors duration-700 sm:px-3',
        highlighted ? 'rounded-2xl bg-butter-soft' : 'bg-transparent'
      )}
    >
      <div className="grid grid-cols-[2.5rem_minmax(0,1fr)] gap-x-3">
        {/* The comment this one answers, on top, with the curved line down to the avatar */}
        {isReply && (
          <>
            <div className="relative h-5">
              <span
                aria-hidden="true"
                className="absolute -bottom-1 left-5 top-2.5 w-6 rounded-tl-lg border-l-2 border-t-2 border-foreground/20"
              />
            </div>
            {parent ? (
              <button
                type="button"
                onClick={() => onJump(parent.id)}
                aria-label={`Jump to the comment by ${parent.author_name}`}
                className="flex h-5 min-w-0 items-center gap-1.5 text-left text-xs text-muted-foreground transition-colors hover:text-sky"
              >
                <Avatar name={parent.author_name} className="size-4 text-[9px]" />
                <span className="shrink-0 font-semibold text-foreground/80">{parent.author_name}</span>
                <span className="truncate">{snippet(parent.body)}</span>
              </button>
            ) : (
              <span className="flex h-5 items-center text-xs italic text-muted-foreground">
                The original comment was deleted
              </span>
            )}
          </>
        )}

        <Avatar name={comment.author_name} className="size-10 text-base shadow-sm" />

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5">
            <span className="font-semibold">{comment.author_name}</span>
            {comment.is_author && (
              <span className="rounded-full bg-sky/10 px-2 py-0.5 text-[10px] font-semibold uppercase leading-none tracking-wider text-sky ring-1 ring-sky/25">
                Author
              </span>
            )}
            <time
              dateTime={comment.created_at}
              title={new Date(comment.created_at).toLocaleString()}
              className="text-xs text-muted-foreground"
            >
              {timeAgo(comment.created_at)}
            </time>
            {comment.edited_at && (
              <span
                title={`Edited ${new Date(comment.edited_at).toLocaleString()}`}
                className="text-xs italic text-muted-foreground"
              >
                (edited)
              </span>
            )}
          </div>

          {editing ? (
            <div className="mt-1">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={handleEditKeyDown}
                rows={3}
                maxLength={2000}
                autoFocus
                aria-label="Edit your comment"
                className="block w-full resize-y rounded-none border border-border bg-white px-4 py-3 text-[15px] leading-relaxed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky/40"
              />
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  onClick={saveEdit}
                  disabled={saving}
                  className="h-8 rounded-full px-4 text-xs font-semibold"
                >
                  {saving ? 'Saving...' : 'Save'}
                </Button>
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  disabled={saving}
                  className="rounded-full border border-border bg-white px-3 py-1 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
                >
                  Cancel
                </button>
                <p className={cn('text-xs', editError ? 'text-destructive' : 'text-muted-foreground')} role={editError ? 'alert' : undefined}>
                  {editError || 'Ctrl or Cmd + Enter to save, Esc to cancel.'}
                </p>
              </div>
            </div>
          ) : (
            <p className="mt-1.5 whitespace-pre-wrap break-words text-[15px] leading-7 text-foreground/90">{comment.body}</p>
          )}

          <div className="mt-3 flex items-center gap-5">
            <button
              type="button"
              onClick={() => onReply(comment)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-sky"
            >
              <Reply className="size-3.5" /> Reply
            </button>
            {canEdit && !editing && (
              <button
                type="button"
                onClick={startEdit}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-sky"
              >
                <Pencil className="size-3.5" /> Edit
              </button>
            )}
            {isAdmin && (
              <button
                type="button"
                onClick={() => onDelete(comment)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-destructive"
              >
                <Trash2 className="size-3.5" /> Delete
              </button>
            )}
          </div>
        </div>
      </div>
    </li>
  )
}

function Composer({ postId, replyTo, textareaRef, onCancelReply, onPosted, onSwitchPerson }) {
  const [identity, setIdentity] = useState(() => loadIdentity())
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [body, setBody] = useState('')
  const [trap, setTrap] = useState('') // hidden field: only bots fill it in
  const [sending, setSending] = useState(false)
  const [message, setMessage] = useState('')

  async function handleSubmit(e) {
    e?.preventDefault()
    setMessage('')
    // A bot filled the hidden field. If an autofill ever does it by mistake, a real person still sees a message.
    if (trap) return setMessage('Something went wrong. Please try again.')

    const text = body.trim()
    if (!text) {
      setMessage('Write a comment first.')
      return
    }

    let who = identity
    if (!who) {
      const cleanName = name.trim() || ANONYMOUS
      const cleanEmail = email.trim().toLowerCase()
      if (cleanEmail && !EMAIL_PATTERN.test(cleanEmail)) {
        return setMessage('That email address does not look right. Leave it empty or try again.')
      }
      who = { name: cleanName, email: cleanEmail }
    }

    const editToken = crypto.randomUUID()

    try {
      setSending(true)
      const comment = await CommentService.create({
        postId,
        email: who.email,
        name: who.name,
        body: text,
        replyToId: replyTo?.id ?? null,
        editToken,
      })
      rememberEditToken(comment.id, editToken)
      // Only remember someone who actually gave a name or email; anonymous visitors see the optional fields again
      if (!identity && (who.email || who.name !== ANONYMOUS)) {
        saveIdentity(who)
        setIdentity(who)
      }
      setBody('')
      onPosted(comment)
    } catch (err) {
      console.error(err)
      if (err.message?.includes('rate_limited')) {
        setMessage('You are commenting very fast. Give it a minute and try again.')
      } else if (err.message?.includes('reply_target_missing')) {
        setMessage('The comment you were replying to was removed. Your text is still here.')
        onCancelReply()
      } else if (err.message?.includes('post_not_found')) {
        setMessage('This post is no longer open for comments.')
      } else if (err.code === '23514') {
        setMessage('Please check your name and email.')
      } else {
        setMessage('Something went wrong. Please try again.')
      }
    } finally {
      setSending(false)
    }
  }

  function handleKeyDown(e) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') handleSubmit(e)
    if (e.key === 'Escape' && replyTo) onCancelReply()
  }

  function switchPerson() {
    clearIdentity()
    setIdentity(null)
    onSwitchPerson?.()
  }

  return (
    <form onSubmit={handleSubmit} className="relative rounded-none border border-border/70 bg-white p-5 shadow-soft sm:p-7">
      {identity ? (
        <div className="mb-4 flex items-center gap-2.5 text-sm text-foreground/75">
          <Avatar name={identity.name} className="size-7 text-xs" />
          <span>
            Commenting as <strong className="text-foreground">{identity.name}</strong>
          </span>
          <span aria-hidden="true" className="text-foreground/30">
            ·
          </span>
          <button
            type="button"
            onClick={switchPerson}
            className="font-medium text-sky underline-offset-4 hover:underline"
          >
            Not you?
          </button>
        </div>
      ) : (
        <div className="mb-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              type="text"
              placeholder="Name (optional)"
              aria-label="Name (optional)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={60}
              autoComplete="given-name"
              className="h-11 rounded-none border-border bg-white px-4"
            />
            <Input
              type="email"
              placeholder="Email (optional)"
              aria-label="Email (optional)"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              className="h-11 rounded-none border-border bg-white px-4"
            />
          </div>
        </div>
      )}

      {/* Hidden trap field for bots. Real visitors never see it. */}
      <input
        type="text"
        name="hp_check"
        value={trap}
        onChange={(e) => setTrap(e.target.value)}
        tabIndex={-1}
        autoComplete="nope"
        data-lpignore="true"
        data-1p-ignore="true"
        aria-hidden="true"
        style={{ position: 'absolute', left: '-9999px' }}
      />

      {/* Who this reply is for, like the bar above Discord's message box */}
      {replyTo && (
        <div className="flex items-center gap-2 rounded-none border border-b-0 border-border bg-rose-soft/50 px-3.5 py-2.5 text-xs">
          <Reply className="size-3.5 shrink-0 text-sky" />
          <span className="shrink-0 text-muted-foreground">Replying to</span>
          <strong className="shrink-0">{replyTo.author_name}</strong>
          <span className="min-w-0 truncate text-muted-foreground">{snippet(replyTo.body)}</span>
          <button
            type="button"
            onClick={onCancelReply}
            aria-label="Cancel reply"
            className="ml-auto shrink-0 rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}

      <textarea
        ref={textareaRef}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        onKeyDown={handleKeyDown}
        rows={4}
        maxLength={2000}
        placeholder={replyTo ? `Reply to ${replyTo.author_name}` : 'Share your thoughts...'}
        aria-label="Your comment"
        className={cn(
          'block w-full resize-y rounded-none border border-border bg-white px-4 py-3.5 text-[15px] leading-7',
          'placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky/40',
        )}
      />

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className={cn('text-xs', message ? 'text-destructive' : 'text-muted-foreground')} role={message ? 'alert' : undefined}>
          {message || 'Be kind. Ctrl or Cmd + Enter to send.'}
        </p>
        <Button type="submit" disabled={sending} className="h-10 rounded-full px-6 text-sm font-semibold">
          {sending ? (
            'Posting...'
          ) : (
            <>
              Post comment <Send className="size-4" />
            </>
          )}
        </Button>
      </div>
    </form>
  )
}