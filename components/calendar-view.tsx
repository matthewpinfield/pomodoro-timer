"use client"

import { useState } from "react"
import { CalendarDays, RefreshCw, Link as LinkIcon } from "lucide-react"
import { useAuth } from "@/context/auth-context"
import { useSettings } from "@/context/settings-context"
import { useTasks } from "@/context/task-context"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

function todayDigitsLocal(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, "0")
  const d = String(now.getDate()).padStart(2, "0")
  return `${y}${m}${d}`
}

export function CalendarView() {
  const { user, loading: authLoading } = useAuth()
  const { calendarIcsUrl, updateCalendarIcsUrl } = useSettings()
  const { importCalendarTasks } = useTasks()
  const [draftUrl, setDraftUrl] = useState(calendarIcsUrl ?? "")
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastSyncCount, setLastSyncCount] = useState<number | null>(null)

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    updateCalendarIcsUrl(draftUrl.trim() || null)
  }

  const handleSync = async () => {
    if (!supabase || !calendarIcsUrl) return
    setSyncing(true)
    setError(null)
    setLastSyncCount(null)
    try {
      const { data, error: invokeError } = await supabase.functions.invoke("fetch-calendar", {
        body: { icsUrl: calendarIcsUrl, todayDigits: todayDigitsLocal() },
      })
      if (invokeError) throw invokeError
      if (data?.error) throw new Error(data.error)

      const events = (data?.events ?? []) as { uid: string; summary: string; durationMinutes: number }[]
      importCalendarTasks(events)
      setLastSyncCount(events.length)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't sync your calendar. Try again in a moment.")
    } finally {
      setSyncing(false)
    }
  }

  if (authLoading) {
    return <div className="w-full max-w-md mx-auto text-center text-sm text-muted-foreground py-12">Loading...</div>
  }

  if (!user) {
    return (
      <div className="w-full max-w-md mx-auto flex flex-col gap-6 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Calendar</h1>
        <div className="glass-card rounded-[1.5rem] p-6">
          <p className="text-sm text-muted-foreground">
            Sign in to import today&apos;s events from your calendar as tasks.
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
          Paste your calendar&apos;s private iCal (ICS) link to import today&apos;s events as tasks.
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
            {syncing ? "Syncing..." : "Sync today's events"}
          </Button>
          {lastSyncCount !== null && !error && (
            <p className="text-sm text-muted-foreground">
              {lastSyncCount === 0
                ? "No events found for today."
                : `Imported ${lastSyncCount} event${lastSyncCount === 1 ? "" : "s"} as task${lastSyncCount === 1 ? "" : "s"}.`}
            </p>
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
      )}
    </div>
  )
}
