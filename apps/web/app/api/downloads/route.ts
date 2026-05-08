import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { contentId } = await request.json()

    if (!contentId) {
      return NextResponse.json({ error: 'Content ID required' }, { status: 400 })
    }

    // Check if user has access to content
    const content = ((await supabase
      .from('content')
      .select('id, is_free, required_tier')
      .eq('id', contentId)
      .single()) as any).data as any

    if (!content) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 })
    }

    // Verify access
    if (!content.is_free) {
      const hasAccess = await checkUserAccess(supabase, user.id, contentId, content.required_tier)
      if (!hasAccess) {
        return NextResponse.json({ error: 'No access to this content' }, { status: 403 })
      }
    }

    // Check if download already exists
    const { data: existingDownload } = await supabase
      .from('downloads')
      .select('id')
      .eq('user_id', user.id)
      .eq('content_id', contentId)
      .single()

    if (existingDownload) {
      return NextResponse.json(existingDownload, { status: 200 })
    }

    // Create download record
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30) // 30-day expiry

    const { data: download, error: downloadError } = (await supabase
      .from('downloads')
      .insert({
        user_id: user.id,
        content_id: contentId,
        expires_at: expiresAt.toISOString(),
      } as any)
      .select()
      .single()) as any

    if (downloadError) {
      return NextResponse.json({ error: downloadError.message }, { status: 400 })
    }

    return NextResponse.json(download, { status: 201 })
  } catch (error) {
    console.error('Download error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: downloads, error } = await supabase
      .from('downloads')
      .select('*, content(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(downloads, { status: 200 })
  } catch (error) {
    console.error('Download fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { contentId } = await request.json()

    if (!contentId) {
      return NextResponse.json({ error: 'Content ID required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('downloads')
      .delete()
      .eq('user_id', user.id)
      .eq('content_id', contentId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Download delete error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function checkUserAccess(
  supabase: any,
  userId: string,
  contentId: string,
  requiredTier: string
): Promise<boolean> {
  // Check active subscription
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('tier, status, expires_at')
    .eq('user_id', userId)
    .eq('status', 'active')
    .single()

  if (subscription) {
    const isExpired = subscription.expires_at && new Date(subscription.expires_at) < new Date()
    if (!isExpired) {
      if (
        requiredTier === 'free' ||
        (requiredTier === 'basic' && ['basic', 'premium'].includes(subscription.tier)) ||
        (requiredTier === 'premium' && subscription.tier === 'premium')
      ) {
        return true
      }
    }
  }

  // Check one-time purchase
  const { data: purchase } = await supabase
    .from('purchases')
    .select('type, rent_expires_at')
    .eq('user_id', userId)
    .eq('content_id', contentId)
    .single()

  if (purchase) {
    if (purchase.type === 'buy') return true
    if (purchase.type === 'rent' && purchase.rent_expires_at) {
      return new Date(purchase.rent_expires_at) > new Date()
    }
  }

  return false
}
