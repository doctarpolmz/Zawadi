import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { contentId } = await req.json()
    const authHeader = req.headers.get('Authorization')

    if (!contentId) {
      return new Response(JSON.stringify({ access: false, reason: 'missing_content_id' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader! } } }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return new Response(JSON.stringify({ access: false, reason: 'unauthenticated' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: content } = await supabase
      .from('content')
      .select('id, is_free, required_tier, stream_url, drm_key_id')
      .eq('id', contentId)
      .single()

    if (!content) {
      return new Response(JSON.stringify({ access: false, reason: 'not_found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Free content — grant access immediately
    if (content.is_free) {
      return new Response(JSON.stringify({ access: true, url: content.stream_url }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Check active subscription
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('tier')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .gt('expires_at', new Date().toISOString())
      .single()

    const tierRank: Record<string, number> = { free: 0, basic: 1, premium: 2 }
    const hasSubAccess = sub && tierRank[sub.tier] >= tierRank[content.required_tier]

    if (hasSubAccess) {
      return new Response(JSON.stringify({ access: true, url: content.stream_url, drmKeyId: content.drm_key_id }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Check purchase / rental
    const { data: purchase } = await supabase
      .from('purchases')
      .select('type, rent_expires_at')
      .eq('user_id', user.id)
      .eq('content_id', contentId)
      .single()

    const hasPurchase = purchase && (
      purchase.type === 'buy' ||
      (purchase.rent_expires_at && new Date(purchase.rent_expires_at) > new Date())
    )

    if (hasPurchase) {
      return new Response(JSON.stringify({ access: true, url: content.stream_url, drmKeyId: content.drm_key_id }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ access: false, reason: 'subscription_required' }), {
      status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (err) {
    return new Response(JSON.stringify({ access: false, reason: 'internal_error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
