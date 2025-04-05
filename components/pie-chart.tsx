"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import type { Task } from "@/types/task"
import { Clock, Plus, Play } from "lucide-react"

interface PieChartProps {
  tasks: Task[]
  onTaskSelect: (taskId: string) => void
  onCenterClick: () => void
  workdayHours?: number
}

export function PieChart({
  tasks,
  onTaskSelect,
  onCenterClick,
  workdayHours = 8, // Default to 8 hours
}: PieChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [hoveredSlice, setHoveredSlice] = useState<number | null>(null)
  const [selectedSlice, setSelectedSlice] = useState<number | null>(null)
  const [isHoveringCenter, setIsHoveringCenter] = useState(false)
  const [chartSize, setChartSize] = useState({ width: 320, height: 320 })
  const [isAnimating, setIsAnimating] = useState(false)

  // Convert workday hours to minutes
  const workdayMinutes = workdayHours * 60

  // Determine chart size based on screen width
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth
      if (width < 640) {
        setChartSize({ width: 280, height: 280 })
      } else {
        setChartSize({ width: 320, height: 320 })
      }
    }

    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Draw the pie chart
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas dimensions with device pixel ratio for sharp rendering
    const dpr = window.devicePixelRatio || 1
    canvas.width = chartSize.width * dpr
    canvas.height = chartSize.height * dpr
    ctx.scale(dpr, dpr)

    // Clear canvas
    ctx.clearRect(0, 0, chartSize.width, chartSize.height)

    const centerX = chartSize.width / 2
    const centerY = chartSize.height / 2
    const radius = Math.min(centerX, centerY) - 20
    const innerRadius = radius * 0.6

    // If no tasks, draw empty circle with gradient
    if (tasks.length === 0) {
      // Create gradient background
      const gradient = ctx.createLinearGradient(0, 0, chartSize.width, chartSize.height)
      gradient.addColorStop(0, "#f1f5f9")
      gradient.addColorStop(1, "#e2e8f0")

      // Draw outer circle with shadow
      ctx.save()
      ctx.shadowColor = "rgba(0, 0, 0, 0.1)"
      ctx.shadowBlur = 15
      ctx.shadowOffsetX = 0
      ctx.shadowOffsetY = 5
      ctx.beginPath()
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
      ctx.fillStyle = gradient
      ctx.fill()
      ctx.restore()

      // Draw the white center
      ctx.beginPath()
      ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2)
      ctx.fillStyle = isHoveringCenter ? "#f8fafc" : "#ffffff"
      ctx.fill()

      // Draw text
      ctx.font = "bold 18px Inter, system-ui, sans-serif"
      ctx.fillStyle = "#64748b"
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      ctx.fillText("No tasks yet", centerX, centerY - 10)

      ctx.font = "14px Inter, system-ui, sans-serif"
      ctx.fillStyle = "#94a3b8"
      ctx.fillText("Click to add tasks", centerX, centerY + 20)

      // Draw plus icon if hovering center
      if (isHoveringCenter) {
        ctx.fillStyle = "#3b82f6"
        ctx.beginPath()
        ctx.arc(centerX, centerY + 45, 12, 0, Math.PI * 2)
        ctx.fill()

        ctx.fillStyle = "#ffffff"
        ctx.fillRect(centerX - 5, centerY + 40, 10, 2)
        ctx.fillRect(centerX - 1, centerY + 36, 2, 10)
      }

      return
    }

    // Calculate total goal time
    const totalGoalTime = tasks.reduce((sum, task) => sum + task.goalTimeMinutes, 0)

    // STEP 1: Draw all pie segments first (including the gray segment)
    let startAngle = -Math.PI / 2 // Start from 12 o'clock position

    // Draw colored task segments
    tasks.forEach((task, index) => {
      // Calculate slice angle based on proportion of workday
      const sliceAngle = (task.goalTimeMinutes / workdayMinutes) * Math.PI * 2
      const endAngle = startAngle + sliceAngle

      // Calculate midpoint angle for the slice
      const midAngle = startAngle + sliceAngle / 2

      // Determine if slice should be "pulled out" (hovered or selected)
      const isPulledOut = hoveredSlice === index || selectedSlice === index
      const pullDistance = isPulledOut ? 10 : 0

      // Calculate offset for pulled out slice
      const offsetX = Math.cos(midAngle) * pullDistance
      const offsetY = Math.sin(midAngle) * pullDistance

      // Draw slice
      ctx.beginPath()
      ctx.moveTo(centerX + offsetX, centerY + offsetY)
      ctx.arc(centerX + offsetX, centerY + offsetY, radius, startAngle, endAngle)
      ctx.lineTo(centerX + offsetX, centerY + offsetY)
      ctx.closePath()

      // Fill with task color or slightly lighter if hovered
      if (isPulledOut) {
        // Create a slightly lighter version of the color for hover effect
        ctx.fillStyle = task.color + "ee"
      } else {
        ctx.fillStyle = task.color
      }
      ctx.fill()

      // Draw progress arc (inner arc)
      if (task.progressMinutes > 0) {
        const progressRatio = Math.min(1, task.progressMinutes / task.goalTimeMinutes)
        const progressAngle = sliceAngle * progressRatio

        ctx.beginPath()
        ctx.moveTo(centerX + offsetX, centerY + offsetY)
        ctx.arc(centerX + offsetX, centerY + offsetY, radius * 0.8, startAngle, startAngle + progressAngle)
        ctx.lineTo(centerX + offsetX, centerY + offsetY)
        ctx.closePath()

        // Fill with darker shade of task color
        ctx.fillStyle = task.color + "99" // Add transparency
        ctx.fill()
      }

      // Draw play icon on hovered slice
      if (isPulledOut) {
        const iconX = centerX + Math.cos(midAngle) * (radius * 0.7)
        const iconY = centerY + Math.sin(midAngle) * (radius * 0.7)

        // Draw circle background for play icon
        ctx.beginPath()
        ctx.arc(iconX, iconY, 15, 0, Math.PI * 2)
        ctx.fillStyle = "rgba(255, 255, 255, 0.9)"
        ctx.fill()

        // Draw play triangle
        ctx.beginPath()
        ctx.moveTo(iconX - 5, iconY - 7)
        ctx.lineTo(iconX - 5, iconY + 7)
        ctx.lineTo(iconX + 7, iconY)
        ctx.closePath()
        ctx.fillStyle = "#3b82f6"
        ctx.fill()
      }

      startAngle = endAngle
    })

    // Draw gray segment if total task time is less than workday
    if (totalGoalTime < workdayMinutes) {
      const remainingAngle = ((workdayMinutes - totalGoalTime) / workdayMinutes) * Math.PI * 2
      const endAngle = startAngle + remainingAngle

      ctx.beginPath()
      ctx.moveTo(centerX, centerY)
      ctx.arc(centerX, centerY, radius, startAngle, endAngle)
      ctx.lineTo(centerX, centerY)
      ctx.closePath()

      // Fill with white/light gray
      ctx.fillStyle = "#f1f5f9"
      ctx.fill()
    }

    // STEP 2: Draw the shadow for the center circle ON TOP of the pie segments
    // This creates the illusion that the center circle is casting a shadow on the pie
    ctx.save()

    // Draw an outer shadow ring - darker by 20%
    ctx.beginPath()
    ctx.arc(centerX, centerY, innerRadius + 2, 0, Math.PI * 2)
    ctx.strokeStyle = "rgba(0, 0, 0, 0.25)" // 20% darker (from 0.2 to 0.25)
    ctx.lineWidth = 1
    ctx.stroke()

    // Draw a much more prominent shadow - darker by 20%
    ctx.beginPath()
    ctx.arc(centerX, centerY, innerRadius + 8, 0, Math.PI * 2)
    ctx.shadowColor = "rgba(0, 0, 0, 0.85)" // 20% darker (from 0.7 to 0.85)
    ctx.shadowBlur = 25
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 8
    ctx.fillStyle = "rgba(0, 0, 0, 0.36)" // 20% darker (from 0.3 to 0.36)
    ctx.fill()
    ctx.restore()

    // STEP 3: Draw the white center circle ON TOP of everything
    // Create a gradient for the center circle
    const centerGradient = ctx.createRadialGradient(
      centerX,
      centerY - 15,
      0, // Shift gradient origin up for 3D effect
      centerX,
      centerY,
      innerRadius,
    )
    centerGradient.addColorStop(0, isHoveringCenter ? "#f0f9ff" : "#ffffff")
    centerGradient.addColorStop(1, isHoveringCenter ? "#e0f2fe" : "#f8fafc")

    // Draw the white center circle
    ctx.beginPath()
    ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2)
    ctx.fillStyle = centerGradient
    ctx.fill()

    // Add subtle inner shadow at the top to enhance 3D effect
    ctx.save()
    ctx.beginPath()
    ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2)
    ctx.clip()
    ctx.beginPath()
    ctx.rect(centerX - radius, centerY - radius, radius * 2, innerRadius * 0.5)
    ctx.fillStyle = "rgba(0, 0, 0, 0.03)"
    ctx.fill()
    ctx.restore()

    // STEP 4: Draw the text in the center
    // Draw center text
    ctx.font = "bold 20px Inter, system-ui, sans-serif"
    ctx.fillStyle = isHoveringCenter ? "#3b82f6" : "#1e293b"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.fillText("Today", centerX, centerY - 10)

    // If a task is selected or hovered, show its name
    if (hoveredSlice !== null || selectedSlice !== null) {
      const taskIndex = selectedSlice !== null ? selectedSlice : hoveredSlice
      if (taskIndex !== null && taskIndex < tasks.length) {
        const task = tasks[taskIndex]

        ctx.font = "14px Inter, system-ui, sans-serif"
        ctx.fillStyle = "#64748b"
        ctx.fillText(task.name, centerX, centerY + 15)
      }
    } else {
      // Show total time and workday time
      const totalHours = Math.floor(totalGoalTime / 60)
      const totalMinutes = totalGoalTime % 60
      const timeText = `${totalHours > 0 ? `${totalHours}h ` : ""}${totalMinutes}m / ${workdayHours}h`

      ctx.font = "14px Inter, system-ui, sans-serif"
      ctx.fillStyle = "#64748b"
      ctx.fillText(timeText, centerX, centerY + 15)
    }

    // Draw plus icon if hovering center
    if (isHoveringCenter) {
      ctx.fillStyle = "#3b82f6"
      ctx.beginPath()
      ctx.arc(centerX, centerY + 45, 12, 0, Math.PI * 2)
      ctx.fill()

      ctx.fillStyle = "#ffffff"
      ctx.fillRect(centerX - 5, centerY + 40, 10, 2)
      ctx.fillRect(centerX - 1, centerY + 36, 2, 10)
    }
  }, [tasks, hoveredSlice, selectedSlice, chartSize, isHoveringCenter, workdayHours, workdayMinutes])

  // Handle mouse move to detect which slice is being hovered
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isAnimating) return

    const canvas = canvasRef.current
    if (!canvas) {
      setHoveredSlice(null)
      setIsHoveringCenter(false)
      return
    }

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const centerX = rect.width / 2
    const centerY = rect.height / 2
    const radius = Math.min(centerX, centerY) - 20

    // Calculate distance from center
    const dx = x - centerX
    const dy = y - centerY
    const distance = Math.sqrt(dx * dx + dy * dy)

    // Check if hovering over center circle
    if (distance < radius * 0.6) {
      setHoveredSlice(null)
      setIsHoveringCenter(true)
      return
    } else {
      setIsHoveringCenter(false)
    }

    // If outside the pie, no hover
    if (distance > radius || tasks.length === 0) {
      setHoveredSlice(null)
      return
    }

    // Calculate angle
    let angle = Math.atan2(dy, dx)
    // Convert to 0-2π range starting from top (-π/2)
    angle = (angle + Math.PI * 2.5) % (Math.PI * 2)

    // Find which slice contains this angle
    const totalGoalTime = Math.min(
      tasks.reduce((sum, task) => sum + task.goalTimeMinutes, 0),
      workdayMinutes,
    )
    let startAngle = 0

    for (let i = 0; i < tasks.length; i++) {
      const sliceAngle = (tasks[i].goalTimeMinutes / workdayMinutes) * Math.PI * 2
      const endAngle = startAngle + sliceAngle

      if (angle >= startAngle && angle < endAngle) {
        setHoveredSlice(i)
        return
      }

      startAngle = endAngle
    }

    setHoveredSlice(null)
  }

  // Handle mouse leave
  const handleMouseLeave = () => {
    setHoveredSlice(null)
    setIsHoveringCenter(false)
  }

  // Handle click to select a task or add new tasks
  const handleClick = () => {
    if (isHoveringCenter) {
      onCenterClick()
      return
    }

    if (hoveredSlice !== null && hoveredSlice < tasks.length) {
      setSelectedSlice(hoveredSlice)
      setIsAnimating(true)

      // Animate selection before navigating
      setTimeout(() => {
        onTaskSelect(tasks[hoveredSlice].id)
      }, 300)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center w-full">
      <div
        className="relative flex justify-center items-center mb-4"
        style={{ width: chartSize.width, height: chartSize.height }}
      >
        <canvas
          ref={canvasRef}
          width={chartSize.width}
          height={chartSize.height}
          className="cursor-pointer rounded-full"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onClick={handleClick}
        />

        {/* Task tooltip on hover */}
        <AnimatePresence>
          {hoveredSlice !== null && hoveredSlice < tasks.length && !isAnimating && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
              className="absolute bottom-0 mb-2 bg-white px-3 py-1.5 rounded-full shadow-lg flex items-center"
            >
              <Play className="w-4 h-4 mr-1 text-blue-500" />
              <span className="text-sm font-medium">Click to start timer for {tasks[hoveredSlice].name}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Center tooltip on hover */}
        <AnimatePresence>
          {isHoveringCenter && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
              className="absolute bottom-0 mb-2 bg-white px-3 py-1.5 rounded-full shadow-lg flex items-center"
            >
              <Plus className="w-4 h-4 mr-1 text-blue-500" />
              <span className="text-sm font-medium">Add tasks</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Task count and workday indicator - moved down by 10% */}
      {tasks.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center text-sm text-gray-500 mb-2 mt-4" // Added mt-4 to move it down by 10%
        >
          <Clock className="w-4 h-4 mr-1" />
          <span>
            {tasks.length} task{tasks.length !== 1 ? "s" : ""} •
            {Math.floor(tasks.reduce((sum, task) => sum + task.goalTimeMinutes, 0) / 60)}h
            {tasks.reduce((sum, task) => sum + task.goalTimeMinutes, 0) % 60}m of {workdayHours}h day
          </span>
        </motion.div>
      )}
    </div>
  )
}

