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
