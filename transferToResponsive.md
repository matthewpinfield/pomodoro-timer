**IMPORTANT RULE CHANGE FOR ALL SIZING AND LAYOUT:**

**Problem We Are Solving:**
Our React application currently uses fixed pixel values (`px`) for element widths, heights, padding, margins, and possibly font sizes. This is causing major problems:
1.  **Not Responsive:** Elements do not resize correctly on different screen sizes (mobile, tablet, desktop). Layouts break.
2.  **Ignores User Needs:** It doesn't respect user browser zoom or font size preferences, leading to accessibility issues.
3.  **Inconsistent Scaling:** Components look disproportionate depending on the viewing context.

**The OLD, INCORRECT Method (What we STOPPED doing):**
- Defining widths like `width: 400px;`
- Defining heights like `height: 300px;`
- Using `padding: 10px;` or `margin: 15px;`
- Setting `font-size: 14px;` directly.

**The NEW, CORRECT RULE (What we ALWAYS do now):**
1.  **USE TAILWIND CSS UTILITIES:** Prioritize Tailwind classes for all sizing, spacing, and layout. Examples:
    *   Widths: `w-full`, `w-1/2`, `w-auto`, `max-w-screen-md`, `md:w-3/4`
    *   Heights: `h-full`, `h-screen`, `min-h-screen`, `h-auto` (Note: Height is often content-driven or relies on Flexbox/Grid).
    *   Padding: `p-4`, `px-2`, `py-6`, `pt-1` (These use `rem` by default).
    *   Margins: `m-4`, `mx-auto`, `my-6`, `mt-1` (These use `rem` by default).
    *   Font Sizes: `text-sm`, `text-base`, `text-lg`, `text-xl` (These use `rem` and `line-heights`).
2.  **RELATIVE UNITS:** If a Tailwind utility isn't suitable or for custom properties:
    *   **Use `rem`:** For most things (font-size, padding, margin, width/height where appropriate). `rem` scales with the root font size, respecting user preferences.
    *   **Use `%`:** For widths/heights relative to the parent container (e.g., `width: 100%`). Essential for fluid layouts.
    *   **Use `vw`/`vh` (with caution):** For sizing relative to the viewport, often with `clamp()` or `min()`/`max()` for control. `dvh`/`dvw` might be better on mobile.
3.  **AVOID FIXED `px`:** Do NOT use fixed `px` values for layout dimensions, component sizes, spacing, or typography. The ONLY exceptions might be for things like `border-width: 1px;` or maybe a very small, fixed icon size IF absolutely necessary and it doesn't break layout (but even then, `rem` is often better).
4.  **FLEXBOX & GRID:** Use Tailwind's Flexbox (`flex`, `items-center`, `justify-between`, etc.) and Grid (`grid`, `grid-cols-3`, `gap-4`, etc.) utilities to manage layout flow and alignment. These work *with* relative sizing.

**Specific Context - React & Nested Elements (like Canvas):**
- Apply these Tailwind/relative unit rules to all React components and their JSX elements (`div`, `span`, etc.).
- **Crucially for nested elements (like a `div` containing a `<canvas>`):**
    - The **parent `div`** MUST ALSO be sized responsively using Tailwind/relative units. If the parent has a fixed `px` width/height, the children cannot resize properly within it.
    - The **`<canvas>` element itself** often needs special handling:
        - Use CSS (Tailwind classes like `w-full h-auto` or `aspect-video` if applicable) to make the *canvas element* responsive within its parent.
        - Often requires JavaScript (e.g., within a `useEffect` hook in React) to get the actual rendered size of the parent `div` and set the `width` and `height` *attributes* of the canvas element accordingly. Redraw the canvas content after resizing. Missing this JavaScript step is a common reason canvases don't resize visually.

**Goal:** Every part of the UI should adapt smoothly to different screen sizes and user settings, powered by Tailwind's utility-first, responsive approach. Fixed pixels are the enemy of this goal.