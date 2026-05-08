import { createServerSupabaseClient } from '@/lib/supabase/server'
import { MessageSquare, TrendingUp, Clock, CheckCircle } from 'lucide-react'
import { ContentRequestsClient } from '@/components/requests/ContentRequests'

export const dynamic = 'force-dynamic'

export default async function RequestsPage() {
  const supabase = createServerSupabaseClient()

  const requests = ((await supabase
    .from('content_requests')
    .select('*, users(full_name, avatar_url)')
    .order('upvotes', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(50)) as any).data as any[]

  // Stats
  const total = requests.length
  const fulfilled = requests?.filter(r => r.status === 'fulfilled').length ?? 0
  const pending = requests?.filter(r => r.status === 'pending').length ?? 0
  const topRequest = requests?.[0]

  return (
    <div className="px-4 md:px-8 max-w-screen-xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <MessageSquare className="w-8 h-8 text-zawadi-green" />
          Content Requests
        </h1>
        <p className="text-zinc-400 mt-2 max-w-2xl">
          Can't find what you're looking for? Submit a request and our team will
          review it. Upvote requests you want to see added — popular requests get
          priority!
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 bg-zawadi-surface rounded-xl border border-white/5 text-center">
          <p className="text-2xl font-bold text-white">{total}</p>
          <p className="text-xs text-zinc-500 mt-0.5 flex items-center justify-center gap-1">
            <TrendingUp className="w-3 h-3" /> Total requests
          </p>
        </div>
        <div className="p-4 bg-zawadi-surface rounded-xl border border-white/5 text-center">
          <p className="text-2xl font-bold text-zawadi-gold">{pending}</p>
          <p className="text-xs text-zinc-500 mt-0.5 flex items-center justify-center gap-1">
            <Clock className="w-3 h-3" /> Pending review
          </p>
        </div>
        <div className="p-4 bg-zawadi-surface rounded-xl border border-white/5 text-center">
          <p className="text-2xl font-bold text-zawadi-green">{fulfilled}</p>
          <p className="text-xs text-zinc-500 mt-0.5 flex items-center justify-center gap-1">
            <CheckCircle className="w-3 h-3" /> Fulfilled
          </p>
        </div>
      </div>

      {/* How it works */}
      <div className="p-5 bg-zawadi-surface rounded-xl border border-white/5">
        <h2 className="text-sm font-semibold text-white mb-3">How It Works</h2>
        <div className="grid sm:grid-cols-4 gap-4 text-center">
          {[
            { step: '1', label: 'Submit your request', icon: '📝' },
            { step: '2', label: 'Community upvotes', icon: '👍' },
            { step: '3', label: 'Admin reviews it', icon: '🔍' },
            { step: '4', label: 'Content is added!', icon: '🎉' },
          ].map(s => (
            <div key={s.step} className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-zawadi-green/10 border border-zawadi-green/20 flex items-center justify-center text-xs font-bold text-zawadi-green">
                {s.step}
              </div>
              <span className="text-xl">{s.icon}</span>
              <p className="text-xs text-zinc-400">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Client-side interactive list */}
      <ContentRequestsClient initialRequests={(requests ?? []) as any} />
    </div>
  )
}
