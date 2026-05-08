'use client'
import { useState } from 'react'
import { MessageSquare, Check, X, Loader, ChevronDown, ChevronUp, TrendingUp, Sparkles, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatDate, cn } from '@/lib/utils'
import type { ContentRequest } from '@/types/database'

type RequestStatus = 'pending' | 'reviewing' | 'approved' | 'rejected' | 'fulfilled'

interface AdminRequestsPanelProps {
  initialRequests: ContentRequest[]
}

const STATUS_OPTIONS: { value: RequestStatus; label: string; color: string; bgColor: string }[] = [
  { value: 'pending', label: 'Pending', color: 'text-zinc-300', bgColor: 'bg-zinc-700/50 border-zinc-600' },
  { value: 'reviewing', label: 'In Review', color: 'text-blue-400', bgColor: 'bg-blue-500/10 border-blue-500/20' },
  { value: 'approved', label: 'Approved', color: 'text-zawadi-green', bgColor: 'bg-zawadi-green/10 border-zawadi-green/20' },
  { value: 'rejected', label: 'Not Available', color: 'text-red-400', bgColor: 'bg-red-500/10 border-red-500/20' },
  { value: 'fulfilled', label: 'Available Now! ✓', color: 'text-zawadi-gold', bgColor: 'bg-zawadi-gold/10 border-zawadi-gold/20' },
]

