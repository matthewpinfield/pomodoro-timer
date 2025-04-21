# How the Pomodoro Timer Circle Works (Technical Description)

This document provides a technical explanation of how the circular timer component (`components/timer-circle.tsx`) renders visual representations of time.

## Core Concept

The timer utilizes concentric arcs drawn on an HTML canvas element to represent different time segments concurrently.

*   **Red Arc (Task Time Remaining):** Represents the fraction of the total defined task duration (`taskGoalMinutes`) that remains (`taskTimeLeftSeconds`).
*   **Blue Arc (Work Session Progress):** Represents the progress through the current work session (e.g., Pomodoro cycle). Its maximum potential length is relative to the total task duration, and its current length reflects the time elapsed within the work session.
*   **Green Arc (Break Session Progress):** Represents the progress through the current break session (short or long). Its length is directly proportional to the time remaining in the break.

All time values are handled in seconds internally for calculation accuracy, though often sourced from minute-based props or settings.

## Canvas and Coordinate System

*   **Canvas Element:** A reference (`canvasRef`) to the `<canvas>` DOM element is maintained.
*   **Rendering Context:** A 2D rendering context (`ctx`) is obtained from the canvas.
*   **Device Pixel Ratio (DPR):** The canvas buffer size is adjusted based on `window.devicePixelRatio` to ensure sharpness on high-resolution displays. The context is scaled accordingly.
*   **Center Point:** Calculations are based on the canvas dimensions (`width`, `height`) to find the center (`centerX`, `centerY`).
*   **Radii:**
    *   `outerRadius`: Defines the outermost boundary of the arcs.
    *   `innerRadius`: Defines the boundary of the central circular area.
    *   `trackWidth`: The calculated thickness of the drawn arcs (`outerRadius - innerRadius`).
