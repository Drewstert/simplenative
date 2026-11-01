create table if not exists public.game_saves (
  user_id uuid primary key references auth.users(id) on delete cascade,
  username text not null default 'Anonymous',
  rings numeric not null default 0,
  red_rings numeric not null default 0,
  upgrade numeric not null default 0,
  upgrade_mult numeric not null default 1,
  base_mult numeric not null default 1,
  rings_per_second numeric not null default 0,
  red_drop numeric not null default 2,
  rng_red numeric not null default 20,
  click_red_rate numeric not null default 0,
  tick_speed integer not null default 1000,
  time_stones integer not null default 0,
  time_price numeric not null default 100,
  rebirths integer not null default 0,
  selected_zone text,
  super_mult numeric not null default 1,
  updated_at timestamptz not null default now()
);

alter table public.game_saves drop column if exists game_state;
alter table public.game_saves drop column if exists red_upgrades;
alter table public.game_saves drop column if exists owned_characters;
alter table public.game_saves drop column if exists active_upgrade_costs;

create table if not exists public.active_upgrades (
  user_id uuid not null references public.game_saves(user_id) on delete cascade,
  upgrade_name text not null,
  level integer not null default 0,
  primary key (user_id, upgrade_name)
);

create table if not exists public.red_upgrades (
  user_id uuid not null references public.game_saves(user_id) on delete cascade,
  upgrade_key text not null,
  price numeric not null,
  level integer,
  stock integer,
  primary key (user_id, upgrade_key)
);

create table if not exists public.owned_characters (
  user_id uuid not null references public.game_saves(user_id) on delete cascade,
  character_name text not null,
  color text not null,
  count integer not null default 0,
  cost numeric not null,
  gain numeric not null,
  primary key (user_id, character_name)
);

create table if not exists public.active_upgrade_costs (
  user_id uuid not null references public.game_saves(user_id) on delete cascade,
  upgrade_name text not null,
  cost numeric not null,
  primary key (user_id, upgrade_name)
);

alter table public.game_saves enable row level security;
alter table public.active_upgrades enable row level security;
alter table public.red_upgrades enable row level security;
alter table public.owned_characters enable row level security;
alter table public.active_upgrade_costs enable row level security;

drop policy if exists "Users can manage their own game save" on public.game_saves;
create policy "Users can manage their own game save"
on public.game_saves for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can manage their own active upgrades" on public.active_upgrades;
create policy "Users can manage their own active upgrades"
on public.active_upgrades for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can manage their own red upgrades" on public.red_upgrades;
create policy "Users can manage their own red upgrades"
on public.red_upgrades for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can manage their own owned characters" on public.owned_characters;
create policy "Users can manage their own owned characters"
on public.owned_characters for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can manage their own active upgrade costs" on public.active_upgrade_costs;
create policy "Users can manage their own active upgrade costs"
on public.active_upgrade_costs for all to authenticated
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

drop policy if exists "Anyone can read the leaderboard" on public.leaderboard;
create policy "Anyone can read the leaderboard"
on public.leaderboard for select to anon, authenticated
using (true);

drop policy if exists "Users can insert their own leaderboard row" on public.leaderboard;
create policy "Users can insert their own leaderboard row"
on public.leaderboard for insert to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own leaderboard row" on public.leaderboard;
create policy "Users can update their own leaderboard row"
on public.leaderboard for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
