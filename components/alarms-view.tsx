"use client"

import { useState } from "react"
import { AlarmClock, Pause, Play, X } from "lucide-react"
import { useAlarms, type AlarmItem } from "@/context/alarm-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { formatTime } from "@/lib/utils"

const PRESET_MINUTES = [1, 5, 10, 15, 30]

export function AlarmsView() {
  const { alarms, addAlarm, pauseAlarm, resumeAlarm, removeAlarm, getRemainingSeconds } = useAlarms()
  const [customMinutes, setCustomMinutes] = useState("")
  const [label, setLabel] = useState("")

  const handleAdd = (minutes: number) => {
    if (minutes <= 0) return
    addAlarm(minutes * 60, label)
    setLabel("")
    setCustomMinutes("")
  }

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleAdd(parseFloat(customMinutes))
  }

  return (
    <div className="w-full max-w-lg mx-auto flex flex-col gap-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Alarms</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Set a quick reminder without losing your place - it&apos;ll pause your session when it goes off.
        </p>
      </div>

      <div className="glass-card rounded-[1.5rem] p-5 sm:p-6 flex flex-col gap-4">
        <div className="flex flex-wrap gap-2 justify-center">
          {PRESET_MINUTES.map((minutes) => (
            <Button key={minutes} variant="secondary" onClick={() => handleAdd(minutes)}>
              {minutes}m
            </Button>
          ))}
        </div>

        <form onSubmit={handleCustomSubmit} className="flex flex-col sm:flex-row gap-2">
          <Input
            type="number"
            min="0"
            step="any"
            inputMode="decimal"
            placeholder="Custom minutes"
            value={customMinutes}
            onChange={(e) => setCustomMinutes(e.target.value)}
            className="flex-1"
          />
          <Input
            type="text"
            placeholder="Label (optional)"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            maxLength={60}
            className="flex-1"
          />
          <Button type="submit" disabled={!customMinutes}>Start</Button>
        </form>
      </div>

      {alarms.length > 0 && (
        <div className="flex flex-col gap-3">
          {alarms.map((alarm) => (
            <AlarmRow
              key={alarm.id}
              alarm={alarm}
              remainingSeconds={getRemainingSeconds(alarm)}
              onPause={() => pauseAlarm(alarm.id)}
              onResume={() => resumeAlarm(alarm.id)}
              onRemove={() => removeAlarm(alarm.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function AlarmRow({
  alarm,
  remainingSeconds,
  onPause,
  onResume,
  onRemove,
}: {
  alarm: AlarmItem
  remainingSeconds: number
  onPause: () => void
  onResume: () => void
  onRemove: () => void
}) {
  const isPaused = alarm.endAt === null

  return (
    <div className="glass-card rounded-2xl px-4 sm:px-5 py-3 flex items-center gap-3">
      <AlarmClock className="w-5 h-5 text-primary flex-shrink-0" />
      <div className="flex-1 min-w-0">
        {alarm.label && <p className="text-sm font-medium text-foreground truncate">{alarm.label}</p>}
        <p className="font-digital text-xl tabular-nums text-foreground">{formatTime(remainingSeconds)}</p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        aria-label={isPaused ? "Resume timer" : "Pause timer"}
        onClick={isPaused ? onResume : onPause}
      >
        {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
      </Button>
      <Button variant="ghost" size="icon" aria-label="Cancel timer" onClick={onRemove}>
        <X className="w-4 h-4" />
      </Button>
    </div>
  )
}
