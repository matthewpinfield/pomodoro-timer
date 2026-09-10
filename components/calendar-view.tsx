"use client"

import { useState } from "react"
import { formatDistanceToNow, format } from "date-fns"
import { CalendarDays, RefreshCw, Link as LinkIcon } from "lucide-react"
import { useAuth } from "@/context/auth-context"
import { useSettings } from "@/context/settings-context"
import { useTasks } from "@/context/task-context"
import { supabase } from "@/lib/supabase"
import { useProAccess } from "@/lib/entitlements"
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
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // New events found by the most recent sync that aren't tasks yet - shown
  // as a checklist so a one-off "take the dog to the vet" doesn't land on
  // the task list unasked. Events already accepted on a past sync skip this
  // entirely and just keep auto-updating (see handleSync).
  const [reviewEvents, setReviewEvents] = useState<CalendarEvent[] | null>(null)
  const [selectedUids, setSelectedUids] = useState<Set<string>>(new Set())
  const [lastImportSummary, setLastImportSummary] = useState<{ added: number; skipped: number } | null>(null)

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    updateCalendarIcsUrl(draftUrl.trim() || null)
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

      const events = (data?.events ?? []) as CalendarEvent[]
      const alreadyImported = events.filter((e) => importedSourceUids.has(e.uid))
      const newEvents = events.filter((e) => !importedSourceUids.has(e.uid))

      // Events already turned into tasks on a previous sync keep updating
      // automatically (renamed, rescheduled, or removed) - no need to
      // re-approve the same recurring meeting every time.
      importCalendarTasks(alreadyImported)
      setCalendarLastSyncedAt(new Date().toISOString())

      if (newEvents.length > 0) {
        setReviewEvents(newEvents)
        setSelectedUids(new Set(newEvents.map((e) => e.uid))) // default: everything checked
      } else {
        setLastImportSummary({ added: 0, skipped: 0 })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't sync your calendar. Try again in a moment.")
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
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Calendar</h1>
        <div className="glass-card rounded-[1.5rem] p-6">
          <p className="text-sm text-muted-foreground">
            Sign in to import your upcoming calendar events as tasks.
          </p>
        </div>
      </div>
    )
  }

  // Placeholder paywall seam - unreachable today (useProAccess always grants
  // access, since there's no billing system yet), but the structural branch
  // exists so flipping that hook's internals on later is the only change
  // needed here. See lib/entitlements.ts.
  if (!hasProAccess) {
    return (
      <div className="w-full max-w-md mx-auto flex flex-col gap-6 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Calendar</h1>
        <div className="glass-card rounded-[1.5rem] p-6">
          <p className="text-sm text-muted-foreground">
            Calendar import requires FocusPie Pro.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md mx-auto flex flex-col gap-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Calendar</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Paste your calendar&apos;s private iCal (ICS) link to import the next month of events as tasks -
          each one lands on its own day, so it only shows up once that day arrives. You&apos;ll get to pick
          which new events actually become tasks.
        </p>
      </div>

      <form onSubmit={handleSave} className="glass-card rounded-[1.5rem] p-5 sm:p-6 flex flex-col gap-3">
        <Input
          type="url"
          placeholder="https://calendar.example.com/your-secret-feed.ics"
          value={draftUrl}
          onChange={(e) => setDraftUrl(e.target.value)}
        />
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
          {lastImportSummary && !error && !reviewEvents && (
            <p className="text-sm text-muted-foreground">
              {lastImportSummary.added === 0 && lastImportSummary.skipped === 0
                ? "No new events found in the next month."
                : `Added ${lastImportSummary.added} new task${lastImportSummary.added === 1 ? "" : "s"}${
                    lastImportSummary.skipped > 0 ? `, skipped ${lastImportSummary.skipped}` : ""
                  }.`}
            </p>
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
      )}

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
