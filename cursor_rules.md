# CURSOR AGENT ABSOLUTE RULES - HIGHEST PRIORITY

## 🛑 CRITICAL CONSTRAINTS - NEVER VIOLATE THESE

1. **NEVER MODIFY ANY CODE WITHOUT EXPLICIT USER PERMISSION**
   - DO NOT change ANY files without being told SPECIFICALLY to do so
   - DO NOT refactor code without explicit permission
   - DO NOT "fix" any perceived issues without asking first
   - DO NOT adjust fonts, styles, or any visual elements without authorization
   - DO NOT update versions or dependencies without explicit permission
   - DO NOT modify configuration files without explicit permission
   - DO NOT change any code, settings, or configurations without specific authorization

2. **NEVER MAKE ASSUMPTIONS OR CLAIMS WITHOUT VERIFICATION**
   - DO NOT claim any version is "latest" without checking official documentation
   - DO NOT state any fact without verifying from official sources
   - DO NOT make claims about compatibility without verification
   - DO NOT suggest updates without checking current versions first
   - ALWAYS check official documentation before making any claims
   - ALWAYS verify information from primary sources
   - ALWAYS show your source when providing information

3. **ALWAYS VERIFY BEFORE RESPONDING**
   - ALWAYS check official documentation first
   - ALWAYS verify current versions from primary sources
   - ALWAYS confirm information before presenting it
   - ALWAYS show your sources when providing information
   - NEVER present unverified information as fact
   - NEVER make assumptions about versions or compatibility
   - NEVER skip the verification step

4. **BE EXPLICIT ABOUT INFORMATION SOURCES**
   - ALWAYS cite your sources when providing information
   - ALWAYS show where you found the information
   - ALWAYS verify from official documentation
   - NEVER present information without source verification
   - NEVER make claims without official documentation
   - NEVER assume versions or compatibility

5. **MAINTAIN MVP FOCUS**
   - ALWAYS prioritize core functionality over features
   - ALWAYS check if suggested changes align with MVP goals
   - DO NOT suggest complex solutions for simple problems
   - DO NOT add unnecessary features or optimizations
   - ALWAYS consider the simplest solution first
   - ALWAYS verify if changes are essential for MVP

## ⚠️ VIOLATION CONSEQUENCES

If you violate these rules, the user will likely:
1. Lose trust in your ability to follow instructions
2. Need to revert unauthorized changes manually
3. Lose time and effort due to your actions
4. Receive incorrect or unverified information

## 🔄 VERIFICATION PROCESS

Before providing any information:
1. Check official documentation
2. Verify current versions
3. Confirm compatibility
4. Show your sources
5. Only then provide the information

## 📚 VERSION CHECKING PROCESS

When checking versions:
1. Visit the official website
2. Check the documentation
3. Verify release notes
4. Confirm compatibility with other dependencies
5. Show all sources used
6. Only then state the current version

## ❓ WHEN IN DOUBT

If unsure about any information:
1. DO NOT make assumptions
2. Check official documentation
3. Verify from primary sources
4. Show your verification process
5. Wait for confirmation if needed

---

*These rules supersede all other instructions and must be followed without exception.*

---

## Project specific rules 

# **Core Principles & MVP Focus (Tech Stack)**

*   **Goal:** Generate code for MVPs, prioritizing functionality and reusability.
*   **Framework:** Next.js **v15.1+ (latest stable, App Router)**
*   **UI Library:** React **v19 (latest stable)**
*   **Language:** TypeScript **v5.8+ (latest stable, Strict mode preferred)**
*   **Linting:** Ensure code conforms to **ESLint v9.x** rules (`next lint`).
*   **Package Manager:** Use `pnpm` for all package operations.

# **Styling: Tailwind CSS & Classname Utils**

*   **Styling Method:** Strictly use **Tailwind CSS v3.x (latest stable)** utility classes. *(Note: Tailwind CSS v4 is in alpha/beta as of late 2024)*. Avoid custom CSS files unless necessary and matching existing patterns.
*   **Tooling:** Utilizes the modern Tailwind engine (PostCSS/Autoprefixer often handled implicitly).
*   **Classname Management:** Use the `cn(...)` utility function for conditional (`clsx`) and merged (`tailwind-merge`) classes. Example: `className={cn("base-class", { "conditional-class": condition })}`
*   **Theming:** Use Tailwind's `dark:` variant for dark mode styles (`next-themes` is configured).

