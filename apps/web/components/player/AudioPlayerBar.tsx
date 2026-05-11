'use client'
import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, X } from 'lucide-react'
import { usePlayerStore } from '@/lib/stores/usePlayerStore'
import { getThumbnail, formatDuration, cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

export function AudioPlayerBar() {
  const { currentContent, isPlaying, volume, setPlaying, setVolume, setCurrentContent, nextInQueue, setProgress } = usePlayerStore()
  const audioRef = useRef<HTMLAudioElement>(null)
  const [current, setCurrent] = useState(0)
  const [duration, setDuration] = useState(0)
  const [muted, setMuted] = useState(false)
  const lastSave = useRef(0)

  useEffect(() => {
    if (!audioRef.current) return
    if (isPlaying) audioRef.current.play().catch(() => {})
    else audioRef.current.pause()
  }, [isPlaying, currentContent])

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = muted ? 0 : volume
  }, [volume, muted])

  const saveProgress = async (seconds: number) => {
    if (!currentContent || seconds - lastSave.current < 15) return
    lastSave.current = seconds
    setProgress(currentContent.id, seconds)
    const supabase = createClient()
    await (supabase.from('watch_history') as any).upsert(
      { content_id: currentContent.id, progress_seconds: Math.floor(seconds), last_watched: new Date().toISOString() },
      { onConflict: 'user_id,content_id' }
    )
  }

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    const pct = (e.clientX - rect.left) / rect.width
    audioRef.current.currentTime = pct * duration
  }

  if (!currentContent || currentContent.type !== 'music') return null

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-black/20 backdrop-blur-3xl shadow-[0_24px_80px_-40px_rgba(0,0,0,0.8)]">
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        src={currentContent.stream_url ?? ''}
        onLoadedMetadata={e => setDuration((e.target as HTMLAudioElement).duration)}
        onTimeUpdate={e => {
          const t = (e.target as HTMLAudioElement).currentTime
          setCurrent(t)
          saveProgress(t)
        }}
        onEnded={nextInQueue}
      />

      {/* Progress bar */}
      <div
        className="h-1 bg-white/10 cursor-pointer group"
        onClick={seek}
      >
        <div
          className="h-full bg-gradient-to-r from-zawadi-green to-zawadi-gold transition-all relative"
          style={{ width: `${duration ? (current / duration) * 100 : 0}%` }}
        >
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>

      <div className="max-w-screen-2xl mx-auto px-4 md:px-8 h-20 flex items-center gap-4">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="relative w-12 h-12 rounded-2xl overflow-hidden shrink-0 border border-white/10">
            <Image
              src={getThumbnail(currentContent, 80)}
              alt={currentContent.title}
              fill
              className="object-cover"
            />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">{currentContent.title}</p>
            <p className="text-xs text-zinc-500 truncate">{currentContent.categories?.name ?? 'Music'}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 transition-colors hidden sm:flex">
            <SkipBack className="w-4 h-4" />
          </button>
          <button
            onClick={() => setPlaying(!isPlaying)}
            className="inline-flex h-12 w-12 items-center justify-center rounded-3xl bg-zawadi-green hover:bg-zawadi-green/90 transition-colors shadow-lg shadow-zawadi-green/20"
          >
            {isPlaying
              ? <Pause className="w-5 h-5 text-zawadi-dark" />
              : <Play className="w-5 h-5 text-zawadi-dark ml-0.5" />
            }
          </button>
          <button className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 transition-colors hidden sm:flex">
            <SkipForward className="w-4 h-4" />
          </button>
        </div>

        <div className="text-xs text-zinc-500 hidden sm:block tabular-nums">
          {formatDuration(current)} / {formatDuration(duration)}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <button onClick={() => setMuted(!muted)} className="inline-flex h-8 w-8 items-center justify-center rounded-2xl bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 transition-colors">
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <input
            type="range" min={0} max={1} step={0.01}
            value={muted ? 0 : volume}
            onChange={e => { setVolume(parseFloat(e.target.value)); setMuted(false) }}
            className="w-20 accent-zawadi-green"
          />
        </div>

        <button
          onClick={() => setCurrentContent(null)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
