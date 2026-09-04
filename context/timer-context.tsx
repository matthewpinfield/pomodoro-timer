"use client"; // Mark this context as a Client Component

import * as React from "react";
import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { useTasks } from "./task-context"; // Corrected import path

// --- Constants (Defaults only) ---
const DEFAULT_POMODORO_MINUTES = 25;
const DEFAULT_SHORT_BREAK_MINUTES = 5;
const DEFAULT_LONG_BREAK_MINUTES = 15;
const DEFAULT_POMODOROS_UNTIL_LONG_BREAK = 4;
const DEFAULT_MONOCHROME = false;
const SETTINGS_STORAGE_KEY = "focuspie-timer-settings";

// --- Types ---
// Export TimerMode to be used by other components
export type TimerMode = "idle" | "working" | "shortBreak" | "longBreak";

// Define the shape of the timer settings
// Export the interface
export interface TimerSettings {
  pomodoro: number; // Duration in seconds
  shortBreak: number; // Duration in seconds
  longBreak: number; // Duration in seconds
  pomodorosUntilLongBreak: number;
  monochromeEnabled?: boolean; // Re-add monochrome setting
  autoPauseEnabled: boolean; // Added auto-pause setting
}

interface TimerContextType {
  mode: TimerMode;
  timeLeftInMode: number;
  taskTimeLeft: number;
  sessionTotalDuration: number; // The total duration of the current session (useful for dynamic bounds)
  pomodorosCompletedCycle: number; // Pomodoros completed since last long break
  isRunning: boolean; // Export the running state
  settings: TimerSettings;
  startWork: () => void;
  pauseTimer: () => void; // Acts as play/pause
  skipBreak: () => void;
  toggleAutoPause: () => void;
  // Add function to update settings
  updateTimerSetting: (key: keyof Omit<TimerSettings, 'autoPauseEnabled'>, valueInMinutes: number) => void;
  // Add reset function if needed later
}

// --- Context Definition ---
const TimerContext = createContext<TimerContextType | undefined>(undefined);

// Helper to get initial settings
const getInitialSettings = (): TimerSettings => {
  let savedSettings: Partial<TimerSettings> = {};
  if (typeof window !== 'undefined') {
    try {
      const savedData = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (savedData) {
        savedSettings = JSON.parse(savedData);
      }
    } catch (error) {
      console.error("Error reading timer settings from localStorage:", error);
    }
  }
  // Return merged settings with defaults, ensuring durations are in seconds
  return {
    pomodoro: (savedSettings.pomodoro ?? DEFAULT_POMODORO_MINUTES) * 60,
    shortBreak: (savedSettings.shortBreak ?? DEFAULT_SHORT_BREAK_MINUTES) * 60,
    longBreak: (savedSettings.longBreak ?? DEFAULT_LONG_BREAK_MINUTES) * 60,
    pomodorosUntilLongBreak: savedSettings.pomodorosUntilLongBreak ?? DEFAULT_POMODOROS_UNTIL_LONG_BREAK,
    autoPauseEnabled: savedSettings.autoPauseEnabled ?? false,
  };
};

