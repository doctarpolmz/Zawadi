import { createServerSupabaseClient } from '@/lib/supabase/server'
import { ContentUploadForm } from '@/components/admin/ContentUploadForm'
import { Pencil, Trash2, Plus } from 'lucide-react'
import { formatPrice } from '@/lib/utils'

export default async function AdminContentPage() {
  const supabase = createServerSupabaseClient()
  const content = ((await supabase
    .from('content')
    .select('*, categories(*)')
    .order('created_at', { ascending: false })
    .limit(50)) as any).data as any[]

  const categories = ((await supabase.from('categories').select('*')) as any).data as any[]

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Content Management</h1>
          <p className="text-zinc-400 text-sm mt-1">{content?.length ?? 0} titles in catalog</p>
        </div>
      </div>

      {/* Upload form */}
      <ContentUploadForm categories={categories ?? []} />

      {/* Content table */}
      <div className="bg-zawadi-surface rounded-2xl border border-white/5 overflow-hidden">
        <div className="px-5 py-4 border-b border-white/5">
          <h2 className="font-semibold text-white">All Content</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                <th className="px-4 py-3 text-left text-zinc-500 font-medium">Title</th>
                <th className="px-4 py-3 text-left text-zinc-500 font-medium hidden md:table-cell">Type</th>
                <th className="px-4 py-3 text-left text-zinc-500 font-medium hidden lg:table-cell">Category</th>
                <th className="px-4 py-3 text-left text-zinc-500 font-medium">Price</th>
                <th className="px-4 py-3 text-left text-zinc-500 font-medium hidden sm:table-cell">Tier</th>
                <th className="px-4 py-3 text-left text-zinc-500 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {content?.map(item => (
                <tr key={item.id} className="border-b border-white/5 last:border-0 hover:bg-white/2 transition-colors">
                  <td className="px-4 py-3 text-white font-medium max-w-[200px] truncate">{item.title}</td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="capitalize px-2 py-0.5 rounded-md bg-white/10 text-zinc-300 text-xs">{item.type}</span>
                  </td>
                  <td className="px-4 py-3 text-zinc-400 hidden lg:table-cell">{(item as any).categories?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-zinc-300">{item.is_free ? <span className="text-zawadi-green">Free</span> : formatPrice(item.price)}</td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className={`capitalize px-2 py-0.5 rounded-md text-xs font-medium ${item.required_tier === 'premium' ? 'bg-zawadi-gold/20 text-zawadi-gold' : item.required_tier === 'basic' ? 'bg-zawadi-green/20 text-zawadi-green' : 'bg-white/10 text-zinc-400'}`}>
                      {item.required_tier}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button className="p-1.5 text-zinc-500 hover:text-zawadi-green hover:bg-zawadi-green/10 rounded-lg transition-colors">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
