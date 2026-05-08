'use client'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Area, AreaChart } from 'recharts'

interface AdminChartsProps {
  purchases: Array<{ amount_paid: number | null; purchased_at: string; currency: string }>
}

export function AdminCharts({ purchases }: AdminChartsProps) {
  // Group by month for revenue chart
  const revenueByMonth: Record<string, number> = {}
  purchases.forEach(p => {
    const key = new Date(p.purchased_at).toLocaleDateString('en', { month: 'short', year: '2-digit' })
    revenueByMonth[key] = (revenueByMonth[key] ?? 0) + (p.amount_paid ?? 0)
  })
  const revenueData = Object.entries(revenueByMonth)
    .slice(-6)
    .map(([month, revenue]) => ({ month, revenue: parseFloat(revenue.toFixed(2)) }))

  // Group by day for last 14 days
  const dailySales: Record<string, number> = {}
  const now = new Date()
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const key = d.toLocaleDateString('en', { month: 'short', day: 'numeric' })
    dailySales[key] = 0
  }
  purchases.forEach(p => {
    const d = new Date(p.purchased_at)
    const diff = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24))
    if (diff <= 13) {
      const key = d.toLocaleDateString('en', { month: 'short', day: 'numeric' })
      if (key in dailySales) dailySales[key]++
    }
  })
  const dailyData = Object.entries(dailySales).map(([day, sales]) => ({ day, sales }))

  const tooltipStyle = {
    backgroundColor: '#1A1A24',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px',
    color: '#fff',
  }

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Revenue chart */}
      <div className="bg-zawadi-surface rounded-2xl border border-white/5 p-5">
        <h3 className="text-sm font-semibold text-white mb-4">Monthly Revenue (USD)</h3>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={revenueData}>
            <defs>
              <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00C896" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#00C896" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="month" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Area type="monotone" dataKey="revenue" stroke="#00C896" fill="url(#revGrad)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Daily sales */}
      <div className="bg-zawadi-surface rounded-2xl border border-white/5 p-5">
        <h3 className="text-sm font-semibold text-white mb-4">Daily Purchases (last 14 days)</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={dailyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="day" tick={{ fill: '#71717a', fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="sales" fill="#F5A623" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
