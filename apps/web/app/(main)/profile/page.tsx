'use client'
import { useState } from 'react'
import { redirect } from 'next/navigation'
import { User, Crown, CreditCard, Edit2, Check } from 'lucide-react'
import { useAuthStore } from '@/lib/stores/useAuthStore'
import { createClient } from '@/lib/supabase/client'
import { getInitials } from '@/lib/utils'

const PLANS = [
  {
    tier: 'free' as const,
    label: 'Free',
    price: '$0',
    features: ['Limited content', 'Ads included', 'SD quality', '1 device'],
    color: 'border-zinc-700',
    buttonClass: 'bg-white/10 text-white',
  },
  {
    tier: 'basic' as const,
    label: 'Basic',
    price: '$4.99/mo',
    features: ['Most content', 'No ads', 'HD quality', '2 devices', 'Offline downloads'],
    color: 'border-zawadi-green',
    buttonClass: 'bg-zawadi-green text-zawadi-dark',
  },
  {
    tier: 'premium' as const,
    label: 'Premium',
    price: '$9.99/mo',
    features: ['All content', 'No ads', '4K quality', '5 devices', 'Unlimited downloads', 'Early access'],
    color: 'border-zawadi-gold',
    buttonClass: 'bg-zawadi-gold text-zawadi-dark',
  },
]

export default function ProfilePage() {
  const { user, profile, subscription, fetchProfile } = useAuthStore()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(profile?.full_name ?? '')
  const [saving, setSaving] = useState(false)

  if (!user) return null

  const saveName = async () => {
    setSaving(true)
    const supabase = createClient() as any
    await supabase.from('users').update({ full_name: name }).eq('id', user.id)
    await fetchProfile()
    setSaving(false)
    setEditing(false)
  }

  const currentTier = subscription?.tier ?? 'free'

  return (
    <div className="px-4 md:px-8 max-w-3xl mx-auto space-y-10">
      <h1 className="text-3xl font-bold text-white">Profile</h1>

      {/* Avatar + info */}
      <div className="flex items-center gap-6 p-6 bg-zawadi-surface rounded-2xl border border-white/5">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-zawadi-green/30 to-zawadi-gold/30 border-2 border-zawadi-green/30 flex items-center justify-center text-2xl font-bold text-zawadi-green shrink-0">
          {getInitials(profile?.full_name)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            {editing ? (
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                className="bg-transparent border-b border-zawadi-green text-white text-xl font-bold focus:outline-none"
                autoFocus
              />
            ) : (
              <h2 className="text-xl font-bold text-white">{profile?.full_name ?? 'User'}</h2>
            )}
            {editing ? (
              <button onClick={saveName} disabled={saving} className="p-1 text-zawadi-green hover:text-zawadi-green/80">
                <Check className="w-4 h-4" />
              </button>
            ) : (
              <button onClick={() => setEditing(true)} className="p-1 text-zinc-500 hover:text-white">
                <Edit2 className="w-4 h-4" />
              </button>
            )}
          </div>
          <p className="text-zinc-400 text-sm">{profile?.email}</p>
          <span className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-zawadi-green/10 text-zawadi-green text-xs font-medium capitalize">
            <Crown className="w-3 h-3" /> {currentTier} plan
          </span>
        </div>
      </div>

      {/* Subscription plans */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-zawadi-green" /> Subscription
        </h2>
        <div className="grid sm:grid-cols-3 gap-4">
          {PLANS.map(plan => {
            const isActive = plan.tier === currentTier
            return (
              <div
                key={plan.tier}
                className={`p-5 rounded-2xl border-2 bg-zawadi-surface transition-all ${plan.color} ${isActive ? 'opacity-100' : 'opacity-70 hover:opacity-90'}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-white">{plan.label}</h3>
                  {isActive && (
                    <span className="px-2 py-0.5 rounded bg-white/10 text-xs text-white font-medium">Current</span>
                  )}
                </div>
                <p className="text-2xl font-bold text-white mb-4">{plan.price}</p>
                <ul className="space-y-1.5 mb-5">
                  {plan.features.map(f => (
                    <li key={f} className="text-sm text-zinc-300 flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-zawadi-green shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
                <button
                  disabled={isActive}
                  className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${plan.buttonClass}`}
                >
                  {isActive ? 'Active' : `Upgrade to ${plan.label}`}
                </button>
              </div>
            )
          })}
        </div>
        <p className="text-xs text-zinc-600 mt-3">Payments via Stripe (card) or Flutterwave (M-Pesa, MTN MoMo, OPay)</p>
      </div>
    </div>
  )
}