function AdminRequestRow({ request, onUpdated }: {
  request: ContentRequest
  onUpdated: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [reply, setReply] = useState(request.admin_reply ?? '')
  const [status, setStatus] = useState<RequestStatus>(request.status)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState('')

  const handleSave = async () => {
    setSaving(true)
    setSaveError('')
    const supabase = createClient()
    const user = (await supabase.auth.getUser()).data.user
    const { error } = await (supabase.from('content_requests') as any).update({
      status,
      admin_reply: reply.trim() || null,
      replied_by: user?.id ?? null,
      replied_at: reply.trim() ? new Date().toISOString() : null,
    }).eq('id', request.id)
    setSaving(false)

    if (error) {
      console.error('Failed to save request update:', error)
      setSaveError(error.message)
      return
    }

    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    onUpdated()
  }

  const statusConfig = STATUS_OPTIONS.find(s => s.value === status) || STATUS_OPTIONS[0]

  return (
    <div className="bg-zawadi-surface rounded-2xl border border-white/5 overflow-hidden hover:border-white/10 transition-colors">
      {/* Header row */}
      <div className="p-5 flex items-start gap-4">
        {/* Upvotes - visual indicator */}
        <div className="flex flex-col items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 w-16 shrink-0">
          <TrendingUp className="w-4 h-4 text-zawadi-gold" />
          <span className="text-lg font-bold text-white">{request.upvotes}</span>
          <span className="text-xs text-zinc-500">votes</span>
        </div>

        {/* Main info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 flex-wrap mb-2">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{request.type === 'movie' ? '🎬' : request.type === 'music' ? '🎵' : '📚'}</span>
                <h3 className="text-white font-bold text-base">{request.title}</h3>
              </div>
              {request.description && (
                <p className="text-zinc-400 text-xs leading-relaxed line-clamp-1">{request.description}</p>
              )}
            </div>
            <span className={cn('px-3 py-1.5 rounded-full text-xs font-semibold border capitalize', statusConfig.bgColor)}>
              {statusConfig.label}
            </span>
          </div>

          {/* User & date info */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-600">
            <span className="font-medium">{request.users?.full_name ?? 'Unknown User'}</span>
            <span className="text-zinc-700">·</span>
            <span className="text-zinc-600">{request.users?.email}</span>
            <span className="text-zinc-700">·</span>
            <span className="text-zinc-600">{formatDate(request.created_at)}</span>
          </div>
        </div>

        {/* Expand toggle */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="p-2 text-zinc-500 hover:text-white hover:bg-white/10 transition-colors rounded-lg shrink-0"
        >
          {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>
      </div>

      {/* Expanded management form */}
      {expanded && (
        <div className="px-5 pb-5 border-t border-white/5 pt-5 space-y-4 bg-white/2">
          {/* User's reason */}
          {request.reason && (
            <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
              <p className="text-xs font-semibold text-zinc-400 mb-2 flex items-center gap-2 uppercase tracking-wide">
                <AlertCircle className="w-3.5 h-3.5" /> User's Context
              </p>
              <p className="text-sm text-zinc-200 italic">"{request.reason}"</p>
            </div>
          )}

          {/* Current admin reply if exists */}
          {request.admin_reply && (
            <div className="p-4 bg-zawadi-green/5 border border-zawadi-green/20 rounded-xl">
              <p className="text-xs font-semibold text-zawadi-green mb-2 flex items-center gap-2">
                <Check className="w-3.5 h-3.5" /> Previous Reply
              </p>
              <p className="text-sm text-zinc-200">{request.admin_reply}</p>
              {request.replied_at && (
                <p className="text-xs text-zinc-600 mt-2">{formatDate(request.replied_at)}</p>
              )}
            </div>
          )}

          {/* Status selector */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-3 uppercase tracking-wide">Update Status</label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {STATUS_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setStatus(opt.value)}
                  className={cn(
                    'px-3 py-2.5 rounded-lg text-xs font-semibold border transition-all duration-200 capitalize text-center',
                    status === opt.value
                      ? `${opt.bgColor} ${opt.color}`
                      : 'text-zinc-500 border-white/10 hover:border-white/20 hover:bg-white/5'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Reply textarea */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-2 uppercase tracking-wide">
              Reply to User <span className="text-zinc-600 font-normal">(visible on requests page)</span>
            </label>
            <textarea
              value={reply}
              onChange={e => setReply(e.target.value)}
              placeholder="Update the user on the status of their request…"
              rows={3}
              className="w-full px-4 py-3 rounded-xl bg-zawadi-surface2 border border-white/10 text-white placeholder-zinc-600 focus:outline-none focus:border-zawadi-green focus:ring-1 focus:ring-zawadi-green/50 transition-all text-sm resize-none"
            />
            <p className="text-xs text-zinc-600 mt-1.5">Users will see this message on their request card.</p>
          </div>

          {/* Save actions */}
          <div className="flex flex-col gap-3 pt-2">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleSave}
                disabled={saving}
                className={cn(
                  'flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-xl transition-all duration-200 uppercase tracking-wide',
                  saved
                    ? 'bg-zawadi-green/10 text-zawadi-green border border-zawadi-green/30'
                    : 'bg-zawadi-green text-zawadi-dark hover:bg-zawadi-green/90 border border-zawadi-green'
                )}
              >
                {saving ? (
                  <><Loader className="w-4 h-4 animate-spin" /> Saving…</>
                ) : saved ? (
                  <><Check className="w-4 h-4" /> Saved!</>
                ) : (
                  <><Sparkles className="w-4 h-4" /> Save Changes</>
                )}
              </button>
              <button
                onClick={() => setExpanded(false)}
                className="px-4 py-2.5 text-sm font-semibold text-zinc-400 hover:text-white transition-colors"
              >
                Close
              </button>
            </div>
            {saveError && (
              <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{saveError}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export function AdminRequestsPanel({ initialRequests }: AdminRequestsPanelProps) {
  const [requests, setRequests] = useState(initialRequests)
  const [statusFilter, setStatusFilter] = useState<RequestStatus | 'all'>('all')
  const [typeFilter, setTypeFilter] = useState<'all' | 'movie' | 'music' | 'book'>('all')
  const [search, setSearch] = useState('')

  const reload = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('content_requests')
      .select('*, users(full_name, email)')
      .order('upvotes', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(100)
    if (data) setRequests(data as ContentRequest[])
  }

  let filtered = requests.filter(r => {
    const matchStatus = statusFilter === 'all' || r.status === statusFilter
    const matchType = typeFilter === 'all' || r.type === typeFilter
    const matchSearch = !search || r.title.toLowerCase().includes(search.toLowerCase()) || r.description?.toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchType && matchSearch
  })

  const counts = STATUS_OPTIONS.reduce((acc, s) => {
    acc[s.value] = requests.filter(r => r.status === s.value).length
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <MessageSquare className="w-7 h-7 text-zawadi-green" />
            Content Requests
          </h2>
          <div className="flex items-center gap-2 px-4 py-2 bg-zawadi-surface rounded-lg border border-white/5">
            <TrendingUp className="w-4 h-4 text-zawadi-green" />
            <span className="text-sm font-bold text-white">{requests.length}</span>
            <span className="text-xs text-zinc-500">total</span>
          </div>
        </div>
        <p className="text-zinc-400 text-sm">Manage community content requests and keep users informed</p>
      </div>

      {/* Search and filters */}
      <div className="space-y-3">
        <div className="relative">
          <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by title or description…"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zawadi-surface border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:border-zawadi-green focus:ring-1 focus:ring-zawadi-green/50 transition-all text-sm"
          />
        </div>

        {/* Status filter tabs */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setStatusFilter('all')}
            className={cn(
              'px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 border',
              statusFilter === 'all'
                ? 'bg-white/10 text-white border-white/20'
                : 'text-zinc-400 border-white/5 hover:bg-white/5'
            )}
          >
            All ({requests.length})
          </button>
          {STATUS_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setStatusFilter(opt.value)}
              className={cn(
                'px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 border capitalize',
                statusFilter === opt.value
                  ? `${opt.bgColor} ${opt.color}`
                  : 'text-zinc-400 border-white/5 hover:bg-white/5'
              )}
            >
              {opt.label} ({counts[opt.value] ?? 0})
            </button>
          ))}
        </div>

        {/* Type filters */}
        <div className="flex flex-wrap gap-2">
          {(['all', 'movie', 'music', 'book'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={cn(
                'px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 border',
                typeFilter === t
                  ? 'bg-white/10 text-white border-white/20'
                  : 'text-zinc-400 border-white/5 hover:bg-white/5'
              )}
            >
              {t === 'all' ? 'All Types' : t === 'movie' ? '🎬' : t === 'music' ? '🎵' : '📚'} {t !== 'all' ? t : ''}
            </button>
          ))}
        </div>
      </div>

      {/* Request rows */}
      <div className="space-y-3">
        {filtered.length > 0 ? (
          filtered.map(req => (
            <AdminRequestRow
              key={req.id}
              request={req}
              onUpdated={reload}
            />
          ))
        ) : (
          <div className="text-center py-16 text-zinc-600">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-40" />
            <p className="text-lg font-semibold text-zinc-400">No requests found</p>
            {search && <p className="text-sm mt-2">Try a different search term</p>}
          </div>
        )}
      </div>
    </div>
  )
}
