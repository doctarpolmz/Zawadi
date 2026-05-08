import { createServerSupabaseClient } from '@/lib/supabase/server'
import { AdminCharts } from '@/components/admin/AdminCharts'
import { formatPrice } from '@/lib/utils'

export default async function AdminAnalyticsPage() {
  const supabase = createServerSupabaseClient()

  const [{ data: purchases }, { data: topContent }, { data: watchHistory }] = await Promise.all([
    supabase.from('purchases').select('amount_paid, purchased_at, currency, content_id'),
    supabase.from('watch_history')
      .select('content_id, content(title, type)')
      .limit(100),
    supabase.from('watch_history').select('content_id, completed').limit(200),
  ]) as any
  const purchasesList = purchases as any[]
  const topContentList = topContent as any[]
  const watchHistoryList = watchHistory as any[]

  const totalRev = purchasesList.reduce((s, p) => s + (p.amount_paid ?? 0), 0)
  const completedCount = watchHistoryList.filter(h => h.completed).length
  const completionRate = watchHistoryList.length ? Math.round((completedCount / watchHistoryList.length) * 100) : 0

  // Top content by watch count
  const watchCount: Record<string, { title: string; type: string; count: number }> = {}
  topContentList.forEach(item => {
    const c = (item as any).content
    if (!c) return
    if (!watchCount[item.content_id]) watchCount[item.content_id] = { title: c.title, type: c.type, count: 0 }
    watchCount[item.content_id].count++
  })
  const topItems = Object.values(watchCount).sort((a, b) => b.count - a.count).slice(0, 10)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Analytics</h1>
        <p className="text-zinc-400 text-sm mt-1">Platform performance overview</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Revenue', value: formatPrice(totalRev) },
          { label: 'Total Purchases', value: purchasesList.length },
          { label: 'Watch Events', value: watchHistoryList.length },
          { label: 'Completion Rate', value: `${completionRate}%` },
        ].map(kpi => (
          <div key={kpi.label} className="p-4 bg-zawadi-surface rounded-2xl border border-white/5 text-center">
            <p className="text-2xl font-bold text-white">{kpi.value}</p>
            <p className="text-xs text-zinc-500 mt-1">{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* Revenue charts */}
      <AdminCharts purchases={purchasesList} />

      {/* Top content */}
      <div className="bg-zawadi-surface rounded-2xl border border-white/5 overflow-hidden">
        <div className="px-5 py-4 border-b border-white/5">
          <h2 className="font-semibold text-white">Most Watched Content</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5">
              <th className="px-4 py-3 text-left text-zinc-500 font-medium">#</th>
              <th className="px-4 py-3 text-left text-zinc-500 font-medium">Title</th>
              <th className="px-4 py-3 text-left text-zinc-500 font-medium">Type</th>
              <th className="px-4 py-3 text-left text-zinc-500 font-medium">Views</th>
            </tr>
          </thead>
          <tbody>
            {topItems.map((item, i) => (
              <tr key={i} className="border-b border-white/5 last:border-0">
                <td className="px-4 py-3 text-zinc-600 font-medium">{i + 1}</td>
                <td className="px-4 py-3 text-white font-medium">{item.title}</td>
                <td className="px-4 py-3">
                  <span className="capitalize px-2 py-0.5 rounded bg-white/10 text-zinc-300 text-xs">{item.type}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-1.5 bg-white/10 rounded-full max-w-[100px]">
                      <div className="h-full bg-zawadi-green rounded-full"
                        style={{ width: `${(item.count / topItems[0].count) * 100}%` }} />
                    </div>
                    <span className="text-zinc-400 tabular-nums">{item.count}</span>
                  </div>
                </td>
              </tr>
            ))}
            {topItems.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-zinc-600">No watch data yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
