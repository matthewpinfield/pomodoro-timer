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
  const [chartSize, setChartSize] = useState({ width: 300, height: 300 }) // Start with a default size
  const [isAnimating, setIsAnimating] = useState(false)

  // Demo tasks for empty state visualization
  const demoTasks = [
    { id: 'demo1', name: 'Deep Work', goalTimeMinutes: 120, progressMinutes: 0, color: '#4f46e5' },
    { id: 'demo2', name: 'Meetings', goalTimeMinutes: 90, progressMinutes: 0, color: '#f97316' },
    { id: 'demo3', name: 'Planning', goalTimeMinutes: 60, progressMinutes: 0, color: '#14b8a6' },
    { id: 'demo4', name: 'Breaks', goalTimeMinutes: 30, progressMinutes: 0, color: '#ec4899' }
  ]

  // Use demo tasks only when no real tasks exist
  const displayTasks = tasks.length > 0 ? tasks : demoTasks

  // Convert workday hours to minutes
  const workdayMinutes = workdayHours * 60

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

    for (let i = 0; i < displayTasks.length; i++) {
      const sliceAngle = (displayTasks[i].goalTimeMinutes / workdayMinutes) * Math.PI * 2;
      const endAngle = startAngle + sliceAngle;

      if (angle >= startAngle && angle < endAngle) {
        return i;
      }
      startAngle = endAngle;
    }

    return null; // Should not happen if click is within a segment, but safety return
  };

  // Determine chart size based on screen width
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      // Size calculations based on screen size and orientation
      let size;
      if (width < height) { // Portrait mode (mobile)
        size = Math.min(width * 0.75, height * 0.35); 
      } else { // Landscape mode (desktop)
        size = Math.min(height * 0.55, width * 0.35);
      }
      
      // Apply size with a minimum bound
      const minSize = Math.max(300, Math.min(width, height) * 0.25); // Ensure at least 300px
      setChartSize({ 
        width: Math.max(size, minSize),
        height: Math.max(size, minSize)
      });
    }

    // Run immediately and on resize
    handleResize();
    window.addEventListener("resize", handleResize);
    
    // Force a redraw after a slight delay to ensure dimensions are applied
    const timer = setTimeout(() => {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          // Force a clear and redraw
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          // Immediately queue a redraw
          requestAnimationFrame(() => handleResize());
        }
      }
    }, 100);
    
    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(timer);
    }
  }, []);

  // Touch event handlers for mobile
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      const touch = e.touches[0];
      const rect = canvas.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      
      // Use existing functions to determine what was touched
      const clickedSliceIndex = getSliceIndexFromCoords(x, y);
      
      if (clickedSliceIndex !== null && tasks.length > 0) {
        setSelectedSlice(clickedSliceIndex);
        onTaskSelect(tasks[clickedSliceIndex].id);
      } else {
        // Check if center was clicked
        const centerX = chartSize.width / 2;
        const centerY = chartSize.height / 2;
        const innerRadius = Math.min(centerX, centerY) - 20;
        const innerRadius2 = innerRadius * 0.6;
        
        const dx = x - centerX;
        const dy = y - centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance <= innerRadius2) {
          onCenterClick();
        }
      }
    };

    canvas.addEventListener('touchstart', handleTouchStart);
    
    return () => {
      canvas.removeEventListener('touchstart', handleTouchStart);
    };
  }, [tasks, chartSize, onTaskSelect, onCenterClick, getSliceIndexFromCoords]);

  // Draw the pie chart
  useEffect(() => {
    try {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Set canvas dimensions with device pixel ratio for sharp rendering
      const dpr = window.devicePixelRatio || 1;
      canvas.width = chartSize.width * dpr;
      canvas.height = chartSize.height * dpr;
      ctx.scale(dpr, dpr);

      // Clear canvas
      ctx.clearRect(0, 0, chartSize.width, chartSize.height);

      const centerX = chartSize.width / 2;
      const centerY = chartSize.height / 2;
      
      // Use dvmin for radius calculations
      const minRadius = chartSize.width * 0.1; // 10% of chart size
      const radius = Math.max(minRadius, Math.min(centerX, centerY) - (chartSize.width * 0.05)); // 5% padding
      const innerRadius = radius * 0.6;

      // Define Tailwind-based font sizes in pixels (using theme)
      const fontBase = Math.min(centerX, centerY) * 0.08; // text-base (~16px scaled)
      const fontSm = Math.min(centerX, centerY) * 0.07;   // text-sm (~14px scaled)
      const fontXs = Math.min(centerX, centerY) * 0.06;   // text-xs (~12px scaled)

      // If no tasks (including demo tasks), draw empty circle with gradient
      if (displayTasks.length === 0) {
        // Create gradient background
        const gradient = ctx.createLinearGradient(0, 0, chartSize.width, chartSize.height);
        gradient.addColorStop(0, "hsl(var(--muted) / 0.2)");
        gradient.addColorStop(1, "hsl(var(--muted) / 0.1)");

        // Draw outer circle with shadow
        ctx.save();
        ctx.shadowColor = "rgba(0, 0, 0, 0.1)";
        ctx.shadowBlur = radius * 0.05; // 5% of radius
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = radius * 0.02; // 2% of radius

        // Draw the empty circle
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // Draw inner circle (cutout)
        ctx.beginPath();
        ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2);
        ctx.fillStyle = "hsl(var(--background))";
        ctx.fill();

        // Add text
        ctx.fillStyle = "hsl(var(--muted-foreground))";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        // Add "Add Tasks" text
        ctx.font = `${fontBase}px system-ui`;
        ctx.fillText("Add Tasks", centerX, centerY - fontBase);

        // Add "Click + to get started" text
        ctx.font = `${fontSm}px system-ui`;
        ctx.fillText("Click + to get started", centerX, centerY + fontBase);

        ctx.restore();
        return;
      }

      // Draw task slices
      let startAngle = -Math.PI / 2; // Start from 12 o'clock
      displayTasks.forEach((task, index) => {
        const sliceAngle = (task.goalTimeMinutes / workdayMinutes) * Math.PI * 2;
        const endAngle = startAngle + sliceAngle;

        // Draw slice
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        ctx.closePath();

        // Apply hover/selection effects
        const isHovered = hoveredSlice === index;
        const isSelected = selectedSlice === index;
        const baseColor = task.color;
        const hoverColor = isHovered ? adjustColor(baseColor, 20) : baseColor;
        const selectedColor = isSelected ? adjustColor(baseColor, -20) : hoverColor;

        ctx.fillStyle = selectedColor;
        ctx.fill();

        // Add task name
        const midAngle = startAngle + sliceAngle / 2;
        const textRadius = radius * 0.8;
        const textX = centerX + Math.cos(midAngle) * textRadius;
        const textY = centerY + Math.sin(midAngle) * textRadius;

        ctx.save();
        ctx.translate(textX, textY);
        ctx.rotate(midAngle + Math.PI / 2);

        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = `${fontSm}px system-ui`;

        // Truncate text if too long
        const maxWidth = radius * 0.8;
        let displayText = task.name;
        while (ctx.measureText(displayText).width > maxWidth && displayText.length > 0) {
          displayText = displayText.slice(0, -1);
        }
        if (displayText.length < task.name.length) {
          displayText += "...";
        }

        ctx.fillText(displayText, 0, 0);
        ctx.restore();

        startAngle = endAngle;
      });

      // Draw center circle
      ctx.beginPath();
      ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff";
      ctx.fill();

      // Add center button
      ctx.save();
      ctx.shadowColor = "rgba(0, 0, 0, 0.1)";
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 2;

      // Draw plus icon
      const iconSize = innerRadius * 0.4;
      const iconX = centerX - iconSize / 2;
      const iconY = centerY - iconSize / 2;

      ctx.fillStyle = isHoveringCenter ? "#4f46e5" : "#64748b";
      ctx.fillRect(iconX, centerY - iconSize / 4, iconSize, iconSize / 2);
      ctx.fillRect(centerX - iconSize / 4, iconY, iconSize / 2, iconSize);

      ctx.restore();
    } catch (error) {
      console.error("Error drawing pie chart:", error);
    }
  }, [displayTasks, hoveredSlice, selectedSlice, isHoveringCenter, chartSize, workdayMinutes, workdayHours]);

  // Helper function to adjust color brightness
  function adjustColor(color: string, amount: number): string {
    // Parse the hex color string
    let hexColor = color;
    
    // Convert HSL variable to hex if needed
    if (color.startsWith('hsl')) {
      // For demo purposes, just use a fallback
      return amount > 0 ? lightenColor(color) : darkenColor(color);
    }
    
    if (color.startsWith('#')) {
      hexColor = color.slice(1);
    }
    
    const num = parseInt(hexColor, 16);
    
    let r = (num >> 16) + amount;
    r = Math.min(Math.max(0, r), 255);
    
    let g = ((num >> 8) & 0x00FF) + amount;
    g = Math.min(Math.max(0, g), 255);
    
    let b = (num & 0x0000FF) + amount;
    b = Math.min(Math.max(0, b), 255);
    
    return `#${(g | (b << 8) | (r << 16)).toString(16).padStart(6, '0')}`;
  }
  
  // Helper functions for HSL colors
  function lightenColor(color: string): string {
    // Simple approximation for demo
    return color.replace(')', ', 0.9)').replace('hsl', 'hsla');
  }
  
  function darkenColor(color: string): string {
    // Simple approximation for demo
    return color.replace(')', ', 1.1)').replace('hsl', 'hsla');
  }

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

    if (clickedSliceIndex !== null && clickedSliceIndex < displayTasks.length) {
      const taskId = displayTasks[clickedSliceIndex].id;
      setSelectedSlice(clickedSliceIndex);
      setIsAnimating(true);
      
      // Trigger navigation immediately
      onTaskSelect(taskId);

      // Reset animation/selection state after a short delay
      setTimeout(() => {
        setIsAnimating(false);
        setSelectedSlice(null);
      }, 300); 
    }
  };

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={chartSize.width}
        height={chartSize.height}
        style={{ width: `${chartSize.width}px`, height: `${chartSize.height}px` }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        className="cursor-pointer"
      />
      <AnimatePresence>
        {hoveredSlice !== null && tasks.length > 0 && (
          <motion.div
            className="absolute top-0 left-0 bg-white/90 backdrop-blur-sm p-md rounded-lg shadow-lg border border-gray-100"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            style={{
              transform: `translate(${chartSize.width / 2}px, ${chartSize.height + 16}px)`,
            }}
          >
            <div className="flex items-center gap-sm">
              <div
                className="w-icon-sm h-icon-sm rounded-full"
                style={{ backgroundColor: tasks[hoveredSlice].color }}
              />
              <div>
                <div className="font-medium">{tasks[hoveredSlice].name}</div>
                <div className="text-sm text-gray-500">
                  {Math.floor(tasks[hoveredSlice].goalTimeMinutes / 60)}h{" "}
                  {tasks[hoveredSlice].goalTimeMinutes % 60}m
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

