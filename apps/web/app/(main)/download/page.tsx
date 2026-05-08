import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Download, Film, Music, BookOpen, Clock } from 'lucide-react'
import { getThumbnail, formatDate } from '@/lib/utils'
import { DownloadButton } from '@/components/download/DownloadButton'

export default async function DownloadHistoryPage() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const downloads = ((await supabase
    .from('user_downloads')
    .select('*, content(*, categories(*))')
    .eq('user_id', user.id)
    .order('downloaded_at', { ascending: false })
    .limit(50)) as any).data as any[]

  const typeIcon = (type: string) => {
    if (type === 'music') return <Music className="w-4 h-4 text-zawadi-green" />
    if (type === 'book') return <BookOpen className="w-4 h-4 text-zawadi-gold" />
    return <Film className="w-4 h-4 text-blue-400" />
  }

  const contentLink = (type: string, id: string) =>
    type === 'music' ? `/listen/${id}` : type === 'book' ? `/read/${id}` : `/watch/${id}`

  return (
    <div className="px-4 md:px-8 max-w-screen-xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-zawadi-green/10 border border-zawadi-green/20 flex items-center justify-center">
          <Download className="w-5 h-5 text-zawadi-green" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Download History</h1>
          <p className="text-zinc-400 text-sm mt-0.5">
            Files are available for re-download within 24 hours of each request
          </p>
        </div>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
        <Clock className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
        <p className="text-sm text-blue-300">
          Each download link is valid for <strong>24 hours</strong>. You can re-download
          up to <strong>3 times per title per day</strong>. Downloads are for personal,
          offline use only.
        </p>
      </div>

      {/* Downloads list */}
      {downloads && downloads.length > 0 ? (
        <div className="space-y-3">
          {downloads.map((dl) => {
            const content = (dl as any).content
            if (!content) return null
            return (
              <div
                key={dl.id}
                className="flex items-center gap-4 p-4 bg-zawadi-surface rounded-xl border border-white/5 hover:border-white/10 transition-colors"
              >
                {/* Thumbnail */}
                <Link href={contentLink(content.type, content.id)} className="shrink-0">
                  <div className="relative w-16 h-20 rounded-lg overflow-hidden">
                    <Image
                      src={getThumbnail(content, 150)}
                      alt={content.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                </Link>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <Link href={contentLink(content.type, content.id)}>
                    <h3 className="text-white font-semibold text-sm hover:text-zawadi-green transition-colors truncate">
                      {content.title}
                    </h3>
                  </Link>
                  <div className="flex items-center gap-2 mt-1 text-xs text-zinc-500">
                    {typeIcon(content.type)}
                    <span className="capitalize">{content.type}</span>
                    {content.categories?.name && (
                      <>
                        <span>·</span>
                        <span>{content.categories.name}</span>
                      </>
                    )}
                    {dl.file_size_mb && (
                      <>
                        <span>·</span>
                        <span>{dl.file_size_mb} MB</span>
                      </>
                    )}
                  </div>
                  <p className="text-xs text-zinc-600 mt-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Downloaded {formatDate(dl.downloaded_at)}
                  </p>
                </div>

                {/* Re-download button */}
                <div className="shrink-0">
                  <DownloadButton content={content} compact />
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-20 border border-dashed border-white/10 rounded-2xl">
          <Download className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
          <p className="text-lg text-zinc-500">No downloads yet</p>
          <p className="text-sm text-zinc-600 mt-1 mb-6">
            Download movies, music, and books to watch offline
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-zawadi-green text-zawadi-dark text-sm font-semibold rounded-xl hover:bg-zawadi-green/90 transition-colors"
          >
            Browse Content
          </Link>
        </div>
      )}
    </div>
  )
}
