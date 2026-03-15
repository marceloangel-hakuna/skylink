-- ── Connections table (idempotent) ──────────────────────────────────────────

create table if not exists public.connections (
  id           uuid primary key default gen_random_uuid(),
  requester_id uuid not null references auth.users(id) on delete cascade,
  receiver_id  uuid not null references auth.users(id) on delete cascade,
  status       text not null default 'pending'
               check (status in ('pending','accepted','declined')),
  met_on_flight text,
  tags          text[]   default '{}',
  notes         text,
  message       text,
  created_at    timestamptz not null default now(),
  unique(requester_id, receiver_id)
);

-- ── RLS ─────────────────────────────────────────────────────────────────────

alter table public.connections enable row level security;

-- Users can see connections they're part of
drop policy if exists "connections_select" on public.connections;
create policy "connections_select" on public.connections
  for select using (
    auth.uid() = requester_id or auth.uid() = receiver_id
  );

-- Users can send connection requests (insert where they are the requester)
drop policy if exists "connections_insert" on public.connections;
create policy "connections_insert" on public.connections
  for insert with check (auth.uid() = requester_id);

-- Receiver can accept/decline; requester can update tags/notes
drop policy if exists "connections_update" on public.connections;
create policy "connections_update" on public.connections
  for update using (
    auth.uid() = receiver_id or auth.uid() = requester_id
  );

-- Either party can delete
drop policy if exists "connections_delete" on public.connections;
create policy "connections_delete" on public.connections
  for delete using (
    auth.uid() = requester_id or auth.uid() = receiver_id
  );

-- ── Profiles: readable by all authenticated users ───────────────────────────

alter table public.profiles enable row level security;

drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles
  for select using (auth.role() = 'authenticated');

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);
