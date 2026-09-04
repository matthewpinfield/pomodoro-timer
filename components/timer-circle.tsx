// timer-circle.tsx (Corrected Version)
"use client"

import { useRef, useEffect, useCallback, memo, useLayoutEffect } from "react"
import { Clock, Play, Pause } from "lucide-react"
import type { TimerMode } from "@/context/timer-context"
import { useTimer } from "@/context/timer-context"
// Import needed helpers from single utility file
import { getCssVariable, parseOklch } from '@/lib/utils'; // Assuming unsplit state

interface TimerCircleProps {
  mode: TimerMode
  currentModeTotalDuration: number
  timeLeftInMode: number
  timeDisplay: string
  taskName: string
  isRunning: boolean
  onTimerClick: () => void
  taskGoalMinutes: number
  taskTimeLeftSeconds: number; // Type is just number
  taskColor: string // Base task color
  // NO modeColor prop
}


const TimerCircle = memo(function TimerCircle({
  mode,
  currentModeTotalDuration,
  timeLeftInMode,
  timeDisplay,
  taskName,
  isRunning,
  onTimerClick,
  taskGoalMinutes,
  taskTimeLeftSeconds, // Receive number (parent handles NaN conversion)
  taskColor,
}: TimerCircleProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const { settings } = useTimer();
  const mountedRef = useRef(false);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !mountedRef.current) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // --- Dimensions, Scaling, Clearing ---
    const rect = canvas.getBoundingClientRect(); const dpr = window.devicePixelRatio || 1;
    if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
        canvas.width = rect.width * dpr; canvas.height = rect.height * dpr; ctx.scale(dpr, dpr);
    }
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    const width = rect.width; const height = rect.height; const centerX = width / 2; const centerY = height / 2;
    
    // EXACT MATCH to pie-chart.tsx radius
    const radius = Math.min(centerX, centerY) - (width > 350 ? 25 : 15);
    const innerRadius = radius * 0.6; // 60% of radius

    // --- Colors ---
    const secondaryColor = getCssVariable('--secondary', '#e2e8f0');
    const borderColor = getCssVariable('--border', '#e5e7eb');
    const computedInnerBg = getCssVariable('--popover', '#ffffff');
    const cardColor = getCssVariable('--card', '#ffffff');

    // --- Draw Base Background Ring (Empty portion) ---
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.lineTo(centerX, centerY);
    ctx.closePath();
    ctx.fillStyle = secondaryColor;
    ctx.fill();

    // --- Draw Active Timer Slice ---
    const startAngle = -Math.PI / 2; // Top Center
    let currentModeArcSize = 0;
    const safeTimeLeftInMode = isNaN(timeLeftInMode) ? 0 : timeLeftInMode;
    if (currentModeTotalDuration > 0 && safeTimeLeftInMode >= 0) {
        const modeRemainingFraction = Math.min(1, safeTimeLeftInMode / currentModeTotalDuration);
        currentModeArcSize = (Math.PI * 2) * modeRemainingFraction;
    }
    const modeEndAngle = startAngle + currentModeArcSize;

    // Distinct Mode Colors
    let finalModeColor = getCssVariable('--primary', '#3b82f6');
    if (mode === 'working') {
        finalModeColor = taskColor || getCssVariable('--timer-work-fixed', '#3b82f6'); 
    } else if (mode === 'shortBreak' || mode === 'longBreak') {
        finalModeColor = getCssVariable('--timer-rest-fixed', '#10b981');
    }

    if (currentModeArcSize > 1e-6 && mode !== 'idle') {
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, modeEndAngle);
        ctx.lineTo(centerX, centerY);
        ctx.closePath();
        ctx.fillStyle = finalModeColor;
        ctx.fill();
    }

    // --- Inner Circle Drawing (Exact Canvas Match to Pie Chart) ---
    // Outer border of inner mask
    ctx.save(); 
    ctx.beginPath(); 
    ctx.arc(centerX, centerY, innerRadius + 1, 0, Math.PI * 2); 
    ctx.strokeStyle = borderColor + "40"; 
    ctx.lineWidth = 1; 
    ctx.stroke(); 

    // Shadow Layer
    ctx.beginPath(); 
    ctx.arc(centerX, centerY, innerRadius + 8, 0, Math.PI * 2); 
    ctx.shadowColor = "rgba(0, 0, 0, 0.5)"; 
    ctx.shadowBlur = 15; 
    ctx.shadowOffsetX = 0; 
    ctx.shadowOffsetY = 4; 
    ctx.fillStyle = computedInnerBg; 
    ctx.fill(); 
    ctx.restore();

    // Inner Fill Gradient
    const centerGradient = ctx.createRadialGradient(centerX, centerY - 15, 0, centerX, centerY, innerRadius); 
    centerGradient.addColorStop(0, cardColor); 
    centerGradient.addColorStop(1, cardColor); 
    ctx.beginPath(); 
    ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2); 
    ctx.fillStyle = centerGradient; 
    ctx.fill(); 

    // Top Gloss Detail (Signature Pie Chart style)
    ctx.save(); 
    ctx.beginPath(); 
    ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2); 
    ctx.clip(); 
    ctx.beginPath(); 
    ctx.rect(centerX - radius, centerY - radius, radius * 2, innerRadius * 0.5); 
    ctx.fillStyle = "rgba(0, 0, 0, 0.02)"; 
    ctx.fill(); 
    ctx.restore();

    // requestAnimationFrame loop
    if (isRunning && mountedRef.current) { animationFrameRef.current = requestAnimationFrame(draw); }
    else { if (animationFrameRef.current) { cancelAnimationFrame(animationFrameRef.current); animationFrameRef.current = undefined; } }

  }, [ // Dependencies
      mode, timeLeftInMode, isRunning, taskTimeLeftSeconds, timeDisplay,
      taskName, currentModeTotalDuration, taskGoalMinutes,
      taskColor, settings?.autoPauseEnabled
  ]);

  // --- Effects (layout, resize, visibility) ---
  useLayoutEffect(() => { mountedRef.current = true; draw(); return () => { mountedRef.current = false; if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current); }; }, [draw]);
  useEffect(() => { if (!mountedRef.current) return; const h = () => { if(mountedRef.current) draw(); }; window.addEventListener('resize', h); return () => window.removeEventListener('resize', h); }, [draw]);
  useEffect(() => { if (!mountedRef.current) return; const h = () => { if (mountedRef.current && settings?.autoPauseEnabled && isRunning && document.visibilityState === 'hidden') { onTimerClick(); } }; document.addEventListener('visibilitychange', h); return () => document.removeEventListener('visibilitychange', h); }, [settings?.autoPauseEnabled, isRunning, onTimerClick]);

  // Prepare HTML overlay strings
  let subtitle = taskName;
  if (mode === 'shortBreak') subtitle = 'Short Break'; 
  if (mode === 'longBreak') subtitle = 'Long Break'; 
  if (mode === 'idle' && !taskName) subtitle = 'Ready';
  
  const safeTaskTimeLeft = isNaN(taskTimeLeftSeconds) ? 0 : taskTimeLeftSeconds;
  const hoursLeft = Math.floor(safeTaskTimeLeft / 3600);
  const minutesLeft = Math.floor((safeTaskTimeLeft % 3600) / 60);

  return (
    <div className="flex flex-col items-center">
      <div 
        className="relative w-full max-w-md aspect-square overflow-hidden group hover:scale-[1.01] transition-transform duration-300" 
        onClick={onTimerClick} 
        style={{ cursor: 'pointer' }}
      >
        <canvas ref={canvasRef} className="w-full h-full block drop-shadow-xl" width={300} height={300} />
        
        {/* Crisp HTML Overlay purely for Text Positioning (transparent, matching 60% inner canvas ring) */}
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center pointer-events-none">
          <div className="absolute inset-0 m-auto w-[60%] h-[60%] rounded-full flex flex-col items-center justify-center transition-all duration-300 pointer-events-auto">
             
             {/* Play/Pause Hover Indicator */}
             <div className="absolute top-10 sm:top-12 text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform -translate-y-4 group-hover:translate-y-0">
               {isRunning ? <Pause className="w-6 h-6 fill-current drop-shadow-md" /> : <Play className="w-6 h-6 fill-current drop-shadow-md ml-1" />}
             </div>

             {/* Stacked Labels matching Pie Chart */}
             <div className="flex flex-col items-center justify-center transition-transform duration-300 group-hover:translate-y-2">
                 <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground truncate max-w-[160px] pb-1">
                    {subtitle}
                 </h2>
                 <p className="font-digital text-2xl sm:text-3xl font-normal tracking-wider text-muted-foreground tabular-nums">
                     {(mode === 'working' || mode === 'idle') && !isNaN(taskTimeLeftSeconds)
                        ? `${Math.floor(taskTimeLeftSeconds / 60)}:${(taskTimeLeftSeconds % 60).toString().padStart(2, '0')}`
                        : timeDisplay}
                 </p>
             </div>
          </div>
        </div>
      </div>
       {taskGoalMinutes > 0 && (
         <div className="flex items-center justify-center text-sm font-medium text-foreground/80 bg-card/40 backdrop-blur-md px-5 py-2.5 rounded-full border border-white/5 shadow-sm mt-4 tracking-wide z-10">
           <Clock className="w-4 h-4 mr-2 flex-shrink-0" />
           <span>{Math.floor(taskGoalMinutes / 60)}h{(taskGoalMinutes || 0) % 60 > 0 ? ` ${taskGoalMinutes % 60}m` : ""} task</span>
         </div>
       )}
    </div>
  );
});

export { TimerCircle }