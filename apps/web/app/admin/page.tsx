import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Users, Film, DollarSign, TrendingUp, Eye, Music, BookOpen } from 'lucide-react'
import { AdminCharts } from '@/components/admin/AdminCharts'

export default async function AdminDashboardPage() {
  const supabase = createServerSupabaseClient()

  const [
    { count: userCount },
    { count: contentCount },
    { data: purchases },
    { data: recentContent },
    { data: movieCount },
    { data: musicCount },
    { data: bookCount },
  ] = await Promise.all([
    supabase.from('users').select('*', { count: 'exact', head: true }),
    supabase.from('content').select('*', { count: 'exact', head: true }),
    supabase.from('purchases').select('amount_paid, purchased_at, currency'),
    supabase.from('content').select('*, categories(*)').order('created_at', { ascending: false }).limit(5),
    supabase.from('content').select('id', { count: 'exact', head: true }).eq('type', 'movie'),
    supabase.from('content').select('id', { count: 'exact', head: true }).eq('type', 'music'),
    supabase.from('content').select('id', { count: 'exact', head: true }).eq('type', 'book'),
  ]) as any
  const purchasesList = purchases as any[]
  const recentContentList = recentContent as any[]

  const totalRevenue = purchasesList.reduce((s, p) => s + (p.amount_paid ?? 0), 0)
  const thisMonth = purchasesList.filter(p => {
    const d = new Date(p.purchased_at)
    const now = new Date()
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  }).reduce((s, p) => s + (p.amount_paid ?? 0), 0)

  const stats = [
    { label: 'Total Users', value: userCount ?? 0, icon: Users, color: 'text-blue-400', bg: 'bg-blue-400/10' },
    { label: 'Total Content', value: contentCount ?? 0, icon: Film, color: 'text-purple-400', bg: 'bg-purple-400/10' },
    { label: 'Total Revenue', value: `$${totalRevenue.toFixed(2)}`, icon: DollarSign, color: 'text-zawadi-green', bg: 'bg-zawadi-green/10' },
    { label: 'This Month', value: `$${thisMonth.toFixed(2)}`, icon: TrendingUp, color: 'text-zawadi-gold', bg: 'bg-zawadi-gold/10' },
  ]

  const contentBreakdown = [
    { label: 'Movies', value: (movieCount as any)?.count ?? 0, icon: Film, color: 'text-red-400' },
    { label: 'Music', value: (musicCount as any)?.count ?? 0, icon: Music, color: 'text-green-400' },
    { label: 'Books', value: (bookCount as any)?.count ?? 0, icon: BookOpen, color: 'text-yellow-400' },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-zinc-400 text-sm mt-1">Welcome back, admin</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map(stat => (
          <div key={stat.label} className="p-5 bg-zawadi-surface rounded-2xl border border-white/5">
            <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center mb-3`}>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <p className="text-2xl font-bold text-white">{stat.value}</p>
            <p className="text-sm text-zinc-500 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Content breakdown */}
      <div className="grid grid-cols-3 gap-4">
        {contentBreakdown.map(item => (
          <div key={item.label} className="p-4 bg-zawadi-surface rounded-xl border border-white/5 flex items-center gap-4">
            <item.icon className={`w-8 h-8 ${item.color}`} />
            <div>
              <p className="text-xl font-bold text-white">{item.value}</p>
              <p className="text-xs text-zinc-500">{item.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <AdminCharts purchases={purchasesList} />

      {/* Recent content */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Recently Added</h2>
        <div className="bg-zawadi-surface rounded-2xl border border-white/5 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                <th className="px-4 py-3 text-left text-zinc-500 font-medium">Title</th>
                <th className="px-4 py-3 text-left text-zinc-500 font-medium">Type</th>
                <th className="px-4 py-3 text-left text-zinc-500 font-medium">Category</th>
                <th className="px-4 py-3 text-left text-zinc-500 font-medium">Price</th>
                <th className="px-4 py-3 text-left text-zinc-500 font-medium">Access</th>
              </tr>
            </thead>
            <tbody>
              {recentContentList.map(item => (
                <tr key={item.id} className="border-b border-white/5 last:border-0 hover:bg-white/2">
                  <td className="px-4 py-3 text-white font-medium">{item.title}</td>
                  <td className="px-4 py-3">
                    <span className="capitalize px-2 py-0.5 rounded bg-white/10 text-zinc-300 text-xs">{item.type}</span>
                  </td>
                  <td className="px-4 py-3 text-zinc-400">{(item as any).categories?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-zinc-300">{item.is_free ? 'Free' : `$${item.price}`}</td>
                  <td className="px-4 py-3">
                    <span className={`capitalize px-2 py-0.5 rounded text-xs ${item.required_tier === 'premium' ? 'bg-zawadi-gold/20 text-zawadi-gold' : item.required_tier === 'basic' ? 'bg-zawadi-green/20 text-zawadi-green' : 'bg-white/10 text-zinc-400'}`}>
                      {item.required_tier}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
