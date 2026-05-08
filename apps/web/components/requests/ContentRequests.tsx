'use client'
import { useState } from 'react'
import { ThumbsUp, Send, ChevronDown, ChevronUp, Clock,
         CheckCircle, XCircle, Loader, MessageSquare, Search } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/lib/stores/useAuthStore'
import { formatDate, cn, getInitials } from '@/lib/utils'

type RequestStatus = 'pending' | 'reviewing' | 'approved' | 'rejected' | 'fulfilled'

interface ContentRequest {
  id: string
  user_id: string
  title: string
  type: 'movie' | 'music' | 'book'
  description: string | null
  reason: string | null
  status: RequestStatus
  admin_reply: string | null
  upvotes: number
  created_at: string
  replied_at: string | null
  users?: { full_name: string | null; avatar_url: string | null }
}

interface RequestFormProps {
  onSubmitted: () => void
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: RequestStatus }) {
  const config = {
    pending: { label: 'Pending', icon: Clock, cls: 'bg-zinc-700/50 text-zinc-300 border-zinc-600' },
    reviewing: { label: 'Under Review', icon: Loader, cls: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
    approved: { label: 'Approved', icon: CheckCircle, cls: 'bg-zawadi-green/10 text-zawadi-green border-zawadi-green/20' },
    rejected: { label: 'Not Available', icon: XCircle, cls: 'bg-red-500/10 text-red-400 border-red-500/20' },
    fulfilled: { label: 'Added!', icon: CheckCircle, cls: 'bg-zawadi-gold/10 text-zawadi-gold border-zawadi-gold/20' },
  }[status]

  const Icon = config.icon
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border', config.cls)}>
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  )
}

// ─── Single request card ──────────────────────────────────────────────────────

function RequestCard({ request, userId, onUpvote }: {
  request: ContentRequest
  userId: string | undefined
  onUpvote: (id: string) => void
}) {
  const [expanded, setExpanded] = useState(false)

  const typeEmoji = request.type === 'movie' ? '🎬' : request.type === 'music' ? '🎵' : '📚'

  return (
    <div className="bg-zawadi-surface border border-white/5 rounded-xl overflow-hidden hover:border-white/10 transition-colors">
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Upvote button */}
          <button
            onClick={() => userId && onUpvote(request.id)}
            disabled={!userId}
            className={cn(
              'flex flex-col items-center gap-0.5 px-2.5 py-2 rounded-lg border transition-all shrink-0',
              userId
                ? 'border-white/10 hover:border-zawadi-green/40 hover:bg-zawadi-green/5 cursor-pointer'
                : 'border-white/5 opacity-50 cursor-not-allowed'
            )}
          >
            <ThumbsUp className="w-3.5 h-3.5 text-zinc-400" />
            <span className="text-xs font-bold text-white">{request.upvotes}</span>
          </button>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div>
                <span className="text-lg mr-1">{typeEmoji}</span>
                <span className="text-white font-semibold text-sm">{request.title}</span>
              </div>
              <StatusBadge status={request.status} />
            </div>

            {request.description && (
              <p className="text-zinc-400 text-sm mt-1.5 leading-relaxed line-clamp-2">
                {request.description}
              </p>
            )}

            <div className="flex items-center gap-3 mt-2 text-xs text-zinc-600">
              <span className="capitalize">{request.type}</span>
              <span>·</span>
              <span>{formatDate(request.created_at)}</span>
              {request.users?.full_name && (
                <>
                  <span>·</span>
                  <span>by {request.users.full_name.split(' ')[0]}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Admin reply */}
        {request.admin_reply && (
          <div className="mt-3 ml-12 p-3 bg-zawadi-green/5 border border-zawadi-green/20 rounded-lg">
            <p className="text-xs font-semibold text-zawadi-green mb-1 flex items-center gap-1">
              <MessageSquare className="w-3 h-3" /> Admin Reply
            </p>
            <p className="text-sm text-zinc-300">{request.admin_reply}</p>
            {request.replied_at && (
              <p className="text-xs text-zinc-600 mt-1">{formatDate(request.replied_at)}</p>
            )}
          </div>
        )}

        {/* Expand toggle for reason */}
        {request.reason && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="ml-12 mt-2 flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {expanded ? 'Less' : 'Why they want it'}
          </button>
        )}
        {expanded && request.reason && (
          <p className="ml-12 mt-2 text-sm text-zinc-400 italic">"{request.reason}"</p>
        )}
      </div>
    </div>
  )
}

// ─── Submit form ──────────────────────────────────────────────────────────────

