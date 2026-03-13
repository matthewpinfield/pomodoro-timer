// timer-circle.tsx (Corrected Version)
"use client"

import { useRef, useEffect, useCallback, memo, useLayoutEffect } from "react"
import { Clock } from "lucide-react"
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
    const outerRadius = Math.min(centerX, centerY) * 0.95;
    const innerRadius = outerRadius * 0.6;
    const trackWidth = outerRadius - innerRadius;
    const arcRadius = outerRadius - trackWidth / 2; // Radius for arc center line
    const capRadius = trackWidth / 2; // Radius for the end cap circle
    const angleOffsetDegrees = 10; // Use 0 offset for 12 o'clock start
    const angleOffsetRadians = angleOffsetDegrees * Math.PI / 180; const startAngle = -Math.PI / 2 + angleOffsetRadians;
    const fullCircle = Math.PI * 2;
    // --- End Dimensions ---

    // --- Font/Icon Sizes ---
    const viewportSize = Math.min(width, height);
    const timerFontSizePx = Math.max(16, viewportSize * 0.1);
    const detailFontSizePx = Math.max(10, Math.min(12, Math.round(viewportSize * 0.05)));
    const iconSize = Math.min(centerX, centerY) * 0.15; const pauseWidth = iconSize * 0.8; const pauseHeight = iconSize; const pauseBarWidth = pauseWidth * 0.3;
    const baseFontStack = "Inter, system-ui, sans-serif";
    const timerFontStack = "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, \"Liberation Mono\", \"Courier New\", monospace";
    // --- End Sizes ---

    // Layer 1: Base Track
    ctx.save();
    ctx.beginPath(); ctx.arc(centerX, centerY, arcRadius, 0, fullCircle); ctx.lineWidth = trackWidth;
    ctx.strokeStyle = getCssVariable('--muted', 'hsl(210, 40%, 96.1%)'); ctx.stroke();
    ctx.restore();

    // Layer 2: Task Arc (Remaining Time)
    ctx.save();
    const totalTaskSeconds = (taskGoalMinutes || 1) * 60;
    let taskArcFraction = 0;
    const safeTaskTimeLeft = isNaN(taskTimeLeftSeconds) ? 0 : taskTimeLeftSeconds;
    if (totalTaskSeconds > 0 && safeTaskTimeLeft >= 0) {
        taskArcFraction = Math.min(1, safeTaskTimeLeft / totalTaskSeconds);
    }
    const taskArcSize = fullCircle * taskArcFraction;
    const taskEndAngle = startAngle + taskArcSize;
    const finalTaskColor = taskColor || 'red'; // Fallback red

    if (taskArcSize > 1e-6) {
       ctx.beginPath();
       ctx.arc(centerX, centerY, arcRadius, startAngle, taskEndAngle);
       ctx.lineWidth = trackWidth;
       ctx.lineCap = "round" as CanvasLineCap;
       ctx.strokeStyle = finalTaskColor;
       ctx.stroke();
            
    }
    ctx.restore();

    // --- Calculate Dynamic Contrasting SHADE for Mode Arc (INTERNAL LOGIC - SHADING) ---
    let dynamicModeColor = getCssVariable('--primary', '#0000ff'); // Fallback
    const baseColorOklch = parseOklch(taskColor);
    if (baseColorOklch) {
        try {
            const mainArcLightness = baseColorOklch.l; const mainArcChroma = baseColorOklch.c; const mainArcHue = baseColorOklch.h;
            let contrastingLightness = mainArcLightness;
            const lightnessThreshold = 0.65; const lightnessAdjust = 0.05; const minLightness = 0.15; const maxLightness = 0.9;
            if (mainArcLightness <= lightnessThreshold) { contrastingLightness = mainArcLightness + lightnessAdjust; }
            else { contrastingLightness = mainArcLightness - lightnessAdjust; }
            contrastingLightness = Math.max(minLightness, Math.min(maxLightness, contrastingLightness));
            dynamicModeColor = `oklch(${contrastingLightness.toFixed(3)} ${mainArcChroma.toFixed(3)} ${mainArcHue.toFixed(1)})`;
        } catch (e) {
            console.error("[DRAW Mode Calc] Error calculating dynamic Oklch shade:", e);
            dynamicModeColor = mode === 'working' ? getCssVariable('--primary', '#0000ff') : getCssVariable('--success', '#00ff00');
        }
    } else {
        dynamicModeColor = mode === 'working' ? getCssVariable('--primary', '#0000ff') : getCssVariable('--success', '#00ff00');
    }
    // --- End Internal Calculation ---

    // Layer 3: Pomodoro Arc (Remaining Time in Mode - Using Reference Scaling)
        // Layer 3: Pomodoro Arc (Remaining Time in Mode - Using Reference Scaling)
        ctx.save();
        let currentModeArcSize = 0;
        const safeTimeLeftInMode = isNaN(timeLeftInMode) ? 0 : timeLeftInMode;
        if (currentModeTotalDuration > 0 && safeTimeLeftInMode >= 0) {
            const modeRemainingFraction = Math.min(1, safeTimeLeftInMode / currentModeTotalDuration);
            if (mode === 'working') {
                const pomodoroDurationSeconds = currentModeTotalDuration;
                const maxPomodoroRatio = totalTaskSeconds > 0 ? pomodoroDurationSeconds / totalTaskSeconds : 0;
                const maxPomodoroArcSize = fullCircle * maxPomodoroRatio;
                currentModeArcSize = maxPomodoroArcSize * modeRemainingFraction;
            } else if (mode === 'shortBreak' || mode === 'longBreak') {
                currentModeArcSize = fullCircle * modeRemainingFraction;
            }
        }
        const modeEndAngle = startAngle + currentModeArcSize;
    
        // --- Apply 80% Alpha (Simplified for OKLCH only) ---
        // Declare the variable here
        let finalModeColorWithAlpha = 'blue'; // Default fallback
    
        // Use the calculated dynamicModeColor from the section above
        const baseModeColor = dynamicModeColor; // Use the color calculated based on taskColor

        // *** ADD LOGS HERE ***
        console.log("Base Dynamic Mode Color:", baseModeColor); 
        // *** END LOGS ***
    
        try {
            // Assume baseModeColor is 'oklch(...)'
            // Replace existing alpha (if any) or add new alpha '/ 0.8' before the closing ')'
            finalModeColorWithAlpha = baseModeColor.replace(/(\/\s*[\d.]+)?\)$/, ' / 0.9)');
        } catch (e) {
            console.error("TimerCircle: Error applying alpha to oklch color:", baseModeColor, e);
            // Fallback to the original calculated color or blue if it's totally invalid
            finalModeColorWithAlpha = baseModeColor || 'blue';
        }
        // --- End Alpha Application ---
    
        if (currentModeArcSize > 1e-6 && mode !== 'idle') {
            ctx.beginPath();
            ctx.arc(centerX, centerY, arcRadius, startAngle, modeEndAngle);
            ctx.lineWidth = trackWidth;
            ctx.lineCap = "round" as CanvasLineCap;
            // Use the color WITH alpha applied
            ctx.strokeStyle = finalModeColorWithAlpha;
            ctx.stroke();
        }
    
        ctx.restore();
    

    // Layer 4: Center Circle (Using Pie Chart Reference Style - No Gray Overlay)
    ctx.save();
    const cardColor = getCssVariable('--card', '#ffffff');
    const borderColor = getCssVariable('--border', '#e2e8f0');
    const computedInnerBg = cardColor;
    // Subtle outer border
    ctx.beginPath(); ctx.arc(centerX, centerY, innerRadius + 1, 0, fullCircle); ctx.strokeStyle = borderColor + "40"; ctx.lineWidth = 1; ctx.stroke();
    // Shadow base
    ctx.beginPath(); ctx.arc(centerX, centerY, innerRadius + 8, 0, fullCircle); ctx.shadowColor = "rgba(0, 0, 0, 0.5)"; ctx.shadowBlur = 15; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 4; ctx.fillStyle = computedInnerBg; ctx.fill();
    // Reset shadow
    ctx.shadowColor = "transparent"; ctx.shadowBlur = 0; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0;
    // Center gradient
    const centerGradient = ctx.createRadialGradient(centerX, centerY - 15, 0, centerX, centerY, innerRadius);
    centerGradient.addColorStop(0, cardColor); centerGradient.addColorStop(1, cardColor);
    ctx.beginPath(); ctx.arc(centerX, centerY, innerRadius, 0, fullCircle); ctx.fillStyle = centerGradient;
    ctx.fill();
    ctx.restore(); // Restore from Layer 4 save

    // --- Center Text & Icons (Use RECENT style) ---
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    const timerTextColor = getCssVariable('--foreground', '#0f172a');
    const subtitleColor = getCssVariable('--muted-foreground', '#6b7280');
    // Play/pause icon
    ctx.save(); ctx.fillStyle = getCssVariable('--border', '#e5e7eb');
    if (isRunning) { const pauseX = centerX - pauseWidth / 2; const pauseY = centerY - pauseHeight / 2; const barSpacing = pauseWidth * 0.2; ctx.fillRect(pauseX, pauseY, pauseBarWidth, pauseHeight); ctx.fillRect(pauseX + pauseBarWidth + barSpacing, pauseY, pauseBarWidth, pauseHeight); }
    else { ctx.beginPath(); ctx.moveTo(centerX - iconSize * 0.3, centerY - iconSize * 0.5); ctx.lineTo(centerX - iconSize * 0.3, centerY + iconSize * 0.5); ctx.lineTo(centerX + iconSize * 0.5, centerY); ctx.closePath(); ctx.fill(); }
    ctx.restore();
    // Timer text
    ctx.font = `bold ${timerFontSizePx}px ${timerFontStack}`; ctx.fillStyle = timerTextColor;
    ctx.fillText(timeDisplay, centerX, centerY);
    // Subtitle
    let subtitle = taskName;
    if (mode === 'shortBreak') subtitle = 'Short Break'; if (mode === 'longBreak') subtitle = 'Long Break'; if (mode === 'idle' && !taskName) subtitle = 'Ready';
    ctx.font = `${detailFontSizePx}px ${baseFontStack}`; ctx.fillStyle = subtitleColor;
    const maxWidth = innerRadius * 1.8; let finalSubtitle = subtitle;
    if (ctx.measureText(subtitle).width > maxWidth) { let truncatedSubtitle = subtitle; while (ctx.measureText(truncatedSubtitle + "...").width > maxWidth && truncatedSubtitle.length > 0) { truncatedSubtitle = truncatedSubtitle.slice(0, -1); } finalSubtitle = truncatedSubtitle + "..."; }
    ctx.fillText(finalSubtitle, centerX, centerY + (timerFontSizePx * 0.6));
    // Task remaining text (Corrected Logic)
    if (mode === 'working' && taskGoalMinutes > 0 && !isNaN(safeTaskTimeLeft) && safeTaskTimeLeft >= 0) { // Use safeTaskTimeLeft
        const hoursLeft = Math.floor(safeTaskTimeLeft / 3600);
        const minutesLeft = Math.floor((safeTaskTimeLeft % 3600) / 60);
        ctx.font = `${detailFontSizePx}px ${baseFontStack}`; ctx.fillStyle = subtitleColor;
        ctx.fillText(`${hoursLeft}h ${minutesLeft}m remaining`, centerX, centerY + (timerFontSizePx * 0.6) + (detailFontSizePx * 1.4));
    }
    // --- End Text & Icons ---

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

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-full max-w-md aspect-square rounded-lg overflow-hidden" onClick={onTimerClick} style={{ cursor: 'pointer' }}>
        <canvas ref={canvasRef} className="w-full h-full block" width={300} height={300} />
      </div>
       {taskGoalMinutes > 0 && (
         <div className="flex items-center text-sm text-muted-foreground mt-4">
           <Clock className="w-4 h-4 mr-2 flex-shrink-0" />
           <span>{Math.floor(taskGoalMinutes / 60)}h{(taskGoalMinutes || 0) % 60 > 0 ? ` ${taskGoalMinutes % 60}m` : ""} task</span>
         </div>
       )}
    </div>
  );
});

export { TimerCircle }