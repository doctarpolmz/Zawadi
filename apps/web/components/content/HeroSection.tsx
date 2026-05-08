'use client'
import Image from 'next/image'
import Link from 'next/link'
import { Play, Plus, Star } from 'lucide-react'
import type { Content } from '@/types/database'
import { getThumbnail, truncate } from '@/lib/utils'

interface HeroSectionProps {
  content: Content | null
}

export function HeroSection({ content }: HeroSectionProps) {
  if (!content) return null

  const href = content.type === 'movie' ? `/watch/${content.id}` :
               content.type === 'music' ? `/listen/${content.id}` :
               `/read/${content.id}`

  return (
    <section className="relative h-[70vh] min-h-[500px] overflow-hidden">
      {/* Background image */}
      <Image
        src={getThumbnail(content, 1400)}
        alt={content.title}
        fill
        className="object-cover"
        priority
      />

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-r from-zawadi-dark via-zawadi-dark/70 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-zawadi-dark via-transparent to-zawadi-dark/20" />

      {/* Content */}
      <div className="absolute inset-0 flex items-center">
        <div className="px-4 md:px-8 max-w-screen-2xl mx-auto w-full">
          <div className="max-w-xl space-y-4 animate-fadeIn">
            {/* Badge */}
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-md bg-zawadi-green/20 text-zawadi-green text-xs font-medium capitalize">
                {content.type}
              </span>
              {content.categories && (
                <span className="px-2.5 py-1 rounded-md bg-white/10 text-zinc-300 text-xs">
                  {content.categories.name}
                </span>
              )}
              {content.is_free && (
                <span className="px-2.5 py-1 rounded-md bg-zawadi-gold/20 text-zawadi-gold text-xs font-medium">
                  FREE
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight">
              {content.title}
            </h1>

            {/* Description */}
            {content.description && (
              <p className="text-zinc-300 text-base leading-relaxed max-w-md">
                {truncate(content.description, 180)}
              </p>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <Link
                href={href}
                className="flex items-center gap-2 px-6 py-3 bg-zawadi-green text-zawadi-dark font-semibold rounded-xl hover:bg-zawadi-green/90 transition-all hover:scale-105 active:scale-95"
              >
                <Play className="w-5 h-5 fill-current" />
                {content.type === 'book' ? 'Read Now' : 'Play Now'}
              </Link>
              <button className="flex items-center gap-2 px-6 py-3 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-all border border-white/10">
                <Plus className="w-5 h-5" />
                My List
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
