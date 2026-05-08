import { createServerSupabaseClient } from '@/lib/supabase/server'
import { ContentCard } from '@/components/content/ContentCard'

interface PageProps {
  searchParams: { q?: string; category?: string }
}

export default async function BrowseBooksPage({ searchParams }: PageProps) {
  const supabase = createServerSupabaseClient()

  let query = supabase
    .from('content')
    .select('*, categories(*)')
    .eq('type', 'book')
    .order('created_at', { ascending: false })

  if (searchParams.q) query = query.ilike('title', `%${searchParams.q}%`)
  if (searchParams.category) query = query.eq('category_id', searchParams.category)

  const { data: books } = await query.limit(48)
  const { data: categories } = await supabase.from('categories').select('*').eq('type', 'book')

  return (
    <div className="px-4 md:px-8 max-w-screen-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">📚 Books</h1>
        <p className="text-zinc-400 mt-1">Fiction, non-fiction, African literature and more</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {categories?.map((cat: any) => (
          <a key={cat.id} href={`?category=${cat.id}`}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${searchParams.category === cat.id ? 'bg-zawadi-green text-zawadi-dark font-medium' : 'bg-white/5 text-zinc-300 hover:bg-white/10'}`}>
            {cat.name}
          </a>
        ))}
      </div>

      <form method="GET">
        <input type="search" name="q" defaultValue={searchParams.q} placeholder="Search books, authors..."
          className="w-full max-w-md px-4 py-2.5 rounded-xl bg-zawadi-surface border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:border-zawadi-green transition-colors text-sm" />
      </form>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {books?.map((book: any) => <ContentCard key={book.id} content={book} />)}
      </div>
    </div>
  )
}
