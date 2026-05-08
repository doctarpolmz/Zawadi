'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { usePlayerStore } from '@/lib/stores/usePlayerStore'

interface PageProps {
  params: { id: string }
}

// Client component that loads the track and hands it to AudioPlayerBar
export default function ListenPage({ params }: PageProps) {
  const { setCurrentContent, setPlaying } = usePlayerStore()
  const router = useRouter()

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('content')
        .select('*, categories(*)')
        .eq('id', params.id)
        .eq('type', 'music')
        .single()
      if (!data) { router.push('/browse/music'); return }
      setCurrentContent(data as any)
      setPlaying(true)
      router.push('/browse/music')
    }
    load()
  }, [params.id])

  return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 border-2 border-zawadi-green border-t-transparent rounded-full animate-spin" />
        <p className="text-zinc-400 text-sm">Loading track…</p>
      </div>
    </div>
  )
}
