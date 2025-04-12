"use client"

import { useRef, useEffect, useCallback, memo, useLayoutEffect } from "react"
import { Clock } from "lucide-react"
import type { TimerMode } from "@/context/timer-context"
import { useTimer } from "@/context/timer-context"
import { isFontLoaded } from "@/lib/font-registry"

interface TimerCircleProps {
  mode: TimerMode
  currentModeTotalDuration: number
  timeLeftInMode: number
  taskProgress: number
  timeDisplay: string
  taskName: string
  isRunning: boolean
  onTimerClick: () => void
  taskGoalMinutes?: number
  taskTimeLeftSeconds?: number
}

const TimerCircle = memo(function TimerCircle({
  mode,
  currentModeTotalDuration,
  timeLeftInMode,
  taskProgress,
  timeDisplay,
  taskName,
  isRunning,
  onTimerClick,
  taskGoalMinutes = 120,
  taskTimeLeftSeconds = 7200,
}: TimerCircleProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const { settings } = useTimer();
  const prevTimeRef = useRef(timeLeftInMode);
  const mountedRef = useRef(false);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !mountedRef.current) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Always get fresh dimensions
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    // Always update canvas size to match display size
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;

    // Clear the canvas
    ctx.clearRect(0, 0, width, height);

    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(centerX, centerY) * 0.95;
    const trackWidth = Math.min(centerX, centerY) * 0.2;
    const innerRadius = radius - trackWidth - (radius * 0.02);
    const startAngle = -Math.PI / 2;
    const fullCircle = Math.PI * 2;

    // Calculate responsive sizes
    const shadowBlur = Math.min(centerX, centerY) * 0.15;
    const shadowOffset = Math.min(centerX, centerY) * 0.08;
    const iconSize = Math.min(centerX, centerY) * 0.15;

    // Play/pause icon dimensions
    const pauseWidth = iconSize * 0.8;
    const pauseHeight = iconSize;
    const pauseBarWidth = pauseWidth * 0.3;

    // Font sizes based on canvas size
    const viewportSize = Math.min(width, height);
    const baseFontSize = viewportSize * 0.25;
    const subtitleFontSize = viewportSize * 0.08;
    const taskTimeFontSize = viewportSize * 0.06;

    // Layer 1: Base (Gray Track)
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius - trackWidth / 2, 0, fullCircle);
    ctx.lineWidth = trackWidth;
    ctx.strokeStyle = "hsl(210, 40%, 85%)";
    ctx.stroke();
    ctx.restore();

    // Layer 2: Task Progress (Red)
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
    ctx.strokeStyle = "hsl(0, 84.2%, 60.2%)";
    ctx.stroke();
    ctx.restore();

    // Layer 3: Mode Progress (Blue/Green)
    ctx.save();
    const modeProgress = timeLeftInMode / currentModeTotalDuration;
    let baseModeColor = "hsl(221.2, 83.2%, 53.3%)";
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
      baseModeColor = "hsl(142.1, 76.2%, 36.3%)";
      const breakArcEndAngle = startAngle + currentModeArcSize;

      ctx.beginPath();
      ctx.arc(centerX, centerY, radius - trackWidth / 2, startAngle, breakArcEndAngle);
      ctx.lineWidth = trackWidth;
      ctx.lineCap = "round";
      ctx.strokeStyle = baseModeColor;
      ctx.stroke();
    }
    ctx.restore();

    // Layer 4: Center
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, innerRadius + (trackWidth * 0.1), 0, fullCircle);
    ctx.shadowColor = "rgba(0, 0, 0, 0.7)";
    ctx.shadowBlur = shadowBlur;
    ctx.shadowOffsetX = shadowOffset;
    ctx.shadowOffsetY = shadowOffset;
    ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(centerX, centerY, innerRadius, 0, fullCircle);
    ctx.shadowColor = "rgba(0, 0, 0, 0.6)";
    ctx.shadowBlur = shadowBlur * 0.7;
    ctx.shadowOffsetX = shadowOffset * 0.7;
    ctx.shadowOffsetY = shadowOffset * 0.7;
    ctx.fillStyle = "hsl(0, 0%, 100%)";
    ctx.fill();
    ctx.restore();

    // Play/pause icon
    ctx.save();
    ctx.fillStyle = "hsl(215.4, 16.3%, 75%)";
    if (isRunning) {
      const pauseX = centerX - pauseWidth / 2;
      const pauseY = centerY - pauseHeight / 2;
      const barSpacing = pauseWidth * 0.2;
      
      ctx.fillRect(pauseX, pauseY, pauseBarWidth, pauseHeight);
      ctx.fillRect(pauseX + pauseBarWidth + barSpacing, pauseY, pauseBarWidth, pauseHeight);
    } else {
      ctx.beginPath();
      ctx.moveTo(centerX - iconSize * 0.5, centerY - iconSize * 0.75);
      ctx.lineTo(centerX - iconSize * 0.5, centerY + iconSize * 0.75);
      ctx.lineTo(centerX + iconSize * 0.75, centerY);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    // Use Doto font if loaded, otherwise fallback to system font
    const isDotoLoaded = isFontLoaded('doto');
    const fontFamily = isDotoLoaded ? "var(--font-doto), system-ui, sans-serif" : "system-ui, sans-serif";

    // Timer text
    ctx.font = `bold ${baseFontSize}px ${fontFamily}`;
    ctx.fillStyle = "#000000";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(timeDisplay, centerX, centerY - iconSize * 0.5);

    let subtitle = taskName;
    if (mode === 'shortBreak') subtitle = 'Short Break';
    if (mode === 'longBreak') subtitle = 'Long Break';
    if (mode === 'idle') subtitle = 'Ready';

    ctx.font = `${subtitleFontSize}px ${fontFamily}`;
    ctx.fillStyle = "#666666";
    ctx.fillText(subtitle, centerX, centerY + iconSize * 0.75);

    if (mode === 'working' && taskTimeLeftSeconds !== undefined && taskTimeLeftSeconds >= 0) {
      const hoursLeft = Math.floor(taskTimeLeftSeconds / 3600);
      const minutesLeft = Math.floor((taskTimeLeftSeconds % 3600) / 60);
      ctx.font = `${taskTimeFontSize}px system-ui, sans-serif`;
      ctx.fillStyle = "#666666";
      ctx.fillText(`${hoursLeft}h ${minutesLeft}m remaining`, centerX, centerY + 35);
    }

    if (isRunning && mountedRef.current) {
      animationFrameRef.current = requestAnimationFrame(draw);
    }
  }, [mode, timeLeftInMode, isRunning, taskTimeLeftSeconds, timeDisplay, taskName, currentModeTotalDuration, taskGoalMinutes]);

  // Setup canvas dimensions and initial draw
  useLayoutEffect(() => {
    mountedRef.current = true;
    draw();
    return () => {
      mountedRef.current = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [draw]);

  // Handle resize
  useEffect(() => {
    if (!mountedRef.current) return;

    const handleResize = () => {
      if (!mountedRef.current) return;
      draw();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [draw]);

  // Handle visibility change
  useEffect(() => {
    if (!mountedRef.current) return;

    const handleVisibilityChange = () => {
      if (!mountedRef.current) return;
      if (settings.autoPauseEnabled && isRunning && document.visibilityState === 'hidden') {
        onTimerClick();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [settings.autoPauseEnabled, isRunning, onTimerClick]);

  // Redraw when Doto font loads
  useEffect(() => {
    const handleFontsLoaded = () => {
      if (mountedRef.current) {
        draw();
      }
    };

    window.addEventListener('fontsloaded', handleFontsLoaded);
    return () => window.removeEventListener('fontsloaded', handleFontsLoaded);
  }, [draw]);

  return (
    <div className="flex flex-col items-center">
      <div 
        className="relative w-full max-w-[400px] aspect-square rounded-lg overflow-hidden"
        onClick={onTimerClick}
      >
        <canvas 
          ref={canvasRef} 
          className="w-full h-full cursor-pointer block"
          style={{ width: '100%', height: '100%' }}
        />
      </div>

      {/* Task time label */}
      <div className="flex items-center text-sm text-gray-500 mt-4">
        <Clock className="w-4 h-4 mr-2" />
        <span>
          {Math.floor(taskGoalMinutes / 60)}h{taskGoalMinutes % 60 > 0 ? ` ${taskGoalMinutes % 60}m` : ""} task
        </span>
      </div>
    </div>
  );
});

export { TimerCircle }

