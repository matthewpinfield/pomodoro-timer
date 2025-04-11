# How the Pomodoro Timer Circle Works (For Dummies)

This document explains how the circular timer in `components/timer-circle.tsx` displays time.

## Core Idea

Imagine a clock face. The timer uses arcs (curved lines) on this circle to show time passing.

*   **Red Arc:** Shows time left for the **entire task** you are working on.
*   **Blue Arc:** Shows time left for the **current work session** (like a 25-minute Pomodoro).
*   **Green Arc:** Shows time left for the **current break session** (short or long break).

All time is measured in seconds internally, but displayed in minutes and seconds.

## The Circle Parts

*   **Canvas:** The digital drawing board where the circle is drawn (`canvasRef`).
*   **Center:** The middle point of the circle (`centerX`, `centerY`).
*   **Radius:** How big the circle is (`radius`).
*   **Track Width:** How thick the colored arcs are (`trackWidth`).
*   **Inner Radius:** The size of the white circle in the middle (`innerRadius`).
*   **Start Angle:** The top of the circle (12 o\\'clock position, `startAngle = -Math.PI / 2`).
*   **Full Circle:** Represents 360 degrees (`fullCircle = Math.PI * 2`).

## Drawing the Arcs

The computer draws arcs using `ctx.arc(centerX, centerY, radius, startAngle, endAngle)`.

*   It starts drawing at `startAngle`.
*   It draws **clockwise** to `endAngle`.

### 1. Background Track

*   A simple light gray full circle is drawn first as a background.
    ```javascript
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius - trackWidth / 2, 0, fullCircle);
    ctx.lineWidth = trackWidth;
    ctx.strokeStyle = "#e2e8f0"; // Light gray
    ctx.stroke();
    ```

### 2. Red Arc (Total Task Time Remaining)

*   **Purpose:** Shows how much of the total task duration is left.
*   **Anchor Point:** Starts firmly at 12 o\\'clock (`startAngle`). **This never moves.**
*   **Length Calculation:**
    *   Calculate total seconds and fraction left:
        ```javascript
        const totalTaskSeconds = (taskGoalMinutes || 1) * 60;
        let taskArcFraction = 1; // Default to full circle if no task goal
        if (totalTaskSeconds > 0) {
          taskArcFraction = Math.min(taskTimeLeftSeconds / totalTaskSeconds, 1);
        }
        ```
    *   Calculate the arc size (angle in radians):
        ```javascript
        const taskArcSize = fullCircle * taskArcFraction;
        ```
*   **Drawing:**
    *   Calculate end angle:
        ```javascript
        const redArcEndAngle = startAngle + taskArcSize;
        ```
    *   Draw the arc:
        ```javascript
        // Draws from 12 o\\'clock (startAngle), clockwise, by the calculated length (taskArcSize)
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius - trackWidth / 2, startAngle, redArcEndAngle);
        ctx.lineWidth = trackWidth;
        ctx.lineCap = "round";
        ctx.strokeStyle = `#ef4444${opacitySuffix}`; // Red
        ctx.stroke();
        ```
*   **Recession (How it gets shorter):** As `taskTimeLeftSeconds` decreases, `taskArcSize` gets smaller. The arc\\'s end point (`redArcEndAngle`) moves **counter-clockwise** back towards the 12 o'clock anchor (`startAngle`).

### 3. Blue Arc (Current Work Session Time Remaining)

*   **Purpose:** Shows progress within the current work session (e.g., 25 mins), displayed *relative* to the total task time, but visually anchored like the red arc.
*   **Anchor Point:** Starts firmly at 12 o\\'clock (`startAngle`), **just like the Red Arc**. **This never moves.**
*   **Length Calculation (Relative Scaling is KEY):**
    *   Calculate session progress (0-1):
        ```javascript
        const modeProgress = timeLeftInMode / currentModeTotalDuration;
        ```
    *   Calculate the maximum *relative* size this session represents:
        ```javascript
        const maxWorkSessionArc = (currentModeTotalDuration / totalTaskSeconds) * fullCircle;
        ```
    *   Calculate the actual *relative* arc size for drawing:
        ```javascript
        let currentModeArcSize = modeProgress * maxWorkSessionArc;
        ```
*   **Drawing:**
    *   Define start and end angles:
        ```javascript
        // Draws from 12 o\\'clock (startAngle), clockwise, by its calculated relative length (currentModeArcSize)
        const blueArcStartAngle = startAngle; // Fixed anchor
        const blueArcEndAngle = startAngle + currentModeArcSize;
        ```
    *   Draw the arc:
        ```javascript
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius - trackWidth / 2, blueArcStartAngle, blueArcEndAngle);
        ctx.lineWidth = trackWidth;
        ctx.lineCap = "round";
        ctx.strokeStyle = `#3b82f6${opacitySuffix}`; // Blue
        ctx.stroke();
        ```
*   **Recession:** As `timeLeftInMode` decreases, `currentModeArcSize` gets smaller. The arc\\'s end point (`blueArcEndAngle`) moves **counter-clockwise** back towards its *fixed* 12 o\\'clock start point (`startAngle`).

### 4. Green Arc (Break Session Time Remaining)

*   **Purpose:** Shows time left in a short or long break.
*   **Anchor Point:** Starts firmly at 12 o\\'clock (`startAngle`). **This never moves.**
*   **Length Calculation:**
    *   Calculate break progress (0-1):
        ```javascript
        // Note: modeProgress calculation is done before the if/else blocks
        // const modeProgress = timeLeftInMode / currentModeTotalDuration;
        ```
    *   Calculate the arc size (absolute, no scaling needed):
        ```javascript
        // Note: currentModeArcSize calculation is done before the if/else blocks
        // let currentModeArcSize = fullCircle * modeProgress;
        ```
*   **Drawing:**
    *   Define start and end angles:
        ```javascript
        // Draws from 12 o\\'clock (startAngle), clockwise, by the calculated length (currentModeArcSize)
        const breakArcStartAngle = startAngle;
        const breakArcEndAngle = startAngle + currentModeArcSize; // Using the pre-calculated absolute size
         ```
    *   Draw the arc:
        ```javascript
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius - trackWidth / 2, breakArcStartAngle, breakArcEndAngle);
        ctx.lineWidth = trackWidth;
        ctx.lineCap = "round";
        ctx.strokeStyle = `#10b981${opacitySuffix}`; // Green
        ctx.stroke();
        ```
*   **Recession:** As `timeLeftInMode` decreases, `currentModeArcSize` gets smaller. The arc\\'s end point (`breakArcEndAngle`) moves **counter-clockwise** back towards the 12 o'clock anchor (`startAngle`).

## Center White Circle and Text

*   A white circle is drawn in the middle (`innerRadius`) with a shadow effect.
*   **Main Time (`timeDisplay`):** Shows `timeLeftInMode` formatted like MM:SS.
*   **Subtitle (`subtitle`):** Shows the current `taskName` (if working) or \\'Short Break\\'/'Long Break\\'/'Ready\\'.
*   **Task Time Remaining (`taskTimeDisplay`):** Shows `taskTimeLeftSeconds` formatted like H:MM \\'remaining\\' (only shown during \\'working\\' mode).
*   **Play/Pause Icon:** Drawn in the very center, changes based on `isRunning` state.

## Static Time Below Timer

*   In `app/timer/page.tsx`, there\\'s a separate piece of text showing the current actual time (like 10:30 AM). This comes from `new Date()` and is stored in `formattedTime`.

## How the Numbers Change (State Management)

*   The actual numbers (`timeLeftInMode`, `taskTimeLeftSeconds`, `mode`, `isRunning`, etc.) are managed by React Context (`useTimer`, `useTasks`).
*   Functions like `startWork`, `pauseTimer`, `skipBreak` in the context update these numbers.
*   The `TimerCircle` component receives these numbers as `props`.
*   A `useEffect` hook inside `TimerCircle` watches for changes in these props and redraws the canvas whenever a number changes.
*   In `app/timer/page.tsx`, `useEffect` hooks handle the countdown logic for `taskTimeLeftSeconds` and save/load it from the browser\\'s Local Storage (`focuspie-taskTimeLeft`) so it doesn\'t reset if you close the page.

## Opacity

*   When the timer is paused (`isRunning` is false), the Red, Blue, and Green arcs are drawn slightly transparent (using `opacitySuffix = "80"`).

This covers the main parts of how the timer circle works visually and functionally. 