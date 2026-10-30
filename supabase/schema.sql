create table if not exists public.game_saves (
  user_id uuid primary key references auth.users(id) on delete cascade,
  username text not null default 'Anonymous',
  rings numeric not null default 0,
  red_rings numeric not null default 0,
  upgrade integer not null default 0,
  upgrade_mult numeric not null default 1,
  rings_per_second numeric not null default 0,
  time_stones integer not null default 0,
  rebirths integer not null default 0,
  game_state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.game_saves enable row level security;

create policy "Users can read their own game save"
on public.game_saves for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can insert their own game save"
on public.game_saves for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update their own game save"
on public.game_saves for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create table if not exists public.leaderboard (
  user_id uuid primary key references auth.users(id) on delete cascade,
  username text not null default 'Anonymous',
  rings numeric not null default 0,
  rebirths integer not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.leaderboard enable row level security;

create policy "Anyone can read the leaderboard"
on public.leaderboard for select
to anon, authenticated
using (true);

create policy "Users can insert their own leaderboard row"
on public.leaderboard for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update their own leaderboard row"
on public.leaderboard for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
