'use client'
import Image from 'next/image'
import Link from 'next/link'
import { Play, Lock, Star } from 'lucide-react'
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
        'relative overflow-hidden rounded-xl bg-zawadi-surface border border-white/5 content-card-hover',
        isWide ? 'aspect-video' : 'aspect-[2/3]'
      )}>
        <Image
          src={getThumbnail(content, isWide ? 500 : 300)}
          alt={content.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-110"
          sizes={isWide ? '(max-width: 768px) 100vw, 320px' : '(max-width: 768px) 50vw, 200px'}
        />

        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Badges */}
        <div className="absolute top-2 left-2 flex gap-1.5">
          {content.is_free ? (
            <span className="px-2 py-0.5 rounded-md bg-zawadi-green text-zawadi-dark text-[10px] font-bold uppercase">
              Free
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-md bg-black/60 text-zinc-300 text-[10px] uppercase">
              {content.required_tier}
            </span>
          )}
        </div>

        {/* Duration */}
        {content.duration_seconds && (
          <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-black/60 text-zinc-300 text-[10px]">
            {formatDuration(content.duration_seconds)}
          </div>
        )}

        {/* Play button on hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="w-12 h-12 rounded-full bg-zawadi-green/90 flex items-center justify-center shadow-lg">
            <Play className="w-5 h-5 text-zawadi-dark fill-current ml-0.5" />
          </div>
        </div>

        {/* Bottom info on hover */}
        <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          <p className="text-white text-sm font-medium truncate">{content.title}</p>
          {!content.is_free && content.price > 0 && (
            <p className="text-zawadi-gold text-xs mt-0.5">{formatPrice(content.price)} to buy</p>
          )}
          <div className="mt-2">
            <DownloadButton content={content} compact />
          </div>
        </div>
      </div>

      {/* Title below card */}
      <div className="mt-2 px-0.5">
        <p className="text-sm text-zinc-300 font-medium truncate group-hover:text-white transition-colors">
          {content.title}
        </p>
        {content.categories && (
          <p className="text-xs text-zinc-600 mt-0.5">{content.categories.name}</p>
        )}
      </div>
    </Link>
  )
}
