"use client"

// Use 'import type' if using TypeScript
import type React from "react"
import { useState, useRef, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import type { Task } from "@/types/task"; // Import Task type
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
  workdayHours = 8,
  className = "",
}: PieChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [hoveredSlice, setHoveredSlice] = useState<number | null>(null)
  const [selectedSlice, setSelectedSlice] = useState<number | null>(null)
  const [isHoveringCenter, setIsHoveringCenter] = useState(false)
  const [chartSize, setChartSize] = useState({ width: 300, height: 300 }) // Start size
  const [isAnimating, setIsAnimating] = useState(false)

  const workdayMinutes = workdayHours * 60

  // Update chart size based on container, with different max sizes
  const updateChartSize = useCallback(() => {
    if (containerRef.current) {
      const { width } = containerRef.current.getBoundingClientRect();
      const isMobile = typeof window !== 'undefined' ? window.innerWidth < 768 : true;
      const maxSize = isMobile ? 320 : 500; // Adjust 500 max for desktop if needed
      const size = Math.max(10, Math.min(width, maxSize));
      // Only update if size actually changes to prevent infinite loops if observer triggers rapidly
      setChartSize(prevSize => (prevSize.width === size ? prevSize : { width: size, height: size }));
    }
  }, []);

  // Effect to update size on mount and resize
  useEffect(() => {
    updateChartSize(); // Initial calculation

    const resizeObserver = new ResizeObserver(updateChartSize);
    const currentContainer = containerRef.current;

    if (currentContainer) {
      resizeObserver.observe(currentContainer);
    }
    window.addEventListener('resize', updateChartSize);

    return () => {
      if (currentContainer) {
        resizeObserver.unobserve(currentContainer);
      }
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateChartSize);
    };
  }, [updateChartSize]);


  // Drawing Logic Effect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || chartSize.width === 0 || chartSize.height === 0) return; // Added height check

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    // Ensure canvas buffer matches calculated size * dpr
    if (canvas.width !== chartSize.width * dpr || canvas.height !== chartSize.height * dpr) {
        canvas.width = chartSize.width * dpr;
        canvas.height = chartSize.height * dpr;
        ctx.scale(dpr, dpr); // Rescale context if canvas size changed
    } else {
        // Clear existing content if size didn't change but redraw is needed
        ctx.save(); // Save context state
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // Reset transform to clear correctly
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.restore(); // Restore previous scale
    }


    const centerX = chartSize.width / 2
    const centerY = chartSize.height / 2
    // Adjust radius calculation slightly if needed
    const radius = Math.min(centerX, centerY) - (chartSize.width > 350 ? 25 : 15) // Example: slightly more padding on larger charts
    const innerRadius = radius * 0.6

    // Dynamic font sizes
    const titleFontSize = Math.max(14, Math.min(24, Math.round(chartSize.width * 0.07)))
    const detailFontSize = Math.max(10, Math.min(12, Math.round(chartSize.width * 0.05)))

    // --- Empty State Drawing ---
    if (tasks.length === 0) {
      // ... (Empty state drawing logic using dynamic font sizes - same as before) ...
        const gradient = ctx.createLinearGradient(0, 0, chartSize.width, chartSize.height)
        gradient.addColorStop(0, "#f1f5f9") // Use theme colors?
        gradient.addColorStop(1, "#e2e8f0") // Use theme colors?
        ctx.save(); ctx.shadowColor = "rgba(0, 0, 0, 0.1)"; ctx.shadowBlur = 15; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 5; ctx.beginPath(); ctx.arc(centerX, centerY, radius, 0, Math.PI * 2); ctx.fillStyle = gradient; ctx.fill(); ctx.restore();
        ctx.beginPath(); ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2); ctx.fillStyle = isHoveringCenter ? "#f8fafc" : "#ffffff"; ctx.fill(); // Use theme colors?
        ctx.font = `bold ${titleFontSize}px Inter, system-ui, sans-serif`; ctx.fillStyle = "#64748b"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("No tasks yet", centerX, centerY - (titleFontSize * 0.6)); // Use theme colors?
        ctx.font = `${detailFontSize}px Inter, system-ui, sans-serif`; ctx.fillStyle = "#94a3b8"; ctx.fillText("Click to add tasks", centerX, centerY + (detailFontSize * 1.5)); // Use theme colors?
        if (isHoveringCenter) { /* ... draw plus icon ... */ }
      return
    }

    // --- Task Slice Drawing ---
    const totalGoalTime = tasks.reduce((sum, task) => sum + task.goalTimeMinutes, 0)
    let startAngle = -Math.PI / 2
    tasks.forEach((task, index) => {
        // ... (Slice drawing logic - same as before) ...
        const sliceAngle = (task.goalTimeMinutes / workdayMinutes) * Math.PI * 2; const endAngle = startAngle + sliceAngle; const midAngle = startAngle + sliceAngle / 2; const isHovered = hoveredSlice === index; const pullDistance = isHovered ? 10 : 0; const offsetX = Math.cos(midAngle) * pullDistance; const offsetY = Math.sin(midAngle) * pullDistance;
        ctx.beginPath(); ctx.moveTo(centerX + offsetX, centerY + offsetY); ctx.arc(centerX + offsetX, centerY + offsetY, radius, startAngle, endAngle); ctx.lineTo(centerX + offsetX, centerY + offsetY); ctx.closePath(); ctx.fillStyle = isHovered ? task.color + "ee" : task.color; ctx.fill();
        if (task.progressMinutes > 0) { /* ... draw progress arc ... */ }
        startAngle = endAngle;
    })

    // --- Remaining Time Slice ---
    if (totalGoalTime < workdayMinutes) {
        // ... (Remaining time drawing logic - same as before) ...
        const remainingAngle = ((workdayMinutes - totalGoalTime) / workdayMinutes) * Math.PI * 2; const endAngle = startAngle + remainingAngle; ctx.beginPath(); ctx.moveTo(centerX, centerY); ctx.arc(centerX, centerY, radius, startAngle, endAngle); ctx.lineTo(centerX, centerY); ctx.closePath(); ctx.fillStyle = "#f1f5f9"; ctx.fill(); // Use theme colors?
    }

    // --- Inner Circle Drawing ---
    // ... (Inner circle drawing logic - same as before, consider theme colors) ...
    ctx.save(); ctx.beginPath(); ctx.arc(centerX, centerY, innerRadius + 2, 0, Math.PI * 2); ctx.strokeStyle = "rgba(0, 0, 0, 0.25)"; ctx.lineWidth = 1; ctx.stroke(); ctx.beginPath(); ctx.arc(centerX, centerY, innerRadius + 8, 0, Math.PI * 2); ctx.shadowColor = "rgba(0, 0, 0, 0.85)"; ctx.shadowBlur = 25; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 8; ctx.fillStyle = "rgba(0, 0, 0, 0.36)"; ctx.fill(); ctx.restore();
    const centerGradient = ctx.createRadialGradient(centerX, centerY - 15, 0, centerX, centerY, innerRadius); centerGradient.addColorStop(0, isHoveringCenter ? "#f0f9ff" : "#ffffff"); centerGradient.addColorStop(1, isHoveringCenter ? "#e0f2fe" : "#f8fafc"); ctx.beginPath(); ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2); ctx.fillStyle = centerGradient; ctx.fill(); // Use theme colors?
    ctx.save(); ctx.beginPath(); ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2); ctx.clip(); ctx.beginPath(); ctx.rect(centerX - radius, centerY - radius, radius * 2, innerRadius * 0.5); ctx.fillStyle = "rgba(0, 0, 0, 0.03)"; ctx.fill(); ctx.restore(); // Adjust for theme?

    // --- Center Text Drawing ---
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    let titleText = "Today";
    let detailText = "";

    // Determine Title Text (Today or Task Name)
    if (hoveredSlice !== null && tasks[hoveredSlice]) {
        const task = tasks[hoveredSlice];
        const fullTaskName = task.name;
        const maxWidth = innerRadius * 1.8; // 90% of inner diameter

        // Set font for measurement
        ctx.font = `bold ${titleFontSize}px Inter, system-ui, sans-serif`;
        let measuredWidth = ctx.measureText(fullTaskName).width;

        // Truncate if necessary
        if (measuredWidth <= maxWidth) {
            titleText = fullTaskName;
        } else {
            let truncatedName = fullTaskName;
            while (ctx.measureText(truncatedName + "...").width > maxWidth && truncatedName.length > 0) {
                truncatedName = truncatedName.slice(0, -1);
            }
            titleText = truncatedName + "...";
        }
    } else {
        titleText = "Today"; // Default title
    }

    // Determine Detail Text (Task Time or Overall Summary)
    ctx.font = `${detailFontSize}px Inter, system-ui, sans-serif`; // Set font for detail text
    if (hoveredSlice !== null && tasks[hoveredSlice]) {
        const task = tasks[hoveredSlice];
        const taskHours = Math.floor(task.goalTimeMinutes / 60);
        const taskMinutes = task.goalTimeMinutes % 60;
        detailText = `${taskHours}h ${taskMinutes}m`;
    } else {
        const totalHours = Math.floor(totalGoalTime / 60);
        const totalMinutes = totalGoalTime % 60;
        detailText = `${totalHours}h ${totalMinutes}m / ${workdayHours}h day`;
    }

    // Draw Title Text
    ctx.font = `bold ${titleFontSize}px Inter, system-ui, sans-serif`; // Ensure correct font
    ctx.fillStyle = isHoveringCenter ? "#3b82f6" : "#1e293b";
    ctx.fillText(titleText, centerX, centerY - (titleFontSize * 0.8));

    // Draw Detail Text
    ctx.font = `${detailFontSize}px Inter, system-ui, sans-serif`; // Ensure correct font
    ctx.fillStyle = "#64748b";
    // Use the appropriate vertical offset based on whether it's task time or summary
    const detailOffsetY = hoveredSlice !== null ? (detailFontSize * 1.5) : (detailFontSize * 0.5);
    ctx.fillText(detailText, centerX, centerY + detailOffsetY);

    // Draw Plus Icon if hovering center
    if (isHoveringCenter) { /* ... draw plus icon ... */ }

  // Dependencies for redraw: include everything that affects the visual output
  }, [tasks, hoveredSlice, selectedSlice, chartSize, isHoveringCenter, workdayHours, workdayMinutes, onCenterClick, onTaskSelect]); // Added chartSize, handlers


  // --- INTERACTION LOGIC ---
  // getSliceIndexFromCoords, handleMouseMove, handleMouseLeave, handleClick
  // Keep these functions as they were in the previous complete code block, they rely on chartSize.
  const getSliceIndexFromCoords = (x: number, y: number): number | null => {
    const canvas = canvasRef.current; if (!canvas) return null; const rect = canvas.getBoundingClientRect(); const dpr = window.devicePixelRatio || 1; const scaleX = canvas.width / (rect.width * dpr); const scaleY = canvas.height / (rect.height * dpr); const canvasX = (x - rect.left) * scaleX; const canvasY = (y - rect.top) * scaleY; const centerX = chartSize.width / 2; const centerY = chartSize.height / 2; const radius = Math.min(centerX, centerY) - (chartSize.width > 350 ? 25 : 15); const innerRadius = radius * 0.6; const dx = canvasX - centerX; const dy = canvasY - centerY; const distance = Math.sqrt(dx * dx + dy * dy); if (distance < innerRadius || distance > radius) { return null; } let angle = Math.atan2(dy, dx); if (angle < -Math.PI / 2) { angle += Math.PI * 2; } let currentStartAngle = -Math.PI / 2; for (let i = 0; i < tasks.length; i++) { const sliceAngle = (tasks[i].goalTimeMinutes / workdayMinutes) * Math.PI * 2; const endAngle = currentStartAngle + sliceAngle; if (angle >= currentStartAngle && angle < endAngle) { return i; } currentStartAngle = endAngle; } return null;
  };
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current; if (!canvas) return; const rect = canvas.getBoundingClientRect(); const clientX = e.clientX - rect.left; const clientY = e.clientY - rect.top; const elementCenterX = rect.width / 2; const elementCenterY = rect.height / 2; const dxClient = clientX - elementCenterX; const dyClient = clientY - elementCenterY; const distanceClient = Math.sqrt(dxClient * dxClient + dyClient * dyClient); const scaleFactor = rect.width / chartSize.width; const innerRadiusClient = (chartSize.width / 2 * 0.6) * scaleFactor; if (distanceClient < innerRadiusClient) { setIsHoveringCenter(true); setHoveredSlice(null); } else { setIsHoveringCenter(false); const sliceIndex = getSliceIndexFromCoords(e.clientX, e.clientY); setHoveredSlice(sliceIndex); }
  };
  const handleMouseLeave = () => { setHoveredSlice(null); setIsHoveringCenter(false); };
  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current; if (!canvas) return; const rect = canvas.getBoundingClientRect(); const clientX = e.clientX - rect.left; const clientY = e.clientY - rect.top; const elementCenterX = rect.width / 2; const elementCenterY = rect.height / 2; const dxClient = clientX - elementCenterX; const dyClient = clientY - elementCenterY; const distanceClient = Math.sqrt(dxClient * dxClient + dyClient * dyClient); const scaleFactor = rect.width / chartSize.width; const innerRadiusClient = (chartSize.width / 2 * 0.6) * scaleFactor; if (distanceClient < innerRadiusClient) { onCenterClick(); return; } const clickedSliceIndex = getSliceIndexFromCoords(e.clientX, e.clientY); if (clickedSliceIndex !== null && clickedSliceIndex < tasks.length) { setSelectedSlice(clickedSliceIndex); setIsAnimating(true); const taskId = tasks[clickedSliceIndex].id; setTimeout(() => { setIsAnimating(false); setSelectedSlice(null); onTaskSelect(taskId); }, 150); }
  };
  // --- END INTERACTION LOGIC ---


  return (
    // Container ref used for size calculation
    <div ref={containerRef} className={`flex flex-col items-center justify-center w-full h-full ${className}`}>
      {/* Relative container for positioning canvas */}
      <div
       className="relative flex justify-center items-center"
        style={{ width: `${chartSize.width}px`, height: `${chartSize.height}px` }}
      >
        <canvas
          ref={canvasRef}
          style={{ width: `${chartSize.width}px`, height: `${chartSize.height}px` }}
          className="absolute top-0 left-0 cursor-pointer rounded-full"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onClick={handleClick}
          // Set initial width/height attributes to avoid layout shifts, useEffect will update with DPR
          width={chartSize.width}
          height={chartSize.height}
        />
      </div>
    </div>
  )
}