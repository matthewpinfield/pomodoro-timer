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

## Calendar integration

Auto-populate the day's task list from a connected calendar (Google Calendar
being the obvious first target) instead of relying on the user to remember to
add everything manually. Directly targets the same "forgetting things" gap as
the notification tiers above — a meeting or commitment already on the
calendar shows up as a task automatically, rather than depending on the user
to notice it and enter it themselves. Needs real scoping (which calendar
providers, one-way import vs. two-way sync, how auto-imported events map to
task duration/priority) before estimating effort - likely needs a backend
for OAuth + calendar API access, so probably bundles naturally with the
Tier 3 push notification work rather than being a separate infrastructure
lift.

**Calendar, not Tasks:** considered pulling in Google Tasks (todos) alongside
Calendar, but they're separate Google APIs with separate OAuth scopes despite
sharing a UI panel in Gmail/Calendar. Decided against it — for this user,
client meetings land on the calendar, not a todo list, so Calendar events are
the actual source of "things I'll forget," and Tasks would just double the
integration surface for a case that doesn't come up.

## Mid-session reminder timer

Raised as "need a timer in case you have to remember something while
working" - not yet scoped to a specific mechanism. Two different features
this could mean, worth resolving before building either:

- **Quick capture** (already exists) - the Quick Note button on a running
  session lets you jot a stray thought without leaving the timer or losing
  focus, reviewed later. No new work needed if this is the actual need.
- **A real secondary countdown** - e.g. "ping me in 10 minutes about X" running
  alongside the main pomodoro/task timer. This is new state and UI (a second
  independent timer, its own notification, needs to coexist with the existing
  tick loop in `context/timer-context.tsx` without interfering with it) -
  a real feature, not a tweak.

## Architecture decision: Calendar and Alarms/Reminders get their own pages

Both of the above (Calendar integration, a real secondary countdown/alarm)
should live on their own routes (e.g. `/calendar`, `/alarms`) rather than
being folded into `/pie-chart` or `/timer`. Deliberate choice: those two
screens are the core, high-frequency loop (plan the day, run a session) and
should stay uncluttered - anything additive belongs behind its own nav entry,
the same way `/settings` already does, not competing for space on the pie
chart or timer circle.

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
