"use client"

import { useRef, useEffect } from "react"

interface CircleTimerProps {
  pomodoroProgress: number
  taskProgress: number
  timeDisplay: string
  subtitle: string
  variant: "split" | "arc"
}

export function CircleTimer({ pomodoroProgress, taskProgress, timeDisplay, subtitle, variant }: CircleTimerProps) {
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

    if (variant === "split") {
      // Draw shadow for the main circle
      ctx.save()
      ctx.shadowColor = "rgba(0, 0, 0, 0.1)"
      ctx.shadowBlur = 10
      ctx.shadowOffsetX = 0
      ctx.shadowOffsetY = 4

      // Draw the background circle (white with shadow)
      ctx.beginPath()
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
      ctx.fillStyle = "#ffffff"
      ctx.fill()
      ctx.restore()

      // Draw the task time arc (red)
      const taskAngle = Math.PI * 2 * taskProgress
      ctx.beginPath()
      ctx.arc(centerX, centerY, radius, -Math.PI / 2, -Math.PI / 2 + taskAngle)
      ctx.lineTo(centerX, centerY)
      ctx.fillStyle = "#f87171" // Red color
      ctx.fill()

      // Draw the pomodoro time arc (blue) on top
      const pomodoroAngle = Math.PI * 2 * pomodoroProgress
      ctx.beginPath()
      ctx.arc(centerX, centerY, radius, -Math.PI / 2, -Math.PI / 2 + pomodoroAngle)
      ctx.lineTo(centerX, centerY)
      ctx.fillStyle = "#60a5fa" // Blue color
      ctx.fill()

      // Draw the inner white circle
      ctx.beginPath()
      ctx.arc(centerX, centerY, radius * 0.7, 0, Math.PI * 2)
      ctx.fillStyle = "#ffffff"
      ctx.fill()
    } else if (variant === "arc") {
      // Draw shadow for the main circle
      ctx.save()
      ctx.shadowColor = "rgba(0, 0, 0, 0.1)"
      ctx.shadowBlur = 10
      ctx.shadowOffsetX = 0
      ctx.shadowOffsetY = 4

      // Draw the background circle (white with shadow)
      ctx.beginPath()
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
      ctx.fillStyle = "#ffffff"
      ctx.fill()
      ctx.restore()

      // Draw the background track (light gray)
      ctx.beginPath()
      ctx.arc(centerX, centerY, radius - 5, 0, Math.PI * 2)
      ctx.lineWidth = 5
      ctx.strokeStyle = "#f1f5f9" // Light gray
      ctx.stroke()

      // Draw the pomodoro progress arc (blue-gray)
      const pomodoroAngle = Math.PI * 2 * pomodoroProgress
      ctx.beginPath()
      ctx.arc(centerX, centerY, radius - 5, -Math.PI / 2, -Math.PI / 2 + pomodoroAngle)
      ctx.lineWidth = 5
      ctx.strokeStyle = "#64748b" // Blue-gray
      ctx.stroke()

      // Draw the task progress arc (red)
      const taskStartAngle = -Math.PI / 2 + pomodoroAngle
      const taskEndAngle = taskStartAngle + Math.PI * 2 * taskProgress * 0.25 // Only show a portion
      ctx.beginPath()
      ctx.arc(centerX, centerY, radius - 5, taskStartAngle, taskEndAngle)
      ctx.lineWidth = 5
      ctx.strokeStyle = "#f87171" // Red color
      ctx.stroke()
    }

    // Draw the time text
    ctx.font = "bold 24px Inter, sans-serif"
    ctx.fillStyle = "#1e293b"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.fillText(timeDisplay, centerX, centerY - 10)

    // Draw the subtitle
    ctx.font = "12px Inter, sans-serif"
    ctx.fillStyle = "#64748b"
    ctx.fillText(subtitle, centerX, centerY + 15)
  }, [pomodoroProgress, taskProgress, timeDisplay, subtitle, variant])

  return (
    <div className="relative">
      <canvas ref={canvasRef} width={240} height={240} className="w-60 h-60" />
    </div>
  )
}

