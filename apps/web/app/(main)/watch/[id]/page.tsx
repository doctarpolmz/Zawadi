import { createServerSupabaseClient } from '@/lib/supabase/server'
import { VideoPlayer } from '@/components/player/VideoPlayer'
import { ContentDetails } from '@/components/content/ContentDetails'
import { AccessGate } from '@/components/content/AccessGate'
import { notFound } from 'next/navigation'

interface PageProps {
  params: { id: string }
}

export default async function WatchPage({ params }: PageProps) {
  const supabase = createServerSupabaseClient()

  const { data: content } = (await supabase
    .from('content')
    .select('*, categories(*)')
    .eq('id', params.id)
    .eq('type', 'movie')
    .single()) as any

  if (!content) notFound()

  const { data: { user } } = await supabase.auth.getUser()

  // Check access
  let hasAccess = content.is_free
  if (!hasAccess && user) {
    const { data: sub } = (await supabase
      .from('subscriptions')
      .select('tier')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()) as any

    const tierRank: Record<string, number> = { free: 0, basic: 1, premium: 2 }
    if (sub && tierRank[sub.tier] >= tierRank[content.required_tier]) {
      hasAccess = true
    }

    if (!hasAccess) {
      const { data: purchase } = (await supabase
        .from('purchases')
        .select('type, rent_expires_at')
        .eq('user_id', user.id)
        .eq('content_id', content.id)
        .single()) as any

      if (purchase && (purchase.type === 'buy' || (purchase.rent_expires_at && new Date(purchase.rent_expires_at) > new Date()))) {
        hasAccess = true
      }
    }
  }

  // Get reviews
  const { data: reviews } = (await supabase
    .from('reviews')
    .select('*, users(full_name, avatar_url)')
    .eq('content_id', content.id)
    .order('created_at', { ascending: false })
    .limit(10)) as any

  // Get related
  const { data: related } = (await supabase
    .from('content')
    .select('*, categories(*)')
    .eq('type', 'movie')
    .eq('category_id', content.category_id ?? '')
    .neq('id', content.id)
    .limit(6)) as any

  return (
    <div className="max-w-screen-2xl mx-auto">
      {/* Player area */}
      <div className="aspect-video bg-black w-full">
        {hasAccess ? (
          <VideoPlayer
            contentId={content.id}
            muxPlaybackId={content.stream_url ?? ''}
            title={content.title}
          />
        ) : (
          <AccessGate content={content as any} user={user} />
        )}
      </div>

      {/* Details */}
      <div className="px-4 md:px-8 py-8">
        <ContentDetails
          content={content as any}
          reviews={reviews ?? []}
          related={related ?? []}
          hasAccess={hasAccess}
          userId={user?.id}
        />
      </div>
    </div>
  )
}
