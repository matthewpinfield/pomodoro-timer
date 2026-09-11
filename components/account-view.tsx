"use client"

import { useState, useEffect, useRef } from "react"
import { toast } from "sonner"
import { Mail, LogOut, CheckCircle2, Sparkles } from "lucide-react"
import { useAuth } from "@/context/auth-context"
import { useProAccess } from "@/lib/entitlements"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

// After a Stripe redirect back, the webhook that actually confirms payment
// usually resolves in 1-2 seconds but isn't synchronous with the redirect -
// poll briefly rather than assume it's already landed. No Realtime
// subscription in this app yet, and introducing one for a single screen
// isn't proportionate to what a short poll already covers.
const POLL_INTERVAL_MS = 2000
const MAX_POLL_ATTEMPTS = 5

export function AccountView() {
  const { user, loading, sendSignInLink, signOut } = useAuth()
  const { hasProAccess, loading: proLoading, refetch } = useProAccess()
  const [email, setEmail] = useState("")
  const [linkSent, setLinkSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [billingBusy, setBillingBusy] = useState(false)
  const [polling, setPolling] = useState(false)
  const pollAttemptsRef = useRef(0)

  // Read the Stripe redirect's query param directly from the URL rather
  // than next/navigation's useSearchParams() - this is a static export with
  // no server-rendered reactivity to preserve, so a plain client-side check
  // is simpler and avoids needing a Suspense boundary for one-time read.
  useEffect(() => {
    if (typeof window === "undefined") return
    const params = new URLSearchParams(window.location.search)
    const checkout = params.get("checkout")
    if (checkout === "success") {
      pollAttemptsRef.current = 0
      setPolling(true)
    } else if (checkout === "cancel") {
      toast("Checkout canceled - no changes made.")
    }
    if (checkout) {
      window.history.replaceState({}, "", window.location.pathname)
    }
  }, [])

  useEffect(() => {
    if (!polling) return
    if (hasProAccess) {
      setPolling(false)
      toast.success("You're now on FocusPie Pro!")
      return
    }
    if (pollAttemptsRef.current >= MAX_POLL_ATTEMPTS) {
      setPolling(false)
      toast("Still confirming your payment - check back in a moment if Pro features aren't unlocked yet.")
      return
    }
    const timer = setTimeout(() => {
      pollAttemptsRef.current += 1
      refetch()
    }, POLL_INTERVAL_MS)
    return () => clearTimeout(timer)
  }, [polling, hasProAccess, refetch])

  const handleBillingAction = async (mode: "checkout" | "portal") => {
    if (!supabase) return
    setBillingBusy(true)
    try {
      const { data, error: invokeError } = await supabase.functions.invoke("stripe-billing-session", {
        body: { mode },
      })
      if (invokeError) throw invokeError
      if (data?.error) throw new Error(data.error)
      if (!data?.url) throw new Error("No checkout URL returned")
      window.location.href = data.url
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't open billing right now.")
      setBillingBusy(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setSending(true)
    setError(null)
    const errorMessage = await sendSignInLink(email)
    setSending(false)
    if (errorMessage) {
      setError(errorMessage)
    } else {
      setLinkSent(true)
    }
  }

  if (loading) {
    return <div className="w-full max-w-md mx-auto text-center text-sm text-muted-foreground py-12">Loading...</div>
  }

  return (
    <div className="w-full max-w-md mx-auto flex flex-col gap-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Account</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Sign in to sync your tasks and settings across devices.
        </p>
      </div>

      {user ? (
        <div className="glass-card rounded-[1.5rem] p-6 flex flex-col items-center gap-4 text-center">
          <CheckCircle2 className="w-10 h-10 text-primary" />
          <div>
            <p className="font-semibold text-foreground">You&apos;re signed in</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>

          {proLoading ? (
            <p className="text-xs text-muted-foreground bg-secondary/60 px-3 py-1.5 rounded-full">Checking plan...</p>
          ) : hasProAccess ? (
            <p className="text-xs font-medium text-primary bg-primary/10 px-3 py-1.5 rounded-full flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              FocusPie Pro
            </p>
          ) : (
            <p className="text-xs text-muted-foreground bg-secondary/60 px-3 py-1.5 rounded-full">Free plan</p>
          )}

          {!proLoading && !hasProAccess && (
            <Button onClick={() => handleBillingAction("checkout")} disabled={billingBusy} className="gap-2">
              <Sparkles className="w-4 h-4" />
              {billingBusy ? "Loading..." : "Upgrade to Pro"}
            </Button>
          )}
          {!proLoading && hasProAccess && (
            <Button variant="outline" onClick={() => handleBillingAction("portal")} disabled={billingBusy}>
              {billingBusy ? "Loading..." : "Manage billing"}
            </Button>
          )}

          <Button variant="outline" onClick={() => signOut()} className="gap-2">
            <LogOut className="w-4 h-4" />
            Sign out
          </Button>
        </div>
      ) : linkSent ? (
        <div className="glass-card rounded-[1.5rem] p-6 flex flex-col items-center gap-3 text-center">
          <Mail className="w-10 h-10 text-primary" />
          <p className="font-semibold text-foreground">Check your email</p>
          <p className="text-sm text-muted-foreground">
            We sent a sign-in link to <span className="font-medium text-foreground">{email}</span>. Click it to finish signing in - no password needed.
          </p>
          <Button variant="ghost" size="sm" onClick={() => setLinkSent(false)}>
            Use a different email
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="glass-card rounded-[1.5rem] p-6 flex flex-col gap-4">
          <Input
            type="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={sending || !email} className="gap-2">
            <Mail className="w-4 h-4" />
            {sending ? "Sending..." : "Send me a sign-in link"}
          </Button>
        </form>
      )}
    </div>
  )
}
