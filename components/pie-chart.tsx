"use client"

import type React from "react"

import { useState, useRef, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import type { Task } from "@/types/task"
import { Clock, Plus, Play } from "lucide-react"

interface PieChartProps {
  tasks: Task[]
  onTaskSelect: (taskId: string) => void
  onCenterClick: () => void
  workdayHours?: number
  className?: string;
}

export function PieChart({
  tasks,
  onTaskSelect,
  onCenterClick,
  workdayHours = 8, // Default to 8 hours
}: PieChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [hoveredSlice, setHoveredSlice] = useState<number | null>(null)
  const [selectedSlice, setSelectedSlice] = useState<number | null>(null)
  const [isHoveringCenter, setIsHoveringCenter] = useState(false)
  const [chartSize, setChartSize] = useState({ width: 320, height: 320 })
  const [isAnimating, setIsAnimating] = useState(false)

  // Convert workday hours to minutes
  const workdayMinutes = workdayHours * 60

  const updateChartSize = useCallback(() => {
    if (containerRef.current) {
      const { width } = containerRef.current.getBoundingClientRect();
      const size = Math.max(10, Math.min(width, 320)); // Limit max size, ensure min size > 0
      setChartSize({ width: size, height: size });
    }
  }, []);

  useEffect(() => {
    updateChartSize();

    const resizeObserver = new ResizeObserver(updateChartSize);
    const currentContainer = containerRef.current;

    if (currentContainer) {
      resizeObserver.observe(currentContainer);
    }

    return () => {
      if (currentContainer) {
        resizeObserver.unobserve(currentContainer);
      }
      resizeObserver.disconnect();
    };
  }, [updateChartSize]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || chartSize.width === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = chartSize.width * dpr;
    canvas.height = chartSize.height * dpr;
    ctx.scale(dpr, dpr)

    // Clear canvas
    ctx.clearRect(0, 0, chartSize.width, chartSize.height);

    const centerX = chartSize.width / 2
    const centerY = chartSize.height / 2
    const radius = Math.min(centerX, centerY) - 20
    const innerRadius = radius * 0.6

    const titleFontSize = chartSize.width < 250 ? 16 : 20
    const detailFontSize = chartSize.width < 250 ? 12 : 14

    if (tasks.length === 0) {
      const gradient = ctx.createLinearGradient(0, 0, chartSize.width, chartSize.height)
      gradient.addColorStop(0, "#f1f5f9")
      gradient.addColorStop(1, "#e2e8f0")

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

      ctx.beginPath()
      ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2)
      ctx.fillStyle = isHoveringCenter ? "#f8fafc" : "#ffffff"
      ctx.fill()

      ctx.font = `bold ${titleFontSize}px Inter, system-ui, sans-serif`
      ctx.fillStyle = "#64748b"
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      ctx.fillText("No tasks yet", centerX, centerY - 10)

      ctx.font = `${detailFontSize}px Inter, system-ui, sans-serif`
      ctx.fillStyle = "#94a3b8"
      ctx.fillText("Click to add tasks", centerX, centerY + 20)

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

    const totalGoalTime = tasks.reduce((sum, task) => sum + task.goalTimeMinutes, 0)

    let startAngle = -Math.PI / 2

    tasks.forEach((task, index) => {
      const sliceAngle = (task.goalTimeMinutes / workdayMinutes) * Math.PI * 2
      const endAngle = startAngle + sliceAngle

      const midAngle = startAngle + sliceAngle / 2

      const isHovered = hoveredSlice === index
      const pullDistance = isHovered ? 10 : 0

      const offsetX = Math.cos(midAngle) * pullDistance
      const offsetY = Math.sin(midAngle) * pullDistance

      ctx.beginPath()
      ctx.moveTo(centerX + offsetX, centerY + offsetY)
      ctx.arc(centerX + offsetX, centerY + offsetY, radius, startAngle, endAngle)
      ctx.lineTo(centerX + offsetX, centerY + offsetY)
      ctx.closePath()

      if (isHovered) {
        ctx.fillStyle = task.color + "ee"
      } else {
        ctx.fillStyle = task.color
      }
      ctx.fill()

      if (task.progressMinutes > 0) {
        const progressRatio = Math.min(1, task.progressMinutes / task.goalTimeMinutes)
        const progressAngle = sliceAngle * progressRatio

        ctx.beginPath()
        ctx.moveTo(centerX + offsetX, centerY + offsetY)
        ctx.arc(centerX + offsetX, centerY + offsetY, radius * 0.8, startAngle, startAngle + progressAngle)
        ctx.lineTo(centerX + offsetX, centerY + offsetY)
        ctx.closePath()

        ctx.fillStyle = task.color + "99"
        ctx.fill()
      }

      startAngle = endAngle
    })

    if (totalGoalTime < workdayMinutes) {
      const remainingAngle = ((workdayMinutes - totalGoalTime) / workdayMinutes) * Math.PI * 2
      const endAngle = startAngle + remainingAngle

      ctx.beginPath()
      ctx.moveTo(centerX, centerY)
      ctx.arc(centerX, centerY, radius, startAngle, endAngle)
      ctx.lineTo(centerX, centerY)
      ctx.closePath()

      ctx.fillStyle = "#f1f5f9"
      ctx.fill()
    }

    ctx.save()

    ctx.beginPath()
    ctx.arc(centerX, centerY, innerRadius + 2, 0, Math.PI * 2)
    ctx.strokeStyle = "rgba(0, 0, 0, 0.25)"
    ctx.lineWidth = 1
    ctx.stroke()

    ctx.beginPath()
    ctx.arc(centerX, centerY, innerRadius + 8, 0, Math.PI * 2)
    ctx.shadowColor = "rgba(0, 0, 0, 0.85)"
    ctx.shadowBlur = 25
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 8
    ctx.fillStyle = "rgba(0, 0, 0, 0.36)"
    ctx.fill()
    ctx.restore()

    const centerGradient = ctx.createRadialGradient(
      centerX,
      centerY - 15,
      0,
      centerX,
      centerY,
      innerRadius,
    )
    centerGradient.addColorStop(0, isHoveringCenter ? "#f0f9ff" : "#ffffff")
    centerGradient.addColorStop(1, isHoveringCenter ? "#e0f2fe" : "#f8fafc")

    ctx.beginPath()
    ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2)
    ctx.fillStyle = centerGradient
    ctx.fill()

    ctx.save()
    ctx.beginPath()
    ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2)
    ctx.clip()
    ctx.beginPath()
    ctx.rect(centerX - radius, centerY - radius, radius * 2, innerRadius * 0.5)
    ctx.fillStyle = "rgba(0, 0, 0, 0.03)"
    ctx.fill()
    ctx.restore()

    ctx.font = `bold ${titleFontSize}px Inter, system-ui, sans-serif`
    ctx.fillStyle = isHoveringCenter ? "#3b82f6" : "#1e293b"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.fillText("Today", centerX, centerY - 10)

    if (hoveredSlice !== null || selectedSlice !== null) {
      const taskIndex = selectedSlice !== null ? selectedSlice : hoveredSlice
      if (taskIndex !== null && taskIndex < tasks.length) {
        const task = tasks[taskIndex]

        ctx.font = `${detailFontSize}px Inter, system-ui, sans-serif`
        ctx.fillStyle = "#64748b"
        ctx.fillText(task.name, centerX, centerY + 15)
      }
    } else {
      const totalHours = Math.floor(totalGoalTime / 60)
      const totalMinutes = totalGoalTime % 60
      const timeText = `${totalHours > 0 ? `${totalHours}h ` : ""}${totalMinutes}m / ${workdayHours}h`

      ctx.font = `${detailFontSize}px Inter, system-ui, sans-serif`
      ctx.fillStyle = "#64748b"
      ctx.fillText(timeText, centerX, centerY + 15)
    }

    if (isHoveringCenter) {
      ctx.fillStyle = "#3b82f6"
      ctx.beginPath()
      ctx.arc(centerX, centerY + 45, 12, 0, Math.PI * 2)
      ctx.fill()

      ctx.fillStyle = "#ffffff"
      ctx.fillRect(centerX - 5, centerY + 40, 10, 2)
      ctx.fillRect(centerX - 1, centerY + 36, 2, 10)
    }
  }, [tasks, hoveredSlice, selectedSlice, chartSize, isHoveringCenter, workdayHours, workdayMinutes]);

  const getSliceIndexFromCoords = (x: number, y: number): number | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const scaleX = canvas.width / (rect.width * dpr);
    const scaleY = canvas.height / (rect.height * dpr);

    const canvasX = (x - rect.left) * scaleX;
    const canvasY = (y - rect.top) * scaleY;

    const centerX = chartSize.width / 2;
    const centerY = chartSize.height / 2;
    const radius = Math.min(centerX, centerY) - 20;
    const innerRadius = radius * 0.6;

    const dx = canvasX - centerX;
    const dy = canvasY - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < innerRadius || distance > radius) {
      return null;
    }

    let angle = Math.atan2(dy, dx);
    if (angle < -Math.PI / 2) {
      angle += Math.PI * 2;
    }

    let startAngle = -Math.PI / 2;

    for (let i = 0; i < tasks.length; i++) {
      const sliceAngle = (tasks[i].goalTimeMinutes / workdayMinutes) * Math.PI * 2;
      const endAngle = startAngle + sliceAngle;

      if (angle >= startAngle && angle < endAngle) {
        return i;
      }
      startAngle = endAngle;
    }

    return null;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const sliceIndex = getSliceIndexFromCoords(e.clientX, e.clientY);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const centerX = chartSize.width / 2;
    const centerY = chartSize.height / 2;
    const radius = Math.min(centerX, centerY) - 20;
    const innerRadius = radius * 0.6;

    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    const elementCenterX = rect.width / 2;
    const elementCenterY = rect.height / 2;
    const dxClient = clientX - elementCenterX;
    const dyClient = clientY - elementCenterY;
    const distanceClient = Math.sqrt(dxClient * dxClient + dyClient * dyClient);

    const scaleFactor = rect.width / chartSize.width;
    const innerRadiusClient = innerRadius * scaleFactor;

    if (distanceClient < innerRadiusClient) {
        setIsHoveringCenter(true);
        setHoveredSlice(null);
    } else {
        setIsHoveringCenter(false);
        setHoveredSlice(sliceIndex);
    }
  };

  const handleMouseLeave = () => {
    setHoveredSlice(null);
    setIsHoveringCenter(false);
  };

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;
    const elementCenterX = rect.width / 2;
    const elementCenterY = rect.height / 2;
    const dxClient = clientX - elementCenterX;
    const dyClient = clientY - elementCenterY;
    const distanceClient = Math.sqrt(dxClient * dxClient + dyClient * dyClient);

    const scaleFactor = rect.width / chartSize.width;
    const innerRadiusClient = (chartSize.width / 2 * 0.6) * scaleFactor;

    if (distanceClient < innerRadiusClient) {
      onCenterClick();
      return;
    }

    const clickedSliceIndex = getSliceIndexFromCoords(e.clientX, e.clientY);

    if (clickedSliceIndex !== null && clickedSliceIndex < tasks.length) {
      setSelectedSlice(clickedSliceIndex);
      setIsAnimating(true);
      const taskId = tasks[clickedSliceIndex].id;

      setTimeout(() => {
        setIsAnimating(false);
        setSelectedSlice(null);
        onTaskSelect(taskId);
      }, 150);
    }
  };

  return (
    <div ref={containerRef} className="flex flex-col items-center justify-center w-full max-w-full">
      <div
       className="relative flex justify-center items-center"
        style={{
        width: `${chartSize.width}px`,
        height: `${chartSize.height}px`,
        }}
      >
        <canvas
          ref={canvasRef}
          width={chartSize.width}
          height={chartSize.height}
          style={{ width: `${chartSize.width}px`, height: `${chartSize.height}px` }}
          className="absolute top-0 left-0 cursor-pointer rounded-full"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onClick={handleClick}
        />
      </div>

      {tasks.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center text-sm text-slate-500 dark:text-slate-400 mb-2 mt-2"
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

