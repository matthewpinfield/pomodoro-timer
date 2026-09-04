# How the Pomodoro Timer Circle Works (For Dummies)

This document explains how the circular timer in `components/timer-circle.tsx` displays time.

## Core Idea

Imagine a pie chart, like the one on the Plan page. The timer circle works the
same way - solid colored wedges radiating from the center, not thin stroked
rings.

*   **Task wedge:** Shows time left for the **entire task** you are working on.
*   **Pomodoro wedge:** Shows time left for the **current work session** (a Pomodoro).
*   **Rest wedge:** Shows time left for the **current break** (short or long).

Only one of Pomodoro/Rest is ever showing at once, since you're either working
or resting, never both. The task wedge is visible whenever a task is selected,
regardless of mode.

All time is measured in seconds internally, but displayed in minutes and seconds.

## The Circle Parts

*   **Canvas:** The digital drawing board where the circle is drawn (`canvasRef`).
*   **Center:** The middle point of the circle (`centerX`, `centerY`).
*   **Radius:** How big the circle is (`radius`) - matches the pie chart's radius calculation exactly.
*   **Inner Radius:** The white circle in the middle where the text sits (`innerRadius`, 60% of `radius`).
*   **Start Angle:** The top of the circle (12 o'clock position, `startAngle = -Math.PI / 2`).
*   **Full Circle:** Represents 360 degrees (`Math.PI * 2`).

## Drawing the Wedges

Each wedge is a solid pie slice: `moveTo(center)` → `arc(...)` → `lineTo(center)` → `fill()`.
Both wedges below are drawn at the **same radius** - the second one is drawn
directly on top of the first, so it visually covers part of it.

### 1. Background

A full circle in a neutral secondary color is drawn first, as the "empty" backdrop.

### 2. Task Wedge (drawn first)

*   **Purpose:** How much of the total task duration is left.
*   **Anchor:** Always starts at 12 o'clock. Fixed.
*   **Size:** `taskFraction = taskTimeLeftSeconds / (taskGoalMinutes * 60)`, clamped 0-1, mapped to the full circle.
*   **Color:** the task's own color (`taskColor`).
*   **Behavior:** As `taskTimeLeftSeconds` counts down, the wedge shrinks back toward 12 o'clock.

### 3. Pomodoro/Rest Wedge (drawn second, on top)

*   **Purpose:** Progress within the current work session or break.
*   **Anchor:** Same 12 o'clock start as the task wedge - this is what makes it overlap.
*   **Size while working:** capped relative to the task. A 25-minute pomodoro inside
    a 2-hour task can only ever cover `25/120 ≈ 21%` of the circle, however much
    time is left in the session:
    `maxPomodoroRatio = min(1, currentModeTotalDuration / totalTaskSeconds)`,
    then `wedgeSize = fullCircle * maxPomodoroRatio * (timeLeftInMode / currentModeTotalDuration)`.
    This is what makes the pomodoro visually read as "a small bite" of a longer task.
*   **Size while resting:** not scaled to the task at all - a break isn't part of
    the task, so it just uses `fullCircle * (timeLeftInMode / currentModeTotalDuration)` directly.
*   **Color:** `workColor` while working, `restColor` while resting - both derived
    from the task's own color family (a tinted variant), not a fixed universal color.
*   **Not drawn while idle** (no session running yet).

## Center White Circle and Text

*   A white/card-colored circle sits on top of everything at `innerRadius`, masking the center of both wedges.
*   **Main time:** shows `taskTimeLeftSeconds` (while idle or working) or the mode countdown `timeDisplay` (while resting).
*   **Subtitle:** the current task's name, or "Short Break"/"Long Break"/"Ready".
*   **Play/Pause icon:** visible by default (always shown on touch devices); on
    devices that support hovering, it's hidden until you hover the circle.

## How the Numbers Change (State Management)

*   The actual numbers (`timeLeftInMode`, `taskTimeLeftSeconds`, `mode`, `isRunning`, etc.) are managed by React Context (`useTimer`, `useTasks`).
*   `startWork`, `pauseTimer`, `skipBreak` in `TimerContext` update these numbers.
*   `TimerCircle` receives them as props and redraws (`requestAnimationFrame`) whenever they change while running.
*   `taskTimeLeftSeconds` and the pomodoro/session duration are tracked as two
    genuinely separate numbers in `TimerContext` - the task's own remaining time
    is never conflated with the pomodoro setting.