// --- Provider Component ---
export function TimerProvider({ children }: { children: ReactNode }) {
  // Get Task Context functions/state
  const { tasks, updateTaskProgress, currentTaskId } = useTasks();

  const currentTask = React.useMemo(() => {
    return currentTaskId ? tasks.find(t => t.id === currentTaskId) : undefined;
  }, [tasks, currentTaskId]);

  // --- State ---
  const [settings, setSettings] = useState<TimerSettings>(getInitialSettings); // Load initial settings
  const [mode, setMode] = useState<TimerMode>("idle");
  
  // Define calculateIdleDuration BEFORE it's used in state initialization or effects
  const calculateIdleDuration = useCallback(() => {
    let duration = settings.pomodoro;
    if (currentTask) {
       let taskSecondsLeft = (currentTask.goalTimeMinutes * 60) - (currentTask.progressMinutes * 60);
       if (typeof window !== 'undefined') {
           const saved = localStorage.getItem(`focuspie-taskTimeLeft-${currentTask.id}`);
           if (saved) {
               const parsed = parseInt(saved, 10);
               if (!isNaN(parsed) && parsed > 0) {
                   taskSecondsLeft = parsed;
               }
           }
       }
       if (taskSecondsLeft > 0) {
           duration = taskSecondsLeft;
       }
    }
    return duration;
  }, [settings.pomodoro, currentTask]);

  const calculateSessionTotalDuration = useCallback(() => {
    if (currentTask && currentTask.goalTimeMinutes > 0) {
      return currentTask.goalTimeMinutes * 60;
    }
    return settings.pomodoro;
  }, [settings.pomodoro, currentTask]);

  const [timeLeftInMode, setTimeLeftInMode] = useState<number>(calculateIdleDuration());
  const [taskTimeLeft, setTaskTimeLeft] = useState<number>(calculateIdleDuration());
  const [sessionTotalDuration, setSessionTotalDuration] = useState<number>(calculateSessionTotalDuration());
  const [pomodorosCompletedCycle, setPomodorosCompletedCycle] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false); // Internal state to control interval
  const [secondsThisTick, setSecondsThisTick] = useState<number>(0); // New state for seconds counter

  // --- Effect to Save Settings to localStorage ---
  useEffect(() => {
    try {
      // Save settings in minutes for easier reading/editing if needed
      const settingsToSave = {
        ...settings,
        pomodoro: settings.pomodoro / 60,
        shortBreak: settings.shortBreak / 60,
        longBreak: settings.longBreak / 60,
      };
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settingsToSave));
    } catch (error) {
      console.error("Error saving timer settings to localStorage:", error);
    }
  }, [settings]);

  // --- Effect to update timeLeftInMode if settings change AND timer is idle ---
  useEffect(() => {
    if (mode === 'idle') {
      const idleDur = calculateIdleDuration();
      const totalDur = calculateSessionTotalDuration();
      setTimeLeftInMode(idleDur);
      setSessionTotalDuration(totalDur);
    }
  }, [mode, calculateIdleDuration, calculateSessionTotalDuration]);

  // --- Reset Timer when user switches tasks ---
  const prevTaskIdRef = React.useRef(currentTaskId);
  useEffect(() => {
    if (prevTaskIdRef.current !== currentTaskId) {
       setIsRunning(false);
       setMode("idle");
       setSecondsThisTick(0);
       
       // Sync taskTimeLeft when switching
       const newIdleDur = calculateIdleDuration();
       setTaskTimeLeft(newIdleDur);
       setTimeLeftInMode(newIdleDur);
       setSessionTotalDuration(calculateSessionTotalDuration());
       
       prevTaskIdRef.current = currentTaskId;
    }
  }, [currentTaskId, calculateIdleDuration, calculateSessionTotalDuration]);

  // --- Effect to persist taskTimeLeft to localStorage ---
  useEffect(() => {
    if (currentTaskId && !isNaN(taskTimeLeft)) {
      localStorage.setItem(`focuspie-taskTimeLeft-${currentTaskId}`, taskTimeLeft.toString());
    }
  }, [taskTimeLeft, currentTaskId]);

  // --- Timer Logic (Background Safe) ---
  const lastTickRef = React.useRef<number | null>(null);

  useEffect(() => {
    let animationFrameId: number;

    const tick = (timestamp: number) => {
      if (!lastTickRef.current) {
        lastTickRef.current = timestamp;
      }

      const deltaMs = timestamp - lastTickRef.current;
      
      // If 1 second (1000ms) has passed since the last tick
      if (deltaMs >= 1000) {
        // Calculate how many full seconds actually passed (important for heavy throttling)
        const secondsPassed = Math.floor(deltaMs / 1000);
        
        // Update the last tick time, keeping the remainder to prevent drift
        lastTickRef.current = timestamp - (deltaMs % 1000);

        setTimeLeftInMode((prevTime) => {
          const newTime = Math.max(0, prevTime - secondsPassed);
          
          if (newTime === 0 && prevTime > 0) {
             // Let the next effect iteration handle the 0 state transition
             return 0;
          }
          return newTime;
        });

        if (mode === 'working') {
          // Add actual seconds passed to the bucket for progress updates
          setSecondsThisTick(prev => prev + secondsPassed);
        }
      }

      if (isRunning && timeLeftInMode > 0) {
        animationFrameId = requestAnimationFrame(tick);
      }
    };

    if (isRunning && timeLeftInMode > 0) {
      animationFrameId = requestAnimationFrame(tick);
    } else if (isRunning && timeLeftInMode === 0) {
       // Time's up, handle transition
       setIsRunning(false); // Stop the timer
       setSecondsThisTick(0); // Reset seconds counter
       lastTickRef.current = null; // Reset tick ref

       if (mode === "working") {
         const completed = pomodorosCompletedCycle + 1;
         setPomodorosCompletedCycle(completed);
         
         // Determine next break
         if (completed % settings.pomodorosUntilLongBreak === 0) {
           setMode("longBreak");
           setTimeLeftInMode(settings.longBreak);
           setSessionTotalDuration(settings.longBreak);
         } else {
           setMode("shortBreak");
           setTimeLeftInMode(settings.shortBreak);
           setSessionTotalDuration(settings.shortBreak);
         }
         // Automatically start the break timer
         setIsRunning(true);

       } else if (mode === "shortBreak" || mode === "longBreak") {
         // Break finished, go idle, ready for next work session
         setMode("idle");
         const idleDur = calculateIdleDuration();
         const totalDur = calculateSessionTotalDuration();
         setTimeLeftInMode(idleDur);
         setSessionTotalDuration(totalDur);
         // Reset cycle count after long break
         if (mode === "longBreak") {
             setPomodorosCompletedCycle(0);
         }
       }
    } else if (!isRunning) {
        lastTickRef.current = null;
    }

    // Cleanup 
    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [isRunning, timeLeftInMode, mode, pomodorosCompletedCycle, settings, calculateIdleDuration, calculateSessionTotalDuration]);

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

  // --- Effect for Auto-Pause on Visibility Change ---
  useEffect(() => {
    const handleVisibilityChange = () => {
      // Check setting before pausing
      if (settings.autoPauseEnabled && isRunning && document.visibilityState === 'hidden') {
        console.log("TIMER_CONTEXT: Auto-pausing due to visibility change (setting enabled).");
        setIsRunning(false); 
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    console.log("TIMER_CONTEXT: Attached visibilitychange listener.");

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      console.log("TIMER_CONTEXT: Removed visibilitychange listener.");
    };
  // Add settings.autoPauseEnabled dependency
  }, [isRunning, settings.autoPauseEnabled]);

  // --- Actions ---
  const startWork = useCallback(() => {
    // Only allow starting work if idle or after a break was skipped/finished passively
    if (mode === "idle") {
        const workDuration = calculateIdleDuration();
        const totalDur = calculateSessionTotalDuration();
        setTimeLeftInMode(workDuration);
        setSessionTotalDuration(totalDur);
        setMode("working");
        setIsRunning(true);
    }
  }, [mode, calculateIdleDuration, calculateSessionTotalDuration]);

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
          const idleDur = calculateIdleDuration();
          const totalDur = calculateSessionTotalDuration();
          setTimeLeftInMode(idleDur);
          setSessionTotalDuration(totalDur);
          setIsRunning(false);
          // Reset cycle count if skipping long break
          if (mode === "longBreak") {
              setPomodorosCompletedCycle(0);
          }
      }
  }, [mode, settings.pomodoro, calculateIdleDuration, calculateSessionTotalDuration]);

  // RE-ADD toggleAutoPause function
  const toggleAutoPause = useCallback(() => {
    setSettings(prevSettings => ({
      ...prevSettings,
      autoPauseEnabled: !prevSettings.autoPauseEnabled,
    }));
    console.log(`TIMER_CONTEXT: Toggled autoPause to ${!settings.autoPauseEnabled}`);
  }, [settings.autoPauseEnabled]);

  // NEW: Function to update timer duration settings
  const updateTimerSetting = useCallback((key: keyof Omit<TimerSettings, 'autoPauseEnabled'>, valueInMinutes: number) => {
    // Basic validation (ensure positive integer)
    const validValueMinutes = Math.max(1, Math.floor(valueInMinutes)); 
    setSettings(prevSettings => ({
      ...prevSettings,
      // Store value in seconds
      [key]: key === 'pomodorosUntilLongBreak' ? validValueMinutes : validValueMinutes * 60,
    }));
  }, []);

  // --- Context Value ---
  const value = {
    mode,
    timeLeftInMode,
    taskTimeLeft,
    sessionTotalDuration,
    pomodorosCompletedCycle,
    isRunning, // Include isRunning in the context value
    settings,
    startWork,
    pauseTimer, // Play/Pause toggle
    skipBreak,
    toggleAutoPause, // RE-ADD to value
    updateTimerSetting, // Add new function to context
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