"use client"

import { useRef, useEffect } from "react"
import { motion } from "framer-motion"
import { Clock } from "lucide-react"

interface TimerCircleProps {
  pomodoroProgress: number
  taskProgress: number
  timeDisplay: string
  taskName: string
  isRunning: boolean
  onTimerClick: () => void
  taskGoalMinutes?: number
  taskTimeLeftSeconds?: number
}

export function TimerCircle({
  pomodoroProgress,
  taskProgress,
  timeDisplay,
  taskName,
  isRunning,
  onTimerClick,
  taskGoalMinutes = 120, // Default to 2 hours in minutes
  taskTimeLeftSeconds = 7200, // Task time left in seconds (default 2 hours)
}: TimerCircleProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas dimensions with device pixel ratio for sharp rendering
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
    const trackWidth = 30 // Width of the timer track
    const innerRadius = radius - trackWidth - 5 // Inner circle radius, touching the tracks

    // Start at 12 o'clock position (-90 degrees or -PI/2 radians)
    const startAngle = -Math.PI / 2

    // 5% gap (18 degrees)
    const gapSize = (Math.PI / 180) * 18

    // Draw the background track (light gray) - only for the gap
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius - trackWidth / 2, startAngle - gapSize, startAngle)
    ctx.lineWidth = trackWidth
    ctx.strokeStyle = "#e2e8f0" // Light gray
    ctx.stroke()

    // STEP 1: Draw the red timer (task time)
    // At start (taskProgress = 0), it covers full circle minus gap
    // As task progresses, it decreases
    if (taskProgress < 1) {
      // Calculate how much of the circle to draw (from 100% down to 0%)
      const redArcSize = (Math.PI * 2 - gapSize) * (1 - taskProgress)

      // Draw main part with flat start
      ctx.beginPath()
      ctx.arc(centerX, centerY, radius - trackWidth / 2, startAngle, startAngle + redArcSize - 0.01)
      ctx.lineWidth = trackWidth
      ctx.lineCap = "butt" // Flat start
      ctx.strokeStyle = "#ef4444" // Red color
      ctx.stroke()

      // Draw rounded end at the moving end
      ctx.beginPath()
      ctx.arc(centerX, centerY, radius - trackWidth / 2, startAngle + redArcSize - 0.01, startAngle + redArcSize)
      ctx.lineWidth = trackWidth
      ctx.lineCap = "round" // Rounded end
      ctx.strokeStyle = "#ef4444" // Red color
      ctx.stroke()
    }

    // STEP 2: Draw the blue timer (pomodoro)
    // Calculate pomodoro ratio (how much of the task is one pomodoro)
    const POMODORO_MINUTES = 25
    const pomodoroRatio = Math.min(1, POMODORO_MINUTES / taskGoalMinutes)

    // Calculate blue arc size
    const blueArcSize = Math.PI * 2 * pomodoroRatio * (1 - pomodoroProgress)

    if (blueArcSize > 0) {
      ctx.save()
      ctx.shadowColor = "rgba(0, 0, 0, 0.3)"
      ctx.shadowBlur = 8
      ctx.shadowOffsetX = 0
      ctx.shadowOffsetY = 4

      // Draw main part with flat start
      ctx.beginPath()
      ctx.arc(centerX, centerY, radius - trackWidth / 2, startAngle, startAngle + blueArcSize - 0.01)
      ctx.lineWidth = trackWidth
      ctx.lineCap = "butt" // Flat start
      ctx.strokeStyle = "#3b82f6" // Blue color
      ctx.stroke()

      // Draw rounded end at the moving end
      ctx.beginPath()
      ctx.arc(centerX, centerY, radius - trackWidth / 2, startAngle + blueArcSize - 0.01, startAngle + blueArcSize)
      ctx.lineWidth = trackWidth
      ctx.lineCap = "round" // Rounded end
      ctx.strokeStyle = "#3b82f6" // Blue color
      ctx.stroke()
      ctx.restore()
    }

    // STEP 3: Draw the center white circle with shadow
    ctx.save()
    ctx.beginPath()
    ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2)
    ctx.shadowColor = "rgba(0, 0, 0, 0.2)"
    ctx.shadowBlur = 15
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 5
    ctx.fillStyle = "#ffffff"
    ctx.fill()
    ctx.restore()

    // STEP 4: Draw play/pause icon in light grey behind the text
    ctx.save()
    ctx.fillStyle = "#e5e7eb" // Light grey
    if (isRunning) {
      // Pause icon
      const pauseWidth = 24
      const pauseHeight = 30
      const pauseX = centerX - pauseWidth / 2
      const pauseY = centerY - pauseHeight / 2

      ctx.fillRect(pauseX, pauseY, 8, pauseHeight)
      ctx.fillRect(pauseX + 16, pauseY, 8, pauseHeight)
    } else {
      // Play icon (triangle)
      ctx.beginPath()
      ctx.moveTo(centerX - 10, centerY - 15)
      ctx.lineTo(centerX - 10, centerY + 15)
      ctx.lineTo(centerX + 15, centerY)
      ctx.closePath()
      ctx.fill()
    }
    ctx.restore()

    // STEP 5: Draw the text elements
    // Draw the pomodoro time text (main display)
    ctx.font = "bold 32px Inter, system-ui, sans-serif"
    ctx.fillStyle = "#334155" // Slate-700
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.fillText(timeDisplay, centerX, centerY - 10)

    // Draw the task name
    ctx.font = "14px Inter, system-ui, sans-serif"
    ctx.fillStyle = "#94a3b8" // Slate-400
    ctx.fillText(taskName, centerX, centerY + 15)

    // Format task time left using taskTimeLeftSeconds
    const hoursLeft = Math.floor(taskTimeLeftSeconds / 3600)
    const minutesLeft = Math.floor((taskTimeLeftSeconds % 3600) / 60)
    const taskTimeDisplay = `${hoursLeft}:${minutesLeft.toString().padStart(2, "0")}`

    // Draw the task time remaining (small timer under the task name)
    ctx.font = "12px Inter, system-ui, sans-serif"
    ctx.fillStyle = "#94a3b8" // Slate-400
    ctx.fillText(taskTimeDisplay + " remaining", centerX, centerY + 35)
  }, [pomodoroProgress, taskProgress, timeDisplay, taskName, isRunning, taskGoalMinutes, taskTimeLeftSeconds])

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

