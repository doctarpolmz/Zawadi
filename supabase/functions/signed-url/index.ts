import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { contentId, bucket, path } = await req.json()
    const authHeader = req.headers.get('Authorization')

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const anonClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader! } } }
    )

    const { data: { user } } = await anonClient.auth.getUser()
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthenticated' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Validate access first
    const { data: content } = await supabase
      .from('content')
      .select('is_free, required_tier')
      .eq('id', contentId)
      .single()

    if (!content) {
      return new Response(JSON.stringify({ error: 'Content not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!content.is_free) {
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('tier')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single()

      const tierRank: Record<string, number> = { free: 0, basic: 1, premium: 2 }
      if (!sub || tierRank[sub.tier] < tierRank[content.required_tier]) {
        return new Response(JSON.stringify({ error: 'Access denied' }), {
          status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }

    // Generate a signed URL valid for 4 hours
    const { data: signedUrl, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, 14400)

    if (error) throw error

    return new Response(JSON.stringify({ url: signedUrl.signedUrl }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