function SubmitRequestForm({ onSubmitted }: RequestFormProps) {
  const { user } = useAuthStore()
  const [title, setTitle] = useState('')
  const [type, setType] = useState<'movie' | 'music' | 'book'>('movie')
  const [description, setDescription] = useState('')
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [open, setOpen] = useState(false)

  if (!user) {
    return (
      <div className="p-5 bg-zawadi-surface rounded-xl border border-white/5 text-center">
        <MessageSquare className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
        <p className="text-zinc-400 text-sm mb-3">Sign in to submit a content request</p>
        <a href="/login"
          className="inline-flex px-4 py-2 bg-zawadi-green text-zawadi-dark text-sm font-semibold rounded-lg">
          Sign In
        </a>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) { setError('Please enter a title.'); return }
    setLoading(true)
    setError('')
    try {
      const supabase = createClient()
      const { error: err } = await (supabase.from('content_requests') as any).insert({
        title: title.trim(),
        type,
        description: description.trim() || null,
        reason: reason.trim() || null,
        user_id: user.id,
      })
      if (err) throw err
      setTitle('')
      setDescription('')
      setReason('')
      setOpen(false)
      onSubmitted()
    } catch (err: any) {
      setError(err.message ?? 'Failed to submit. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-zawadi-surface rounded-xl border border-white/5 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 hover:bg-white/2 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-zawadi-green/10 flex items-center justify-center">
            <Send className="w-4 h-4 text-zawadi-green" />
          </div>
          <span className="font-semibold text-white text-sm">Request Content</span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-zinc-500" /> : <ChevronDown className="w-4 h-4 text-zinc-500" />}
      </button>

      {open && (
        <form onSubmit={handleSubmit} className="px-5 pb-5 border-t border-white/5 pt-4 space-y-4">
          {error && (
            <p className="text-red-400 text-sm bg-red-400/10 px-3 py-2 rounded-lg">{error}</p>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              Title <span className="text-red-400">*</span>
            </label>
            <input
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Coming to America, Burna Boy – African Giant"
              className="w-full px-3 py-2.5 rounded-xl bg-zawadi-surface2 border border-white/10 text-white placeholder-zinc-600 focus:outline-none focus:border-zawadi-green transition-colors text-sm"
            />
          </div>

          {/* Type */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Content Type</label>
            <div className="flex gap-2">
              {(['movie', 'music', 'book'] as const).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={cn(
                    'flex-1 py-2 rounded-lg text-sm font-medium capitalize transition-colors border',
                    type === t
                      ? 'bg-zawadi-green/10 text-zawadi-green border-zawadi-green/30'
                      : 'bg-white/5 text-zinc-400 border-white/10 hover:bg-white/10'
                  )}
                >
                  {t === 'movie' ? '🎬' : t === 'music' ? '🎵' : '📚'} {t}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              Description <span className="text-zinc-600">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Artist name, director, year, genre — any details that help us find it"
              rows={2}
              className="w-full px-3 py-2.5 rounded-xl bg-zawadi-surface2 border border-white/10 text-white placeholder-zinc-600 focus:outline-none focus:border-zawadi-green transition-colors text-sm resize-none"
            />
          </div>

          {/* Reason */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              Why do you want it? <span className="text-zinc-600">(optional)</span>
            </label>
            <input
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="e.g. Classic Nollywood film my family loves"
              className="w-full px-3 py-2.5 rounded-xl bg-zawadi-surface2 border border-white/10 text-white placeholder-zinc-600 focus:outline-none focus:border-zawadi-green transition-colors text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-5 py-2.5 bg-zawadi-green text-zawadi-dark font-semibold text-sm rounded-xl hover:bg-zawadi-green/90 transition-colors disabled:opacity-60"
          >
            {loading ? (
              <><Loader className="w-4 h-4 animate-spin" /> Submitting…</>
            ) : (
              <><Send className="w-4 h-4" /> Submit Request</>
            )}
          </button>
        </form>
      )}
    </div>
  )
}

// ─── Main exported component (client, used inside the page) ──────────────────

interface ContentRequestsClientProps {
  initialRequests: ContentRequest[]
}

export function ContentRequestsClient({ initialRequests }: ContentRequestsClientProps) {
  const { user } = useAuthStore()
  const [requests, setRequests] = useState(initialRequests)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | 'movie' | 'music' | 'book'>('all')
  const [refreshKey, setRefreshKey] = useState(0)

  const reload = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('content_requests')
      .select('*, users(full_name, avatar_url)')
      .order('upvotes', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(50)
    if (data) setRequests(data as ContentRequest[])
    setRefreshKey(k => k + 1)
  }

  const handleUpvote = async (requestId: string) => {
    if (!user) return
    const supabase = createClient()

    // Check if upvote already exists
    const { data: existing } = await supabase
      .from('request_upvotes')
      .select('id')
      .eq('request_id', requestId)
      .eq('user_id', user.id)
      .single()

    if (existing) {
      // Remove upvote
      await supabase
        .from('request_upvotes')
        .delete()
        .eq('request_id', requestId)
        .eq('user_id', user.id)
    } else {
      // Add upvote
      await (supabase.from('request_upvotes') as any).insert({
        request_id: requestId,
        user_id: user.id,
      })
    }

    reload()
  }

  const filtered = requests.filter(r => {
    const matchSearch = !search || r.title.toLowerCase().includes(search.toLowerCase())
    const matchType = typeFilter === 'all' || r.type === typeFilter
    return matchSearch && matchType
  })

  return (
    <div className="space-y-5">
      {/* Submit form */}
      <SubmitRequestForm onSubmitted={reload} />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search requests…"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-zawadi-surface border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:border-zawadi-green transition-colors text-sm"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'movie', 'music', 'book'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={cn(
                'px-3 py-2 rounded-lg text-sm capitalize transition-colors',
                typeFilter === t
                  ? 'bg-white/10 text-white font-medium'
                  : 'text-zinc-400 hover:bg-white/5'
              )}
            >
              {t === 'all' ? 'All' : t === 'movie' ? '🎬' : t === 'music' ? '🎵' : '📚'} {t !== 'all' ? t : ''}
            </button>
          ))}
        </div>
      </div>

      {/* Request count */}
      <p className="text-sm text-zinc-500">
        {filtered.length} request{filtered.length !== 1 ? 's' : ''}
        {typeFilter !== 'all' && ` for ${typeFilter}s`}
      </p>

      {/* Request list */}
      <div className="space-y-3">
        {filtered.length > 0 ? (
          filtered.map(req => (
            <RequestCard
              key={req.id}
              request={req}
              userId={user?.id}
              onUpvote={handleUpvote}
            />
          ))
        ) : (
          <div className="text-center py-12 text-zinc-600">
            <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p>No requests found</p>
            {search && <p className="text-sm mt-1">Try a different search term</p>}
          </div>
        )}
      </div>
    </div>
  )
}
