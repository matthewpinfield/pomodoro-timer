# Pre-Launch Issues

Live tracker for known gaps before this goes public. Update status as things
get fixed rather than deleting entries — keeps the history of what was known
and when.

## Blocking / should fix before launch

### Never actually deployed
Everything's been verified locally (`pnpm build`, `tsc`, manual testing) but
the GitHub Pages workflow itself has never run for real, and nothing's been
pushed to `origin`. The config *should* work based on local verification, but
that's not the same as a confirmed live deployment.
**Status:** open.

### No test suite
`jest.config.mjs` references the `ts-jest` preset, which isn't installed in
`devDependencies` — `pnpm test` fails immediately. Moot today since there are
zero test files, but it means nothing will catch a regression automatically
once this is being iterated on post-launch.
**Status:** open.

### No ESLint config
`next lint` prompts to bootstrap a config interactively rather than running.
No lint gate in CI.
**Status:** open.

## Known bugs, deferred

### Progress minutes under-count after a backgrounded tab
In `context/timer-context.tsx`, the tick loop correctly subtracts however much
time actually passed (`secondsPassed`), however large the gap - but the
per-minute progress-crediting effect always adds exactly 1 minute per firing,
then resets its counter to 0, discarding anything over 60 seconds. If
`requestAnimationFrame` gets throttled while a tab is backgrounded/minimized
and the next tick jumps by, say, 90+ seconds, `taskTimeLeft` correctly reflects
the full elapsed time but `progressMinutes` only gets credited 1 minute -
the two drift apart. Confirmed via code trace during this session; user asked
to set aside rather than fix immediately.
**Fix direction:** credit `Math.floor(secondsThisTick / 60)` minutes and keep
the remainder, instead of a flat +1 with a full reset.
**Status:** open, not yet fixed.

## Accepted risk

### Next.js pinned at 15.2.4, not the latest patched 15.5.25
Dependabot flagged ~105 alerts on the dependency tree (mostly duplicated
across historical versions in the raw listing). Upgrading `next` to `15.5.25`
and everything else within reach fixed all of them except `next` itself -
confirmed via `pnpm audit`.

But upgrading `next` past `15.3.0` breaks the app outright. Root-caused, not
just observed: an extra empty `<div>` (`display:flex`, no class, sized to
exactly the viewport) gets injected as the very first child of `<body>`,
*before* the real app root. That pushes the entire real app down by one full
viewport height - so on any normal-sized screen it renders completely
off-screen, and the page looks blank even though React state/props are
computing correctly underneath (confirmed via console logging - task data,
mode, timers all correct; nothing is visibly on screen or clickable). This is
a duplicate-DOM/hydration artifact in Next.js's App Router in that version
range, not a bug in this app's code.

Bisected precisely: `15.2.4` and `15.3.0` are clean: `15.3.5`, `15.4.0`, and
`15.5.25` all show the extra div. Reverting React alone (while keeping a
broken `next` version) did not fix it; reverting only `next` did - confirmed
in both directions, so the regression is inside Next.js itself.

Given the choice between this and unpatched CVEs in a package that isn't
even running as a server in production (this deploys as a static export -
no Next.js server process, so most of the flagged Server Actions/middleware/
SSRF issues don't apply to the live site), kept `next@15.2.4` and took every
other fix (React, uuid, postcss, yaml, sharp, and more - `pnpm audit` is
clean except for `next` itself).

**Status:** deliberate, documented tradeoff, not an oversight. Next step to
actually resolve it: bisect the exact `next` release between `15.3.0` and
`15.3.5` that introduces the extra div (narrower range now than "somewhere
in 15.x"), then either use that as the ceiling or file it upstream with the
reproduction above.

## Scope decisions worth confirming intentional

### No accounts / no sync
State is entirely `localStorage`, tied to one browser on one device. Fine if
that's the intended scope for launch; flagging so it's a decision, not an
oversight discovered later.

### Mobile: functional but not mobile-native
Real-device tested and called "okay-ish." Two concrete touch gaps were found
and fixed this session (hover-only play/pause icon, overly tight text
truncation). Broader mobile-native polish (bottom tab bar, content ordering
on `/pie-chart`) was discussed and deliberately deferred - see
`FUTURE_FEATURES.md`. Not a bug, just noting it's a conscious "good enough for
now" rather than a finished mobile pass.

## Repo hygiene (non-blocking)

- `.cursor/rules/*.mdc` files are leftover from before the Cursor→Claude
  switch, superseded by `CLAUDE.md`. Harmless but redundant.
- Stray root files (`app function.txt`, `How the Pomodoro Timer Circle Works
  (F.md`, `transferToResponsive.md`) look like working notes rather than
  project docs. Worth a cleanup pass at some point, not urgent.

## Resolved this session (for reference)

Kept brief - full detail is in git history (`git log`). Broken production
build, broken GitHub Pages deploy config, missing/broken app icons, several
real timer-logic bugs (task time not counting down, pomodoro/task duration
conflated, a race that permanently corrupted saved task time, goal edits not
syncing), single-task interaction model, accessibility labels, stale About
copy, mobile touch fixes, sound notifications (Tier 1), stale timer-circle
documentation (both docs rewritten to match the filled-wedge rendering).
