'use client'
import Image from 'next/image'
import Link from 'next/link'
import { Play, Plus } from 'lucide-react'
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
    <section className="relative isolate min-h-[75vh] overflow-hidden">
      <Image
        src={getThumbnail(content, 1400)}
        alt={content.title}
        fill
        className="object-cover brightness-[0.7] scale-[1.05] transition-transform duration-[20000ms] ease-linear"
        priority
      />

      <div className="absolute inset-0 hero-glow opacity-90 pointer-events-none" />
      <div className="absolute inset-0 bg-black/65" />
      <div className="absolute inset-x-0 bottom-0 h-72 bg-gradient-to-t from-zawadi-dark to-transparent" />
      <div className="absolute right-[-10%] top-0 h-full w-1/2 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.08),transparent_30%)] pointer-events-none" />

      <div className="relative px-4 md:px-8 max-w-screen-2xl mx-auto h-full flex items-center">
        <div className="max-w-2xl space-y-6 animate-fadeIn">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[11px] uppercase tracking-[0.35em] text-zinc-300">
            Featured {content.type}
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight text-white leading-tight">
            {content.title}
          </h1>

          {content.description && (
            <p className="max-w-xl text-sm md:text-base text-zinc-300 leading-relaxed">
              {truncate(content.description, 190)}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={href}
              className="inline-flex items-center gap-2 rounded-3xl bg-zawadi-green px-6 py-3 text-sm font-semibold text-zawadi-dark transition-all duration-200 hover:scale-[1.02] hover:bg-zawadi-green/90"
            >
              <Play className="w-5 h-5 fill-current" />
              {content.type === 'book' ? 'Read Now' : 'Play Now'}
            </Link>
            <button className="inline-flex items-center gap-2 rounded-3xl border border-white/10 bg-white/10 px-6 py-3 text-sm font-semibold text-white transition-all duration-200 hover:bg-white/15">
              <Plus className="w-5 h-5" />
              Add to List
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-xl">
            <div className="rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-xs uppercase tracking-[0.28em] text-zinc-400">
              Cinematic quality
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-xs uppercase tracking-[0.28em] text-zinc-400">
              Smooth playback
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-xs uppercase tracking-[0.28em] text-zinc-400">
              Curated for you
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
