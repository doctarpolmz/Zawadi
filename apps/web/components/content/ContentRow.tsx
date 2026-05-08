import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import type { Content } from '@/types/database'
import { ContentCard } from './ContentCard'
import { SkeletonCard } from '@/components/layout/Skeleton'

interface ContentRowProps {
  title: string
  items: Content[]
  viewAllHref?: string
  loading?: boolean
  variant?: 'default' | 'wide'
}

export function ContentRow({ title, items, viewAllHref, loading, variant = 'default' }: ContentRowProps) {
  return (
    <section>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg md:text-xl font-semibold text-white">{title}</h2>
        {viewAllHref && (
          <Link
            href={viewAllHref}
            className="flex items-center gap-1 text-sm text-zinc-400 hover:text-zawadi-green transition-colors"
          >
            View all <ChevronRight className="w-4 h-4" />
          </Link>
        )}
      </div>

      {/* Grid */}
      <div className={
        variant === 'wide'
          ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
          : 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4'
      }>
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
          : items.map((item) => (
              <ContentCard key={item.id} content={item} variant={variant} />
            ))}
      </div>
    </section>
  )
}
