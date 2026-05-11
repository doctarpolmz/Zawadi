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
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl md:text-3xl font-semibold text-white tracking-tight">{title}</h2>
        {viewAllHref && (
          <Link
            href={viewAllHref}
            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-zinc-300 transition-all hover:border-white/20 hover:bg-white/10 hover:text-white"
          >
            View all <ChevronRight className="w-4 h-4" />
          </Link>
        )}
      </div>

      <div className={
        variant === 'wide'
          ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
          : 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6'
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
