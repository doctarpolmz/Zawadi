import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Download, Trash2 } from 'lucide-react'
import { getThumbnail, formatDate, formatDuration } from '@/lib/utils'

export default async function DownloadsPage() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: downloads } = await supabase
    .from('downloads')
    .select('*, content(*, categories(*))')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const getContentLink = (type: string, id: string) =>
    type === 'movie' ? `/watch/${id}` : type === 'music' ? `/listen/${id}` : `/read/${id}`

  const isExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false
    return new Date(expiresAt) < new Date()
  }

  return (
    <div className="px-4 md:px-8 max-w-screen-2xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/library"
          className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <Download className="w-8 h-8 text-zawadi-green" />
            My Downloads
          </h1>
          <p className="text-zinc-400 mt-1">Manage your downloaded content</p>
        </div>
      </div>

      {/* Downloads Grid */}
      {!downloads || downloads.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4">
            <Download className="w-8 h-8 text-zinc-600" />
          </div>
          <h2 className="text-lg font-medium text-zinc-400 mb-1">No downloads yet</h2>
          <p className="text-zinc-600 mb-6">Start downloading content to watch, listen, or read offline</p>
          <Link
            href="/browse/movies"
            className="inline-block px-6 py-2 rounded-lg bg-zawadi-green text-zawadi-dark font-medium hover:bg-zawadi-green/90 transition-colors"
          >
            Browse Content
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {downloads.map((download: any) => {
            const expired = isExpired(download.expires_at)
            const content = download.content

            return (
              <Link
                key={download.id}
                href={getContentLink(content.type, download.content_id)}
                className="group flex items-start gap-4 p-4 rounded-xl bg-zawadi-surface border border-white/5 hover:border-white/20 hover:bg-zawadi-surface/80 transition-all"
              >
                {/* Thumbnail */}
                <div className="relative w-24 h-36 rounded-lg overflow-hidden shrink-0">
                  <Image
                    src={getThumbnail(content, 150)}
                    alt={content.title}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-2">
                    <span className="text-xs text-white font-medium">View</span>
                  </div>
                </div>

                {/* Content Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h3 className="text-base font-medium text-white truncate group-hover:text-zawadi-green transition-colors">
                        {content.title}
                      </h3>
                      <p className="text-sm text-zinc-500 mt-1">{content.categories?.name ?? content.type}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        {content.duration_seconds && (
                          <span className="text-xs bg-white/10 px-2 py-1 rounded text-zinc-300">
                            {formatDuration(content.duration_seconds)}
                          </span>
                        )}
                        <span className="text-xs bg-white/10 px-2 py-1 rounded text-zinc-300">
                          Downloaded {formatDate(download.created_at)}
                        </span>
                      </div>
                      {download.expires_at && (
                        <p className={`text-xs mt-2 ${expired ? 'text-red-500' : 'text-yellow-600'}`}>
                          {expired ? 'Download expired' : `Expires ${formatDate(download.expires_at)}`}
                        </p>
                      )}
                    </div>

                    {/* Delete Button */}
                    <DownloadDeleteButton contentId={download.content_id} />
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

function DownloadDeleteButton({ contentId }: { contentId: string }) {
  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (!confirm('Remove this download?')) return

    try {
      const response = await fetch('/api/downloads', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentId }),
      })
      if (response.ok) {
        window.location.reload()
      }
    } catch (error) {
      console.error('Failed to delete download:', error)
    }
  }

  return (
    <button
      onClick={handleDelete}
      className="p-2 rounded-lg text-zinc-500 hover:text-red-500 hover:bg-red-500/10 transition-colors"
      title="Remove download"
    >
      <Trash2 className="w-5 h-5" />
    </button>
  )
}
