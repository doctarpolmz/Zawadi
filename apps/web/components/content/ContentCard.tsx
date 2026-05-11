'use client'
import Image from 'next/image'
import Link from 'next/link'
import { Play } from 'lucide-react'
import type { Content } from '@/types/database'
import { getThumbnail, formatDuration, formatPrice, cn } from '@/lib/utils'
import { DownloadButton } from '@/components/download/DownloadButton'

interface ContentCardProps {
  content: Content
  variant?: 'default' | 'wide'
}

export function ContentCard({ content, variant = 'default' }: ContentCardProps) {
  const href = content.type === 'movie' ? `/watch/${content.id}` :
               content.type === 'music' ? `/listen/${content.id}` :
               `/read/${content.id}`

  const isWide = variant === 'wide'

  return (
    <Link href={href} className="group block">
      <div className={cn(
        'relative overflow-hidden rounded-[1.75rem] bg-zawadi-surface border border-white/10 shadow-[0_24px_70px_-24px_rgba(0,0,0,0.8)] content-card-hover',
        isWide ? 'aspect-video' : 'aspect-[2/3]'
      )}>
        <Image
          src={getThumbnail(content, isWide ? 500 : 300)}
          alt={content.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-110"
          sizes={isWide ? '(max-width: 768px) 100vw, 320px' : '(max-width: 768px) 50vw, 200px'}
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        <div className="absolute top-3 left-3 flex flex-wrap gap-2">
          <span className="px-2 py-1 rounded-2xl bg-black/70 text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-200">
            {content.type}
          </span>
          {content.is_free ? (
            <span className="px-2 py-1 rounded-2xl bg-zawadi-green text-zawadi-dark text-[10px] font-semibold uppercase tracking-[0.2em]">
              Free
            </span>
          ) : (
            <span className="px-2 py-1 rounded-2xl bg-white/10 text-[10px] uppercase tracking-[0.2em] text-zinc-300">
              {content.required_tier}
            </span>
          )}
        </div>

        {content.duration_seconds && (
          <div className="absolute top-3 right-3 px-2 py-1 rounded-2xl bg-black/70 text-[10px] uppercase tracking-[0.2em] text-zinc-300">
            {formatDuration(content.duration_seconds)}
          </div>
        )}

        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-zawadi-green/95 shadow-2xl shadow-zawadi-green/20">
            <Play className="w-6 h-6 text-zawadi-dark" />
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/90 via-black/10 to-transparent opacity-100 transition-transform duration-300 translate-y-full group-hover:translate-y-0">
          <p className="text-sm font-semibold text-white truncate">{content.title}</p>
          {content.categories && (
            <p className="mt-1 text-[11px] uppercase tracking-[0.2em] text-zinc-400">{content.categories.name}</p>
          )}
          {!content.is_free && content.price > 0 && (
            <p className="mt-2 text-zawadi-gold text-[11px] font-semibold">{formatPrice(content.price)} to buy</p>
          )}
          <div className="mt-3">
            <DownloadButton content={content} compact />
          </div>
        </div>
      </div>
      <div className="mt-3 px-0.5">
        <p className="text-sm font-semibold text-white truncate group-hover:text-zawadi-green transition-colors">
          {content.title}
        </p>
        {content.categories && (
          <p className="text-xs text-zinc-500 mt-1 truncate">{content.categories.name}</p>
        )}
      </div>
    </Link>
  )
}
