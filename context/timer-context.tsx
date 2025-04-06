"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { useSettings } from "./settings-context"

interface TimerState {
  isRunning: boolean
  timeLeft: number
  currentPhase: "work" | "shortBreak" | "longBreak"
  cyclesCompleted: number
}

interface TimerContextType {
  timerState: TimerState
  startTimer: () => void
  pauseTimer: () => void
  resetTimer: () => void
  skipPhase: () => void
}

const TimerContext = createContext<TimerContextType | undefined>(undefined)

export function TimerProvider({ children }: { children: ReactNode }) {
  const { settings } = useSettings()
  const [timerState, setTimerState] = useState<TimerState>({
    isRunning: false,
    timeLeft: settings.workDuration * 60,
    currentPhase: "work",
    cyclesCompleted: 0,
  })

  // Update timer state when settings change
  useEffect(() => {
    if (!timerState.isRunning) {
      setTimerState((prev) => ({
        ...prev,
        timeLeft: settings.workDuration * 60,
      }))
    }
  }, [settings.workDuration])

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout

    if (timerState.isRunning && timerState.timeLeft > 0) {
      interval = setInterval(() => {
        setTimerState((prev) => {
          const newTimeLeft = prev.timeLeft - 1

          // If timer reaches zero, move to next phase
          if (newTimeLeft === 0) {
            if (prev.currentPhase === "work") {
              const newCyclesCompleted = prev.cyclesCompleted + 1
              const isLongBreak = newCyclesCompleted % settings.cyclesBeforeLongBreak === 0

              return {
                isRunning: false,
                timeLeft: isLongBreak ? settings.longBreakDuration * 60 : settings.shortBreakDuration * 60,
                currentPhase: isLongBreak ? "longBreak" : "shortBreak",
                cyclesCompleted: newCyclesCompleted,
              }
            } else {
              return {
                isRunning: false,
                timeLeft: settings.workDuration * 60,
                currentPhase: "work",
                cyclesCompleted: prev.cyclesCompleted,
              }
            }
          }

          return {
            ...prev,
            timeLeft: newTimeLeft,
          }
        })
      }, 1000)
    }

    return () => clearInterval(interval)
  }, [timerState.isRunning, settings])

  const startTimer = () => {
    setTimerState((prev) => ({ ...prev, isRunning: true }))
  }

  const pauseTimer = () => {
    setTimerState((prev) => ({ ...prev, isRunning: false }))
  }

  const resetTimer = () => {
    setTimerState({
      isRunning: false,
      timeLeft: settings.workDuration * 60,
      currentPhase: "work",
      cyclesCompleted: 0,
    })
  }

  const skipPhase = () => {
    if (timerState.currentPhase === "work") {
      const newCyclesCompleted = timerState.cyclesCompleted + 1
      const isLongBreak = newCyclesCompleted % settings.cyclesBeforeLongBreak === 0

      setTimerState({
        isRunning: false,
        timeLeft: isLongBreak ? settings.longBreakDuration * 60 : settings.shortBreakDuration * 60,
        currentPhase: isLongBreak ? "longBreak" : "shortBreak",
        cyclesCompleted: newCyclesCompleted,
      })
    } else {
      setTimerState({
        isRunning: false,
        timeLeft: settings.workDuration * 60,
        currentPhase: "work",
        cyclesCompleted: timerState.cyclesCompleted,
      })
    }
  }

  return (
    <TimerContext.Provider
      value={{
        timerState,
        startTimer,
        pauseTimer,
        resetTimer,
        skipPhase,
      }}
    >
      {children}
    </TimerContext.Provider>
  )
}

export function useTimer() {
  const context = useContext(TimerContext)
  if (context === undefined) {
    throw new Error("useTimer must be used within a TimerProvider")
  }
  return context
} 