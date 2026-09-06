"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import type { User } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase"

interface AuthContextType {
  user: User | null
  loading: boolean
  // Passwordless: no password to set, forget, or reset - just a link emailed
  // to you. Resolves/rejects with an error message on failure, null on success.
  sendSignInLink: (email: string) => Promise<string | null>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }

    // Deliberately not also calling getSession() here: it resolves on its
    // own async timeline separate from onAuthStateChange, and if a sign-in
    // event arrives first, getSession()'s later resolution (checking
    // whatever session existed *before* that sign-in) can overwrite the
    // fresh user with stale null - a real race, not just a theoretical one.
    // onAuthStateChange alone is sufficient: Supabase fires an INITIAL_SESSION
    // event immediately on subscription with the current state, so this one
    // listener covers both the initial load and every subsequent change.
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])

  const sendSignInLink = useCallback(async (email: string): Promise<string | null> => {
    if (!supabase) return "Sign-in isn't configured yet."
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ""
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}${basePath}/account/`,
      },
    })
    return error ? error.message : null
  }, [])

  const signOut = useCallback(async () => {
    if (!supabase) return
    await supabase.auth.signOut()
  }, [])

  const value = { user, loading, sendSignInLink, signOut }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
