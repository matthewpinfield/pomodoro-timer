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
*   **Start Angle:** The top of the circle (12 o\'clock position, `startAngle = -Math.PI / 2`).
*   **Full Circle:** Represents 360 degrees (`fullCircle = Math.PI * 2`).

## Drawing the Arcs

The computer draws arcs using `ctx.arc(centerX, centerY, radius, startAngle, endAngle)`.

*   It starts drawing at `startAngle`.
*   It draws **clockwise** to `endAngle`.

### 1. Background Track

*   A simple light gray full circle is drawn first as a background.
    ```javascript
    ctx.arc(centerX, centerY, radius - trackWidth / 2, 0, fullCircle);
    ctx.strokeStyle = "#e2e8f0"; // Light gray
    ```

### 2. Red Arc (Total Task Time Remaining)

*   **Purpose:** Shows how much of the total task duration is left.
*   **Anchor Point:** Starts firmly at 12 o\'clock (`startAngle`). **This never moves.**
*   **Length Calculation:**
    *   `totalTaskSeconds`: Goal time for the task in seconds (`taskGoalMinutes * 60`).
    *   `taskTimeLeftSeconds`: How many seconds are actually left for the task (this counts down).
    *   `taskArcFraction`: What fraction of the task is left (`taskTimeLeftSeconds / totalTaskSeconds`).
    *   `taskArcSize`: How long the red arc should be (`fullCircle * taskArcFraction`).
*   **Drawing:**
    ```javascript
    // Draws from 12 o\'clock (startAngle), clockwise, by the calculated length (taskArcSize)
    ctx.arc(centerX, centerY, radius - trackWidth / 2, startAngle, startAngle + taskArcSize);
    ctx.strokeStyle = `#ef4444`; // Red
    ```
*   **Recession (How it gets shorter):** As `taskTimeLeftSeconds` decreases, `taskArcSize` gets smaller. The arc\'s end point moves **counter-clockwise** back towards the 12 o'clock anchor.

### 3. Blue Arc (Current Work Session Time Remaining)

*   **Purpose:** Shows progress within the current work session (e.g., 25 mins), displayed *relative* to the total task time.
*   **Anchor Point:** Starts where the Red Arc **ends**. (`blueArcStartAngle = startAngle + completedTaskArc`). **This point moves** as the Red Arc changes.
    *   `completedTaskArc`: Calculates the *empty* part of the circle *not* covered by the Red Arc (`fullCircle * (1 - taskArcFraction)`).
*   **Length Calculation (Relative Scaling is KEY):**
    *   `modeProgress`: Progress within the current session (0 to 1) (`timeLeftInMode / currentModeTotalDuration`).
    *   `maxWorkSessionArc`: Maximum size the *entire* blue session *could* take up relative to the *entire* task time (`(currentModeTotalDuration / totalTaskSeconds) * fullCircle`).
    *   `currentModeArcSize`: Actual length of the blue arc right now (`modeProgress * maxWorkSessionArc`). This scales the session progress to fit visually within the task context.
*   **Drawing:**
    ```javascript
    // Draws from where the red arc ends (blueArcStartAngle), clockwise, by its calculated relative length (currentModeArcSize)
    const blueArcEndAngle = blueArcStartAngle + currentModeArcSize;
    ctx.arc(centerX, centerY, radius - trackWidth / 2, blueArcStartAngle, blueArcEndAngle);
    ctx.strokeStyle = `#3b82f6`; // Blue
    ```
*   **Recession:** As `timeLeftInMode` decreases, `currentModeArcSize` gets smaller. The arc\'s end point moves **counter-clockwise** back towards its *moving* start point (`blueArcStartAngle`).

### 4. Green Arc (Break Session Time Remaining)

*   **Purpose:** Shows time left in a short or long break.
*   **Anchor Point:** Starts firmly at 12 o\'clock (`startAngle`). **This never moves.**
*   **Length Calculation:**
    *   `modeProgress`: Progress within the break (0 to 1) (`timeLeftInMode / currentModeTotalDuration`).
    *   `currentModeArcSize`: How long the green arc should be (`fullCircle * modeProgress`). No relative scaling needed here.
*   **Drawing:**
    ```javascript
    // Draws from 12 o\'clock (startAngle), clockwise, by the calculated length (currentModeArcSize)
    const breakArcEndAngle = startAngle + currentModeArcSize;
    ctx.arc(centerX, centerY, radius - trackWidth / 2, startAngle, breakArcEndAngle);
    ctx.strokeStyle = `#10b981`; // Green
    ```
*   **Recession:** As `timeLeftInMode` decreases, `currentModeArcSize` gets smaller. The arc\'s end point moves **counter-clockwise** back towards the 12 o'clock anchor.

## Center White Circle and Text

*   A white circle is drawn in the middle (`innerRadius`) with a shadow effect.
*   **Main Time (`timeDisplay`):** Shows `timeLeftInMode` formatted like MM:SS.
*   **Subtitle (`subtitle`):** Shows the current `taskName` (if working) or \'Short Break\'/\'Long Break\'/\'Ready\'.
*   **Task Time Remaining (`taskTimeDisplay`):** Shows `taskTimeLeftSeconds` formatted like H:MM \'remaining\' (only shown during \'working\' mode).
*   **Play/Pause Icon:** Drawn in the very center, changes based on `isRunning` state.

## Static Time Below Timer

*   In `app/timer/page.tsx`, there\'s a separate piece of text showing the current actual time (like 10:30 AM). This comes from `new Date()` and is stored in `formattedTime`.

## How the Numbers Change (State Management)

*   The actual numbers (`timeLeftInMode`, `taskTimeLeftSeconds`, `mode`, `isRunning`, etc.) are managed by React Context (`useTimer`, `useTasks`).
*   Functions like `startWork`, `pauseTimer`, `skipBreak` in the context update these numbers.
*   The `TimerCircle` component receives these numbers as `props`.
*   A `useEffect` hook inside `TimerCircle` watches for changes in these props and redraws the canvas whenever a number changes.
*   In `app/timer/page.tsx`, `useEffect` hooks handle the countdown logic for `taskTimeLeftSeconds` and save/load it from the browser\'s Local Storage (`focuspie-taskTimeLeft`) so it doesn\'t reset if you close the page.

## Opacity

*   When the timer is paused (`isRunning` is false), the Red, Blue, and Green arcs are drawn slightly transparent (using `opacitySuffix = "80"`).

This covers the main parts of how the timer circle works visually and functionally.