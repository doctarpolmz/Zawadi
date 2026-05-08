'use client'
import Image from 'next/image'
import Link from 'next/link'
import { Lock, Star, Crown } from 'lucide-react'
import type { Content } from '@/types/database'
import type { User } from '@supabase/supabase-js'
import { getThumbnail, formatPrice } from '@/lib/utils'

interface AccessGateProps {
  content: Content
  user: User | null
}

export function AccessGate({ content, user }: AccessGateProps) {
  return (
    <div className="relative w-full h-full flex items-center justify-center bg-black overflow-hidden">
      {/* Blurred background */}
      <Image
        src={getThumbnail(content, 1280)}
        alt={content.title}
        fill
        className="object-cover opacity-20 blur-sm scale-110"
      />

      {/* Overlay */}
      <div className="relative z-10 text-center px-6 max-w-md space-y-6">
        <div className="w-16 h-16 rounded-full bg-zawadi-surface/80 border border-white/10 flex items-center justify-center mx-auto">
          <Lock className="w-7 h-7 text-zinc-400" />
        </div>

        <div>
          <h2 className="text-xl font-bold text-white mb-2">Premium Content</h2>
          <p className="text-zinc-400 text-sm">
            {user
              ? 'Upgrade your subscription or purchase this title to watch.'
              : 'Sign in to access this content.'}
          </p>
        </div>

        <div className="space-y-3">
          {!user ? (
            <>
              <Link href="/register" className="flex items-center justify-center gap-2 w-full py-3 bg-zawadi-green text-zawadi-dark font-semibold rounded-xl hover:bg-zawadi-green/90 transition-colors">
                Get Started Free
              </Link>
              <Link href="/login" className="flex items-center justify-center gap-2 w-full py-3 bg-white/10 text-white font-medium rounded-xl hover:bg-white/20 transition-colors border border-white/10">
                Sign In
              </Link>
            </>
          ) : (
            <>
              {content.price > 0 && (
                <button className="flex items-center justify-center gap-2 w-full py-3 bg-zawadi-gold text-zawadi-dark font-semibold rounded-xl hover:bg-zawadi-gold/90 transition-colors">
                  Buy for {formatPrice(content.price)}
                </button>
              )}
              {content.rent_price && (
                <button className="flex items-center justify-center gap-2 w-full py-3 bg-white/10 text-white font-medium rounded-xl hover:bg-white/20 transition-colors border border-white/10">
                  Rent for {formatPrice(content.rent_price)}
                </button>
              )}
              <Link href="/profile" className="flex items-center justify-center gap-2 w-full py-3 bg-purple-600 text-white font-medium rounded-xl hover:bg-purple-700 transition-colors">
                <Crown className="w-4 h-4" /> Upgrade Subscription
              </Link>
            </>
          )}
        </div>

        <p className="text-xs text-zinc-600">
          Required: <span className="capitalize text-zinc-400">{content.required_tier}</span> subscription
        </p>
      </div>
    </div>
  )
}
