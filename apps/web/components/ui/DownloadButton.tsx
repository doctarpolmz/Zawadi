'use client'
import { useState } from 'react'
import { Download, Trash2 } from 'lucide-react'
import { useDownloads } from '@/lib/hooks/useDownloads'
import { cn } from '@/lib/utils'

interface DownloadButtonProps {
  contentId: string
  variant?: 'default' | 'icon' | 'compact'
  className?: string
}

export function DownloadButton({ contentId, variant = 'default', className }: DownloadButtonProps) {
  const { isDownloaded, addDownload, removeDownload, loading, error } = useDownloads()
  const [localLoading, setLocalLoading] = useState(false)
  const isDown = isDownloaded(contentId)

  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setLocalLoading(true)
    try {
      if (isDown) {
        await removeDownload(contentId)
      } else {
        await addDownload(contentId)
      }
    } finally {
      setLocalLoading(false)
    }
  }

  const isLoading = localLoading || loading

  if (variant === 'icon') {
    return (
      <button
        onClick={handleDownload}
        disabled={isLoading}
        className={cn(
          'p-2 rounded-lg transition-all duration-200',
          isDown
            ? 'bg-zawadi-green/20 text-zawadi-green hover:bg-zawadi-green/30'
            : 'bg-white/10 text-zinc-400 hover:bg-white/20',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          className
        )}
        title={isDown ? 'Remove download' : 'Download'}
      >
        {isDown ? <Trash2 className="w-4 h-4" /> : <Download className="w-4 h-4" />}
      </button>
    )
  }

  if (variant === 'compact') {
    return (
      <button
        onClick={handleDownload}
        disabled={isLoading}
        className={cn(
          'px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200',
          isDown
            ? 'bg-zawadi-green/20 text-zawadi-green hover:bg-zawadi-green/30'
            : 'bg-white/10 text-zinc-300 hover:bg-white/20',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          className
        )}
      >
        <div className="flex items-center gap-1.5">
          {isDown ? <Trash2 className="w-3.5 h-3.5" /> : <Download className="w-3.5 h-3.5" />}
          {isDown ? 'Downloaded' : 'Download'}
        </div>
      </button>
    )
  }

  return (
    <button
      onClick={handleDownload}
      disabled={isLoading}
      className={cn(
        'px-4 py-2.5 rounded-lg font-medium transition-all duration-200 flex items-center gap-2',
        isDown
          ? 'bg-zawadi-green/20 text-zawadi-green hover:bg-zawadi-green/30'
          : 'bg-white/10 text-zinc-300 hover:bg-white/20',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        className
      )}
    >
      {isDown ? <Trash2 className="w-4 h-4" /> : <Download className="w-4 h-4" />}
      <span>{isDown ? 'Downloaded' : 'Download'}</span>
    </button>
  )
}
