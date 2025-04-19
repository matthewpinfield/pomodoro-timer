"use client"

// Use 'import type' if using TypeScript
import type React from "react"
import { useState, useRef, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import type { Task } from "@/types/task"; // Import Task type
import { Clock, Plus, Play } from "lucide-react"
import { useTheme } from "next-themes"; // Import useTheme

interface PieChartProps {
  tasks: Task[]
  onTaskSelect: (taskId: string) => void
  onCenterClick: () => void
  workdayHours?: number
  className?: string;
  forceMonochrome?: boolean; // Add prop
}

// Helper function to get CSS variable value
const getCssVariable = (variableName: string): string => {
  if (typeof window === "undefined") return "#808080"; // Default for SSR/initial render
  return getComputedStyle(document.documentElement).getPropertyValue(variableName).trim() || "#808080"; // Fallback
};

export function PieChart({
  tasks,
  onTaskSelect,
  onCenterClick,
  workdayHours = 8,
  className = "",
  forceMonochrome = false, // Destructure prop with default
}: PieChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [hoveredSlice, setHoveredSlice] = useState<number | null>(null)
  const [selectedSlice, setSelectedSlice] = useState<number | null>(null)
  const [isHoveringCenter, setIsHoveringCenter] = useState(false)
  const [chartSize, setChartSize] = useState({ width: 300, height: 300 }) // Start size
  const [isAnimating, setIsAnimating] = useState(false)
  const { theme } = useTheme(); // Get the current theme
  // State to store computed colors, now might include monochrome shades
  const [computedSliceColors, setComputedSliceColors] = useState<{ [key: string]: string }>({});
  const [computedEmptyColor, setComputedEmptyColor] = useState<string>('#cccccc');
  const [computedInnerBg, setComputedInnerBg] = useState<string>('#ffffff');
  const [computedTextColor, setComputedTextColor] = useState<string>('#000000');
  const [computedMutedTextColor, setComputedMutedTextColor] = useState<string>('#666666');

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

  // Effect to compute colors based on theme AND forceMonochrome prop
  useEffect(() => {
    const newSliceColors: { [key: string]: string } = {};
    const primaryColor = getCssVariable('--primary');
    
    if (forceMonochrome) {
        // --- Monochrome Logic --- 
        // Simple lightness adjustment example (more sophisticated logic possible)
        const baseLightness = 70; // Adjust base lightness (0-100) as needed
        const lightnessStep = 5; // Adjust step between shades
        
        tasks.forEach((task, index) => {
            // Calculate lightness: start lighter, get slightly darker
            // Ensure lightness stays within reasonable bounds (e.g., 30-90)
            const lightness = Math.max(30, Math.min(90, baseLightness - (index * lightnessStep)));
            // Reconstruct color (assuming OKLCH primary color format)
            // This assumes --primary is defined like: oklch(L C H)
            // We will replace L with the calculated lightness
            const parts = primaryColor.match(/oklch\(([^ ]+) ([^ ]+) ([^)]+)\)/);
            if (parts) {
                 // Construct OKLCH string with new lightness
                 newSliceColors[task.chartIndex] = `oklch(${lightness / 100} ${parts[2]} ${parts[3]})`;
            } else {
                 // Fallback if primary color isn't OKLCH or parsing fails
                 // Could use tinycolor2 here for HSL manipulation as fallback
                 newSliceColors[task.chartIndex] = primaryColor; // Just use primary as fallback
            }
        });
        setComputedEmptyColor(getCssVariable('--secondary')); // Use secondary for empty space in monochrome

    } else {
        // --- Standard Theme Color Logic --- 
        tasks.forEach(task => {
            newSliceColors[task.chartIndex] = getCssVariable(`--chart-${task.chartIndex}`);
        });
        setComputedEmptyColor(getCssVariable('--secondary')); // Use secondary for empty space
    }

    setComputedSliceColors(newSliceColors);
    // Update other fixed colors (could also be made monochrome)
    setComputedInnerBg(getCssVariable('--popover')); // Inner circle background
    setComputedTextColor(getCssVariable('--popover-foreground')); // Center text
    setComputedMutedTextColor(getCssVariable('--muted-foreground')); // Sub-text

  // Depend on tasks AND forceMonochrome prop
  }, [tasks, forceMonochrome]); 

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

    // Get theme colors ONCE per redraw
    const bgColor = getCssVariable('--background');
    const fgColor = getCssVariable('--foreground');
    const cardColor = getCssVariable('--card');
    const primaryColor = getCssVariable('--primary');
    const mutedFgColor = getCssVariable('--muted-foreground');
    const secondaryColor = getCssVariable('--secondary');
    const accentColor = getCssVariable('--accent'); // For center hover?
    const borderColor = getCssVariable('--border');

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
        ctx.save(); ctx.shadowColor = "rgba(0, 0, 0, 0.1)"; ctx.shadowBlur = 15; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 5; ctx.beginPath(); ctx.arc(centerX, centerY, radius, 0, Math.PI * 2); ctx.fillStyle = secondaryColor; ctx.fill(); ctx.restore();
        ctx.beginPath(); ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2); ctx.fillStyle = isHoveringCenter ? primaryColor : cardColor; ctx.fill(); // Use primary color on hover like button
        ctx.font = `bold ${titleFontSize}px Inter, system-ui, sans-serif`; ctx.fillStyle = isHoveringCenter ? primaryColor : mutedFgColor; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(isHoveringCenter ? "Add Task" : "No tasks yet", centerX, centerY - (titleFontSize * 0.6));
        ctx.font = `${detailFontSize}px Inter, system-ui, sans-serif`; ctx.fillStyle = isHoveringCenter ? primaryColor : mutedFgColor; ctx.fillText(isHoveringCenter ? "Click to plan your day" : "Click center to add", centerX, centerY + (detailFontSize * 1.5));
        if (isHoveringCenter) { /* ... draw plus icon ... */ }
      return
    }

    // --- Task Slice Drawing ---
    const totalGoalTime = tasks.reduce((sum, task) => sum + task.goalTimeMinutes, 0)
    let startAngle = -Math.PI / 2
    tasks.forEach((task, index) => {
        // ... (Slice drawing logic - same as before) ...
        const sliceAngle = (task.goalTimeMinutes / workdayMinutes) * Math.PI * 2; const endAngle = startAngle + sliceAngle; const midAngle = startAngle + sliceAngle / 2; const isHovered = hoveredSlice === index; const pullDistance = isHovered ? 10 : 0; const offsetX = Math.cos(midAngle) * pullDistance; const offsetY = Math.sin(midAngle) * pullDistance;
        const color = computedSliceColors[task.chartIndex] || '#cccccc'; // FIX: Use chartIndex as key
        ctx.beginPath(); ctx.moveTo(centerX + offsetX, centerY + offsetY); ctx.arc(centerX + offsetX, centerY + offsetY, radius, startAngle, endAngle); ctx.lineTo(centerX + offsetX, centerY + offsetY); ctx.closePath();

        // Apply hover effect with transparency correctly for OKLCH
        if (isHovered) {
          // Check if it's an OKLCH color
          if (color.startsWith('oklch(')) {
            ctx.fillStyle = color.replace(')', ' / 0.8)'); // Add alpha channel
          } else {
            ctx.fillStyle = color + "cc"; // Fallback for non-OKLCH (e.g., #cccccc)
          }
        } else {
          ctx.fillStyle = color;
        }

        ctx.fill();
        if (task.progressMinutes > 0) { /* ... draw progress arc ... */ }
        startAngle = endAngle;
    })

    // --- Remaining Time Slice ---
    if (totalGoalTime < workdayMinutes) {
        // ... (Remaining time drawing logic - same as before) ...
        const remainingAngle = ((workdayMinutes - totalGoalTime) / workdayMinutes) * Math.PI * 2; const endAngle = startAngle + remainingAngle; ctx.beginPath(); ctx.moveTo(centerX, centerY); ctx.arc(centerX, centerY, radius, startAngle, endAngle); ctx.lineTo(centerX, centerY); ctx.closePath(); ctx.fillStyle = computedEmptyColor; ctx.fill(); // Use computed empty color
    }

    // --- Inner Circle Drawing ---
    // ... (Inner circle drawing logic - same as before, consider theme colors) ...
    ctx.save(); ctx.beginPath(); ctx.arc(centerX, centerY, innerRadius + 1, 0, Math.PI * 2); ctx.strokeStyle = borderColor + "40"; ctx.lineWidth = 1; ctx.stroke(); ctx.beginPath(); ctx.arc(centerX, centerY, innerRadius + 8, 0, Math.PI * 2); ctx.shadowColor = "rgba(0, 0, 0, 0.5)"; ctx.shadowBlur = 15; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 4; ctx.fillStyle = computedInnerBg; ctx.fill(); ctx.restore();
    const centerGradient = ctx.createRadialGradient(centerX, centerY - 15, 0, centerX, centerY, innerRadius); centerGradient.addColorStop(0, isHoveringCenter ? accentColor : cardColor); centerGradient.addColorStop(1, isHoveringCenter ? accentColor : cardColor); ctx.beginPath(); ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2); ctx.fillStyle = centerGradient; ctx.fill(); // Use theme colors?
    ctx.save(); ctx.beginPath(); ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2); ctx.clip(); ctx.beginPath(); ctx.rect(centerX - radius, centerY - radius, radius * 2, innerRadius * 0.5); ctx.fillStyle = "rgba(0, 0, 0, 0.02)"; ctx.fill(); ctx.restore(); // Adjust for theme?

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
    } else if (isHoveringCenter) {
        titleText = "Add Task"; // Text when hovering center
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
    } else if (isHoveringCenter) {
        detailText = "Click to plan your day"; // Detail text when hovering center
    } else {
        const totalHours = Math.floor(totalGoalTime / 60);
        const totalMinutes = totalGoalTime % 60;
        detailText = `${totalHours}h ${totalMinutes}m / ${workdayHours}h day`;
    }

    // Draw Title Text
    ctx.font = `bold ${titleFontSize}px Inter, system-ui, sans-serif`; // Ensure correct font
    ctx.fillStyle = isHoveringCenter ? primaryColor : computedTextColor;
    ctx.fillText(titleText, centerX, centerY - (titleFontSize * 0.8));

    // Draw Detail Text
    ctx.font = `${detailFontSize}px Inter, system-ui, sans-serif`; // Ensure correct font
    ctx.fillStyle = computedMutedTextColor;
    // Use the appropriate vertical offset based on whether it's task time or summary
    const detailOffsetY = hoveredSlice !== null ? (detailFontSize * 1.5) : (detailFontSize * 0.5);
    ctx.fillText(detailText, centerX, centerY + detailOffsetY);

    // Draw Plus Icon if hovering center
    if (isHoveringCenter) { /* ... draw plus icon ... */ }

  // Dependencies for redraw: include everything that affects the visual output
  }, [tasks, hoveredSlice, selectedSlice, chartSize, isHoveringCenter, workdayHours, workdayMinutes, onCenterClick, onTaskSelect, theme, computedSliceColors, computedEmptyColor, computedInnerBg, computedTextColor, computedMutedTextColor]); // Added chartSize, handlers, and theme


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
    const canvas = canvasRef.current; if (!canvas) return; const rect = canvas.getBoundingClientRect(); const clientX = e.clientX - rect.left; const clientY = e.clientY - rect.top; const elementCenterX = rect.width / 2; const elementCenterY = rect.height / 2; const dxClient = clientX - elementCenterX; const dyClient = clientY - elementCenterY; const distanceClient = Math.sqrt(dxClient * dxClient + dyClient * dyClient); const scaleFactor = rect.width / chartSize.width; const innerRadiusClient = (chartSize.width / 2 * 0.6) * scaleFactor; if (distanceClient < innerRadiusClient) { onCenterClick(); return; } const clickedSliceIndex = getSliceIndexFromCoords(e.clientX, e.clientY); if (clickedSliceIndex !== null && clickedSliceIndex < tasks.length) {

      // Prevent selecting demo tasks
      const task = tasks[clickedSliceIndex];
      if (task && task.id.startsWith('demo-')) {
        console.log("Prevented selection of demo task:", task.id);
        // Optionally, open the plan day dialog here instead?
        // onCenterClick(); // Example: open plan day dialog
        return; 
      }

      // Original logic to select the task (only runs if not demo)
      setSelectedSlice(clickedSliceIndex);
      setIsAnimating(true);
      const taskId = task.id;
      setTimeout(() => { setIsAnimating(false); setSelectedSlice(null); onTaskSelect(taskId); }, 150); 
    }
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