'use client'
import { useState } from 'react'
import { ThumbsUp, Send, ChevronDown, ChevronUp, Clock, CheckCircle, XCircle, Loader, MessageSquare, Search, Sparkles, TrendingUp } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/lib/stores/useAuthStore'
import { formatDate, cn } from '@/lib/utils'
import type { ContentRequest } from '@/types/database'

type RequestStatus = 'pending' | 'reviewing' | 'approved' | 'rejected' | 'fulfilled'

interface RequestFormProps {
  onSubmitted: () => void
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: RequestStatus }) {
  const config = {
    pending: { label: 'Pending', icon: Clock, cls: 'bg-zinc-700/50 text-zinc-300 border-zinc-600' },
    reviewing: { label: 'In Review', icon: Loader, cls: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
    approved: { label: 'Approved', icon: CheckCircle, cls: 'bg-zawadi-green/10 text-zawadi-green border-zawadi-green/20' },
    rejected: { label: 'Not Available', icon: XCircle, cls: 'bg-red-500/10 text-red-400 border-red-500/20' },
    fulfilled: { label: 'Available Now!', icon: CheckCircle, cls: 'bg-zawadi-gold/10 text-zawadi-gold border-zawadi-gold/20' },
  }[status]

  const Icon = config.icon
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border', config.cls)}>
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  )
}

// ─── Request card (streaming-platform style) ──────────────────────────────────

