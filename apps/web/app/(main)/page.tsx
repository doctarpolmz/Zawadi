import { createServerSupabaseClient } from '@/lib/supabase/server'
import { HeroSection } from '@/components/content/HeroSection'
import { ContentRow } from '@/components/content/ContentRow'

export default async function HomePage() {
  const supabase = createServerSupabaseClient()

  const [
    { data: featured },
    { data: movies },
    { data: music },
    { data: books },
    { data: free },
  ] = await Promise.all([
    supabase
      .from('content')
      .select('*, categories(*)')
      .eq('is_free', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .single(),
    supabase
      .from('content')
      .select('*, categories(*)')
      .eq('type', 'movie')
      .order('created_at', { ascending: false })
      .limit(12),
    supabase
      .from('content')
      .select('*, categories(*)')
      .eq('type', 'music')
      .order('created_at', { ascending: false })
      .limit(12),
    supabase
      .from('content')
      .select('*, categories(*)')
      .eq('type', 'book')
      .order('created_at', { ascending: false })
      .limit(12),
    supabase
      .from('content')
      .select('*, categories(*)')
      .eq('is_free', true)
      .order('created_at', { ascending: false })
      .limit(12),
  ])

  return (
    <div className="space-y-16">
      <HeroSection content={featured} />

      <div className="px-4 md:px-8 space-y-16 max-w-screen-2xl mx-auto">
        {movies && movies.length > 0 && (
          <section className="section-surface p-8 md:p-12">
            <ContentRow title="🎬 Latest Movies" items={movies} viewAllHref="/browse/movies" />
          </section>
        )}
        {music && music.length > 0 && (
          <section className="section-surface p-8 md:p-12">
            <ContentRow title="🎵 Fresh Music" items={music} viewAllHref="/browse/music" />
          </section>
        )}
        {books && books.length > 0 && (
          <section className="section-surface p-8 md:p-12">
            <ContentRow title="📚 New Books" items={books} viewAllHref="/browse/books" />
          </section>
        )}
        {free && free.length > 0 && (
          <section className="section-surface p-8 md:p-12">
            <ContentRow title="✨ Free to Watch" items={free} viewAllHref="/browse/movies" />
          </section>
        )}
      </div>
    </div>
  )
}
