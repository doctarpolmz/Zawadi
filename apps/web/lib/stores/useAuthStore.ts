'use client'
import { create } from 'zustand'
import { createClient } from '@/lib/supabase/client'
import type { UserProfile, Subscription } from '@/types/database'
import type { User } from '@supabase/supabase-js'

interface AuthState {
  user: User | null
  profile: UserProfile | null
  subscription: Subscription | null
  loading: boolean
  initialized: boolean
  signIn: (email: string, password: string) => Promise<void>
  signInWithGoogle: () => Promise<void>
  signUp: (email: string, password: string, fullName: string) => Promise<void>
  signOut: () => Promise<void>
  fetchProfile: () => Promise<void>
  setUser: (user: User | null) => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  subscription: null,
  loading: true,
  initialized: false,

  setUser: (user) => set({ user }),

  signIn: async (email, password) => {
    const supabase = createClient()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    set({ user: data.user })
    await get().fetchProfile()
  },

  signInWithGoogle: async () => {
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) throw error
  },

  signUp: async (email, password, fullName) => {
    const supabase = createClient()
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    })
    if (error) throw error
    if (data.user) {
      await (supabase.from('users') as any).upsert({
        id: data.user.id,
        email,
        full_name: fullName,
        role: 'user',
      })
    }
  },

  signOut: async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    set({ user: null, profile: null, subscription: null })
  },

  fetchProfile: async () => {
    const supabase = createClient()
    set({ loading: true })
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      set({ user: null, profile: null, subscription: null, loading: false, initialized: true })
      return
    }

    const [{ data: profile }, { data: sub }] = await Promise.all([
      supabase.from('users').select('*').eq('id', user.id).single(),
      supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single(),
    ])

    set({
      user,
      profile: (profile as any) as UserProfile,
      subscription: (sub as any) as Subscription,
      loading: false,
      initialized: true,
    })
  },
}))
