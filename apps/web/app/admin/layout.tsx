import { MessageSquare } from 'lucide-react'
import Link from 'next/link'
import { LayoutDashboard, Film, Users, BarChart3, Settings, ChevronLeft } from 'lucide-react'

const adminNav = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/content', label: 'Content', icon: Film },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/admin/requests',     label: 'Requests',   icon: MessageSquare }, 
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zawadi-dark flex">
      {/* Sidebar */}
      <aside className="w-56 bg-zawadi-surface border-r border-white/5 flex flex-col py-6 px-3 fixed h-full z-40">
        <div className="flex items-center gap-2 px-3 mb-8">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-zawadi-green to-zawadi-gold flex items-center justify-center text-zawadi-dark font-bold text-xs">Z</div>
          <span className="font-bold text-white">Admin</span>
        </div>

        <nav className="flex-1 space-y-1">
          {adminNav.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          ))}
        </nav>

        <Link href="/" className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-600 hover:text-white transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back to site
        </Link>
      </aside>

      {/* Main */}
      <main className="flex-1 ml-56 p-8">{children}</main>
    </div>
  )
}
