# FocusPie (Pomodoro Timer)

A visual, ADHD-friendly focus timer: a pie chart for planning the day's tasks against a workday budget, and a circular timer for running Pomodoro sessions against the selected task. No backend — all state lives in `localStorage`, deployed as a static export to GitHub Pages.

## Stack & conventions

- **Next.js 15.2 (App Router) + React 19 + TypeScript 5** (strict mode). Package manager: **pnpm**.
- **Styling:** Tailwind CSS v3.x utility classes only — avoid new custom CSS in `globals.css` unless it matches existing patterns (CSS custom properties for theme colors, see below). Merge/conditional classes via `cn()` from `lib/utils.ts` (clsx + tailwind-merge), not manual string concatenation.
- **UI components:** Shadcn/Radix primitives, but only `alert`, `button`, `dialog`, `input`, `label`, `switch`, `textarea`, `toggle` are actually installed in `components/ui/`. Reuse these before adding a new one (`pnpm dlx shadcn-ui@latest add <name>`).
- **State:** React Context only — no Redux/Zustand. Follow the existing `TaskContext` / `TimerContext` / `SettingsContext` pattern (each owns its own `localStorage` key(s), loads on mount, persists via `useEffect`).
- **Forms:** React Hook Form + Zod (`@hookform/resolvers/zod`) where forms exist.
- **Icons:** `lucide-react`, imported by name. **Dates:** `date-fns`. **IDs:** `uuid` (`v4`/`v7`). **Animation:** `framer-motion`, used sparingly.
- **Mobile CSS:** prefer `dvh`/`svh`/`lvh` for full-height elements, Tailwind's `rem`-based spacing scale for everything else (not raw viewport units for padding/margin/gap).

## Architecture

- `context/task-context.tsx` — tasks, `localStorage["focuspie-tasks"]` + `focuspie-current-task`. Ships 4 hardcoded demo tasks (`id` prefixed `demo-`) shown until the user adds a real task (`hasRealTasks` = any non-`demo-` id); demo tasks are not selectable in the pie chart (`pie-chart.tsx` blocks clicks on `id.startsWith('demo-')`).
- `context/timer-context.tsx` — timer mode/countdown state, `localStorage["focuspie-timer-settings"]` + per-task `focuspie-taskTimeLeft-<id>`. Exposes `mode`, `timeLeftInMode`, `taskTimeLeft`, `sessionTotalDuration`, `isRunning`, `settings`, plus actions (`startWork`, `pauseTimer`, `skipBreak`, `toggleAutoPause`, `updateTimerSetting`). **If you add a new piece of state here, remember to add it to the `value` object returned by the provider** — `taskTimeLeft` was computed and consumed elsewhere but missing from `value` for a while, which silently broke the task-time display (TS caught it once the type was correct; runtime just showed `undefined`).
- `context/settings-context.tsx` — `workdayHours`, `useMonochromeChart`, own `localStorage` keys.
- Colors are CSS custom properties in `app/globals.css` (OKLCH), themed per light/dark via `:root` / `.dark`, with per-task chart colors as `--chart-1..N` (and `--mono-1..15` for monochrome mode, `--work-*`/`--rest-*` variants for timer mode). Never hardcode hex for themed UI — read via `getCssVariable()` / `getTaskDisplayColor()` / `getTaskModeColor()` in `lib/utils.ts`, all client-only (`typeof window` guarded, with fallback colors for SSR).
- `components/pie-chart.tsx` and `components/timer-circle.tsx` are hand-rolled `<canvas>` renderers (not SVG/recharts) — redraw logic lives in a `useEffect` keyed on the props/state that affect the drawing. `TIMER_LOGIC.md` documents the timer arc geometry in detail, but predates the OKLCH color refactor — the red/blue/green hex constants it describes are now theme-driven CSS variables (`--timer-work-fixed`, `--timer-rest-fixed`, `--primary`), not literal hex.
- Routing: `/` redirects to `/pie-chart` (task planning / today's overview), `/timer` runs the active session, `/settings` holds preferences.

## Commands

```
pnpm dev      # dev server, localhost:3000
pnpm build    # production static export -> dist/ (see gotcha below)
pnpm lint     # next lint — not yet configured, prompts interactively on first run
pnpm test     # jest — currently broken, ts-jest isn't installed and there are no test files yet
```

## Known gaps / gotchas (as of 2026-09-04)

- **`next.config.mjs` uses a phase-based export** (`(phase) => {...}`, checking `PHASE_PRODUCTION_BUILD` from `next/constants.js`) so that `output: 'export'` + `distDir: 'dist'` apply only to `next build`, not `next dev`. Do not hoist those two options back into the unconditional base config — doing so makes the dev server watch its own `dist/` output as source changes and spin in an infinite recompile loop (confirmed: 140%+ CPU, hundreds of recompiles/minute, intermittent broken JS chunks served to the browser).
- The GitHub Pages workflow (`.github/workflows/deploy.yml`) uploads `path: dist` (the whole export lands directly in `dist/`, not `dist/out` — there's no extra `out` subfolder once `distDir` is customized).
- No `public/` directory exists — `app/manifest.ts` references `/icon-192x192.png` and `/icon-512x512.png` that 404, and there's no favicon. Needs real artwork before launch.
- `jest.config.mjs` references the `ts-jest` preset, which isn't in `devDependencies` — `pnpm test` fails immediately. Moot today (zero test files exist) but blocks adding tests until fixed.
- No ESLint config file — `next lint` asks to bootstrap one interactively rather than running in CI.
- Killing/restarting `pnpm dev` in this environment: `next-server` doesn't always die with a `lsof -ti:3000 | xargs kill`; check `ps aux | grep next-server` and kill the PID directly if a stale instance survives, otherwise it keeps a stale port bound and the next `pnpm dev` silently starts on 3001 instead.
