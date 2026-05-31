'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { Profile } from '@/types'

interface AuthContextType {
  user: User | null
  profile: Profile | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // createClient() вызывается только в браузере (useEffect не запускается при SSR)
    const supabase = createClient()

    const ensureProfile = async (u: { id: string; email?: string; user_metadata?: Record<string, unknown> }) => {
      const { data: existing } = await supabase.from('profiles').select('*').eq('id', u.id).single()
      if (existing) return existing
      const { data: created } = await supabase.from('profiles').insert({
        id: u.id,
        email: u.email || '',
        full_name: (u.user_metadata?.full_name as string) || null,
      }).select().single()
      return created
    }

    const init = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)
        if (user) {
          const profile = await ensureProfile(user)
          setProfile(profile)
        }
      } catch (e) {
        console.error('Auth init error:', e)
      } finally {
        setLoading(false)
      }
    }

    init()

    let subscription: { unsubscribe: () => void } | null = null
    try {
      const { data } = supabase.auth.onAuthStateChange(async (_event, session) => {
        setUser(session?.user ?? null)
        if (session?.user) {
          try {
            const profile = await ensureProfile(session.user)
            setProfile(profile)
          } catch {}
        } else {
          setProfile(null)
        }
      })
      subscription = data.subscription
    } catch (e) {
      console.error('Auth subscription error:', e)
    }

    return () => {
      subscription?.unsubscribe()
    }
  }, [])

  const signOut = async () => {
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
    } catch {}
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
