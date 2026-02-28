-- Besh personal-assistant core schema
-- Run on new Supabase project

create table if not exists besh_users (
  id uuid primary key default gen_random_uuid(),
  phone text unique not null,
  display_name text,
  timezone text default 'UTC',
  onboarding_stage text default 'ask_name',
  onboarding_complete boolean default false,
  profile_json jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists besh_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references besh_users(id) on delete cascade,
  direction text not null check (direction in ('inbound','outbound')),
  channel text not null default 'sms',
  content text not null,
  meta_json jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create table if not exists besh_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references besh_users(id) on delete cascade,
  title text not null,
  status text not null default 'active' check (status in ('active','paused','done')),
  cadence text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists besh_reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references besh_users(id) on delete cascade,
  goal_id uuid references besh_goals(id) on delete set null,
  text text not null,
  schedule_json jsonb default '{}'::jsonb,
  next_fire_at timestamptz,
  active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_besh_conversations_user_created on besh_conversations(user_id, created_at desc);
create index if not exists idx_besh_goals_user_status on besh_goals(user_id, status);
create index if not exists idx_besh_reminders_user_next_fire on besh_reminders(user_id, next_fire_at);
