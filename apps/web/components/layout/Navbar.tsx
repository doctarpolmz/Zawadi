'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Search, User, LogOut, LayoutDashboard } from 'lucide-react'
import { useAuthStore } from '@/lib/stores/useAuthStore'
import { cn, getInitials } from '@/lib/utils'
import { useState } from 'react'

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/browse/movies', label: 'Movies' },
  { href: '/browse/music', label: 'Music' },
  { href: '/browse/books', label: 'Books' },
  { href: '/library', label: 'Library' },
  { href: '/download', label: 'Downloads' },
  { href: '/requests', label: 'Requests' },
]

export function Navbar() {
  const pathname = usePathname()
  const { user, profile, signOut } = useAuthStore()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-black/20 backdrop-blur-3xl shadow-[0_24px_80px_-40px_rgba(0,0,0,0.8)]">
      <div className="max-w-screen-2xl mx-auto px-4 md:px-8 h-20 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-3 shrink-0">
          <div className="inline-flex h-11 w-11 items-center justify-center rounded-3xl bg-gradient-to-br from-zawadi-green to-zawadi-gold text-zawadi-dark font-bold text-lg shadow-lg shadow-zawadi-green/20">
            Z
          </div>
          <div className="hidden md:flex flex-col leading-tight">
            <span className="text-white text-lg font-semibold tracking-tight">Zawadi</span>
            <span className="text-[11px] uppercase tracking-[0.35em] text-zinc-500">Entertainment</span>
          </div>
        </Link>

        <nav className="hidden lg:flex items-center gap-2">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'px-4 py-2 rounded-2xl text-sm transition-all duration-200',
                pathname === link.href
                  ? 'bg-white/10 text-white font-semibold shadow-[0_0_0_1px_rgba(255,255,255,0.08)]'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link href="/browse/movies" className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/5 text-zinc-300 hover:text-white hover:bg-white/10 transition-colors">
            <Search className="w-5 h-5" />
          </Link>

          {user ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white transition-all hover:border-white/20 hover:bg-white/10"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-zawadi-green/30 to-zawadi-gold/30 text-sm font-semibold text-zawadi-green">
                  {getInitials(profile?.full_name)}
                </div>
                <span className="hidden sm:inline">Account</span>
              </button>

              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 top-16 w-56 rounded-3xl bg-zawadi-surface/95 border border-white/10 shadow-2xl backdrop-blur-2xl z-20 overflow-hidden animate-fadeIn">
                    <div className="px-4 py-4 border-b border-white/10">
                      <p className="text-sm font-semibold text-white truncate">{profile?.full_name ?? 'User'}</p>
                      <p className="text-xs text-zinc-500 truncate">{profile?.email}</p>
                    </div>
                    <div className="flex flex-col gap-1 p-2">
                      <Link href="/profile" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 rounded-2xl px-3 py-2 text-sm text-zinc-300 hover:bg-white/5 transition-colors">
                        <User className="w-4 h-4" /> Profile
                      </Link>
                      {profile?.role === 'admin' && (
                        <Link href="/admin" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 rounded-2xl px-3 py-2 text-sm text-zawadi-gold hover:bg-white/5 transition-colors">
                          <LayoutDashboard className="w-4 h-4" /> Admin
                        </Link>
                      )}
                      <button onClick={() => { signOut(); setMenuOpen(false) }} className="flex items-center gap-3 rounded-2xl px-3 py-2 text-sm text-red-400 hover:bg-red-400/10 transition-colors">
                        <LogOut className="w-4 h-4" /> Sign out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login" className="rounded-2xl px-4 py-2 text-sm text-zinc-300 hover:text-white hover:bg-white/5 transition-colors">
                Sign in
              </Link>
              <Link href="/register" className="rounded-2xl bg-zawadi-green px-4 py-2 text-sm font-semibold text-zawadi-dark hover:bg-zawadi-green/90 transition-colors">
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
