import { useEffect, useMemo, useState } from 'react'
import { AuthContext } from './authContext.js'
import { supabase } from './supabaseClient.js'

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [isLoading, setIsLoading] = useState(Boolean(supabase))

  useEffect(() => {
    if (!supabase) {
      return undefined
    }

    let isMounted = true
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (isMounted) {
        setSession(nextSession)
        setIsLoading(false)
      }
    })

    supabase.auth.getSession().then(({ data, error }) => {
      if (!isMounted) return
      if (error) {
        console.error('Gagal memuat sesi Supabase:', error.message)
      } else {
        setSession(data.session)
      }
      setIsLoading(false)
    }).catch((error) => {
      if (!isMounted) return
      console.error('Gagal memuat sesi Supabase:', error)
      setIsLoading(false)
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  const value = useMemo(() => ({
    session,
    isLoading,
    signIn: async (email, password) => {
      if (!supabase) {
        throw new Error('Supabase belum dikonfigurasi. Periksa VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY.')
      }
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      setSession(data.session)
    },
    signOut: async () => {
      if (!supabase) {
        throw new Error('Supabase belum dikonfigurasi.')
      }
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      setSession(null)
    }
  }), [session, isLoading])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

