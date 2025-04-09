"use client"

import { useRef, useEffect } from "react"
import { motion } from "framer-motion"
import { Clock } from "lucide-react"
import type { TimerMode } from "@/context/timer-context"; // Import TimerMode type
import { useTimer } from "@/context/timer-context"; // Import the hook

interface TimerCircleProps {
  mode: TimerMode; // To know if working or break
  currentModeTotalDuration: number; // Total seconds for the current mode (work/break)
  timeLeftInMode: number; // Seconds left in the current mode (replaces old timeDisplay calculation)
  taskProgress: number; // Real-time task progress [0, 1]
  timeDisplay: string; // Formatted string for timeLeftInMode
  taskName: string;
  isRunning: boolean; // Represents if the context timer is running
  onTimerClick: () => void;
  taskGoalMinutes?: number;
  taskTimeLeftSeconds?: number;
}

export function TimerCircle({
  mode,
  currentModeTotalDuration,
  timeLeftInMode,
  taskProgress,
  timeDisplay,
  taskName,
  isRunning,
  onTimerClick,
  taskGoalMinutes = 120, // Default to 2 hours in minutes
  taskTimeLeftSeconds = 7200, // Task time left in seconds (default 2 hours)
}: TimerCircleProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { settings } = useTimer(); // Get settings from context

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas dimensions with device pixel ratio
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)

    // Clear canvas
    ctx.clearRect(0, 0, rect.width, rect.height)

    const centerX = rect.width / 2
    const centerY = rect.height / 2
    const radius = Math.min(centerX, centerY) - 10
    const trackWidth = 30
    const innerRadius = radius - trackWidth - 5 // Keep inner circle calculation
    const startAngle = -Math.PI / 2; // This is already set to 12 o'clock
    const fullCircle = Math.PI * 2

    // --- Draw Background Track (Original Style - Light Gray Circle Segment) ---
    // Draw a full light gray circle as the base background for the arcs
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius - trackWidth / 2, 0, fullCircle)
    ctx.lineWidth = trackWidth;
    ctx.strokeStyle = "#e2e8f0" // Light gray
    ctx.stroke()

    // --- Draw Task Progress Arc (Red - Overall Task Remaining Time) ---
    const totalTaskSeconds = (taskGoalMinutes || 1) * 60; // Use 1 minute if 0 to avoid division by zero
    let taskArcFraction = 1; // Default to full circle if no task goal
    if (totalTaskSeconds > 0) {
      taskArcFraction = Math.min(taskTimeLeftSeconds / totalTaskSeconds, 1);
    }
    const taskArcSize = fullCircle * taskArcFraction;

    // Determine opacity based on running state
    const opacitySuffix = isRunning ? "" : "80"; // "80" hex for 50% opacity

    // Always draw the red arc
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius - trackWidth / 2, startAngle, startAngle + taskArcSize);
    ctx.lineWidth = trackWidth;
    ctx.lineCap = "round";
    ctx.strokeStyle = `#ef4444${opacitySuffix}`; // Red with conditional opacity
    ctx.stroke();

    // --- Draw Current Mode Progress Arc (Blue/Green - Session Time Remaining) ---
    const modeProgress = timeLeftInMode / currentModeTotalDuration; // Progress within the current session [0, 1]
    let baseModeColor = "#3b82f6"; // Blue for working
    let currentModeArcSize = fullCircle * modeProgress; // Base arc size for breaks or if no task context

    if (mode === 'working' && totalTaskSeconds > 0) {
        // Scale the work session arc relative to the total task duration
        const maxWorkSessionArc = (currentModeTotalDuration / totalTaskSeconds) * fullCircle;
        currentModeArcSize = modeProgress * maxWorkSessionArc;
        baseModeColor = "#3b82f6"; // Ensure blue for working

        const completedTaskArc = fullCircle * (1 - taskArcFraction);
        const blueArcStartAngle = startAngle + completedTaskArc;
        const blueArcEndAngle = blueArcStartAngle + currentModeArcSize;

        // Always draw the blue arc
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius - trackWidth / 2, blueArcStartAngle, blueArcEndAngle);
        ctx.lineWidth = trackWidth;
        ctx.lineCap = "round";
        ctx.strokeStyle = `${baseModeColor}${opacitySuffix}`; // Apply conditional opacity
        ctx.stroke();

    } else if (mode === 'shortBreak' || mode === 'longBreak') {
        baseModeColor = "#10b981"; // Green for breaks
        const breakArcEndAngle = startAngle + currentModeArcSize;

        // Always draw the green arc
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius - trackWidth / 2, startAngle, breakArcEndAngle);
        ctx.lineWidth = trackWidth;
        ctx.lineCap = "round";
        ctx.strokeStyle = `${baseModeColor}${opacitySuffix}`; // Apply conditional opacity
        ctx.stroke();
    }
    // Note: The 'idle' mode doesn't draw a progress arc intentionally based on previous logic.
    // If idle should show something (e.g., full transparent blue/red), logic needs adjustment here.

    // --- Draw Center Circle & Text (remains the same) ---
    // Center white circle with shadow
    ctx.save()
    ctx.beginPath()
    ctx.arc(centerX, centerY, innerRadius, 0, fullCircle)
    ctx.shadowColor = "rgba(0, 0, 0, 0.1)"
    ctx.shadowBlur = 10
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 4
    ctx.fillStyle = "#ffffff"
    ctx.fill()
    ctx.restore()

    // Play/pause icon
    ctx.save()
    ctx.fillStyle = "#e5e7eb" // Light grey
    if (isRunning) {
      // Pause icon
      const pauseWidth = 24; const pauseHeight = 30;
      const pauseX = centerX - pauseWidth / 2; const pauseY = centerY - pauseHeight / 2;
      ctx.fillRect(pauseX, pauseY, 8, pauseHeight);
      ctx.fillRect(pauseX + 16, pauseY, 8, pauseHeight);
    } else {
      // Play icon
      ctx.beginPath();
      ctx.moveTo(centerX - 10, centerY - 15);
      ctx.lineTo(centerX - 10, centerY + 15);
      ctx.lineTo(centerX + 15, centerY);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore()

    // Main time display
    ctx.font = "bold 32px Inter, system-ui, sans-serif"
    ctx.fillStyle = "#334155"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.fillText(timeDisplay, centerX, centerY - 10)

    // Subtitle (Task name or Break status)
    let subtitle = taskName;
    if (mode === 'shortBreak') subtitle = 'Short Break';
    if (mode === 'longBreak') subtitle = 'Long Break';
    if (mode === 'idle') subtitle = 'Ready'; // Or taskName

    ctx.font = "14px Inter, system-ui, sans-serif"
    ctx.fillStyle = "#94a3b8"
    ctx.fillText(subtitle, centerX, centerY + 15)

    // Task time remaining
    if (mode === 'working' && taskTimeLeftSeconds !== undefined && taskTimeLeftSeconds >= 0) {
      const hoursLeft = Math.floor(taskTimeLeftSeconds / 3600)
      const minutesLeft = Math.floor((taskTimeLeftSeconds % 3600) / 60)
      const taskTimeDisplay = `${hoursLeft}:${minutesLeft.toString().padStart(2, "0")}`
      ctx.font = "12px Inter, system-ui, sans-serif"
      ctx.fillStyle = "#94a3b8"
      ctx.fillText(taskTimeDisplay + " remaining", centerX, centerY + 35)
    }

  }, [mode, currentModeTotalDuration, timeLeftInMode, taskProgress, timeDisplay, taskName, isRunning, taskGoalMinutes, taskTimeLeftSeconds]) // Ensure all props used are dependencies

  // Add event listener for visibility change to auto-pause the timer
  useEffect(() => {
    const handleVisibilityChange = () => {
      // Only pause if the setting is enabled and the timer is running
      if (settings.autoPauseEnabled && isRunning && document.visibilityState === 'hidden') {
        onTimerClick(); // This function likely toggles pause/resume
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [settings.autoPauseEnabled, isRunning, onTimerClick]); // Add dependencies

  return (
    <div className="flex flex-col items-center">
      <motion.div
        className="relative cursor-pointer"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onTimerClick}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <canvas ref={canvasRef} width={300} height={300} className="w-72 h-72 md:w-80 md:h-80" />
      </motion.div>

      {/* Task time label underneath the circle */}
      <div className="flex items-center text-sm text-gray-500 mt-4">
        <Clock className="w-4 h-4 mr-1" />
        <span>
          {Math.floor(taskGoalMinutes / 60)}h{taskGoalMinutes % 60 > 0 ? ` ${taskGoalMinutes % 60}m` : ""} task
        </span>
      </div>
    </div>
  )
}

