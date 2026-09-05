"use client"

import { useState } from "react"
import { Mail, LogOut, CheckCircle2 } from "lucide-react"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function AccountView() {
  const { user, loading, sendSignInLink, signOut } = useAuth()
  const [email, setEmail] = useState("")
  const [linkSent, setLinkSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)

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
          <p className="text-xs text-muted-foreground bg-secondary/60 px-3 py-1.5 rounded-full">Free plan</p>
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
