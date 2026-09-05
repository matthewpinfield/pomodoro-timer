"use client"

import { useEffect, useRef } from "react"
import { AlarmClock } from "lucide-react"
import { useAlarms } from "@/context/alarm-context"
import { useTimer } from "@/context/timer-context"
import { useSettings } from "@/context/settings-context"
import { playTransitionChime } from "@/lib/sound"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

// Mounted once in the root layout so a firing alarm can interrupt whatever
// page you're on - most importantly the timer page, where auto-pausing the
// running pomodoro is the whole point of this feature.
export function AlarmFiringOverlay() {
  const { alarms, removeAlarm } = useAlarms()
  const { isRunning, pauseTimer } = useTimer()
  const { soundEnabled } = useSettings()
  const firing = alarms.find((a) => a.firing)
  const handledIdRef = useRef<string | null>(null)
  const didPauseMainTimerRef = useRef(false)

  useEffect(() => {
    if (!firing || handledIdRef.current === firing.id) return
    handledIdRef.current = firing.id
    if (soundEnabled) playTransitionChime("alarm")
    // Snapshot whether *this* firing paused the main timer, since pauseTimer()
    // flips isRunning to false right away - checking isRunning at render time
    // would always read as "paused" and lose the distinction.
    didPauseMainTimerRef.current = isRunning
    if (isRunning) pauseTimer()
    // Only react to a *new* alarm starting to fire, not to isRunning/pauseTimer
    // identity changes while one is already firing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firing])

  if (!firing) return null

  return (
    <Dialog open onOpenChange={(open) => { if (!open) removeAlarm(firing.id) }}>
      <DialogContent
        className="sm:max-w-md text-center"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className="items-center">
          <AlarmClock className="w-12 h-12 text-primary mb-2" />
          <DialogTitle className="text-2xl">{firing.label || "Timer done"}</DialogTitle>
          <DialogDescription>
            {didPauseMainTimerRef.current ? "Your reminder timer has finished - your session is paused." : "Your reminder timer has finished."}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-center">
          <Button size="lg" onClick={() => removeAlarm(firing.id)}>Dismiss</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