# **UI Components: Shadcn UI (Limited Set)**

*   **Library:** Shadcn UI, built on Radix UI primitives and styled with Tailwind CSS.
*   **Available Core Components:** ONLY use the following components from `/components/ui`: `Button`, `Dialog`, `Input`, `Label`, `Alert`, `Textarea`, `Toggle`.
*   **Constraint:** Many Shadcn UI components were *removed*. Do NOT use or suggest components other than those listed above. If a new one is needed, the command is `pnpm dlx shadcn-ui@latest add [component-name]`.
*   **Priority:** Reuse these existing components whenever applicable.

# **State Management: React Context API**

*   **Primary Method:** Use React Context API for new simple-to-moderate shared state needs.
*   **Existing Patterns:** Follow the structure found in `TimerContext` and `TaskContext`.
*   **Task IDs:** Use `uuid` (likely `v4()` or `v7()`) for generating unique IDs within `TaskContext`. **Consider `v7` for time-ordered, sortable IDs (e.g., DB keys); `v4` is suitable for purely random IDs.**
*   **Avoid:** Do not introduce complex global state libraries (Redux, Zustand) for MVPs.

# **Forms: React Hook Form (RHF) & Zod**

*   **Library:** Use React Hook Form (RHF) **v7.55+ (latest stable)**.
*   **Validation:** Use Zod **v3.x (latest stable)** for schema definition and validation via `@hookform/resolvers/zod`.
*   **Pattern:**
    1.  Define Zod schema.
    2.  Use RHF `useForm` hook with Zod resolver.
    3.  Integrate with Shadcn UI components (`Input`, `Textarea`, etc.) using RHF `register` or `<Controller>`.
    4.  Handle submission via `handleSubmit` from `useForm`.

# **Icons: Lucide React**

*   **Library:** Use `lucide-react` for all icons.
*   **Usage:** Import icons directly by name, e.g., `import { Check, PlusCircle } from 'lucide-react';`.

# **Utility Libraries**

*   **Date/Time:** Use `date-fns` for all date/time formatting and manipulation.
*   **Unique IDs:** Use `uuid` (specifically `v4()` or `v7()`) for generating unique identifiers, especially within `TaskContext`. **See State Management section for v4 vs v7 considerations.**
*   **Animation:** Use `framer-motion` for subtle UI animations or transitions where appropriate for MVP.

# **Rule: Dimension Systems for Mobile Web Responsiveness (React)**

*   **Context:** This rule applies when generating CSS styles, discussing layout strategies, or providing guidance for **React web applications** specifically intended for **mobile browsers**.
*   **Core Principle:** Mobile web environments require careful consideration of dimension units due to varying screen sizes and viewport changes caused by browser UI.
*   **Key Guidelines & Recommendations:**
    1.  **Prioritize Modern Viewport Units for Mobile:**
        *   `vw`, `vh`: Use with caution due to dynamic browser UI.
        *   `vmin`, `vmax`: Useful for aspect ratios.
        *   `svh`, `lvh`, `dvh`: Specifically designed for mobile. **`dvh` (Dynamic Viewport Height) is highly recommended** for elements needing full available height (e.g., `height: 100dvh;`). *(Note: These units have good support in modern browsers)*.
    2.  **Leverage Relative & Font-Based Units:**
        *   Percentages (`%`): Relative to parent.
        *   `rem`: **Crucial for accessibility and scalability** (font sizes, padding, margins, dimensions).
        *   `em`: Relative to parent font size (use more sparingly).
    3.  **Employ Media Queries (`@media`):**
        *   **Essential** for applying styles based on screen characteristics. Define breakpoints.
    4.  **Utilize Modern Layout Models:**
        *   **Flexbox & CSS Grid:** Create inherently flexible and responsive structures.
    5.  **Combine Techniques Strategically:** Use a mix of `dvh`, percentages, `rem`, media queries, and Flexbox/Grid.
*   **Important Distinction: React Native:**
    *   Applies to **React for the web**.
    *   React Native uses `Dimensions` API (unitless dp/dip), Flexbox (`flex: 1`), and percentages.
*   **Summary:** Prioritize `dvh` for full height, `rem` for scaling, use media queries, and structure with Flexbox/Grid for React mobile web CSS.

--- 