import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    console.error('Stripe webhook signature failed', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const userId = session.client_reference_id
      const { contentId, tier } = session.metadata ?? {}

      if (!userId) break

      if (tier) {
        // Subscription or plan upgrade
        await supabase.from('subscriptions').upsert({
          user_id: userId,
          tier: tier as any,
          status: 'active',
          stripe_sub_id: session.subscription as string,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        }, { onConflict: 'user_id' })
      } else if (contentId) {
        // One-time purchase
        await supabase.from('purchases').insert({
          user_id: userId,
          content_id: contentId,
          type: 'buy',
          amount_paid: (session.amount_total ?? 0) / 100,
          currency: session.currency?.toUpperCase() ?? 'USD',
          payment_ref: session.payment_intent as string,
        })
      }
      break
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      await supabase
        .from('subscriptions')
        .update({ status: 'cancelled' })
        .eq('stripe_sub_id', sub.id)
      break
    }

    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription
      await supabase
        .from('subscriptions')
        .update({
          status: sub.status === 'active' ? 'active' : 'expired',
          expires_at: new Date(sub.current_period_end * 1000).toISOString(),
        })
        .eq('stripe_sub_id', sub.id)
      break
    }
  }

  return NextResponse.json({ received: true })
}
