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
    const radius = Math.min(centerX, centerY) * 0.95 // 5% padding
    const trackWidth = Math.min(centerX, centerY) * 0.2  // 20% of radius for track
    const innerRadius = radius - trackWidth - (radius * 0.02) // 2% gap
    const startAngle = -Math.PI / 2
    const fullCircle = Math.PI * 2

    // Calculate responsive sizes
    const shadowBlur = Math.min(centerX, centerY) * 0.15    // Increased from 8% to 15% of radius
    const shadowOffset = Math.min(centerX, centerY) * 0.08   // Increased from 3% to 8% of radius
    const iconSize = Math.min(centerX, centerY) * 0.15 // 15% of radius for icons

    // Play/pause icon dimensions
    const pauseWidth = iconSize * 0.8
    const pauseHeight = iconSize
    const pauseBarWidth = pauseWidth * 0.3

    // Font sizes based on canvas size
    const fontSizes = {
      xs: Math.round(rect.width * 0.03),  // 3% of width
      sm: Math.round(rect.width * 0.035), // 3.5% of width
      lg: Math.round(rect.width * 0.12),  // Increased from 8% to 12% of width
    }

    // Layer 1: Base (Gray Track)
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius - trackWidth / 2, 0, fullCircle);
    ctx.lineWidth = trackWidth;
    ctx.strokeStyle = "hsl(210, 40%, 85%)"; // Made base layer much darker (from 96.1% to 85%)
    ctx.stroke();
    ctx.restore();

    // Layer 2: Mattress (Red Task Progress) - No shadow
    ctx.save();
    const totalTaskSeconds = (taskGoalMinutes || 1) * 60;
    let taskArcFraction = 1;
    if (totalTaskSeconds > 0) {
      taskArcFraction = Math.min(taskTimeLeftSeconds / totalTaskSeconds, 1);
    }
    const taskArcSize = fullCircle * taskArcFraction;

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius - trackWidth / 2, startAngle, startAngle + taskArcSize);
    ctx.lineWidth = trackWidth;
    ctx.lineCap = "round";
    ctx.strokeStyle = "hsl(0, 84.2%, 60.2%)"; // Red layer color
    ctx.stroke();
    ctx.restore();

    // Layer 3: Sheet (Blue/Green Progress) - No individual shadow
    ctx.save();
    const modeProgress = timeLeftInMode / currentModeTotalDuration;
    let baseModeColor = "hsl(221.2, 83.2%, 53.3%)"; // Blue layer color
    let currentModeArcSize = fullCircle * modeProgress;

    if (mode === 'working' && totalTaskSeconds > 0) {
        const maxWorkSessionArc = (currentModeTotalDuration / totalTaskSeconds) * fullCircle;
        currentModeArcSize = modeProgress * maxWorkSessionArc;
        const blueArcStartAngle = startAngle;
        const blueArcEndAngle = startAngle + currentModeArcSize;
        
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius - trackWidth / 2, blueArcStartAngle, blueArcEndAngle);
        ctx.lineWidth = trackWidth;
        ctx.lineCap = "round";
        ctx.strokeStyle = baseModeColor;
        ctx.stroke();
    } else if (mode === 'shortBreak' || mode === 'longBreak') {
        baseModeColor = "hsl(142.1, 76.2%, 36.3%)"; // Green layer color
        const breakArcEndAngle = startAngle + currentModeArcSize;

        ctx.beginPath();
        ctx.arc(centerX, centerY, radius - trackWidth / 2, startAngle, breakArcEndAngle);
        ctx.lineWidth = trackWidth;
        ctx.lineCap = "round";
        ctx.strokeStyle = baseModeColor;
        ctx.stroke();
    }
    ctx.restore();

    // Layer 4: Duvet (White Center) - Enhanced shadow
    ctx.save();
    // Draw shadow first (slightly larger than the white circle)
    ctx.beginPath();
    ctx.arc(centerX, centerY, innerRadius + (trackWidth * 0.1), 0, fullCircle);
    ctx.shadowColor = "rgba(0, 0, 0, 0.7)";  // 70% opacity for stronger shadow
    ctx.shadowBlur = shadowBlur;
    ctx.shadowOffsetX = shadowOffset;
    ctx.shadowOffsetY = shadowOffset;
    ctx.fillStyle = "rgba(0, 0, 0, 0.45)";  // 45% opacity for shadow base
    ctx.fill();
    
    // Draw white circle on top
    ctx.beginPath();
    ctx.arc(centerX, centerY, innerRadius, 0, fullCircle);
    ctx.shadowColor = "rgba(0, 0, 0, 0.6)";  // 60% opacity
    ctx.shadowBlur = shadowBlur * 0.7;
    ctx.shadowOffsetX = shadowOffset * 0.7;
    ctx.shadowOffsetY = shadowOffset * 0.7;
    ctx.fillStyle = "hsl(0, 0%, 100%)";
    ctx.fill();
    ctx.restore();

    // Play/pause icon
    ctx.save()
    ctx.fillStyle = "hsl(215.4, 16.3%, 75%)" // Light gray color
    if (isRunning) {
      // Pause icon - Two distinct bars with space between
      const pauseX = centerX - pauseWidth / 2;
      const pauseY = centerY - pauseHeight / 2;
      const barSpacing = pauseWidth * 0.2; // 20% of width as spacing between bars
      
      // Left bar
      ctx.fillRect(pauseX, pauseY, pauseBarWidth, pauseHeight);
      
      // Right bar (positioned after the spacing)
      ctx.fillRect(pauseX + pauseBarWidth + barSpacing, pauseY, pauseBarWidth, pauseHeight);
    } else {
      // Play icon
      ctx.beginPath();
      ctx.moveTo(centerX - iconSize * 0.5, centerY - iconSize * 0.75);
      ctx.lineTo(centerX - iconSize * 0.5, centerY + iconSize * 0.75);
      ctx.lineTo(centerX + iconSize * 0.75, centerY);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore()

    // Main time display
    ctx.font = `bold ${fontSizes.lg}px var(--font-doto), sans-serif`
    ctx.fillStyle = "hsl(var(--foreground))" // Use theme color
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.fillText(timeDisplay, centerX, centerY - iconSize * 0.5)

    // Subtitle (Task name or Break status)
    let subtitle = taskName;
    if (mode === 'shortBreak') subtitle = 'Short Break';
    if (mode === 'longBreak') subtitle = 'Long Break';
    if (mode === 'idle') subtitle = 'Ready'; // Or taskName

    ctx.font = `${fontSizes.sm}px var(--font-doto), sans-serif`
    ctx.fillStyle = "hsl(var(--muted-foreground))" // Use theme color
    ctx.fillText(subtitle, centerX, centerY + iconSize * 0.75)

    // Task time remaining
    if (mode === 'working' && taskTimeLeftSeconds !== undefined && taskTimeLeftSeconds >= 0) {
      const hoursLeft = Math.floor(taskTimeLeftSeconds / 3600)
      const minutesLeft = Math.floor((taskTimeLeftSeconds % 3600) / 60)
      const taskTimeDisplay = `${hoursLeft}:${minutesLeft.toString().padStart(2, "0")}`
      ctx.font = `${fontSizes.xs}px Inter, system-ui, sans-serif`
      ctx.fillStyle = "hsl(var(--muted-foreground))" // Use theme color
      ctx.fillText(`${hoursLeft}h ${minutesLeft}m remaining`, centerX, centerY + 35)
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
        <canvas 
          ref={canvasRef} 
          width={400} 
          height={400} 
          className="w-[45dvmin] h-[45dvmin] sm:w-[50dvmin] sm:h-[50dvmin] md:w-[55dvmin] md:h-[55dvmin] lg:w-[60dvmin] lg:h-[60dvmin]" 
        />
      </motion.div>

      {/* Task time label */}
      <div className="flex items-center text-sm text-gray-500 mt-4">
        <Clock className="w-icon-sm h-icon-sm mr-xs" />
        <span>
          {Math.floor(taskGoalMinutes / 60)}h{taskGoalMinutes % 60 > 0 ? ` ${taskGoalMinutes % 60}m` : ""} task
        </span>
      </div>
    </div>
  )
}

