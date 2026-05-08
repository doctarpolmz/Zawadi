import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Play, BookOpen, Music, Clock, Download } from 'lucide-react'
import { getThumbnail, formatDate, formatDuration } from '@/lib/utils'

export default async function LibraryPage() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: purchases }, { data: history }] = await Promise.all([
    supabase
      .from('purchases')
      .select('*, content(*, categories(*))')
      .eq('user_id', user.id)
      .order('purchased_at', { ascending: false }),
    supabase
      .from('watch_history')
      .select('*, content(*, categories(*))')
      .eq('user_id', user.id)
      .eq('completed', false)
      .order('last_watched', { ascending: false })
      .limit(12),
  ]) as any
  const purchasesList = purchases as any[]
  const historyList = history as any[]

  const getContentLink = (type: string, id: string) =>
    type === 'movie' ? `/watch/${id}` : type === 'music' ? `/listen/${id}` : `/read/${id}`

  const getIcon = (type: string) =>
    type === 'music' ? <Music className="w-4 h-4" /> :
    type === 'book' ? <BookOpen className="w-4 h-4" /> :
    <Play className="w-4 h-4" />

  return (
    <div className="px-4 md:px-8 max-w-screen-2xl mx-auto space-y-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">My Library</h1>
          <p className="text-zinc-400 mt-1">Your purchased content and continue watching</p>
        </div>
        <Link
          href="/downloads"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium transition-colors"
        >
          <Download className="w-5 h-5" />
          Downloads
        </Link>
      </div>

      {/* Continue Watching */}
      {historyList && historyList.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-zawadi-green" /> Continue Watching
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {historyList.map(item => {
              const content = (item as any).content
              if (!content) return null
              const pct = content.duration_seconds
                ? Math.min(100, (item.progress_seconds / content.duration_seconds) * 100)
                : item.progress_seconds
              return (
                <Link
                  key={item.id}
                  href={getContentLink(content.type, content.id)}
                  className="group block bg-zawadi-surface border border-white/5 rounded-xl overflow-hidden hover:border-zawadi-green/30 transition-all"
                >
                  <div className="relative aspect-video">
                    <Image src={getThumbnail(content, 400)} alt={content.title} fill className="object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-zawadi-green/90 flex items-center justify-center">
                        <Play className="w-5 h-5 text-zawadi-dark fill-current ml-0.5" />
                      </div>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                      <div className="h-full bg-zawadi-green" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-medium text-white truncate">{content.title}</p>
                    <p className="text-xs text-zinc-500 mt-0.5 flex items-center gap-1">
                      {getIcon(content.type)}
                      {content.type} · {formatDate(item.last_watched)}
                    </p>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {/* Purchases */}
      <section>
        <h2 className="text-xl font-semibold text-white mb-4">Purchased Content</h2>
        {purchasesList && purchasesList.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {purchasesList.map(purchase => {
              const content = (purchase as any).content
              if (!content) return null
              return (
                <Link
                  key={purchase.id}
                  href={getContentLink(content.type, content.id)}
                  className="group block"
                >
                  <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-zawadi-surface border border-white/5 content-card-hover">
                    <Image src={getThumbnail(content, 300)} alt={content.title} fill className="object-cover" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="w-10 h-10 rounded-full bg-zawadi-green/90 flex items-center justify-center">
                        {getIcon(content.type)}
                      </div>
                    </div>
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-zawadi-green/90 text-zawadi-dark text-[10px] font-bold uppercase">
                      {purchase.type === 'rent' ? 'Rented' : 'Owned'}
                    </div>
                  </div>
                  <div className="mt-2">
                    <p className="text-sm text-zinc-300 font-medium truncate">{content.title}</p>
                    <p className="text-xs text-zinc-600 capitalize">{content.type}</p>
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-16 text-zinc-600 border border-dashed border-white/10 rounded-2xl">
            <p className="text-lg mb-2">No purchases yet</p>
            <p className="text-sm mb-6">Browse our catalog and buy or rent content</p>
            <Link href="/" className="px-6 py-2.5 bg-zawadi-green text-zawadi-dark text-sm font-semibold rounded-xl hover:bg-zawadi-green/90 transition-colors">
              Browse Content
            </Link>
          </div>
        )}
      </section>
    </div>
  )
}
