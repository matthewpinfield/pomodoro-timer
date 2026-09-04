# How the Pomodoro Timer Circle Works (Technical Description)

This document provides a technical explanation of how the circular timer component (`components/timer-circle.tsx`) renders visual representations of time.

## Core Concept

The timer draws solid filled wedges on an HTML canvas (`moveTo(center)` → `arc()` → `lineTo(center)` → `fill()`), matching the same rendering technique used by `components/pie-chart.tsx`. It is **not** stroke-based - there are no `ctx.stroke()` calls for the progress arcs, only for a thin 1px decorative border around the inner white circle.

*   **Task wedge:** Represents the fraction of the total defined task duration (`taskGoalMinutes`) that remains (`taskTimeLeftSeconds`). Drawn first, at full radius.
*   **Pomodoro wedge:** Represents progress through the current work session. Drawn second, at the *same* radius as the task wedge, so it visually overlaps and covers the leading portion of it. Its maximum size is capped relative to the task's total duration.
*   **Rest wedge:** Represents progress through the current break (short or long). Same overlap mechanic as the pomodoro wedge, but its size is *not* scaled relative to the task - a break isn't part of the task.

Only one of the pomodoro/rest wedges is ever drawn at a time (`mode` is either `'working'`, `'shortBreak'`, or `'longBreak'`, never more than one). Neither is drawn while `mode === 'idle'`.

All time values are handled in seconds internally, though often sourced from minute-based props or settings.

## Canvas and Coordinate System

*   **Canvas Element:** A reference (`canvasRef`) to the `<canvas>` DOM element.
*   **Rendering Context:** A 2D context (`ctx`).
*   **Device Pixel Ratio (DPR):** The canvas buffer size is scaled by `window.devicePixelRatio` for sharpness on high-DPI displays.
*   **Center Point:** `centerX`, `centerY`, from the canvas's rendered dimensions.
*   **Radii:**
    *   `radius`: `Math.min(centerX, centerY) - (width > 350 ? 25 : 15)` - deliberately matches `pie-chart.tsx`'s radius calculation exactly, so the two components feel visually consistent.
    *   `innerRadius`: `radius * 0.6` - the boundary of the center text area.
*   **Angles:**
    *   `startAngle`: `-Math.PI / 2` (12 o'clock), fixed for every wedge.
    *   `fullCircle`: `Math.PI * 2`.

## Wedge Rendering Logic

Every wedge (background, task, mode) uses the same pattern:

```javascript
ctx.beginPath();
ctx.moveTo(centerX, centerY);
ctx.arc(centerX, centerY, radius, startAngle, endAngle);
ctx.lineTo(centerX, centerY);
ctx.closePath();
ctx.fillStyle = someColor;
ctx.fill();
```

### 1. Background

A full circle (`startAngle` to `startAngle + fullCircle`) filled with `--secondary`, drawn first as the empty backdrop.

### 2. Task Wedge

```javascript
const totalTaskSeconds = taskGoalMinutes * 60;
const taskFraction = Math.min(1, Math.max(0, taskTimeLeftSeconds / totalTaskSeconds));
const taskArcSize = fullCircle * taskFraction;
const taskEndAngle = startAngle + taskArcSize;
// fill with taskColor
```

**Behavior:** As `taskTimeLeftSeconds` decreases, `taskArcSize` shrinks and `taskEndAngle` moves counter-clockwise back toward `startAngle`.

### 3. Pomodoro / Rest Wedge

Drawn at the same radius as the task wedge, immediately after it - so it paints over the leading portion of the task wedge, which is what produces the "overlap" visual.

```javascript
const modeProgress = Math.min(1, Math.max(0, timeLeftInMode / currentModeTotalDuration));

let currentModeArcSize;
if (mode === 'working' && totalTaskSeconds > 0) {
  // Capped relative to the task - a short pomodoro in a long task only ever
  // covers a small slice of the circle.
  const maxPomodoroRatio = Math.min(1, currentModeTotalDuration / totalTaskSeconds);
  currentModeArcSize = fullCircle * maxPomodoroRatio * modeProgress;
} else {
  // Rest isn't part of the task - full circle scale, no capping.
  currentModeArcSize = fullCircle * modeProgress;
}

const modeEndAngle = startAngle + currentModeArcSize;
const finalModeColor = mode === 'working' ? workColor : restColor; // both task-tinted, not fixed colors
```

**Worked examples** (pomodoro = 25 minutes):

| Task length | `maxPomodoroRatio` | Meaning |
|---|---|---|
| 60 min | 25/60 ≈ 41.67% | Pomodoro wedge tops out just under half the circle |
| 50 min | 25/50 = 50% | Pomodoro wedge tops out at exactly half the circle |
| 120 min | 25/120 ≈ 20.83% | Pomodoro wedge tops out at about a fifth of the circle |

**Behavior:** As `timeLeftInMode` decreases, both the ratio-capped maximum and the live progress shrink the wedge toward `startAngle`, just like the task wedge but usually much faster (a 25-minute session drains far quicker than a multi-hour task).

## Center Circle and Text

*   **Inner circle:** filled with `--card` via a radial gradient, drawn on top of both wedges at `innerRadius`, masking their centers. A thin 1px stroke (`--border` at reduced opacity) and a drop shadow give it definition against the wedges behind it. This is the *only* stroke in the component.
*   **Main time:** `taskTimeLeftSeconds` formatted M:SS while idle or working; `timeDisplay` (the mode/session countdown) while resting.
*   **Subtitle:** current task name, or "Short Break" / "Long Break" / "Ready".
*   **Play/Pause icon:** rendered via a CSS class (`hover-reveal`, defined in `app/globals.css`) that is visible by default and only hidden-until-hover on devices where `@media (hover: hover)` matches - i.e. mouse/trackpad. Always visible on touch devices, since `:hover` never fires there.

## State Management and Props

*   Core state transitions (`mode`, `isRunning`, `timeLeftInMode`, `taskTimeLeft`, cycle counts) live in `TimerContext`.
*   `taskTimeLeft` and the pomodoro/session duration (`sessionTotalDuration` / `settings.pomodoro`) are two independent values - the task's own remaining time is never derived from or conflated with the pomodoro setting.
*   `TaskContext` supplies `taskName`, `goalTimeMinutes`, and progress for the current task.
*   `TimerCircle` receives everything via props and redraws (`useCallback` `draw`, driven by `requestAnimationFrame` while running) whenever a relevant prop changes.
*   `taskTimeLeft` is persisted to `localStorage` only once the current task has actually resolved, to avoid ever saving a value computed before the real task data loaded.
