'use client'
import { useState } from 'react'
import { MessageSquare, Check, X, Loader, ChevronDown, ChevronUp, TrendingUp } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatDate, cn } from '@/lib/utils'

type RequestStatus = 'pending' | 'reviewing' | 'approved' | 'rejected' | 'fulfilled'

interface ContentRequest {
  id: string
  user_id: string
  title: string
  type: string
  description: string | null
  reason: string | null
  status: RequestStatus
  admin_reply: string | null
  upvotes: number
  created_at: string
  replied_at: string | null
  users?: { full_name: string | null; email: string }
}

interface AdminRequestsPanelProps {
  initialRequests: ContentRequest[]
}

const STATUS_OPTIONS: { value: RequestStatus; label: string; color: string }[] = [
  { value: 'pending', label: 'Pending', color: 'text-zinc-300' },
  { value: 'reviewing', label: 'Reviewing', color: 'text-blue-400' },
  { value: 'approved', label: 'Approved', color: 'text-zawadi-green' },
  { value: 'rejected', label: 'Rejected', color: 'text-red-400' },
  { value: 'fulfilled', label: 'Fulfilled ✓', color: 'text-zawadi-gold' },
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

  const statusColors: Record<RequestStatus, string> = {
    pending: 'bg-zinc-700/50 text-zinc-300',
    reviewing: 'bg-blue-500/10 text-blue-400',
    approved: 'bg-zawadi-green/10 text-zawadi-green',
    rejected: 'bg-red-500/10 text-red-400',
    fulfilled: 'bg-zawadi-gold/10 text-zawadi-gold',
  }

  return (
    <div className="bg-zawadi-surface rounded-xl border border-white/5 overflow-hidden">
      {/* Header row */}
      <div className="p-4 flex items-start gap-4">
        {/* Upvotes */}
        <div className="flex flex-col items-center gap-0.5 w-10 shrink-0">
          <TrendingUp className="w-3.5 h-3.5 text-zinc-500" />
          <span className="text-sm font-bold text-white">{request.upvotes}</span>
        </div>

        {/* Main info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div>
              <span className="text-white font-semibold text-sm">{request.title}</span>
              <span className="ml-2 text-xs text-zinc-500 capitalize">{request.type}</span>
            </div>
            <span className={cn('px-2 py-0.5 rounded-md text-xs font-medium capitalize', statusColors[request.status])}>
              {request.status}
            </span>
          </div>
          {request.description && (
            <p className="text-zinc-400 text-xs mt-1 line-clamp-1">{request.description}</p>
          )}
          <div className="flex items-center gap-2 mt-1 text-xs text-zinc-600">
            <span>{request.users?.full_name ?? 'User'}</span>
            <span>·</span>
            <span>{request.users?.email}</span>
            <span>·</span>
            <span>{formatDate(request.created_at)}</span>
          </div>
        </div>

        {/* Expand toggle */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="p-1.5 text-zinc-500 hover:text-white transition-colors shrink-0"
        >
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Expanded reply form */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-white/5 pt-4 space-y-3">
          {/* Reason */}
          {request.reason && (
            <div className="p-3 bg-white/3 rounded-lg">
              <p className="text-xs font-medium text-zinc-500 mb-1">User's reason:</p>
              <p className="text-sm text-zinc-300 italic">"{request.reason}"</p>
            </div>
          )}

          {/* Status selector */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Update Status</label>
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setStatus(opt.value)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                    status === opt.value
                      ? `${opt.color} border-current bg-current/10`
                      : 'text-zinc-500 border-zinc-700 hover:border-zinc-500'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Reply textarea */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              Reply to User <span className="text-zinc-600">(visible on the requests page)</span>
            </label>
            <textarea
              value={reply}
              onChange={e => setReply(e.target.value)}
              placeholder="e.g. We're working on adding this! It should be available within 2 weeks."
              rows={3}
              className="w-full px-3 py-2.5 rounded-xl bg-zawadi-surface2 border border-white/10 text-white placeholder-zinc-600 focus:outline-none focus:border-zawadi-green transition-colors text-sm resize-none"
            />
          </div>

          {/* Save */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-zawadi-green text-zawadi-dark text-sm font-semibold rounded-lg hover:bg-zawadi-green/90 transition-colors disabled:opacity-60"
              >
                {saving ? (
                  <><Loader className="w-3.5 h-3.5 animate-spin" /> Saving…</>
                ) : saved ? (
                  <><Check className="w-3.5 h-3.5" /> Saved!</>
                ) : (
                  <><MessageSquare className="w-3.5 h-3.5" /> Save Reply</>
                )}
              </button>
              <button
                onClick={() => setExpanded(false)}
                className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors"
              >
                Close
              </button>
            </div>
            {saveError && (
              <p className="text-xs text-red-400 bg-red-500/10 px-3 py-2 rounded-lg">
                {saveError}
              </p>
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

  const filtered = statusFilter === 'all'
    ? requests
    : requests.filter(r => r.status === statusFilter)

  const counts = STATUS_OPTIONS.reduce((acc, s) => {
    acc[s.value] = requests.filter(r => r.status === s.value).length
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-zawadi-green" />
          Content Requests
          <span className="text-sm text-zinc-500 font-normal">({requests.length} total)</span>
        </h2>
      </div>

      {/* Status filter tabs */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setStatusFilter('all')}
          className={cn(
            'px-3 py-1.5 rounded-lg text-sm transition-colors border',
            statusFilter === 'all'
              ? 'bg-white/10 text-white border-white/20 font-medium'
              : 'text-zinc-400 border-transparent hover:bg-white/5'
          )}
        >
          All ({requests.length})
        </button>
        {STATUS_OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => setStatusFilter(opt.value)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-sm transition-colors border capitalize',
              statusFilter === opt.value
                ? `${opt.color} bg-current/10 border-current/30 font-medium`
                : 'text-zinc-400 border-transparent hover:bg-white/5'
            )}
          >
            {opt.label} ({counts[opt.value] ?? 0})
          </button>
        ))}
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
          <div className="text-center py-10 text-zinc-600">
            <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p>No {statusFilter !== 'all' ? statusFilter : ''} requests</p>
          </div>
        )}
      </div>
    </div>
  )
}
