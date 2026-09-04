# Future Features

Ideas discussed but not yet built, kept here so the reasoning survives between sessions.

## Notifications & Alerts

Currently there's no audio or notification of any kind when a pomodoro/break/task
ends — the only way to know is to be looking at the screen. Three tiers, roughly
in order of effort:

1. **Audio chime** (free tier, cheap to build) — synthesize a short tone with the
   Web Audio API (no asset/licensing needed) and play it from the one place in
   `context/timer-context.tsx` where every transition already happens (pomodoro
   end, break end). Plays even in a backgrounded tab, since browsers don't mute
   background audio the way they throttle background JS.
2. **Desktop notification banner** (moderate) — browser `Notification` API,
   needs a one-time permission prompt. Reliable on desktop Chrome/Firefox/Edge
   even when minimized; much weaker on Safari, especially iOS, unless the app
   is installed as a PWA. Worth weighing given mobile is the primary use case.
3. **True push notifications** (bigger lift, paid-tier candidate) — works even
   if the browser is fully closed. Needs a service worker + push subscription +
   realistically a backend to trigger it — this is the point where the app
   stops being a static, no-backend site and needs accounts + a server. Don't
   back into this accidentally; it's a deliberate architecture decision.

## Paid-tier ideas (ADHD-focused)

FocusPie is positioned as an ADHD-friendly timer, so premium features should
target the executive-function gaps generic pomodoro apps don't address, not
just "more customization."

- **Push notifications** (Tier 3 above) — directly addresses time blindness,
  a core ADHD challenge. Natural anchor for a paid tier since it requires
  backend infrastructure anyway.
- **Escalating alerts** — if a transition notification isn't acknowledged, it
  repeats or gets louder instead of firing once and getting missed (common
  during hyperfocus). Cheap once push notifications exist.
- **Hyperfocus protection** — a firmer, harder-to-dismiss break reminder after
  a task's been running unusually long, for the opposite problem: forgetting
  to stop. Same infrastructure as escalating alerts.
- **Focus insights** — simple stats on when/how long people actually focus.
  No new infrastructure needed, just aggregating data already tracked
  (`progressMinutes` per task, session history).

## Mobile experience

Current mobile layout is responsive (stacks correctly, no broken layouts) but
is fundamentally the desktop layout reflowed, not a mobile-first design. User
tested on a real device and called it "okay-ish" — two concrete touch gaps
were found and fixed (hover-only play/pause icon on the timer circle, overly
tight text truncation). Explicitly deferred rather than rejected:

- **Bottom tab bar** for Plan/Timer instead of routing both through the
  hamburger menu — the two screens used constantly shouldn't require opening
  a menu every time; keep the hamburger for occasional items (Settings, About).
- **Content ordering on small screens** — `/pie-chart` currently shows the
  decorative chart before any task list; on a phone that's most of the first
  screen before reaching anything actionable.

Revisit if further real-device testing turns up more than "okay-ish."
