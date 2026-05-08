'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Search, Bell, User, LogOut, Settings, LayoutDashboard } from 'lucide-react'
import { useAuthStore } from '@/lib/stores/useAuthStore'
import { cn, getInitials } from '@/lib/utils'
import { useState } from 'react'

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/browse/movies', label: 'Movies' },
  { href: '/browse/music', label: 'Music' },
  { href: '/browse/books', label: 'Books' },
  { href: '/library', label: 'My Library' },
  { href: '/download', label: 'Downloads' },
  { href: '/requests',        label: 'Requests' },
]

export function Navbar() {
  const pathname = usePathname()
  const { user, profile, signOut } = useAuthStore()
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5">
      <div className="max-w-screen-2xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between gap-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-zawadi-green to-zawadi-gold flex items-center justify-center text-zawadi-dark font-bold text-sm">Z</div>
          <span className="font-bold text-lg gradient-text hidden sm:block">Zawadi</span>
        </Link>

        {/* Nav Links */}
        <nav className="hidden lg:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm transition-colors',
                pathname === link.href
                  ? 'bg-white/10 text-white font-medium'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {/* Search */}
          <Link href="/browse/movies" className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors">
            <Search className="w-5 h-5" />
          </Link>

          {user ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-white/5 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-zawadi-green/30 to-zawadi-gold/30 border border-zawadi-green/30 flex items-center justify-center text-sm font-medium text-zawadi-green">
                  {getInitials(profile?.full_name)}
                </div>
              </button>

              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 top-12 w-52 bg-zawadi-surface border border-white/10 rounded-xl shadow-xl z-20 overflow-hidden animate-fadeIn">
                    <div className="px-4 py-3 border-b border-white/5">
                      <p className="text-sm font-medium text-white truncate">{profile?.full_name ?? 'User'}</p>
                      <p className="text-xs text-zinc-500 truncate">{profile?.email}</p>
                    </div>
                    <div className="p-1">
                      <Link href="/profile" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-3 py-2 text-sm text-zinc-300 hover:bg-white/5 rounded-lg transition-colors">
                        <User className="w-4 h-4" /> Profile
                      </Link>
                      {profile?.role === 'admin' && (
                        <Link href="/admin" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-3 py-2 text-sm text-zawadi-gold hover:bg-white/5 rounded-lg transition-colors">
                          <LayoutDashboard className="w-4 h-4" /> Admin Dashboard
                        </Link>
                      )}
                      <button onClick={() => { signOut(); setMenuOpen(false) }} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-400 hover:bg-red-400/10 rounded-lg transition-colors">
                        <LogOut className="w-4 h-4" /> Sign out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login" className="px-4 py-1.5 text-sm text-zinc-300 hover:text-white transition-colors">
                Sign in
              </Link>
              <Link href="/register" className="px-4 py-1.5 text-sm bg-zawadi-green text-zawadi-dark font-medium rounded-lg hover:bg-zawadi-green/90 transition-colors">
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
