-- FocusPie Supabase schema
-- Run each section in the Supabase SQL Editor (Project > SQL Editor > New query).
-- Kept in the repo so the schema's history/reasoning lives alongside the code
-- that depends on it, not just in the Supabase dashboard.

-- === Tasks =================================================================
-- Mirrors the shape of types/task.ts's Task interface. Row Level Security
-- means every policy is scoped to auth.uid() = user_id, so a user can only
-- ever see or modify their own rows - enforced by Postgres itself, not by
-- anything the client claims.

create table if not exists public.tasks (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  goal_time_minutes integer not null,
  progress_minutes integer not null default 0,
  chart_index integer not null,
  is_priority boolean not null default false,
  notes jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.tasks enable row level security;

create policy "Users can view their own tasks"
  on public.tasks for select
  using (auth.uid() = user_id);

create policy "Users can insert their own tasks"
  on public.tasks for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own tasks"
  on public.tasks for update
  using (auth.uid() = user_id);

create policy "Users can delete their own tasks"
  on public.tasks for delete
  using (auth.uid() = user_id);

create index if not exists tasks_user_id_idx on public.tasks(user_id);

-- === User settings =========================================================
-- One row per user, shared by two separate React contexts (SettingsContext:
-- workday_hours/use_monochrome_chart/sound_enabled, TimerContext: the
-- pomodoro/break durations + auto_pause_enabled). Each context only ever
-- upserts the columns it owns - Postgres's ON CONFLICT DO UPDATE only
-- touches the columns present in that specific write, so the two contexts
-- can't clobber each other's data even though they share one row.

create table if not exists public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  workday_hours integer not null default 8,
  use_monochrome_chart boolean not null default false,
  sound_enabled boolean not null default true,
  pomodoro_seconds integer not null default 1500,
  short_break_seconds integer not null default 300,
  long_break_seconds integer not null default 900,
  pomodoros_until_long_break integer not null default 4,
  auto_pause_enabled boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.user_settings enable row level security;

create policy "Users can view their own settings"
  on public.user_settings for select
  using (auth.uid() = user_id);

create policy "Users can insert their own settings"
  on public.user_settings for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own settings"
  on public.user_settings for update
  using (auth.uid() = user_id);

-- === Calendar import ========================================================
-- source_uid ties a task back to the ICS event it was imported from (the
-- ICS format's own UID field), so re-syncing updates that same task instead
-- of creating a duplicate every time. NULL for ordinary, manually-created
-- tasks - this column means nothing to them.
alter table public.tasks add column if not exists source_uid text;
create unique index if not exists tasks_user_source_uid_idx
  on public.tasks(user_id, source_uid)
  where source_uid is not null;

-- Where a signed-in user's saved calendar feed URL lives - added to
-- user_settings rather than a new table since it's a single value per user,
-- same shape as everything else already in that row.
alter table public.user_settings add column if not exists calendar_ics_url text;

-- Which day a task belongs to. Manually-created tasks always get today
-- (the app has no UI for planning a future day directly); calendar imports
-- get the event's own date, which is the whole point of this column - it's
-- what lets an imported event silently wait until its real day arrives
-- instead of cluttering today's plan the moment it's synced. Defaults to
-- today for safety (e.g. a future direct-insert missing the column), though
-- the app itself always sets it explicitly.
alter table public.tasks add column if not exists date date not null default current_date;

-- When the user last successfully clicked "Sync calendar" - shown on the
-- Calendar page so they know how stale their imported tasks might be.
alter table public.user_settings add column if not exists calendar_last_synced_at timestamptz;

-- === Task reminders (start time + push) ====================================
-- Optional time-of-day a task should trigger a push reminder. Paired with
-- the task's own `date` column (already local, no timezone) - the reminder
-- fires once `date` + `start_time`, interpreted in the *user's* stored
-- timezone (see user_settings.timezone below), has just passed.
alter table public.tasks add column if not exists start_time time;

-- reminder_sent_at is audit/debug only (when it actually fired, if ever).
-- reminder_last_sent_for stores *which* start_time it fired for, which is
-- what the due-query below actually guards on - editing a task's start_time
-- makes reminder_last_sent_for <> start_time true again automatically, so a
-- rescheduled task becomes eligible for a fresh reminder with zero
-- client-side code having to remember to reset anything.
alter table public.tasks add column if not exists reminder_sent_at timestamptz;
alter table public.tasks add column if not exists reminder_last_sent_for time;

-- IANA timezone (e.g. "Europe/London"), captured automatically from the
-- browser every session - never a manual field, never restored from a prior
-- sync (a stale value from an old device/DST state would be worse than
-- none). Needed so the reminder cron below can correctly turn a task's local
-- date+start_time into an absolute instant to compare against. Nullable: a
-- user who hasn't opened the app since this shipped simply gets no
-- reminders yet - safe default, no wrong-time sends from a guessed zone.
alter table public.user_settings add column if not exists timezone text;

-- One row per subscribed device/browser (a user can have several: phone +
-- laptop) - not folded into user_settings, since it's inherently per-device,
-- not a single account-wide preference. endpoint is the Push API's own
-- unique identifier for that device+browser's subscription.
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

alter table public.push_subscriptions enable row level security;

create policy "Users can view their own push subscriptions"
  on public.push_subscriptions for select
  using (auth.uid() = user_id);

create policy "Users can insert their own push subscriptions"
  on public.push_subscriptions for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own push subscriptions"
  on public.push_subscriptions for delete
  using (auth.uid() = user_id);

-- The reminder cron (below) has no per-user JWT, so it needs to see across
-- ALL users' tasks/settings/subscriptions - this function does that
-- timezone-aware matching in one place using Postgres's own IANA/DST
-- handling (`at time zone`) rather than reimplementing it in Deno/JS.
-- SECURITY: Postgres grants EXECUTE on new functions to PUBLIC by default,
-- which PostgREST would otherwise expose as a callable RPC to any signed-in
-- user - since this returns every user's task names and reminder times,
-- EXECUTE is explicitly revoked below and granted only to service_role (the
-- role the send-task-reminders Edge Function uses).
create or replace function public.due_task_reminders()
returns table (
  task_id uuid,
  user_id uuid,
  task_name text,
  task_start_time time,
  endpoint text,
  p256dh text,
  auth text
)
language sql
security invoker
as $$
  select t.id, t.user_id, t.name, t.start_time, ps.endpoint, ps.p256dh, ps.auth
  from public.tasks t
  join public.user_settings us on us.user_id = t.user_id
  left join public.push_subscriptions ps on ps.user_id = t.user_id
  where t.start_time is not null
    and us.timezone is not null
    and (t.reminder_last_sent_for is null or t.reminder_last_sent_for <> t.start_time)
    and (now() at time zone us.timezone)::date = t.date
    and (now() at time zone us.timezone)::time >= t.start_time
    and (now() at time zone us.timezone)::time < t.start_time + interval '3 minutes';
$$;

revoke all on function public.due_task_reminders() from public, anon, authenticated;
grant execute on function public.due_task_reminders() to service_role;

-- === Scheduled delivery =====================================================
-- pg_cron fires every minute; pg_net makes the actual HTTP call to the Edge
-- Function. The function checks a shared secret (x-cron-secret header, NOT
-- the service-role key - this schema.sql file is committed to the repo, and
-- cron.job's stored SQL is visible to anyone with DB access, so the actual
-- secret value lives in Supabase Vault, referenced by name here, never
-- inlined). One-time setup this SQL assumes has already been run manually
-- (NOT committed anywhere, since it contains a real secret value):
--   select vault.create_secret('<a random 32+ char value>', 'task_reminders_cron_secret');
-- and a matching `supabase secrets set CRON_SECRET=<same value>` for the
-- send-task-reminders function to check against.
create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.schedule(
  'send-task-reminders-every-minute',
  '* * * * *',
  $$
  select net.http_post(
    url := 'https://hsbuiciohnefbfkhlgsg.supabase.co/functions/v1/send-task-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'task_reminders_cron_secret')
    ),
    body := '{}'::jsonb
  );
  $$
);