function RequestCard({ request, userId, onUpvote }: {
  request: ContentRequest
  userId: string | undefined
  onUpvote: (id: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const typeEmoji = request.type === 'movie' ? '🎬' : request.type === 'music' ? '🎵' : '📚'

  return (
    <div className="group relative bg-zawadi-surface border border-white/5 rounded-2xl overflow-hidden hover:border-white/10 hover:shadow-lg transition-all duration-300">
      <div className="p-5">
        <div className="flex items-start gap-4">
          {/* Upvote button - larger, more prominent */}
          <button
            onClick={() => userId && onUpvote(request.id)}
            disabled={!userId}
            className={cn(
              'flex flex-col items-center gap-1 px-3.5 py-3 rounded-xl border transition-all duration-200 shrink-0 font-semibold',
              userId
                ? 'border-zawadi-green/30 hover:border-zawadi-green/60 hover:bg-zawadi-green/10 cursor-pointer bg-zawadi-green/5'
                : 'border-white/5 opacity-40 cursor-not-allowed'
            )}
          >
            <ThumbsUp className="w-4 h-4" />
            <span className="text-sm text-white">{request.upvotes}</span>
          </button>

          {/* Content section */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-xl">{typeEmoji}</span>
                  <h3 className="text-white font-bold text-base leading-tight">{request.title}</h3>
                </div>
                {request.description && (
                  <p className="text-zinc-400 text-sm leading-relaxed line-clamp-2">
                    {request.description}
                  </p>
                )}
              </div>
              <StatusBadge status={request.status} />
            </div>

            {/* Metadata */}
            <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500 mb-3">
              <span className="capitalize px-2 py-1 bg-white/5 rounded-lg">{request.type}</span>
              <span>·</span>
              <span>{formatDate(request.created_at)}</span>
              {request.users?.full_name && (
                <>
                  <span>·</span>
                  <span>by {request.users.full_name.split(' ')[0]}</span>
                </>
              )}
            </div>

            {/* Admin reply - highlighted */}
            {request.admin_reply && (
              <div className="mt-3 p-4 bg-gradient-to-r from-zawadi-green/5 to-zawadi-green/2 border border-zawadi-green/20 rounded-xl">
                <p className="text-xs font-semibold text-zawadi-green mb-1.5 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> Admin Update
                </p>
                <p className="text-sm text-zinc-200 leading-relaxed">{request.admin_reply}</p>
                {request.replied_at && (
                  <p className="text-xs text-zinc-600 mt-2">{formatDate(request.replied_at)}</p>
                )}
              </div>
            )}

            {/* Expand for reason */}
            {request.reason && (
              <>
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="mt-3 flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors font-medium"
                >
                  {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  {expanded ? 'Hide context' : 'View context'}
                </button>
                {expanded && (
                  <p className="mt-2.5 text-sm text-zinc-400 italic border-l-2 border-zinc-700 pl-3">
                    "{request.reason}"
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Submit form (modern, expandable) ──────────────────────────────────────────

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
      <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-r from-zawadi-green/10 via-zawadi-surface to-zawadi-surface p-8 text-center">
        <div className="absolute inset-0 bg-gradient-to-r from-zawadi-green/5 to-transparent" />
        <div className="relative">
          <Send className="w-10 h-10 text-zawadi-green mx-auto mb-4 opacity-60" />
          <h3 className="text-lg font-bold text-white mb-2">Share Your Request</h3>
          <p className="text-zinc-400 text-sm mb-4">Sign in to request content you'd like to see</p>
          <a href="/login" className="inline-flex px-6 py-2.5 bg-zawadi-green text-zawadi-dark text-sm font-semibold rounded-xl hover:bg-zawadi-green/90 transition-colors">
            Sign In
          </a>
        </div>
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
    <div className="bg-zawadi-surface rounded-2xl border border-white/5 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 hover:bg-white/2 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-zawadi-green/10 border border-zawadi-green/20 flex items-center justify-center">
            <Send className="w-5 h-5 text-zawadi-green" />
          </div>
          <div className="text-left">
            <p className="font-bold text-white text-base">Request Content</p>
            <p className="text-xs text-zinc-500 mt-0.5">Can't find what you're looking for?</p>
          </div>
        </div>
        {open ? <ChevronUp className="w-5 h-5 text-zinc-500" /> : <ChevronDown className="w-5 h-5 text-zinc-500" />}
      </button>

      {open && (
        <form onSubmit={handleSubmit} className="px-5 pb-5 border-t border-white/5 pt-5 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium flex items-start gap-2">
              <XCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-2 uppercase tracking-wide">
              Title <span className="text-red-400">*</span>
            </label>
            <input
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Coming to America, Burna Boy – African Giant, The Lion King"
              className="w-full px-4 py-3 rounded-xl bg-zawadi-surface2 border border-white/10 text-white placeholder-zinc-600 focus:outline-none focus:border-zawadi-green focus:ring-1 focus:ring-zawadi-green/50 transition-all text-sm"
            />
          </div>

          {/* Type */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-2 uppercase tracking-wide">Content Type</label>
            <div className="flex gap-2">
              {(['movie', 'music', 'book'] as const).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={cn(
                    'flex-1 py-3 rounded-xl text-sm font-semibold capitalize transition-all border duration-200',
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
            <label className="block text-xs font-semibold text-zinc-300 mb-2 uppercase tracking-wide">
              Description <span className="text-zinc-600 font-normal">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Artist, director, year, genre — anything that helps us find it"
              rows={2}
              className="w-full px-4 py-3 rounded-xl bg-zawadi-surface2 border border-white/10 text-white placeholder-zinc-600 focus:outline-none focus:border-zawadi-green focus:ring-1 focus:ring-zawadi-green/50 transition-all text-sm resize-none"
            />
          </div>

          {/* Reason */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-2 uppercase tracking-wide">
              Why do you want it? <span className="text-zinc-600 font-normal">(optional)</span>
            </label>
            <input
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="e.g. My family's all-time favorite classic"
              className="w-full px-4 py-3 rounded-xl bg-zawadi-surface2 border border-white/10 text-white placeholder-zinc-600 focus:outline-none focus:border-zawadi-green focus:ring-1 focus:ring-zawadi-green/50 transition-all text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-zawadi-green text-zawadi-dark font-bold text-sm rounded-xl hover:bg-zawadi-green/90 transition-all duration-200 disabled:opacity-60 uppercase tracking-wide"
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

// ─── Main exported component ──────────────────────────────────────────────────

interface ContentRequestsClientProps {
  initialRequests: ContentRequest[]
}

export function ContentRequestsClient({ initialRequests }: ContentRequestsClientProps) {
  const { user } = useAuthStore()
  const [requests, setRequests] = useState(initialRequests)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | 'movie' | 'music' | 'book'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | RequestStatus>('all')
  const [sortBy, setSortBy] = useState<'popular' | 'recent'>('popular')

  const reload = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('content_requests')
      .select('*, users(full_name, avatar_url)')
      .order('upvotes', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(50)
    if (data) setRequests(data as ContentRequest[])
  }

  const handleUpvote = async (requestId: string) => {
    if (!user) return
    const supabase = createClient()

    const { data: existing } = await supabase
      .from('request_upvotes')
      .select('id')
      .eq('request_id', requestId)
      .eq('user_id', user.id)
      .single()

    if (existing) {
      await supabase
        .from('request_upvotes')
        .delete()
        .eq('request_id', requestId)
        .eq('user_id', user.id)
    } else {
      await (supabase.from('request_upvotes') as any).insert({
        request_id: requestId,
        user_id: user.id,
      })
    }

    reload()
  }

  let filtered = requests.filter(r => {
    const matchSearch = !search || r.title.toLowerCase().includes(search.toLowerCase()) || r.description?.toLowerCase().includes(search.toLowerCase())
    const matchType = typeFilter === 'all' || r.type === typeFilter
    const matchStatus = statusFilter === 'all' || r.status === statusFilter
    return matchSearch && matchType && matchStatus
  })

  if (sortBy === 'recent') {
    filtered = [...filtered].reverse()
  }

  return (
    <div className="space-y-6">
      {/* Submit form */}
      <SubmitRequestForm onSubmitted={reload} />

      {/* Filters bar */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search requests…"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zawadi-surface border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:border-zawadi-green focus:ring-1 focus:ring-zawadi-green/50 transition-all text-sm"
            />
          </div>
          
          {/* Sort */}
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as 'popular' | 'recent')}
            className="px-3 py-2.5 rounded-xl bg-zawadi-surface border border-white/10 text-white focus:outline-none focus:border-zawadi-green transition-all text-sm"
          >
            <option value="popular">🔥 Most Popular</option>
            <option value="recent">⏰ Most Recent</option>
          </select>
        </div>

        {/* Type filters */}
        <div className="flex flex-wrap gap-2">
          {(['all', 'movie', 'music', 'book'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={cn(
                'px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 border',
                typeFilter === t
                  ? 'bg-white/10 text-white border-white/20'
                  : 'text-zinc-400 border-white/5 hover:bg-white/5'
              )}
            >
              {t === 'all' ? 'All' : t === 'movie' ? '🎬' : t === 'music' ? '🎵' : '📚'} {t !== 'all' ? t : ''}
            </button>
          ))}

          {/* Status filters */}
          <div className="border-l border-white/10 pl-2" />
          {(['all', 'pending', 'reviewing', 'approved', 'fulfilled'] as const).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                'px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 border',
                statusFilter === s
                  ? 'bg-white/10 text-white border-white/20'
                  : 'text-zinc-400 border-white/5 hover:bg-white/5'
              )}
            >
              {s === 'all' ? 'All Status' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Request count info */}
      {requests.length > 0 && (
        <div className="flex items-center gap-2 px-4 py-3 bg-zawadi-surface rounded-xl border border-white/5">
          <TrendingUp className="w-4 h-4 text-zawadi-green" />
          <p className="text-sm text-zinc-400">
            <span className="font-semibold text-white">{filtered.length}</span> request{filtered.length !== 1 ? 's' : ''} found
            {typeFilter !== 'all' && ` for ${typeFilter}s`}
            {statusFilter !== 'all' && ` • ${statusFilter}`}
          </p>
        </div>
      )}

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
          <div className="text-center py-16 text-zinc-600">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-40" />
            <p className="text-lg font-semibold text-zinc-400">No requests found</p>
            {search && <p className="text-sm mt-2">Try a different search term</p>}
            {typeFilter !== 'all' && <p className="text-sm mt-2">Try changing the content type filter</p>}
          </div>
        )}
      </div>
    </div>
  )
}
