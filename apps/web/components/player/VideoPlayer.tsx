'use client'
import { useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

interface VideoPlayerProps {
  contentId: string
  muxPlaybackId: string
  title: string
  startAt?: number
}

export function VideoPlayer({ contentId, muxPlaybackId, title, startAt }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const lastSaveRef = useRef(0)

  const saveProgress = useCallback(async (seconds: number) => {
    if (seconds - lastSaveRef.current < 15) return
    lastSaveRef.current = seconds
    const supabase = createClient()
    await (supabase.from('watch_history') as any).upsert(
      { content_id: contentId, progress_seconds: Math.floor(seconds), last_watched: new Date().toISOString() },
      { onConflict: 'user_id,content_id' }
    )
  }, [contentId])


  // If no Mux playback ID, show sample video
  const videoSrc = muxPlaybackId && muxPlaybackId.startsWith('http')
    ? muxPlaybackId
    : muxPlaybackId
      ? `https://stream.mux.com/${muxPlaybackId}.m3u8`
      : 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'

  return (
    <div className="relative w-full h-full bg-black flex items-center justify-center">
      <video
        ref={videoRef}
        src={videoSrc}
        controls
        className="w-full h-full"
        poster={`https://picsum.photos/seed/${contentId}/1280/720`}
        onTimeUpdate={(e) => {
          const el = e.currentTarget
          saveProgress(el.currentTime)
        }}
        onLoadedMetadata={(e) => {
          if (startAt) (e.currentTarget as HTMLVideoElement).currentTime = startAt
        }}
      >
        <p className="text-white text-center p-8">
          Your browser does not support the video tag.
        </p>
      </video>
    </div>
  )
}
