import { createServerSupabaseClient } from '@/lib/supabase/server'
import { BookReaderClient } from '@/components/player/BookReaderClient'
import { AccessGate } from '@/components/content/AccessGate'
import { notFound } from 'next/navigation'

interface PageProps { params: { id: string } }

export default async function ReadPage({ params }: PageProps) {
  const supabase = createServerSupabaseClient()
  const { data: content } = (await supabase
    .from('content')
    .select('*, categories(*)')
    .eq('id', params.id)
    .eq('type', 'book')
    .single()) as any

  if (!content) notFound()

  const { data: { user } } = await supabase.auth.getUser()
  let hasAccess = content.is_free
  if (!hasAccess && user) {
    const { data: sub } = (await supabase
      .from('subscriptions').select('tier')
      .eq('user_id', user.id).eq('status', 'active').single()) as any
    const tierRank: Record<string, number> = { free: 0, basic: 1, premium: 2 }
    if (sub && tierRank[sub.tier] >= tierRank[content.required_tier]) hasAccess = true
    if (!hasAccess) {
      const { data: purchase } = await supabase.from('purchases')
        .select('type').eq('user_id', user.id).eq('content_id', content.id).single()
      if (purchase) hasAccess = true
    }
  }

  if (!hasAccess) {
    return (
      <div className="h-[calc(100vh-4rem)]">
        <AccessGate content={content as any} user={user} />
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-4rem)]">
      <BookReaderClient content={content as any} />
    </div>
  )
}
