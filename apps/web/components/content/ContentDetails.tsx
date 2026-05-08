'use client'
import { useState } from 'react'
import Image from 'next/image'
import { Star, Clock, Calendar, Play } from 'lucide-react'
import type { Content, Review } from '@/types/database'
import { ContentCard } from './ContentCard'
import { formatDuration, formatDate, getInitials, cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { DownloadButton } from '@/components/download/DownloadButton'

interface ContentDetailsProps {
  content: Content
  reviews: Review[]
  related: Content[]
  hasAccess: boolean
  userId?: string
}

export function ContentDetails({ content, reviews, related, hasAccess, userId }: ContentDetailsProps) {
  const [userRating, setUserRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [reviewText, setReviewText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [localReviews, setLocalReviews] = useState(reviews)

  const avgRating = localReviews.length
    ? localReviews.reduce((s, r) => s + r.rating, 0) / localReviews.length
    : 0

  const submitReview = async () => {
    if (!userId || !userRating) return
    setSubmitting(true)
    const supabase = createClient()
    const { data } = await (supabase.from('reviews') as any).upsert({
      content_id: content.id,
      rating: userRating,
      body: reviewText,
    }, { onConflict: 'user_id,content_id' }).select('*, users(full_name, avatar_url)').single()

    if (data) {
      setLocalReviews(prev => [data as any, ...prev.filter(r => r.user_id !== userId)])
      setReviewText('')
    }
    setSubmitting(false)
  }

  return (
    <div className="grid lg:grid-cols-3 gap-10">
      {/* Main info */}
      <div className="lg:col-span-2 space-y-8">
        {/* Title & meta */}
        <div>
          <h1 className="text-3xl font-bold text-white mb-3">{content.title}</h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-400">
            {content.duration_seconds && (
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" /> {formatDuration(content.duration_seconds)}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" /> {formatDate(content.created_at)}
            </span>
            {avgRating > 0 && (
              <span className="flex items-center gap-1.5">
                <Star className="w-4 h-4 text-zawadi-gold fill-current" />
                {avgRating.toFixed(1)} ({localReviews.length} reviews)
              </span>
            )}
            {content.categories && (
              <span className="px-2.5 py-0.5 rounded-md bg-white/10 capitalize">{content.categories.name}</span>
            )}
          </div>
        </div>

        {/* Description */}
        {content.description && (
          <p className="text-zinc-300 leading-relaxed">{content.description}</p>
        )}
        {/* Actions */}
        {hasAccess && (
          <div className="mt-6">

            {/* Existing star ratings row */}
          <div className="flex items-center gap-1 mb-4">
            {[1, 2, 3, 4, 5].map((n) => (
              <Star
                key={n}
                className={cn(
                 'w-5 h-5',
                  avgRating >= n
                    ? 'text-zawadi-gold fill-current'
                    : 'text-zinc-600'
                )}
              />
            ))}
          </div>

        {/* Downloads */}
          <div className="mt-6">
            <DownloadButton content={content} />
          </div>

    </div>
  )}

        {/* Reviews */}
        <div>
          <h2 className="text-xl font-semibold text-white mb-4">Reviews</h2>

          {/* Write review */}
          {userId && hasAccess && (
            <div className="mb-6 p-4 bg-zawadi-surface rounded-xl border border-white/5 space-y-3">
              <p className="text-sm text-zinc-400 font-medium">Rate this title</p>
              <div className="flex gap-1">
                {[1,2,3,4,5].map(n => (
                  <button
                    key={n}
                    onMouseEnter={() => setHoverRating(n)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setUserRating(n)}
                    className="p-1"
                  >
                    <Star className={cn('w-6 h-6 transition-colors', (hoverRating || userRating) >= n ? 'text-zawadi-gold fill-current' : 'text-zinc-600')} />
                  </button>
                ))}
              </div>
              <textarea
                value={reviewText}
                onChange={e => setReviewText(e.target.value)}
                placeholder="Share your thoughts..."
                rows={3}
                className="w-full px-3 py-2 rounded-lg bg-zawadi-surface2 border border-white/10 text-white placeholder-zinc-600 text-sm resize-none focus:outline-none focus:border-zawadi-green transition-colors"
              />
              <button
                onClick={submitReview}
                disabled={!userRating || submitting}
                className="px-4 py-2 bg-zawadi-green text-zawadi-dark text-sm font-medium rounded-lg disabled:opacity-50 hover:bg-zawadi-green/90 transition-colors"
              >
                {submitting ? 'Submitting…' : 'Submit Review'}
              </button>
            </div>
          )}

          {/* Review list */}
          <div className="space-y-4">
            {localReviews.map(review => (
              <div key={review.id} className="flex gap-3 p-4 bg-zawadi-surface rounded-xl border border-white/5">
                <div className="w-10 h-10 rounded-full bg-zawadi-green/20 border border-zawadi-green/20 flex items-center justify-center text-sm font-medium text-zawadi-green shrink-0">
                  {getInitials((review as any).users?.full_name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-white">{(review as any).users?.full_name ?? 'Anonymous'}</p>
                    <div className="flex gap-0.5">
                      {[1,2,3,4,5].map(n => (
                        <Star key={n} className={cn('w-3.5 h-3.5', review.rating >= n ? 'text-zawadi-gold fill-current' : 'text-zinc-700')} />
                      ))}
                    </div>
                  </div>
                  {review.body && <p className="text-sm text-zinc-400">{review.body}</p>}
                  <p className="text-xs text-zinc-600 mt-1">{formatDate(review.created_at)}</p>
                </div>
              </div>
            ))}
            {localReviews.length === 0 && (
              <p className="text-zinc-600 text-sm">No reviews yet. Be the first!</p>
            )}
          </div>
        </div>
      </div>

      {/* Related */}
      {related.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-white mb-4">You Might Also Like</h2>
          <div className="grid grid-cols-2 lg:grid-cols-1 gap-4">
            {related.slice(0, 4).map(item => (
              <ContentCard key={item.id} content={item} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
