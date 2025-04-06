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
      const width = window.innerWidth;
      // Set size based on viewport width but ensure it's not too large
      const maxWidth = Math.min(width * 0.9, 320); // Increased from 85% to 90% of viewport
      
      if (width < 480) { // Mobile breakpoint
        setChartSize({ 
          width: Math.min(280, maxWidth), // Increased from 240 to 280
          height: Math.min(280, maxWidth) // Increased from 240 to 280
        });
      } else if (width < 640) { // Small breakpoint
        setChartSize({ 
          width: Math.min(300, maxWidth), // Increased from 280 to 300
          height: Math.min(300, maxWidth) // Increased from 280 to 300
        });
      } else { // Medium and up
        setChartSize({ 
          width: Math.min(320, maxWidth), 
          height: Math.min(320, maxWidth) 
        });
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

    // Responsive font sizes based on chart width
    const titleFontSize = chartSize.width < 250 ? 16 : 20 // Smaller font for smallest charts
    const detailFontSize = chartSize.width < 250 ? 12 : 14

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

      // Draw text (using responsive sizes)
      ctx.font = `bold ${titleFontSize}px Inter, system-ui, sans-serif`
      ctx.fillStyle = "#64748b"
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      ctx.fillText("No tasks yet", centerX, centerY - 10)

      ctx.font = `${detailFontSize}px Inter, system-ui, sans-serif`
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
      const isHovered = hoveredSlice === index
      // Restore pull distance based on hover
      const pullDistance = isHovered ? 10 : 0 
      // const isPulledOut = selectedSlice === index // Keep selection logic separate for now

      // Calculate offset for pulled out slice
      const offsetX = Math.cos(midAngle) * pullDistance
      const offsetY = Math.sin(midAngle) * pullDistance

      // Draw slice (use offsetX, offsetY)
      ctx.beginPath()
      ctx.moveTo(centerX + offsetX, centerY + offsetY) // Apply offset
      ctx.arc(centerX + offsetX, centerY + offsetY, radius, startAngle, endAngle) // Apply offset
      ctx.lineTo(centerX + offsetX, centerY + offsetY) // Apply offset
      ctx.closePath()

      // Fill with task color or slightly lighter if hovered
      if (isHovered) { // Use isHovered directly for color change
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

    // STEP 4: Draw the text in the center (using responsive sizes)
    ctx.font = `bold ${titleFontSize}px Inter, system-ui, sans-serif`
    ctx.fillStyle = isHoveringCenter ? "#3b82f6" : "#1e293b"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.fillText("Today", centerX, centerY - 10)

    // If a task is selected or hovered, show its name
    if (hoveredSlice !== null || selectedSlice !== null) {
      const taskIndex = selectedSlice !== null ? selectedSlice : hoveredSlice
      if (taskIndex !== null && taskIndex < tasks.length) {
        const task = tasks[taskIndex]

        ctx.font = `${detailFontSize}px Inter, system-ui, sans-serif`
        ctx.fillStyle = "#64748b"
        ctx.fillText(task.name, centerX, centerY + 15)
      }
    } else {
      // Show total time and workday time
      const totalHours = Math.floor(totalGoalTime / 60)
      const totalMinutes = totalGoalTime % 60
      const timeText = `${totalHours > 0 ? `${totalHours}h ` : ""}${totalMinutes}m / ${workdayHours}h`

      ctx.font = `${detailFontSize}px Inter, system-ui, sans-serif`
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

  // Helper function to determine slice index from coordinates
  const getSliceIndexFromCoords = (x: number, y: number): number | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / (rect.width * (window.devicePixelRatio || 1));
    const scaleY = canvas.height / (rect.height * (window.devicePixelRatio || 1));
    
    const canvasX = (x - rect.left) * scaleX;
    const canvasY = (y - rect.top) * scaleY;

    const centerX = canvas.width / (window.devicePixelRatio || 1) / 2;
    const centerY = canvas.height / (window.devicePixelRatio || 1) / 2;
    const radius = Math.min(centerX, centerY) - 20;
    const innerRadius = radius * 0.6;

    const dx = canvasX - centerX;
    const dy = canvasY - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Check if click is within the pie area (outside the center circle)
    if (distance < innerRadius || distance > radius) {
      return null; // Clicked center or outside
    }

    let angle = Math.atan2(dy, dx);
    if (angle < -Math.PI / 2) {
      angle += Math.PI * 2; // Adjust angle to start from 12 o'clock
    }

    let startAngle = -Math.PI / 2;
    const workdayMinutes = workdayHours * 60;

    for (let i = 0; i < tasks.length; i++) {
      const sliceAngle = (tasks[i].goalTimeMinutes / workdayMinutes) * Math.PI * 2;
      const endAngle = startAngle + sliceAngle;

      if (angle >= startAngle && angle < endAngle) {
        return i;
      }
      startAngle = endAngle;
    }

    return null; // Should not happen if click is within a segment, but safety return
  };

  // Update handleMouseMove
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const sliceIndex = getSliceIndexFromCoords(e.clientX, e.clientY);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / (rect.width * (window.devicePixelRatio || 1));
    const scaleY = canvas.height / (rect.height * (window.devicePixelRatio || 1));
    const canvasX = (e.clientX - rect.left) * scaleX;
    const canvasY = (e.clientY - rect.top) * scaleY;
    const centerX = canvas.width / (window.devicePixelRatio || 1) / 2;
    const centerY = canvas.height / (window.devicePixelRatio || 1) / 2;
    const radius = Math.min(centerX, centerY) - 20;
    const innerRadius = radius * 0.6;
    const dx = canvasX - centerX;
    const dy = canvasY - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < innerRadius) {
        setIsHoveringCenter(true);
        setHoveredSlice(null);
    } else {
        setIsHoveringCenter(false);
        setHoveredSlice(sliceIndex);
    }
  };

  // Update handleMouseLeave
  const handleMouseLeave = () => {
    setHoveredSlice(null);
    setIsHoveringCenter(false);
  };

  // Update handleClick
  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / (rect.width * (window.devicePixelRatio || 1));
    const scaleY = canvas.height / (rect.height * (window.devicePixelRatio || 1));
    const canvasX = (e.clientX - rect.left) * scaleX;
    const canvasY = (e.clientY - rect.top) * scaleY;
    const centerX = canvas.width / (window.devicePixelRatio || 1) / 2;
    const centerY = canvas.height / (window.devicePixelRatio || 1) / 2;
    const radius = Math.min(centerX, centerY) - 20;
    const innerRadius = radius * 0.6;
    const dx = canvasX - centerX;
    const dy = canvasY - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Check center click first
    if (distance < innerRadius) {
      onCenterClick();
      return;
    }

    // Get clicked slice directly
    const clickedSliceIndex = getSliceIndexFromCoords(e.clientX, e.clientY);

    if (clickedSliceIndex !== null && clickedSliceIndex < tasks.length) {
      setSelectedSlice(clickedSliceIndex);
      setIsAnimating(true);
      const taskId = tasks[clickedSliceIndex].id;

      setTimeout(() => {
        setIsAnimating(false);
        setSelectedSlice(null);
        onTaskSelect(taskId);
      }, 300); // Keep delay for visual feedback
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-full">
      <div
        className="relative flex justify-center items-center mb-4"
        style={{ 
          width: chartSize.width, 
          height: chartSize.height,
          maxWidth: '100%' // Ensure it never exceeds its container
        }}
      >
        <canvas
          ref={canvasRef}
          width={chartSize.width}
          height={chartSize.height}
          className="cursor-pointer rounded-full"
          style={{ width: '100%', height: '100%' }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onClick={handleClick}
        />
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

