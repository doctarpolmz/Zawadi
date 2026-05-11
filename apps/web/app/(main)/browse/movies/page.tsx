import { createServerSupabaseClient } from '@/lib/supabase/server'
import { ContentCard } from '@/components/content/ContentCard'
import { Filter } from 'lucide-react'

interface PageProps {
  searchParams: { q?: string; category?: string; tier?: string }
}

export default async function BrowseMoviesPage({ searchParams }: PageProps) {
  const supabase = createServerSupabaseClient()

  let query = supabase
    .from('content')
    .select('*, categories(*)')
    .eq('type', 'movie')
    .order('created_at', { ascending: false })

  if (searchParams.q) {
    query = query.ilike('title', `%${searchParams.q}%`)
  }
  if (searchParams.category) {
    query = query.eq('category_id', searchParams.category)
  }
  if (searchParams.tier === 'free') {
    query = query.eq('is_free', true)
  }

  const movies = (await query.limit(48) as any).data as any[]
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .eq('type', 'movie')

  return (
    <div className="px-4 md:px-8 max-w-screen-2xl mx-auto space-y-8">
      <div className="section-surface p-8 md:p-12">
        <div>
          <h1 className="text-4xl font-semibold text-white tracking-tight">🎬 Movies</h1>
          <p className="text-zinc-400 mt-2 text-lg">Stream the best of African and world cinema</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 mt-8">
          <div className="flex items-center gap-2 text-sm text-zinc-400">
            <Filter className="w-4 h-4" />
            <span>Filter:</span>
          </div>
          {categories?.map((cat: any) => (
            <a
              key={cat.id}
              href={`?category=${cat.id}`}
              className={`px-4 py-2 rounded-2xl text-sm transition-all duration-200 ${
                searchParams.category === cat.id
                  ? 'bg-zawadi-green text-zawadi-dark font-semibold shadow-lg shadow-zawadi-green/20'
                  : 'bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              {cat.name}
            </a>
          ))}
          <a
            href="?tier=free"
            className={`px-4 py-2 rounded-2xl text-sm transition-all duration-200 ${
              searchParams.tier === 'free'
                ? 'bg-zawadi-gold text-zawadi-dark font-semibold shadow-lg shadow-zawadi-gold/20'
                : 'bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-white'
            }`}
          >
            Free Only
          </a>
          {(searchParams.category || searchParams.tier || searchParams.q) && (
            <a href="/browse/movies" className="px-4 py-2 rounded-2xl text-sm text-red-400 hover:bg-red-400/10 transition-colors">
              Clear filters
            </a>
          )}
        </div>

        <form method="GET" className="mt-6">
          <input
            type="search"
            name="q"
            defaultValue={searchParams.q}
            placeholder="Search movies..."
            className="w-full max-w-md px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:border-zawadi-green transition-colors text-sm"
          />
        </form>
      </div>

      {movies && movies.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {movies.map((movie) => (
            <ContentCard key={movie.id} content={movie as any} />
          ))}
        </div>
      ) : (
        <div className="section-surface p-12 text-center">
          <p className="text-xl text-zinc-500">No movies found</p>
          <p className="text-sm text-zinc-600 mt-2">Try a different search or filter</p>
        </div>
      )}
    </div>
  )
}
