import { cn } from '@/lib/utils'

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton', className)} />
}

export function SkeletonCard() {
  return (
    <div className="space-y-3">
      <Skeleton className="aspect-[2/3] w-full rounded-[1.75rem]" />
      <Skeleton className="h-4 w-4/5 rounded-2xl" />
      <Skeleton className="h-3 w-2/3 rounded-2xl" />
    </div>
  )
}

export function SkeletonRow() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-64 rounded-2xl" />
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
        {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    </div>
  )
}

export function SkeletonHero() {
  return <Skeleton className="h-[75vh] min-h-[500px] w-full rounded-none" />
}
