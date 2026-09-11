"use client"

import { useState, useEffect } from "react"
import { formatDistanceToNow, format } from "date-fns"
import { CalendarDays, RefreshCw, Link as LinkIcon, Eye, EyeOff, LogIn } from "lucide-react"
import { useAuth } from "@/context/auth-context"
import { useSettings } from "@/context/settings-context"
import { useTasks } from "@/context/task-context"
import { supabase } from "@/lib/supabase"
import { useProAccess } from "@/lib/entitlements"
import { PremiumBadge } from "@/components/premium-badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface CalendarEvent {
  uid: string
  summary: string
  durationMinutes: number
  date: string // YYYY-MM-DD
}

function todayDigitsLocal(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, "0")
  const d = String(now.getDate()).padStart(2, "0")
  return `${y}${m}${d}`
}

function formatEventDate(dateStr: string): string {
  // Parsed as local midnight, not UTC - a plain `new Date("2026-09-08")` would
  // read as the previous day in timezones behind UTC.
  return format(new Date(`${dateStr}T00:00:00`), "EEE, MMM d")
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m === 0 ? `${h}h` : `${h}h ${m}m`
}

export function CalendarView() {
  const { user, loading: authLoading } = useAuth()
  const { hasProAccess, loading: proLoading } = useProAccess()
  const { calendarIcsUrl, updateCalendarIcsUrl, calendarLastSyncedAt, setCalendarLastSyncedAt } = useSettings()
  const { importCalendarTasks, importedSourceUids } = useTasks()
  const [draftUrl, setDraftUrl] = useState(calendarIcsUrl ?? "")
  const [urlVisible, setUrlVisible] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // New events found by the most recent sync that aren't tasks yet - shown
  // as a checklist so a one-off "take the dog to the vet" doesn't land on
  // the task list unasked. Events already accepted on a past sync skip this
  // entirely and just keep auto-updating (see handleSync).
  const [reviewEvents, setReviewEvents] = useState<CalendarEvent[] | null>(null)
  const [selectedUids, setSelectedUids] = useState<Set<string>>(new Set())
  const [lastImportSummary, setLastImportSummary] = useState<{ added: number; skipped: number } | null>(null)

  // Google connection status - null while unknown/loading, otherwise
  // whether a calendar_connections row exists for this user. Not synced
  // through context since it's only relevant on this page.
  const [googleConnected, setGoogleConnected] = useState<boolean | null>(null)
  const [connectingGoogle, setConnectingGoogle] = useState(false)

  const redirectUri = () => {
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ""
    return `${window.location.origin}${basePath}/calendar/`
  }

  // On mount: check whether Google is already connected, and handle the
  // OAuth redirect back from Google's consent screen (same
  // read-then-clean-the-URL pattern already used for Stripe's
  // ?checkout=success on the Account page).
  useEffect(() => {
    if (!supabase || !user) return
    let cancelled = false

    supabase
      .from("calendar_connections")
      .select("provider")
      .eq("user_id", user.id)
      .eq("provider", "google")
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled) setGoogleConnected(!!data)
      })

    const params = new URLSearchParams(window.location.search)
    const code = params.get("code")
    const state = params.get("state")
    const oauthError = params.get("error")

    if (oauthError) {
      setError("Google sign-in was cancelled or denied.")
      window.history.replaceState({}, "", window.location.pathname)
    } else if (code) {
      const expectedState = sessionStorage.getItem("google_oauth_state")
      sessionStorage.removeItem("google_oauth_state")
      window.history.replaceState({}, "", window.location.pathname)

      if (state !== expectedState) {
        setError("Google sign-in couldn't be verified - please try connecting again.")
      } else {
        setConnectingGoogle(true)
        supabase.functions
          .invoke("connect-google-calendar", { body: { code, redirectUri: redirectUri() } })
          .then(({ data, error: invokeError }) => {
            if (invokeError) throw invokeError
            if (data?.error) throw new Error(data.error)
            if (!cancelled) setGoogleConnected(true)
          })
          .catch((err) => {
            if (!cancelled) {
              setError(err instanceof Error ? err.message : "Couldn't connect Google Calendar.")
            }
          })
          .finally(() => {
            if (!cancelled) setConnectingGoogle(false)
          })
      }
    }

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const handleConnectGoogle = () => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
    if (!clientId) {
      setError("Google Calendar isn't configured yet.")
      return
    }
    const state = crypto.randomUUID()
    sessionStorage.setItem("google_oauth_state", state)

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri(),
      response_type: "code",
      scope: "https://www.googleapis.com/auth/calendar.events.readonly",
      access_type: "offline",
      prompt: "consent", // forces a refresh_token every time, not just first consent
      state,
    })
    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    updateCalendarIcsUrl(draftUrl.trim() || null)
  }

  // Shared by both the ICS and Google sync paths - splits fetched events
  // into "already a task, keep it auto-updating" vs. "new, ask the user"
  // (see the reviewEvents comment above), regardless of which provider
  // supplied them.
  const processFetchedEvents = (events: CalendarEvent[]) => {
    const alreadyImported = events.filter((e) => importedSourceUids.has(e.uid))
    const newEvents = events.filter((e) => !importedSourceUids.has(e.uid))

    importCalendarTasks(alreadyImported)
    setCalendarLastSyncedAt(new Date().toISOString())

    if (newEvents.length > 0) {
      setReviewEvents(newEvents)
      setSelectedUids(new Set(newEvents.map((e) => e.uid))) // default: everything checked
    } else {
      setLastImportSummary({ added: 0, skipped: 0 })
    }
  }

  const handleSync = async () => {
    if (!supabase || !calendarIcsUrl) return
    setSyncing(true)
    setError(null)
    setLastImportSummary(null)
    setReviewEvents(null)
    try {
      const { data, error: invokeError } = await supabase.functions.invoke("fetch-calendar", {
        body: { icsUrl: calendarIcsUrl, todayDigits: todayDigitsLocal() },
      })
      if (invokeError) throw invokeError
      if (data?.error) throw new Error(data.error)
      processFetchedEvents((data?.events ?? []) as CalendarEvent[])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't sync your calendar. Try again in a moment.")
    } finally {
      setSyncing(false)
    }
  }

  const handleSyncGoogle = async () => {
    if (!supabase) return
    setSyncing(true)
    setError(null)
    setLastImportSummary(null)
    setReviewEvents(null)
    try {
      const { data, error: invokeError } = await supabase.functions.invoke("fetch-google-calendar")
      if (invokeError) throw invokeError
      if (data?.error) throw new Error(data.error)
      processFetchedEvents((data?.events ?? []) as CalendarEvent[])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't sync Google Calendar. Try again in a moment.")
    } finally {
      setSyncing(false)
    }
  }

  const toggleSelected = (uid: string) => {
    setSelectedUids((prev) => {
      const next = new Set(prev)
      if (next.has(uid)) next.delete(uid)
      else next.add(uid)
      return next
    })
  }

  const handleConfirmReview = () => {
    if (!reviewEvents) return
    const chosen = reviewEvents.filter((e) => selectedUids.has(e.uid))
    importCalendarTasks(chosen)
    setLastImportSummary({ added: chosen.length, skipped: reviewEvents.length - chosen.length })
    setReviewEvents(null)
  }

  const handleSkipAllReview = () => {
    if (!reviewEvents) return
    setLastImportSummary({ added: 0, skipped: reviewEvents.length })
    setReviewEvents(null)
  }

  if (authLoading || proLoading) {
    return <div className="w-full max-w-md mx-auto text-center text-sm text-muted-foreground py-12">Loading...</div>
  }

  if (!user) {
    return (
      <div className="w-full max-w-md mx-auto flex flex-col gap-6 text-center">
        <div className="flex items-center justify-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Calendar</h1>
          <PremiumBadge />
        </div>
        <div className="glass-card rounded-[1.5rem] p-6">
          <p className="text-sm text-muted-foreground">
            Calendar import is a premium FocusPie feature. Sign in, then subscribe from your
            Account page to unlock it.
          </p>
        </div>
      </div>
    )
  }

  if (!hasProAccess) {
    return (
      <div className="w-full max-w-md mx-auto flex flex-col gap-6 text-center">
        <div className="flex items-center justify-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Calendar</h1>
          <PremiumBadge />
        </div>
        <div className="glass-card rounded-[1.5rem] p-6 flex flex-col gap-3 items-center">
          <p className="text-sm text-muted-foreground">
            Calendar import requires FocusPie Pro.
          </p>
          <Button asChild size="sm">
            <a href="/account">Upgrade to Pro</a>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md mx-auto flex flex-col gap-6">
      <div className="text-center">
        <div className="flex items-center justify-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Calendar</h1>
          <PremiumBadge />
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Paste your calendar&apos;s private iCal (ICS) link to import the next month of events as tasks -
          each one lands on its own day, so it only shows up once that day arrives. You&apos;ll get to pick
          which new events actually become tasks.
        </p>
      </div>

      <div className="glass-card rounded-[1.5rem] p-5 sm:p-6 flex flex-col items-center gap-3 text-center">
        {googleConnected ? (
          <>
            <CalendarDays className="w-8 h-8 text-primary" />
            <p className="text-sm font-medium text-foreground">Google Calendar connected</p>
            <Button onClick={handleSyncGoogle} disabled={syncing} className="gap-2">
              <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} />
              {syncing ? "Syncing..." : "Sync Google Calendar"}
            </Button>
          </>
        ) : (
          <>
            <LogIn className="w-8 h-8 text-primary" />
            <p className="text-sm text-muted-foreground">
              Connect your Google Calendar directly - no copying or pasting anything.
            </p>
            <Button onClick={handleConnectGoogle} disabled={connectingGoogle} className="gap-2">
              {connectingGoogle ? "Connecting..." : "Connect Google Calendar"}
            </Button>
          </>
        )}
      </div>

      <p className="text-xs text-muted-foreground text-center -mt-2">
        Other calendars (Apple, Outlook) - coming soon.
      </p>

      <div className="text-center">
        <p className="text-xs text-muted-foreground">
          Not on Google? You can still paste a private calendar link below - just know your
          provider will warn you this is sensitive, same as a password.
        </p>
      </div>

      <form onSubmit={handleSave} className="glass-card rounded-[1.5rem] p-5 sm:p-6 flex flex-col gap-3">
        <div className="relative">
          <Input
            type={urlVisible ? "text" : "password"}
            placeholder="https://calendar.example.com/your-secret-feed.ics"
            value={draftUrl}
            onChange={(e) => setDraftUrl(e.target.value)}
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setUrlVisible((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label={urlVisible ? "Hide calendar link" : "Show calendar link"}
          >
            {urlVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        <p className="text-xs text-muted-foreground">
          This link grants read access to your calendar to anyone who has it - treat it like a
          password. Don&apos;t share it, and only paste it here.
        </p>
        <Button type="submit" variant="secondary" className="gap-2">
          <LinkIcon className="w-4 h-4" />
          Save link
        </Button>
      </form>

      {calendarIcsUrl && (
        <div className="glass-card rounded-[1.5rem] p-5 sm:p-6 flex flex-col items-center gap-3 text-center">
          <CalendarDays className="w-8 h-8 text-primary" />
          <Button onClick={handleSync} disabled={syncing} className="gap-2">
            <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Syncing..." : "Sync calendar"}
          </Button>
          {calendarLastSyncedAt && (
            <p className="text-xs text-muted-foreground">
              Last imported {formatDistanceToNow(new Date(calendarLastSyncedAt), { addSuffix: true })}
            </p>
          )}
        </div>
      )}

      {/* Shared between the Google and ICS sync paths - only one sync can be
          in flight/most-recent at a time, so one status block covers both. */}
      {lastImportSummary && !error && !reviewEvents && (
        <p className="text-sm text-muted-foreground text-center">
          {lastImportSummary.added === 0 && lastImportSummary.skipped === 0
            ? "No new events found in the next month."
            : `Added ${lastImportSummary.added} new task${lastImportSummary.added === 1 ? "" : "s"}${
                lastImportSummary.skipped > 0 ? `, skipped ${lastImportSummary.skipped}` : ""
              }.`}
        </p>
      )}
      {error && <p className="text-sm text-destructive text-center">{error}</p>}

      {reviewEvents && (
        <div className="glass-card rounded-[1.5rem] p-5 sm:p-6 flex flex-col gap-4">
          <div className="text-center">
            <p className="text-sm font-medium text-foreground">
              {reviewEvents.length} new event{reviewEvents.length === 1 ? "" : "s"} found
            </p>
            <p className="text-xs text-muted-foreground mt-1">Choose which ones should become tasks.</p>
          </div>

          <ul className="flex flex-col gap-2 max-h-80 overflow-y-auto">
            {reviewEvents.map((event) => (
              <li key={event.uid}>
                <label className="flex items-start gap-3 rounded-lg p-2 hover:bg-muted/50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedUids.has(event.uid)}
                    onChange={() => toggleSelected(event.uid)}
                    className="mt-1 w-4 h-4 accent-primary shrink-0"
                  />
                  <span className="flex-1 text-left">
                    <span className="block text-sm text-foreground">{event.summary}</span>
                    <span className="block text-xs text-muted-foreground">
                      {formatEventDate(event.date)} - {formatDuration(event.durationMinutes)}
                    </span>
                  </span>
                </label>
              </li>
            ))}
          </ul>

          <div className="flex gap-2 justify-center">
            <Button variant="ghost" onClick={handleSkipAllReview} className="flex-1">
              Skip all
            </Button>
            <Button onClick={handleConfirmReview} className="flex-1">
              Add {selectedUids.size} selected
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
