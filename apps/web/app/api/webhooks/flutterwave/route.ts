import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  const hash = request.headers.get('verif-hash')
  if (hash !== process.env.FLW_SECRET_HASH) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const payload = await request.json()

  if (payload.status !== 'successful') {
    return NextResponse.json({ received: true })
  }

  const { tx_ref, amount, currency, customer } = payload.data
  // tx_ref format: "zawadi-{userId}-{contentId|tier}-{timestamp}"
  const parts = tx_ref.split('-')
  const userId = parts[1]
  const typeRef = parts[2] // content id or tier name

  const isTier = ['free', 'basic', 'premium'].includes(typeRef)

  if (isTier) {
    await supabase.from('subscriptions').upsert({
      user_id: userId,
      tier: typeRef as any,
      status: 'active',
      flutter_ref: tx_ref,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    }, { onConflict: 'user_id' })
  } else {
    await supabase.from('purchases').insert({
      user_id: userId,
      content_id: typeRef,
      type: 'buy',
      amount_paid: amount,
      currency: currency ?? 'KES',
      payment_ref: tx_ref,
    })
  }

  return NextResponse.json({ received: true })
}
