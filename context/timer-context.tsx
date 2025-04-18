"use client"; // Mark this context as a Client Component

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { useTasks } from "./task-context"; // Corrected import path

// --- Constants ---
const POMODORO_DURATION = 25 * 60; // 25 minutes
const SHORT_BREAK_DURATION = 5 * 60; // 5 minutes
const LONG_BREAK_DURATION = 15 * 60; // 15 minutes
const POMODOROS_UNTIL_LONG_BREAK = 4;

// --- Types ---
// Export TimerMode to be used by other components
export type TimerMode = "idle" | "working" | "shortBreak" | "longBreak";

interface TimerSettings {
  pomodoro: number;
  shortBreak: number;
  longBreak: number;
  pomodorosUntilLongBreak: number;
  autoPauseEnabled: boolean; // Add setting for auto-pause
}

interface TimerContextType {
  mode: TimerMode;
  timeLeftInMode: number;
  pomodorosCompletedCycle: number; // Pomodoros completed since last long break
  isRunning: boolean; // Export the running state
  settings: TimerSettings;
  startWork: () => void;
  pauseTimer: () => void; // Acts as play/pause
  skipBreak: () => void;
  toggleAutoPause: () => void; // Add function to toggle the setting
  // Add reset function if needed later
}

// --- Context Definition ---
const TimerContext = createContext<TimerContextType | undefined>(undefined);

// --- Provider Component ---
export function TimerProvider({ children }: { children: ReactNode }) {
  // --- State ---
  const [settings, setSettings] = useState<TimerSettings>({ // Future: Load from user settings
    pomodoro: POMODORO_DURATION,
    shortBreak: SHORT_BREAK_DURATION,
    longBreak: LONG_BREAK_DURATION,
    pomodorosUntilLongBreak: POMODOROS_UNTIL_LONG_BREAK,
    autoPauseEnabled: true, // Default to enabled
  });
  const [mode, setMode] = useState<TimerMode>("idle");
  const [timeLeftInMode, setTimeLeftInMode] = useState<number>(settings.pomodoro);
  const [pomodorosCompletedCycle, setPomodorosCompletedCycle] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false); // Internal state to control interval
  const [secondsThisTick, setSecondsThisTick] = useState<number>(0); // New state for seconds counter

  // Get Task Context functions/state
  const { updateTaskProgress, currentTaskId } = useTasks();

  // --- Timer Logic ---
  useEffect(() => {
    let interval: NodeJS.Timeout | undefined = undefined;

    if (isRunning && timeLeftInMode > 0) {
      interval = setInterval(() => {
        // Only decrement time and increment seconds counter here
        setTimeLeftInMode((prevTime) => prevTime - 1);
        if (mode === 'working') {
          setSecondsThisTick(prevSeconds => prevSeconds + 1);
        }
      }, 1000);
    } else if (isRunning && timeLeftInMode === 0) {
      // Time's up, handle transition
      setIsRunning(false); // Stop the timer interval
      setSecondsThisTick(0); // Reset seconds counter

      if (mode === "working") {
        const completed = pomodorosCompletedCycle + 1;
        setPomodorosCompletedCycle(completed);
        // No progress update needed here anymore
        // Determine next break
        if (completed % settings.pomodorosUntilLongBreak === 0) {
          setMode("longBreak");
          setTimeLeftInMode(settings.longBreak);
        } else {
          setMode("shortBreak");
          setTimeLeftInMode(settings.shortBreak);
        }
        // Automatically start the break timer (can be changed later)
        // We set isRunning to true to immediately start the break countdown
        setIsRunning(true);

      } else if (mode === "shortBreak" || mode === "longBreak") {
        // Break finished, go idle, ready for next work session
        setMode("idle");
        setTimeLeftInMode(settings.pomodoro);
        // Reset cycle count after long break
        if (mode === "longBreak") {
            setPomodorosCompletedCycle(0);
        }
        // Ensure timer is stopped when going idle
        setIsRunning(false);
      }
    }

    // Cleanup interval
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, timeLeftInMode, mode]); // Removed context dependencies from *this* effect

  // --- Effect for Per-Minute Progress Update ---
  useEffect(() => {
    if (mode === 'working' && secondsThisTick >= 60) {
      if (currentTaskId) {
        updateTaskProgress(currentTaskId, 1); // Update progress by 1 minute
        console.log(`TIMER CONTEXT (Effect): Updated progress for task ${currentTaskId} by 1 minute.`); // Debug log
      } else {
         console.warn("TIMER CONTEXT (Effect): Minute finished, but no currentTaskId found to update progress.");
      }
      setSecondsThisTick(0); // Reset counter after update
    }
  // Depend on secondsThisTick to trigger check, mode/context vars for conditions
  }, [secondsThisTick, mode, currentTaskId, updateTaskProgress]);

  // --- Actions ---
  const startWork = useCallback(() => {
    // Only allow starting work if idle or after a break was skipped/finished passively
    if (mode === "idle") {
        setTimeLeftInMode(settings.pomodoro);
        // Reset cycle if starting fresh after a long break might have finished passively
        // This logic might need refinement depending on desired reset behavior
        // setPomodorosCompletedCycle(0);
        setMode("working");
        setIsRunning(true);
    }
  }, [mode, settings.pomodoro]);

  const pauseTimer = useCallback(() => {
    // Acts as a toggle Play/Pause button
    if (isRunning) {
        // Pause current activity (work or break)
        setIsRunning(false);
    } else {
        // Resume only if not idle (idle requires startWork)
        if (mode !== "idle") {
            // Ensure we don't resume a completed timer
            if(timeLeftInMode > 0) {
                setIsRunning(true);
            }
        }
    }
  }, [isRunning, mode, timeLeftInMode]);

  const skipBreak = useCallback(() => {
      if (mode === "shortBreak" || mode === "longBreak") {
          setMode("idle");
          setTimeLeftInMode(settings.pomodoro);
          setIsRunning(false);
          // Reset cycle count if skipping long break
          if (mode === "longBreak") {
              setPomodorosCompletedCycle(0);
          }
      }
  }, [mode, settings.pomodoro]);

  const toggleAutoPause = useCallback(() => {
    setSettings(prevSettings => ({
      ...prevSettings,
      autoPauseEnabled: !prevSettings.autoPauseEnabled,
    }));
  }, []);

  // --- Context Value ---
  const value = {
    mode,
    timeLeftInMode,
    pomodorosCompletedCycle,
    isRunning, // Include isRunning in the context value
    settings,
    startWork,
    pauseTimer, // Play/Pause toggle
    skipBreak,
    toggleAutoPause, // Include the toggle function in the context value
  };

  return <TimerContext.Provider value={value}>{children}</TimerContext.Provider>;
}

// --- Hook ---
export function useTimer() {
  const context = useContext(TimerContext);
  if (context === undefined) {
    throw new Error("useTimer must be used within a TimerProvider");
  }
  return context;
} 