'use client'
import { useState } from 'react'
import { Download, CheckCircle, AlertCircle, Loader2, Lock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/lib/stores/useAuthStore'
import { cn } from '@/lib/utils'
import type { Content } from '@/types/database'

interface DownloadButtonProps {
  content: Content
  /** When true, renders as a small icon button. Default: full button */
  compact?: boolean
  className?: string
}

type DownloadState = 'idle' | 'checking' | 'downloading' | 'done' | 'error' | 'no_access'

export function DownloadButton({ content, compact = false, className }: DownloadButtonProps) {
  const { user, subscription } = useAuthStore()
  const [state, setState] = useState<DownloadState>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [progress, setProgress] = useState(0)

  // Quick client-side pre-check before hitting the edge function
  const canDownload = (() => {
    if (!user) return false
    if (content.is_free) return true
    if (!subscription?.tier) return false
    const tierRank: Record<string, number> = { free: 0, basic: 1, premium: 2 }
    return (tierRank[subscription.tier] ?? 0) >= (tierRank[content.required_tier] ?? 0)
  })()

  const handleDownload = async () => {
    if (!user) {
      setState('no_access')
      return
    }

    setState('checking')
    setErrorMsg('')
    setProgress(0)

    try {
      // 1. Call edge function to get a secure signed URL + token
      const supabase = createClient()
      const { data: session } = await supabase.auth.getSession()

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/generate-download-link`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.session?.access_token}`,
          },
          body: JSON.stringify({ contentId: content.id }),
        }
      )

      const json = await res.json()

      if (!res.ok) {
        const reasons: Record<string, string> = {
          access_denied: 'You need a subscription or purchase to download this.',
          not_downloadable: 'This title is not available for download.',
          rate_limit_exceeded: 'Download limit reached. Try again in 24 hours.',
          no_file_url: 'Download file not configured. Contact support.',
          unauthenticated: 'Please sign in to download.',
        }
        setState('error')
        setErrorMsg(reasons[json.error] ?? 'Download failed. Please try again.')
        return
      }

      // 2. Trigger browser download with progress tracking
      setState('downloading')
      const { url, filename, fileSizeMb } = json

      // Use fetch + ReadableStream for progress tracking
      const fileRes = await fetch(url)
      if (!fileRes.ok) throw new Error('File fetch failed')

      const contentLength = fileRes.headers.get('content-length')
      const total = contentLength ? parseInt(contentLength, 10) : (fileSizeMb ?? 0) * 1024 * 1024

      const reader = fileRes.body!.getReader()
      const chunks: Uint8Array[] = []
      let received = 0

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        chunks.push(value)
        received += value.length
        if (total > 0) setProgress(Math.round((received / total) * 100))
      }

      // 3. Create object URL and trigger download
      const blob = new Blob(chunks as any)
      const blobUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = filename ?? `zawadi-${content.id}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(blobUrl)

      setState('done')
      setTimeout(() => setState('idle'), 4000)

    } catch (err: any) {
      console.error('Download error:', err)
      setState('error')
      setErrorMsg('Download failed. Check your connection and try again.')
      setTimeout(() => setState('idle'), 5000)
    }
  }

  // ── Compact icon-only variant ─────────────────────────────────────────────
  if (compact) {
    return (
      <button
        onClick={handleDownload}
        disabled={state === 'checking' || state === 'downloading'}
        title={
          !canDownload ? 'Subscribe to download' :
          state === 'done' ? 'Downloaded!' :
          'Download'
        }
        className={cn(
          'p-2 rounded-lg transition-all',
          canDownload
            ? 'text-zinc-400 hover:text-zawadi-green hover:bg-zawadi-green/10'
            : 'text-zinc-700 cursor-not-allowed',
          className
        )}
      >
        {state === 'checking' || state === 'downloading' ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : state === 'done' ? (
          <CheckCircle className="w-4 h-4 text-zawadi-green" />
        ) : !canDownload ? (
          <Lock className="w-4 h-4" />
        ) : (
          <Download className="w-4 h-4" />
        )}
      </button>
    )
  }

  // ── Full button variant ───────────────────────────────────────────────────
  return (
    <div className={cn('space-y-2', className)}>
      <button
        onClick={handleDownload}
        disabled={!canDownload || state === 'checking' || state === 'downloading'}
        className={cn(
          'flex items-center justify-center gap-2 w-full px-5 py-2.5 rounded-xl text-sm font-semibold transition-all',
          canDownload && state === 'idle'
            ? 'bg-white/10 text-white border border-white/10 hover:bg-white/20 hover:border-white/20'
            : canDownload && state === 'done'
              ? 'bg-zawadi-green/20 text-zawadi-green border border-zawadi-green/30'
              : canDownload && (state === 'checking' || state === 'downloading')
                ? 'bg-white/5 text-zinc-400 border border-white/10 cursor-wait'
                : 'bg-white/5 text-zinc-600 border border-white/5 cursor-not-allowed'
        )}
      >
        {state === 'checking' ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Checking access…</>
        ) : state === 'downloading' ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Downloading {progress > 0 ? `${progress}%` : '…'}</>
        ) : state === 'done' ? (
          <><CheckCircle className="w-4 h-4" /> Downloaded!</>
        ) : !canDownload ? (
          <><Lock className="w-4 h-4" /> Subscribe to Download</>
        ) : (
          <><Download className="w-4 h-4" />
            Download {content.type === 'book' ? 'ePub' : content.type === 'music' ? 'MP3' : 'MP4'}
          </>
        )}
      </button>

      {/* Progress bar */}
      {state === 'downloading' && progress > 0 && (
        <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-zawadi-green transition-all duration-300 rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* File size hint */}
      {state === 'idle' && canDownload && (content as any).file_size_mb && (
        <p className="text-center text-xs text-zinc-600">
          {(content as any).file_size_mb} MB · Valid 24h after download starts
        </p>
      )}

      {/* Error message */}
      {state === 'error' && (
        <p className="flex items-center gap-1.5 text-xs text-red-400 bg-red-400/10 px-3 py-2 rounded-lg">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          {errorMsg}
        </p>
      )}

      {/* No access hint */}
      {!canDownload && user && (
        <p className="text-center text-xs text-zinc-600">
          Requires{' '}
          <span className="text-zawadi-gold capitalize">{content.required_tier}</span>{' '}
          subscription or purchase
        </p>
      )}
    </div>
  )
}
