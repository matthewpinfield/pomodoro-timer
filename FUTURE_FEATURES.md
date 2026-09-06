# Future Features

Ideas discussed but not yet built, kept here so the reasoning survives between sessions.

## Tier 3 build plan (settled, in progress)

Everything below in this file that needs a backend - sync, push notifications,
calendar import - is one connected piece of work, not three separate ones.
Settled shape, to build in this order:

1. **Backend: Supabase.** ✅ Done. Client-callable directly (auth + database +
   realtime, protected by row-level security, no server code of our own to
   write or host) - the static export + GitHub Pages deploy did not need to
   change. Considered Firebase (already have an account) - its one real edge
   is FCM for push delivery, but that's not enough to outweigh Supabase's
   fit here (Postgres suits this data well, more community troubleshooting,
   genuine self-host escape hatch).
2. **Auth + Account page.** ✅ Done. One new "Account" entry in the existing
   hamburger menu (same pattern as Alarms/Settings) - its own page, not
   folded into the Settings dialog, since it has more surface area (sign in,
   subscription status, upgrade button) than a quick toggle. Nothing changes
   on `/pie-chart` or `/timer` for anyone who never opens it. Passwordless
   (magic-link) sign-in via Supabase Auth. Custom domain (`focuspie.app`,
   replacing the github.io URL) wired up alongside this, including DNS and
   an auto-provisioned HTTPS certificate. Custom SMTP (Resend, domain
   verified via DKIM/SPF) and branded email templates also done - the
   default Supabase mailer is testing-only (2 emails/hour project-wide,
   sender shows as generic "Supabase Auth", and template editing is gated
   behind custom SMTP entirely), none of which is fit to put in front of a
   real user.
3. **Sync - free once signed in.** Migrates what's in `localStorage` today
   (tasks, timer settings, alarms, progress) to also read/write via Supabase
   for a signed-in user. This is the one piece of Tier 3 that's free -
   competitors treat basic cross-device sync as table-stakes now, not a
   premium feature (see competitive gap check below).
4. **Billing: Stripe, ~£3/$3 per month.** User already has a Stripe account
   (via Buy Me a Coffee), so this is real billing from the start, not a
   placeholder. Subscription, not one-time payment - deliberate: the paid
   features (calendar polling, scheduled push delivery) cost money to keep
   running for as long as the user has them, so revenue needs to track that
   ongoing cost the way it does for every direct competitor's equivalent
   feature (Todoist Pro, TickTick Premium). One sign-in gates everything;
   payment is the additional gate on top, checked against that same account,
   only for Calendar + Push.
5. **Calendar import** (paid) - see "Calendar integration" below for the
   iCal/ICS approach. Technically doesn't need accounts to function as data,
   but is gated behind the paid check per the business model above, so it
   can't ship before step 4 either way.
6. **Push notifications** (paid) - see "Notifications & Alerts" below.
   Hardest remaining sub-problem (server-timed delivery); also where
   vibration finally gets bundled in for Android, and where iPhone
   notifications become possible at all (via Web Push, PWA install required).

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

**Vibration, deliberately not added as a quick win:** considered calling
`navigator.vibrate()` alongside the chime/alarm - cheap, no new
infrastructure. Rejected: the Vibration API has never been implemented in
Safari/WebKit and Apple has given no indication it will be, so it would only
ever work on Android, never iPhone - one of the biggest-selling phones.
The only way to make an iPhone vibrate from a web app is a real native push
notification (iOS Safari supports Web Push from 16.4+, but only for a site
installed via "Add to Home Screen"), which is exactly Tier 3 above. Bundle
vibration with that work rather than shipping an Android-only version now.

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

Auto-populate the day's task list from a connected calendar instead of
relying on the user to remember to add everything manually. Directly targets
the same "forgetting things" gap as the notification tiers above — a meeting
or commitment already on the calendar shows up as a task automatically,
rather than depending on the user to notice it and enter it themselves.

**Calendar, not Tasks:** considered pulling in Google Tasks (todos) alongside
Calendar, but they're separate Google APIs with separate OAuth scopes despite
sharing a UI panel in Gmail/Calendar. Decided against it — for this user,
client meetings land on the calendar, not a todo list, so Calendar events are
the actual source of "things I'll forget," and Tasks would just double the
integration surface for a case that doesn't come up.

**Approach: iCal/ICS feed subscription, not Google OAuth.** Originally
planned as Google Calendar API access via OAuth, but that only ever sees
*Google* Calendar - useless for an Apple Calendar (iCloud) user, regardless
of which account they use to log into FocusPie itself (auth method and
calendar provider are unrelated decisions). Almost every calendar provider
(Google, iCloud, Outlook) exposes the same thing instead: a private iCal/ICS
feed URL, subscribed to rather than authenticated against. One "paste your
calendar's secret iCal link" field covers all three providers identically,
with no OAuth consent screen, no scopes, no per-provider integration code,
and no dependency on which account a user signs into FocusPie with.

Confirmed acceptable tradeoffs for this user's actual need:
- **Read-only, one-way import only** - no writing FocusPie tasks back to the
  calendar. Not needed.
- **Polling, not real-time** - fetched periodically rather than pushed
  instantly; some providers only regenerate their own feed every so often
  regardless. Not needed to update "by the second."

Still needs a small backend proxy to fetch the ICS file server-side (calendar
providers generally don't send CORS headers that would let a browser fetch
it directly) - but that's a much smaller lift than full OAuth + token-refresh
handling would have been, and doesn't require accounts/sign-in to exist
first the way the original Google OAuth plan did. Worth sequencing before
full account sync for that reason, not after.

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

## Competitive gap check (against Tiimo, Sunsama, Forest, Focus To-Do, Focusmate)

Reviewed what other Pomodoro/ADHD apps offer that FocusPie doesn't, to sanity
-check the roadmap rather than build in a vacuum. Verdict per idea:

- **Ambient/focus sounds during the session** (Forest, Tide, Focus To-Do all
  play rain/white-noise while you work, not just a chime at the end) -
  **rejected**. User plays their own music while working and finds a
  constant background sound impractical in an office environment. Not a
  gap worth closing for this user.
- **Body doubling** (Focusmate: a live partner watching you work) -
  **rejected outright** ("nahh"). Also would have required the same
  accounts+backend jump as push notifications/calendar for no clear payoff
  here.
- **Gamification** (Forest's tree-growing, streaks) - **interesting but
  parked**, not rejected. Concern: FocusPie's whole pitch is a clean, simple
  UI for a distractible audience - a streak counter or growing-tree widget
  risks becoming visual clutter/another thing to track rather than reducing
  cognitive load. If revisited, needs to earn its place without adding a
  permanent new UI element to the core `/pie-chart` or `/timer` screens.
- **Cross-device sync** - **confirmed as a real, known gap**, not new news.
  Everything is `localStorage` today (see "No accounts / no sync" in
  `ISSUES.md`), so nothing carries over between devices/browsers. This is
  also the one piece of infrastructure that would unlock Calendar
  integration, push notifications (Tier 3 above), and sync all at once -
  worth treating as the actual next architecture decision rather than three
  separate backend lifts, when it's time to scope it.
- **Where FocusPie already leads:** the pie-chart day-budget visualization
  (seeing the whole day as a proportional donut before starting) isn't
  something any of these competitors do - most are a list + a timer.
  Sunsama's daily-hour-limit is the closest equivalent and it's just a
  number, not a visual. Worth keeping in mind as the thing *not* to dilute
  while adding anything else.
