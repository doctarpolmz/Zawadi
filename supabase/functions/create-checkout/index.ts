import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { contentId, tier, purchaseType, paymentProvider, currency } = await req.json()
    const authHeader = req.headers.get('Authorization')

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader! } } }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthenticated' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: profile } = await supabase.from('users').select('email, full_name').eq('id', user.id).single()
    const siteUrl = Deno.env.get('SITE_URL') ?? 'http://localhost:3000'

    // ─── Flutterwave ───────────────────────────────────────────────────
    if (paymentProvider === 'flutterwave') {
      let amount = 0
      let redirectPath = '/'

      if (tier) {
        amount = tier === 'premium' ? 9.99 : 4.99
        redirectPath = '/profile'
      } else if (contentId) {
        const { data: c } = await supabase.from('content').select('price, rent_price').eq('id', contentId).single()
        amount = purchaseType === 'rent' ? (c?.rent_price ?? 0) : (c?.price ?? 0)
        redirectPath = `/watch/${contentId}`
      }

      const txRef = `zawadi-${user.id}-${tier ?? contentId}-${Date.now()}`
      const payload = {
        tx_ref: txRef,
        amount,
        currency: currency ?? 'KES',
        redirect_url: `${siteUrl}${redirectPath}?payment=success`,
        customer: { email: profile?.email ?? user.email, name: profile?.full_name ?? 'Zawadi User' },
        customizations: {
          title: 'Zawadi',
          description: tier ? `${tier} subscription` : 'Content purchase',
          logo: `${siteUrl}/logo.png`,
        },
      }

      const flwRes = await fetch('https://api.flutterwave.com/v3/payments', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${Deno.env.get('FLW_SECRET_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })
      const flwData = await flwRes.json()

      return new Response(JSON.stringify({ url: flwData.data?.link }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ─── Stripe ────────────────────────────────────────────────────────
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!)

    const tierPriceMap: Record<string, string> = {
      basic: Deno.env.get('STRIPE_BASIC_PRICE_ID') ?? '',
      premium: Deno.env.get('STRIPE_PREMIUM_PRICE_ID') ?? '',
    }

    let lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = []
    let mode: 'payment' | 'subscription' = 'payment'

    if (tier) {
      mode = 'subscription'
      lineItems = [{ price: tierPriceMap[tier], quantity: 1 }]
    } else if (contentId) {
      const { data: c } = await supabase.from('content').select('title, price, rent_price').eq('id', contentId).single()
      const unitAmount = Math.round(((purchaseType === 'rent' ? c?.rent_price : c?.price) ?? 0) * 100)
      lineItems = [{
        price_data: {
          currency: 'usd',
          unit_amount: unitAmount,
          product_data: { name: c?.title ?? 'Content' },
        },
        quantity: 1,
      }]
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode,
      line_items: lineItems,
      success_url: `${siteUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/payment/cancel`,
      client_reference_id: user.id,
      customer_email: profile?.email ?? user.email,
      metadata: { contentId: contentId ?? '', tier: tier ?? '', purchaseType: purchaseType ?? 'buy' },
    })

    return new Response(JSON.stringify({ url: session.url }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message ?? 'Internal error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
