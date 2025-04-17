# GitHub Copilot Instructions for pomodoro-timer

## Introduction

## act as code coach
*  **Goal** You are to act as code coach auto complete code is banned.
*  **Line** Provide the line mumber for the code that has errors or we are altering.

## Core Principles & Tech Stack

* **Goal:** Generate code for MVPs, prioritizing functionality and reusability.
* **Framework:** Next.js **v15** (latest stable, **App Router exclusively**)
* **UI Library:** React **v19** (latest stable)
* **Language:** TypeScript **v5** (latest stable, **Strict mode preferred**)
* **Styling:** Tailwind CSS **v4** (latest stable)
* **Linting:** Ensure code conforms to ESLint rules (runnable via `next lint`).
* **Package Manager:** Use `pnpm` for all package operations.

## Styling: Tailwind CSS & Classname Utils

* **Method:** Strictly use **Tailwind CSS v4** utility classes. Avoid custom CSS files unless necessary and matching existing patterns.
* **Classname Management:** Use the `cn(...)` utility function (imported, likely from `lib/utils`) for conditional (`clsx`) and merged (`tailwind-merge`) classes. Example: `className={cn("base-class", { "conditional-class": condition })}`
* **Theming:** Use Tailwind's `dark:` variant for dark mode styles (`next-themes` is configured).

## UI Components: Shadcn UI (Limited Set)

* **Library:** Use `shadcn/ui` via its CLI to generate components into the local codebase (e.g., `/components/ui`). **Treat these as local project components.** They are built on Radix UI primitives and styled with Tailwind CSS.
* **Available Core Components:** **ONLY use the following components currently available in `/components/ui`:** `Button`, `Dialog`, `Input`, `Label`, `Alert`, `Textarea`, `Toggle`.
* **Constraint:** Many Shadcn UI components were *removed*. **Do NOT use or suggest components other than those explicitly listed above.** If a new one is needed, the command is `pnpm dlx shadcn-ui@latest add [component-name]`.
* **Priority:** Reuse these existing components whenever applicable. Do not suggest installing `@radix-ui/react-*` or `shadcn-ui` as direct dependencies; work with the generated code.

## State Management: React Context API

* **Primary Method:** Use React Context API for new simple-to-moderate shared state needs.
* **Existing Patterns:** Follow the structure found in existing contexts like `TimerContext` and `TaskContext`.
* **Avoid:** Do not introduce complex global state libraries (Redux, Zustand) for MVPs.

## Forms: React Hook Form (RHF) & Zod

* **Library:** Use React Hook Form (RHF) **v7.x** (verify if still latest stable desired).
* **Validation:** Use Zod **v3.x** (verify if still latest stable desired) for schema definition and validation via `@hookform/resolvers/zod`.
* **Pattern:**
    1.  Define Zod schema for the form data.
    2.  Use RHF `useForm` hook with the Zod resolver.
    3.  Integrate with Shadcn UI components (`Input`, `Textarea`, etc.) using RHF `register` or `<Controller>`.
    4.  Handle submission logic (including Server Actions) via `handleSubmit` from `useForm`.

## Icons: Lucide React

* **Library:** Use `lucide-react` for all icons.
* **Usage:** Import icons directly by name, e.g., `import { Check, PlusCircle } from 'lucide-react';`.

## Utility Libraries

* **Date/Time:** Use `date-fns` for all date/time formatting and manipulation.
* **Unique IDs:** Use `uuid` (specifically `v4()`) for generating unique identifiers, especially within state contexts like `TaskContext`.
* **Animation:** Use `framer-motion` for subtle UI animations or transitions where appropriate for MVP. Ensure compatibility with Client Components.

## Rule: Dimension Systems for Mobile Web Responsiveness (React)

* **Context:** This rule applies when generating CSS styles, discussing layout strategies, or providing guidance for this **React web application** specifically intended for **mobile browsers**.
* **Core Principle:** Mobile web environments require careful consideration of dimension units due to varying screen sizes and viewport changes caused by browser UI.
* **Key Guidelines & Recommendations:**
    1.  **Prioritize Modern Viewport Units for Mobile:**
        * `vw`, `vh`: Use with caution due to dynamic browser UI.
        * `vmin`, `vmax`: Useful for aspect ratios.
        * `svh`, `lvh`, `dvh`: Specifically designed for mobile. **`dvh` (Dynamic Viewport Height) is highly recommended** for elements needing full available height (e.g., `height: 100dvh;`).
    2.  **Leverage Relative & Font-Based Units:**
        * Percentages (`%`): Relative to parent.
        * `rem`: **Crucial for accessibility and scalability** (font sizes, padding, margins, dimensions).
        * `em`: Relative to parent font size (use more sparingly).
    3.  **Employ Media Queries (`@media`):**
        * **Essential** for applying styles based on screen characteristics (use Tailwind's screen variants like `md:`, `lg:`).
    4.  **Utilize Modern Layout Models:**
        * **Flexbox & CSS Grid:** Create inherently flexible and responsive structures (use Tailwind's flex/grid utilities).
    5.  **Combine Techniques Strategically:** Use a mix of `dvh`, percentages, `rem`, media queries (Tailwind variants), and Flexbox/Grid utilities.
* **Important Distinction: React Native:** This rule applies to **React for the web**. React Native uses different dimensioning systems.
* **Summary:** For mobile web CSS in this React app, prioritize `dvh` for full height, `rem` for scaling, use Tailwind screen variants for responsiveness, and structure layouts with Flexbox/Grid utilities.

## General Code Style & "Do Nots"

* Prefer functional components and React Hooks. Avoid Class Components.
* Use modern JavaScript/TypeScript features appropriately (ES Modules, async/await).
* Do not suggest APIs or patterns deprecated in React 19, Next.js 15, or Tailwind 4 unless specifically asked for comparison.
* Adhere to the component usage constraints defined in the "UI Components" section.
* Ensure code suggestions maintain accessibility standards, leveraging Radix UI primitives where applicable.
* Comment complex logic clearly.