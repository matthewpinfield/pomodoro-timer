"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import { v4 as uuidv4 } from "uuid"

const STORAGE_KEY = "focuspie-alarms"
// Just forces a re-render often enough for a smooth-looking countdown display.
// Correctness comes from the wall-clock `endAt` deadline below, not this tick -
// a backgrounded/throttled tab can only ever make the countdown *look* choppy,
// never make it late or early.
const DISPLAY_TICK_MS = 250

export interface AlarmItem {
  id: string
  label: string
  durationSeconds: number
  endAt: number | null // epoch ms this alarm will fire at; null while paused
  remainingSecondsAtPause: number | null // snapshot taken when paused, to resume from
  firing: boolean // true once it has reached zero and hasn't been dismissed yet
}

interface AlarmContextType {
  alarms: AlarmItem[]
  addAlarm: (durationSeconds: number, label?: string) => void
  pauseAlarm: (id: string) => void
  resumeAlarm: (id: string) => void
  removeAlarm: (id: string) => void
  getRemainingSeconds: (alarm: AlarmItem) => number
}

const AlarmContext = createContext<AlarmContextType | undefined>(undefined)

export function AlarmProvider({ children }: { children: ReactNode }) {
  const [alarms, setAlarms] = useState<AlarmItem[]>([])
  const [, forceTick] = useState(0)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        setAlarms(JSON.parse(saved))
      }
    } catch (error) {
      console.error("Error reading alarms from localStorage:", error)
    }
  }, [])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(alarms))
  }, [alarms])

  const getRemainingSeconds = useCallback((alarm: AlarmItem): number => {
    if (alarm.endAt === null) {
      return alarm.remainingSecondsAtPause ?? alarm.durationSeconds
    }
    return Math.max(0, Math.round((alarm.endAt - Date.now()) / 1000))
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      forceTick((n) => n + 1)
      setAlarms((prev) => {
        let changed = false
        const next = prev.map((a) => {
          if (a.endAt !== null && !a.firing && Date.now() >= a.endAt) {
            changed = true
            return { ...a, firing: true }
          }
          return a
        })
        return changed ? next : prev
      })
    }, DISPLAY_TICK_MS)
    return () => clearInterval(interval)
  }, [])

  const addAlarm = useCallback((durationSeconds: number, label?: string) => {
    const newAlarm: AlarmItem = {
      id: uuidv4(),
      label: label?.trim() || "",
      durationSeconds,
      endAt: Date.now() + durationSeconds * 1000,
      remainingSecondsAtPause: null,
      firing: false,
    }
    setAlarms((prev) => [...prev, newAlarm])
  }, [])

  const pauseAlarm = useCallback((id: string) => {
    setAlarms((prev) =>
      prev.map((a) => {
        if (a.id !== id || a.endAt === null) return a
        const remaining = Math.max(0, Math.round((a.endAt - Date.now()) / 1000))
        return { ...a, endAt: null, remainingSecondsAtPause: remaining }
      }),
    )
  }, [])

  const resumeAlarm = useCallback((id: string) => {
    setAlarms((prev) =>
      prev.map((a) => {
        if (a.id !== id || a.endAt !== null) return a
        const remaining = a.remainingSecondsAtPause ?? a.durationSeconds
        return { ...a, endAt: Date.now() + remaining * 1000, remainingSecondsAtPause: null }
      }),
    )
  }, [])

  const removeAlarm = useCallback((id: string) => {
    setAlarms((prev) => prev.filter((a) => a.id !== id))
  }, [])

  const value = { alarms, addAlarm, pauseAlarm, resumeAlarm, removeAlarm, getRemainingSeconds }

  return <AlarmContext.Provider value={value}>{children}</AlarmContext.Provider>
}

export function useAlarms() {
  const context = useContext(AlarmContext)
  if (context === undefined) {
    throw new Error("useAlarms must be used within an AlarmProvider")
  }
  return context
}
