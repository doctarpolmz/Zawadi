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
    <div className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-white/5">
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
          className="h-full bg-zawadi-green transition-all relative"
          style={{ width: `${duration ? (current / duration) * 100 : 0}%` }}
        >
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>

      {/* Controls */}
      <div className="max-w-screen-2xl mx-auto px-4 md:px-8 h-16 flex items-center gap-4">
        {/* Content info */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0">
            <Image
              src={getThumbnail(currentContent, 80)}
              alt={currentContent.title}
              fill
              className="object-cover"
            />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">{currentContent.title}</p>
            <p className="text-xs text-zinc-500 truncate">{currentContent.categories?.name ?? 'Music'}</p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <button className="p-2 text-zinc-400 hover:text-white transition-colors hidden sm:flex">
            <SkipBack className="w-4 h-4" />
          </button>
          <button
            onClick={() => setPlaying(!isPlaying)}
            className="w-10 h-10 rounded-full bg-zawadi-green flex items-center justify-center hover:bg-zawadi-green/90 transition-colors"
          >
            {isPlaying
              ? <Pause className="w-4 h-4 text-zawadi-dark fill-current" />
              : <Play className="w-4 h-4 text-zawadi-dark fill-current ml-0.5" />
            }
          </button>
          <button className="p-2 text-zinc-400 hover:text-white transition-colors hidden sm:flex">
            <SkipForward className="w-4 h-4" />
          </button>
        </div>

        {/* Time */}
        <div className="text-xs text-zinc-500 hidden sm:block tabular-nums">
          {formatDuration(current)} / {formatDuration(duration)}
        </div>

        {/* Volume */}
        <div className="hidden md:flex items-center gap-2">
          <button onClick={() => setMuted(!muted)} className="p-1 text-zinc-400 hover:text-white transition-colors">
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <input
            type="range" min={0} max={1} step={0.01}
            value={muted ? 0 : volume}
            onChange={e => { setVolume(parseFloat(e.target.value)); setMuted(false) }}
            className="w-20 accent-zawadi-green"
          />
        </div>

        {/* Close */}
        <button
          onClick={() => setCurrentContent(null)}
          className="p-2 text-zinc-600 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
