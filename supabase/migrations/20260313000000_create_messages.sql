-- ─── Messages table ──────────────────────────────────────────────────────────
-- Run this in your Supabase project → SQL Editor

create table if not exists public.messages (
  id          uuid        primary key default gen_random_uuid(),
  sender_id   uuid        not null references auth.users(id) on delete cascade,
  receiver_id uuid        not null references auth.users(id) on delete cascade,
  content     text        not null,
  created_at  timestamptz not null default now(),
  read_at     timestamptz
);

-- Full row data sent on Realtime events (required for postgres_changes)
alter table public.messages replica identity full;

-- ─── Row-level security ───────────────────────────────────────────────────────

alter table public.messages enable row level security;

-- Users can read messages they sent or received
create policy "Users can read own messages"
  on public.messages for select
  using (auth.uid() = sender_id or auth.uid() = receiver_id);

-- Users can only insert messages as themselves
create policy "Users can send messages"
  on public.messages for insert
  with check (auth.uid() = sender_id);

-- Users can mark received messages as read (update read_at only)
create policy "Users can mark received messages as read"
  on public.messages for update
  using (auth.uid() = receiver_id);

-- ─── Indexes ─────────────────────────────────────────────────────────────────

create index if not exists messages_sender_idx   on public.messages (sender_id,   created_at desc);
create index if not exists messages_receiver_idx on public.messages (receiver_id, created_at desc);

-- ─── Realtime ────────────────────────────────────────────────────────────────
-- Enable Realtime on this table so postgres_changes subscriptions work

alter publication supabase_realtime add table public.messages;
