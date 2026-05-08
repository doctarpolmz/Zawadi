'use client'
import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/lib/stores/useAuthStore'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { fetchProfile } = useAuthStore()

  useEffect(() => {
    fetchProfile()

    const supabase = createClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchProfile()
      } else {
        useAuthStore.setState({ user: null, profile: null, subscription: null, loading: false, initialized: true })
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  return <>{children}</>
}
