# Pre-Launch Issues

Live tracker for known gaps before this goes public. Update status as things
get fixed rather than deleting entries — keeps the history of what was known
and when.

## Operational gotcha worth remembering

### Updating a Supabase Edge Function secret doesn't guarantee already-warm instances pick it up
Hit this 2026-09-11 switching `stripe-webhook` from test to live Stripe keys:
`supabase secrets set` updated the value correctly, but the deployed function
kept failing webhook signature verification with the *old* secret's
behavior - `Deno.env.get(...)` is read once at module load, and a warm
(already-running) instance doesn't necessarily restart just because the
secret store changed underneath it. A genuine code redeploy (not just
re-running `secrets set`) forced a fresh instance and fixed it immediately.
**Takeaway:** after rotating any secret an Edge Function reads
(`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `CRON_SECRET`,
`VAPID_PRIVATE_KEY_JWK`, etc.), redeploy the function that reads it - don't
assume the next invocation automatically sees the new value.

## Full live Stripe billing confirmed working end-to-end (2026-09-11)
Real signup → real Checkout → real payment → real webhook → real
`subscriptions` row update → "FocusPie Pro" correctly shown. Subscription
deliberately left active (real $2.99 charge, kept running for further
testing rather than canceled immediately).

## Considered, deliberately not fixed (low risk)

Full security pass done 2026-09-11 before linking the real (live-mode) Stripe
account - git history scanned clean (no secrets in any commit), every
table's RLS policy reviewed, both Stripe Edge Functions' auth/validation
logic reviewed. Two things were considered and consciously left as-is:

- **No rate limit on `stripe-billing-session`** (creating Stripe Checkout/
  Portal sessions). Unlike `fetch-calendar`, this has no per-account cooldown.
  Worst case if abused: wasted Supabase invocations and harmless extra Stripe
  Customer objects - no cost, no data exposure, and it already requires a
  signed-in account, which is itself rate-limited at sign-up (see above).
- **Stripe webhook events are processed in arrival order, not verified
  chronological order.** Stripe doesn't strictly guarantee in-order delivery;
  a delayed retry of an older event could theoretically overwrite a newer
  subscription status. Real-world risk is low (single-endpoint delivery is
  normally in-order in practice); a proper fix means comparing event
  timestamps before writing, not done given the low probability.

Also confirmed safe by design: this Stripe account is shared with Buy Me a
Coffee, so `stripe-webhook` receives *every* subscription event on the
account, not just FocusPie's - but it only ever updates a `subscriptions` row
that already exists, and a row only exists for a Stripe customer created via
FocusPie's own checkout flow, so an unrelated BMC event finds zero matching
rows and is silently ignored.

## Blocking / should fix before launch

### No rate limiting or bot protection on account sign-up — mitigated
Discovered 2026-09-11 while debugging a Stripe billing test: `Authentication →
Users` in the Supabase dashboard showed an account for
`qa-test-focuspie@gmail.com` that the site owner did not create and doesn't
recognize. Root cause: `context/auth-context.tsx`'s magic-link sign-in
(`supabase.auth.signInWithOtp`) creates a real row in `auth.users` the moment
anyone submits *any* email into the sign-in form on `/account` — no
confirmation, CAPTCHA, or rate limit required for the row to exist, only for
it to ever become a usable session. The live site is public
(`focuspie.app/account`), so any visitor, bot, or scanner could trigger this
indefinitely.
**Fix applied:** Supabase's own sign-up/OTP rate limit (Authentication → Rate
Limits in the dashboard) tightened to 12 requests/hour. A CAPTCHA on the
sign-in form would be more robust still (this rate limit is per-project, not
per-IP, so a slow/patient abuser could still trickle through) but wasn't
pursued given the low severity (Free-tier Supabase has hard usage caps, not
billing risk, and no paid feature is reachable without actually completing
sign-in) - revisit if real abuse is ever observed.
**Status:** mitigated, not eliminated.

### user_settings REST calls returning 400 on the live site — fixed
Spotted 2026-09-11 in the browser Network tab on `focuspie.app/account/`
while debugging the Stripe billing flow. Root cause confirmed via curl
against the live REST API: Postgres error `42703 column
user_settings.calendar_last_synced_at does not exist` - schema drift, not a
code bug. `supabase/schema.sql` has always correctly declared `alter table
public.user_settings add column if not exists calendar_last_synced_at
timestamptz;`, but that one specific statement was apparently never actually
run against the live database (every other column referenced by the app was
individually verified present via curl - this was the only gap). Fix was
purely that one SQL statement; user ran it, re-verified via curl (200
instead of 400 for the same query).
**Status:** fixed.

### Never actually deployed — fixed
Stale as of 2026-09-11 - the app has been live at `focuspie.app` for several
sessions now (custom domain, GitHub Pages), with real Stripe billing, Supabase
auth/sync, Calendar import, and push notifications all confirmed working
against the live deployment. Left the entry rather than deleting it, per this
file's own convention.
**Status:** fixed.

### No test suite — fixed
`jest.config.mjs` referenced the `ts-jest` preset, which was never installed —
`pnpm test` failed immediately. Root cause: `next/jest` already provides its
own SWC-based TS/JSX transform, so the `ts-jest` preset was redundant as well
as broken; removed it rather than installing `ts-jest`. Also needed a
`moduleNameMapper` stub for `uuid` (ESM-only, unreachable by next/jest's
transform pipeline) — see `__mocks__/uuid.js`. 19 tests added covering the
areas with the most real bugs found this session: `lib/utils.ts` (pure color
helpers, `formatTime`), `context/task-context.tsx` (demo-list replacement,
progress accumulation, delete+restore/Undo), and `context/timer-context.tsx`
(pomodoro/task duration independence, the per-minute progress regression
below, task-time depletion only during work sessions).
**Status:** fixed.

### No ESLint config — fixed
Added `eslint.config.mjs` (flat config via `FlatCompat`, bridging
`eslint-config-next`'s legacy-style shareable configs since it doesn't ship a
flat config yet) plus `eslint`, `eslint-config-next`, `@eslint/eslintrc` as
devDependencies. `pnpm lint` now runs clean with zero warnings or errors.
**Status:** fixed.

## Known bugs, fixed this session

### Progress minutes under-count after a backgrounded tab — fixed
In `context/timer-context.tsx`, the tick loop correctly subtracted however much
time actually passed (`secondsPassed`), however large the gap - but the
per-minute progress-crediting effect always added exactly 1 minute per firing,
then reset its counter to 0, discarding anything over 60 seconds. If
`requestAnimationFrame` got throttled while a tab was backgrounded/minimized
and the next tick jumped by, say, 90+ seconds, `taskTimeLeft` correctly
reflected the full elapsed time but `progressMinutes` only got credited 1
minute - the two drifted apart.
**Fix:** credit `Math.floor(secondsThisTick / 60)` minutes and keep the
remainder, instead of a flat +1 with a full reset. Covered by a regression
test in `context/timer-context.test.tsx` that injects a simulated ~150-second
timestamp jump and asserts 2 minutes are credited (not 1), and that the 30s
remainder correctly completes the next minute rather than being dropped.
**Status:** fixed.

## Scope decisions worth confirming intentional

### No accounts / no sync — resolved
Stale as of 2026-09-11 - accounts (Supabase Auth, magic-link) and cross-device
sync (tasks/settings) were built and shipped in a later session, free for
every signed-in user permanently. Left the entry rather than deleting it, per
this file's own convention.

### Mobile: functional but not mobile-native
Real-device tested and called "okay-ish." Two concrete touch gaps were found
and fixed this session (hover-only play/pause icon, overly tight text
truncation). Broader mobile-native polish (bottom tab bar, content ordering
on `/pie-chart`) was discussed and deliberately deferred - see
`FUTURE_FEATURES.md`. Not a bug, just noting it's a conscious "good enough for
now" rather than a finished mobile pass.

## Repo hygiene (non-blocking)

- **gmail.com vs. googlemail.com creates two separate accounts for the same
  mailbox — fixed.** Found 2026-09-11 while testing Stripe billing: Google
  treats `user@gmail.com` and `user@googlemail.com` as the same inbox (a
  legacy regional-domain alias), but Supabase Auth had no way to know that -
  each got its own `auth.users` row, and browser autofill silently swapped
  between the two without the user noticing (a successful test subscription
  on the `@googlemail.com` account was invisible when a later sign-in landed
  on the `@gmail.com` one instead). **Fix:** `lib/utils.ts`'s
  `normalizeEmail()` canonicalizes `@googlemail.com` → `@gmail.com` (plus
  trim/lowercase) before `context/auth-context.tsx` ever calls
  `signInWithOtp` - both domains now always resolve to the same account
  going forward. Existing duplicate accounts from before this fix aren't
  merged (out of scope - no realistic way to reconcile two already-separate
  `auth.users` rows automatically). Covered by tests in `lib/utils.test.ts`.
- ~~`.cursor/rules/*.mdc` files are leftover from before the Cursor→Claude
  switch~~ — removed.
- ~~Stray root files (`app function.txt`, `How the Pomodoro Timer Circle Works
  (F.md`, `transferToResponsive.md`)~~ — removed (superseded by
  `FUTURE_FEATURES.md`/`TIMER_LOGIC.md`/`CLAUDE.md` respectively; preserved
  in git history if ever needed).

## Resolved this session (for reference)

Kept brief - full detail is in git history (`git log`). Broken production
build, broken GitHub Pages deploy config, missing/broken app icons, several
real timer-logic bugs (task time not counting down, pomodoro/task duration
conflated, a race that permanently corrupted saved task time, goal edits not
syncing), single-task interaction model, accessibility labels, stale About
copy, mobile touch fixes, sound notifications (Tier 1), stale timer-circle
documentation (both docs rewritten to match the filled-wedge rendering).

### Intermittent production build crash on /timer (found and fixed while verifying items 2-4)
`pnpm build` occasionally (not every run) failed prerendering `/timer` with
`TypeError: a[d] is not a function` inside the minified webpack runtime.
Root-caused by bisecting every file change against a known-good baseline
rather than assuming it was one of the day's edits: with all other changes
applied, the crash still occurred, and stopped only once
`experimental.optimizePackageImports: ['@/components']` was removed from
`next.config.mjs`. That option is meant for real npm packages with a
resolvable `package.json`/barrel exports (e.g. `lucide-react`) - pointing it
at a local path alias isn't a supported use case, and the resulting transform
race explains why the failure was non-deterministic. Confirmed stable across
4 consecutive clean rebuilds after removal.
**Status:** fixed.

### Dependency vulnerabilities (was going to be an accepted risk, now fully fixed)
Upgrading `next` past `15.3.0` broke the app: an extra empty `<div>`
(`display:flex`, no class, sized to exactly the viewport) gets injected as
the very first child of `<body>` by Next.js's App Router in that version
range, before the real app root - pushing the whole app one viewport height
down, off-screen. Root-caused rather than just avoided: `app/globals.css`
had `#__next, body > div:first-child { height: 100dvh; display: flex; ... }`,
a positional selector assuming the app's real root div would always be
`body`'s first child. Next's new hidden marker div broke that assumption,
and by CSS specificity (`body > div:first-child` beats `[hidden]`'s native
`display: none`) it forced the hidden marker div visible instead of the real
app. Fixed by giving the real root div a stable `id="app-root"`
(`app/layout.tsx`) and targeting that directly instead of relying on DOM
position - immune to whatever Next.js inserts before it, at any version.
Confirmed on `next@15.5.25` (latest patched 15.x): `pnpm audit` is fully
clean, zero vulnerabilities anywhere in the dependency tree.