*   **Angles:**
    *   `startAngle`: The initial angle from which arcs are drawn, typically oriented towards the top (12 o'clock position, `-Math.PI / 2`), potentially with a slight rotation offset applied.
    *   `endAngle`: The angle to which an arc is drawn clockwise from the `startAngle`.
    *   `fullCircle`: Represents a full 360-degree rotation in radians (`Math.PI * 2`).

## Arc Rendering Logic

Arcs are rendered using `ctx.arc(centerX, centerY, radius, startAngle, endAngle)`. The `radius` used is typically the midpoint of the track (`outerRadius - trackWidth / 2`). `lineCap` is often set to `"round"` for smoother arc ends.

### 1. Background Track

*   **Purpose:** Provides a visual base layer for the progress arcs.
*   **Implementation:** A full circle arc (0 to `fullCircle`) is drawn using the `trackWidth` and styled with a neutral background color (e.g., `--muted` CSS variable).

    ```javascript
    // Example: Drawing the background track
    ctx.beginPath();
    ctx.arc(centerX, centerY, outerRadius - trackWidth / 2, 0, fullCircle); // Use calculated outerRadius and trackWidth
    ctx.lineWidth = trackWidth;
    ctx.strokeStyle = getCssVariable('--muted', 'hsl(210, 40%, 96.1%)'); // Use theme color
    ctx.stroke();
    ```

### 2. Red Arc (Task Time Remaining)

*   **Purpose:** Displays the remaining duration of the overall task goal.
*   **Anchor Point:** Starts at the defined `startAngle` (top, possibly rotated). **This start point is fixed.**
*   **Length Calculation:**
    *   `totalTaskSeconds`: The task's goal duration converted to seconds (`taskGoalMinutes * 60`).
    *   `taskTimeLeftSeconds`: The remaining time for the task in seconds (passed as prop).
    *   `taskArcFraction`: The proportion of time remaining (`taskTimeLeftSeconds / totalTaskSeconds`), clamped between 0 and 1.
    *   `taskArcSize`: The angular size of the arc (`fullCircle * taskArcFraction`).
*   **Drawing:**
    *   `taskEndAngle = startAngle + taskArcSize`
    *   Draws an arc from `startAngle` to `taskEndAngle` using the task-specific color (e.g., `--destructive` CSS variable).

    ```javascript
    // Example: Drawing the Red Task Arc
    const taskEndAngle = startAngle + taskArcSize;
    ctx.beginPath();
    ctx.arc(centerX, centerY, outerRadius - trackWidth / 2, startAngle, taskEndAngle);
    ctx.lineWidth = trackWidth;
    ctx.lineCap = "round";
    ctx.strokeStyle = getCssVariable('--destructive', 'hsl(0, 84.2%, 60.2%)');
    ctx.stroke();
    ```
*   **Behavior:** As `taskTimeLeftSeconds` decreases, `taskArcSize` decreases, causing the `taskEndAngle` to move counter-clockwise towards the `startAngle`.

### 3. Blue Arc (Work Session Progress)

*   **Purpose:** Shows progress within the current work session (e.g., Pomodoro), with its maximum length relative to the total task duration.
*   **Anchor Point:** Starts at the **same** defined `startAngle` as the Red Arc (top, possibly rotated). **This start point is fixed, causing overlap with the Red Arc.**
*   **Length Calculation (Relative Scaling):**
    *   `pomodoroDurationSeconds`: The total duration of the current work session mode (e.g., `settings.pomodoro`).
    *   `totalTaskSeconds`: The task's goal duration in seconds (`taskGoalMinutes * 60`).
    *   `timeLeftInMode`: Remaining time in the current work session (passed as prop).
    *   `maxPomodoroRatio`: The maximum proportion of the circle this work session represents relative to the task (`pomodoroDurationSeconds / totalTaskSeconds`), clamped > 0.
    *   `maxPomodoroArcSize`: The maximum angular size the blue arc *could* have (`fullCircle * maxPomodoroRatio`). This determines the scale.
    *   `modeProgress`: The current progress within the work session (`timeLeftInMode / pomodoroDurationSeconds`), clamped between 0 and 1.
    *   `currentBlueArcSize`: The actual angular size to draw (`maxPomodoroArcSize * modeProgress`).
*   **Drawing:**
    *   `blueArcEndAngle = startAngle + currentBlueArcSize`
    *   Draws an arc from `startAngle` to `blueArcEndAngle` using the work session color (e.g., `--primary` CSS variable).

    ```javascript
    // Example: Drawing the Blue Work Arc (Illustrative Calculation)
    const pomodoroDurationSeconds = currentModeTotalDuration; // Assuming work mode
    const totalTaskSeconds = (taskGoalMinutes || 1) * 60;
    const maxPomodoroRatio = totalTaskSeconds > 0 ? pomodoroDurationSeconds / totalTaskSeconds : 0;
    const maxPomodoroArcSize = fullCircle * maxPomodoroRatio;
    const modeProgress = pomodoroDurationSeconds > 0 ? timeLeftInMode / pomodoroDurationSeconds : 0;
    const currentBlueArcSize = maxPomodoroArcSize * Math.max(0, modeProgress); // Ensure non-negative

    const blueArcEndAngle = startAngle + currentBlueArcSize;
    ctx.beginPath();
    ctx.arc(centerX, centerY, outerRadius - trackWidth / 2, startAngle, blueArcEndAngle);
    ctx.lineWidth = trackWidth;
    ctx.lineCap = "round";
    ctx.strokeStyle = getCssVariable('--primary', 'hsl(221.2, 83.2%, 53.3%)');
    ctx.stroke();
    ```
*   **Behavior:** As `timeLeftInMode` decreases, `modeProgress` decreases, causing `currentBlueArcSize` to decrease. The `blueArcEndAngle` moves counter-clockwise towards the `startAngle`. The arc's maximum potential length is scaled by the ratio of the Pomodoro duration to the Task duration.

### 4. Green Arc (Break Session Progress)

*   **Purpose:** Shows progress within the current break session.
*   **Anchor Point:** Starts at the **same** defined `startAngle` as the Red and Blue Arcs (top, possibly rotated). **Fixed start point.**
*   **Length Calculation (Absolute Progress):**
    *   `breakDurationSeconds`: The total duration of the current break mode (e.g., `settings.shortBreak` or `settings.longBreak`).
    *   `timeLeftInMode`: Remaining time in the current break session (passed as prop).
    *   `modeProgress`: The current progress within the break (`timeLeftInMode / breakDurationSeconds`), clamped between 0 and 1.
    *   `currentGreenArcSize`: The angular size to draw (`fullCircle * modeProgress`).
*   **Drawing:**
    *   `greenArcEndAngle = startAngle + currentGreenArcSize`
    *   Draws an arc from `startAngle` to `greenArcEndAngle` using the break color (e.g., `--success` CSS variable).

    ```javascript
    // Example: Drawing the Green Break Arc
    const breakDurationSeconds = currentModeTotalDuration; // Assuming break mode
    const modeProgress = breakDurationSeconds > 0 ? timeLeftInMode / breakDurationSeconds : 0;
    const currentGreenArcSize = fullCircle * Math.max(0, modeProgress);

    const greenArcEndAngle = startAngle + currentGreenArcSize;
    ctx.beginPath();
    ctx.arc(centerX, centerY, outerRadius - trackWidth / 2, startAngle, greenArcEndAngle);
    ctx.lineWidth = trackWidth;
    ctx.lineCap = "round";
    ctx.strokeStyle = getCssVariable('--success', 'hsl(142.1, 76.2%, 36.3%)');
    ctx.stroke();
    ```
*   **Behavior:** As `timeLeftInMode` decreases, `modeProgress` decreases, causing `currentGreenArcSize` to decrease. The `greenArcEndAngle` moves counter-clockwise towards the `startAngle`.

## Center Circle and Text

*   **Inner Circle:** A central circle is drawn using `innerRadius`, typically filled with a background color (e.g., `--card`) and potentially styled with borders or shadows to match UI conventions (e.g., the pie chart's center).
*   **Text Elements:**
    *   **Main Time (`timeDisplay`):** Displays the primary countdown time (usually `timeLeftInMode` for the active mode) formatted as MM:SS. Font size is typically large and bold.
    *   **Subtitle (`subtitle`):** Displays context-dependent text below the main time (e.g., current `taskName`, "Short Break", "Long Break", "Ready"). Text may be truncated if it exceeds the available width within the inner circle.
    *   **Task Time Remaining:** Optionally displays the total remaining task time (`taskTimeLeftSeconds`) formatted as H:MM, typically shown only during 'working' mode.
*   **Play/Pause Icon:** An icon (triangle for play, bars for pause) is drawn in the center, visually indicating the timer's `isRunning` state.

## State Management and Props

*   **Core Logic:** The timer's state transitions (`mode` changes, starting/pausing, cycle completion) are managed externally, typically within a React Context (`TimerContext`).
*   **Task Data:** Information about the current task (`taskName`, `taskGoalMinutes`) and potentially its overall progress is managed externally (`TaskContext`).
*   **Props:** The `TimerCircle` component receives all necessary data to render the current state via props (`mode`, `timeLeftInMode`, `isRunning`, `taskName`, `taskGoalMinutes`, `taskTimeLeftSeconds`, etc.).
*   **Redrawing:** The component uses `useCallback` for the `draw` function and `useEffect` or `useLayoutEffect` hooks to trigger redraws when relevant props change or when the timer is running (using `requestAnimationFrame` for smooth updates). `taskTimeLeftSeconds` is updated and persisted via `localStorage` in the parent `app/timer/page.tsx` component.

This updated description reflects the intended functionality, particularly the shared start angle and the relative scaling calculation for the blue work arc.


#length of pomodoro calculation examples

pomodoro in these examples is based 25 minutes:
example 1:  current task is 1 hour so pomodoro is  41.67% of current task arc
example 2:  current task is 50 minutes so pomodoro is 50% of current task arc
example 3:  current task is 2 hours  so pomodoro is 20.83% of current task arc

Example 1:

Current task: 1 hour = 60 minutes
Pomodoro duration: 25 minutes
Percentage:  
60
25
​
 ×100%≈41.67%
Example 2:

Current task: 50 minutes
Pomodoro duration: 25 minutes
Percentage:  
50
25
​
 ×100%=50%
Example 3:

Current task: 2 hours = 120 minutes
Pomodoro duration: 25 minutes
Percentage:  
120
25
​
 ×100%≈20.83%