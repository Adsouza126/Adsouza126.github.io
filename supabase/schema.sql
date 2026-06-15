-- ════════════════════════════════════════════════════════════════════════
-- Rally — database schema
-- Run this in the Supabase SQL editor (or via `supabase db push`).
-- It is idempotent enough to re-run during development.
-- ════════════════════════════════════════════════════════════════════════

-- Extensions ---------------------------------------------------------------
create extension if not exists "pgcrypto";

-- ──────────────────────────────────────────────────────────────────────────
-- Reference data
-- ──────────────────────────────────────────────────────────────────────────

-- Colleges/universities. `email_domain` lets us softly check college emails.
create table if not exists public.colleges (
  id           uuid primary key default gen_random_uuid(),
  name         text not null unique,
  slug         text not null unique,
  email_domain text,
  created_at   timestamptz not null default now()
);

-- Sports offered on the platform. `positions` is optional per sport.
create table if not exists public.sports (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique,
  slug       text not null unique,
  icon       text,                       -- emoji for lightweight visuals
  positions  text[] not null default '{}',
  created_at timestamptz not null default now()
);

-- ──────────────────────────────────────────────────────────────────────────
-- Users
-- ──────────────────────────────────────────────────────────────────────────

-- Profile row mirrors an auth.users row 1:1.
create table if not exists public.profiles (
  id                uuid primary key references auth.users(id) on delete cascade,
  full_name         text,
  email             text,
  college           text,
  avatar_url        text,
  bio               text,
  campus_area       text,                 -- preferred location / campus area
  preferred_distance int default 5,       -- miles
  availability      jsonb not null default '{}'::jsonb, -- { Monday: ["Morning"], ... }
  reliability_score int not null default 100,
  onboarded         boolean not null default false,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- Sports a user plays, with skill level and optional position.
create table if not exists public.user_sports (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references public.profiles(id) on delete cascade,
  sport_id           uuid not null references public.sports(id) on delete cascade,
  skill_level        text not null default 'Casual'
                       check (skill_level in ('Beginner','Casual','Intermediate','Competitive')),
  preferred_position text,
  created_at         timestamptz not null default now(),
  unique (user_id, sport_id)
);

-- ──────────────────────────────────────────────────────────────────────────
-- Games
-- ──────────────────────────────────────────────────────────────────────────

create table if not exists public.games (
  id           uuid primary key default gen_random_uuid(),
  host_id      uuid not null references public.profiles(id) on delete cascade,
  sport_id     uuid not null references public.sports(id) on delete restrict,
  title        text,
  starts_at    timestamptz not null,
  location     text not null,
  campus_area  text,
  college      text,                       -- denormalized for fast filtering
  max_players  int not null default 10 check (max_players between 2 and 50),
  skill_target text not null default 'Any'
                 check (skill_target in ('Any','Beginner','Casual','Intermediate','Competitive')),
  competitive  boolean not null default false,
  is_public    boolean not null default true,
  description  text,
  auto_balance boolean not null default false,
  teams        jsonb,                       -- { A: [user_id...], B: [user_id...] }
  status       text not null default 'scheduled'
                 check (status in ('scheduled','completed','cancelled')),
  created_at   timestamptz not null default now()
);

create index if not exists games_sport_idx   on public.games (sport_id);
create index if not exists games_starts_idx   on public.games (starts_at);
create index if not exists games_college_idx  on public.games (college);

-- Roster — who has joined a game, and (after balancing) which team.
create table if not exists public.game_participants (
  id        uuid primary key default gen_random_uuid(),
  game_id   uuid not null references public.games(id) on delete cascade,
  user_id   uuid not null references public.profiles(id) on delete cascade,
  team      text check (team in ('A','B')),
  joined_at timestamptz not null default now(),
  unique (game_id, user_id)
);

-- ──────────────────────────────────────────────────────────────────────────
-- Communities (sport-based, per college)
-- ──────────────────────────────────────────────────────────────────────────

create table if not exists public.communities (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  college     text not null,
  sport_id    uuid not null references public.sports(id) on delete cascade,
  description text,
  created_at  timestamptz not null default now(),
  unique (college, sport_id)
);

create table if not exists public.community_members (
  id           uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities(id) on delete cascade,
  user_id      uuid not null references public.profiles(id) on delete cascade,
  joined_at    timestamptz not null default now(),
  unique (community_id, user_id)
);

-- ──────────────────────────────────────────────────────────────────────────
-- Messages — powers both game chat and community discussion.
-- Exactly one of game_id / community_id is set.
-- ──────────────────────────────────────────────────────────────────────────

create table if not exists public.messages (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  game_id      uuid references public.games(id) on delete cascade,
  community_id uuid references public.communities(id) on delete cascade,
  body         text not null,
  created_at   timestamptz not null default now(),
  check (
    (game_id is not null and community_id is null) or
    (game_id is null and community_id is not null)
  )
);

create index if not exists messages_game_idx      on public.messages (game_id, created_at);
create index if not exists messages_community_idx on public.messages (community_id, created_at);

-- ──────────────────────────────────────────────────────────────────────────
-- Attendance + reliability audit log
-- ──────────────────────────────────────────────────────────────────────────

create table if not exists public.attendance (
  id          uuid primary key default gen_random_uuid(),
  game_id     uuid not null references public.games(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  status      text not null check (status in ('attended','no_show')),
  recorded_by uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now(),
  unique (game_id, user_id)
);

create table if not exists public.reliability_logs (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  game_id    uuid references public.games(id) on delete set null,
  delta      int not null,
  reason     text not null,
  new_score  int not null,
  created_at timestamptz not null default now()
);

-- ──────────────────────────────────────────────────────────────────────────
-- New user → profile bootstrap
-- ──────────────────────────────────────────────────────────────────────────

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, college)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'college', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ──────────────────────────────────────────────────────────────────────────
-- Row Level Security
-- Rally is a community app: most data is readable by any signed-in user,
-- but writes are restricted to the owning user (or game host).
-- ──────────────────────────────────────────────────────────────────────────

alter table public.colleges          enable row level security;
alter table public.sports            enable row level security;
alter table public.profiles          enable row level security;
alter table public.user_sports       enable row level security;
alter table public.games             enable row level security;
alter table public.game_participants enable row level security;
alter table public.communities       enable row level security;
alter table public.community_members enable row level security;
alter table public.messages          enable row level security;
alter table public.attendance        enable row level security;
alter table public.reliability_logs  enable row level security;

-- Helper to (re)create a policy without erroring if it exists.
do $$ begin
  -- Reference data: readable by anyone.
  create policy "read colleges" on public.colleges for select using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "read sports" on public.sports for select using (true);
exception when duplicate_object then null; end $$;

-- Profiles: readable by all authenticated users; writable only by owner.
do $$ begin
  create policy "read profiles" on public.profiles for select using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "update own profile" on public.profiles for update
    using (auth.uid() = id) with check (auth.uid() = id);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "insert own profile" on public.profiles for insert
    with check (auth.uid() = id);
exception when duplicate_object then null; end $$;

-- User sports.
do $$ begin
  create policy "read user_sports" on public.user_sports for select using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "write own user_sports" on public.user_sports for all
    using (auth.uid() = user_id) with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

-- Games: public games readable by all; private games by host/participants.
do $$ begin
  create policy "read games" on public.games for select using (
    is_public
    or auth.uid() = host_id
    or exists (
      select 1 from public.game_participants gp
      where gp.game_id = games.id and gp.user_id = auth.uid()
    )
  );
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "insert games" on public.games for insert
    with check (auth.uid() = host_id);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "host updates games" on public.games for update
    using (auth.uid() = host_id) with check (auth.uid() = host_id);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "host deletes games" on public.games for delete
    using (auth.uid() = host_id);
exception when duplicate_object then null; end $$;

-- Participants.
do $$ begin
  create policy "read participants" on public.game_participants for select using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "join games" on public.game_participants for insert
    with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;
do $$ begin
  -- A user can leave; the host can manage the roster (e.g. team assignment).
  create policy "manage participants" on public.game_participants for update
    using (
      auth.uid() = user_id
      or exists (select 1 from public.games g where g.id = game_id and g.host_id = auth.uid())
    );
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "leave games" on public.game_participants for delete
    using (
      auth.uid() = user_id
      or exists (select 1 from public.games g where g.id = game_id and g.host_id = auth.uid())
    );
exception when duplicate_object then null; end $$;

-- Communities.
do $$ begin
  create policy "read communities" on public.communities for select using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "read community_members" on public.community_members for select using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "join communities" on public.community_members for insert
    with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "leave communities" on public.community_members for delete
    using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

-- Messages: readable by all signed-in users; authored by the sender.
do $$ begin
  create policy "read messages" on public.messages for select using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "send messages" on public.messages for insert
    with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "delete own messages" on public.messages for delete
    using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

-- Attendance: only the host can record it; everyone can read.
do $$ begin
  create policy "read attendance" on public.attendance for select using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "host records attendance" on public.attendance for all
    using (exists (select 1 from public.games g where g.id = game_id and g.host_id = auth.uid()))
    with check (exists (select 1 from public.games g where g.id = game_id and g.host_id = auth.uid()));
exception when duplicate_object then null; end $$;

-- Reliability logs: readable by all; inserts happen via server actions.
do $$ begin
  create policy "read reliability_logs" on public.reliability_logs for select using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "insert reliability_logs" on public.reliability_logs for insert
    with check (true);
exception when duplicate_object then null; end $$;
