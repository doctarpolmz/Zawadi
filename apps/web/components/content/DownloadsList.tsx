'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Trash2, Download } from 'lucide-react'
import type { Download as DownloadType } from '@/types/database'
import { useDownloads } from '@/lib/hooks/useDownloads'
import { formatDate, formatDuration } from '@/lib/utils'

export function DownloadsList() {
  const { downloads, loading, fetchDownloads, removeDownload } = useDownloads()
  const [isExpanded, setIsExpanded] = useState(false)

  useEffect(() => {
    if (isExpanded) {
      fetchDownloads()
    }
  }, [isExpanded, fetchDownloads])

  const handleRemove = async (contentId: string) => {
    if (confirm('Remove this download?')) {
      await removeDownload(contentId)
    }
  }

  const getContentLink = (download: DownloadType) => {
    if (!download.content) return '#'
    switch (download.content.type) {
      case 'movie':
        return `/watch/${download.content_id}`
      case 'music':
        return `/listen/${download.content_id}`
      case 'book':
        return `/read/${download.content_id}`
      default:
        return '#'
    }
  }

  const isExpired = (download: DownloadType) => {
    if (!download.expires_at) return false
    return new Date(download.expires_at) < new Date()
  }

  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-colors"
      >
        <Download className="w-4 h-4" />
        Downloads ({downloads.length})
      </button>
    )
  }

  return (
    <div className="p-6 rounded-xl bg-zawadi-surface border border-white/5">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
          <Download className="w-5 h-5 text-zawadi-green" />
          My Downloads
        </h2>
        <button
          onClick={() => setIsExpanded(false)}
          className="text-zinc-500 hover:text-white transition-colors"
        >
          ✕
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8 text-zinc-500">Loading downloads...</div>
      ) : downloads.length === 0 ? (
        <div className="text-center py-12">
          <Download className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
          <p className="text-zinc-500">No downloads yet</p>
          <p className="text-xs text-zinc-600 mt-1">Download content to watch, listen, or read offline</p>
        </div>
      ) : (
        <div className="space-y-3">
          {downloads.map((download) => {
            const expired = isExpired(download)
            return (
              <Link
                key={download.id}
                href={getContentLink(download)}
                className="group flex items-center justify-between p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-white/5"
              >
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-white truncate group-hover:text-zawadi-green transition-colors">
                    {download.content?.title ?? 'Unknown'}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span className="text-xs text-zinc-500">
                      {download.content?.type === 'movie' && download.content?.duration_seconds
                        ? formatDuration(download.content.duration_seconds)
                        : null}
                    </span>
                    {download.expires_at && (
                      <span className={`text-xs ${expired ? 'text-red-500' : 'text-zinc-500'}`}>
                        {expired ? 'Expired' : `Expires ${formatDate(download.expires_at)}`}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    handleRemove(download.content_id)
                  }}
                  className="ml-4 p-2 rounded-lg text-zinc-500 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                  title="Remove download"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
