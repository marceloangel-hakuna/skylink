-- ─────────────────────────────────────────────────────────────────
-- Sky Crews tables
-- ─────────────────────────────────────────────────────────────────

create table public.crews (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text,
  icon        text default '✈️',
  created_by  uuid references auth.users(id) on delete set null,
  created_at  timestamptz default now()
);

create table public.crew_members (
  crew_id   uuid references public.crews(id) on delete cascade,
  user_id   uuid references auth.users(id) on delete cascade,
  role      text default 'member', -- 'admin' | 'member'
  joined_at timestamptz default now(),
  primary key (crew_id, user_id)
);

create table public.crew_posts (
  id         uuid primary key default gen_random_uuid(),
  crew_id    uuid references public.crews(id) on delete cascade,
  user_id    uuid references auth.users(id) on delete cascade,
  content    text not null,
  created_at timestamptz default now()
);

create table public.crew_post_likes (
  post_id    uuid references public.crew_posts(id) on delete cascade,
  user_id    uuid references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (post_id, user_id)
);

create table public.crew_events (
  id          uuid primary key default gen_random_uuid(),
  crew_id     uuid references public.crews(id) on delete cascade,
  title       text not null,
  description text,
  event_date  timestamptz not null,
  location    text,
  created_by  uuid references auth.users(id) on delete set null,
  created_at  timestamptz default now()
);

create table public.crew_event_rsvps (
  event_id   uuid references public.crew_events(id) on delete cascade,
  user_id    uuid references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (event_id, user_id)
);

-- ─────────────────────────────────────────────────────────────────
-- RLS
-- ─────────────────────────────────────────────────────────────────

alter table public.crews           enable row level security;
alter table public.crew_members    enable row level security;
alter table public.crew_posts      enable row level security;
alter table public.crew_post_likes enable row level security;
alter table public.crew_events     enable row level security;
alter table public.crew_event_rsvps enable row level security;

-- Read: any authenticated user
create policy "crews_select"            on public.crews            for select to authenticated using (true);
create policy "crew_members_select"     on public.crew_members     for select to authenticated using (true);
create policy "crew_posts_select"       on public.crew_posts       for select to authenticated using (true);
create policy "crew_post_likes_select"  on public.crew_post_likes  for select to authenticated using (true);
create policy "crew_events_select"      on public.crew_events      for select to authenticated using (true);
create policy "crew_event_rsvps_select" on public.crew_event_rsvps for select to authenticated using (true);

-- Write: own records only
create policy "crews_insert"             on public.crews             for insert to authenticated with check (auth.uid() = created_by);
create policy "crew_members_insert"      on public.crew_members      for insert to authenticated with check (auth.uid() = user_id);
create policy "crew_members_delete"      on public.crew_members      for delete to authenticated using (auth.uid() = user_id);
create policy "crew_posts_insert"        on public.crew_posts        for insert to authenticated with check (auth.uid() = user_id);
create policy "crew_post_likes_insert"   on public.crew_post_likes   for insert to authenticated with check (auth.uid() = user_id);
create policy "crew_post_likes_delete"   on public.crew_post_likes   for delete to authenticated using (auth.uid() = user_id);
create policy "crew_event_rsvps_insert"  on public.crew_event_rsvps  for insert to authenticated with check (auth.uid() = user_id);
create policy "crew_event_rsvps_delete"  on public.crew_event_rsvps  for delete to authenticated using (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────
-- Seed crews
-- ─────────────────────────────────────────────────────────────────

insert into public.crews (id, name, description, icon) values
  ('11111111-0000-0000-0000-000000000001', 'SFO ↔ NYC Weekly',    'For the coast-to-coast commuters who make the SFO-JFK run a second home. Share tips, meet on flights, and build your bicoastal network.',                                      '🗽'),
  ('11111111-0000-0000-0000-000000000002', 'AI Founders Circle',   'A curated group for founders building in the AI space. Share insights, swap war stories, and collaborate across the aisle at 35,000 feet.',                                       '🤖'),
  ('11111111-0000-0000-0000-000000000003', 'LatAm Tech Network',   'Connecting the brightest minds in Latin American technology. From São Paulo to Mexico City to Miami — we''re building the future together.',                                      '🌎');

-- Seed events
insert into public.crew_events (crew_id, title, description, event_date, location) values
  ('11111111-0000-0000-0000-000000000001', 'JFK Terminal 4 Happy Hour', 'Monthly meetup for SFO-NYC commuters. Delta Sky Club, Terminal 4. First drinks on us.',                      now() + interval '7 days',  'JFK · Delta Sky Club, Terminal 4'),
  ('11111111-0000-0000-0000-000000000002', 'AI Demo Night',             'Show your latest AI project. No decks, just working prototypes. Casual and fast-paced.',                    now() + interval '14 days', 'SFO · United Club, Terminal 3'),
  ('11111111-0000-0000-0000-000000000003', 'LatAm Founder Breakfast',   'Networking breakfast for LatAm founders traveling through Miami. English & Spanish welcome.',               now() + interval '10 days', 'MIA · Admirals Club');

-- Seed posts from the first real user
insert into public.crew_posts (crew_id, user_id, content, created_at)
select '11111111-0000-0000-0000-000000000001', id,
  'Just landed at JFK for the 47th time this year 😅 If you''re on AA 2317 this Friday, let''s share a cab to Manhattan!',
  now() - interval '2 hours' from auth.users limit 1;

insert into public.crew_posts (crew_id, user_id, content, created_at)
select '11111111-0000-0000-0000-000000000002', id,
  'My entire roadmap just changed overnight after the latest model releases. Who else is pivoting? Would love to sync with fellow AI founders. ✈️',
  now() - interval '5 hours' from auth.users limit 1;

insert into public.crew_posts (crew_id, user_id, content, created_at)
select '11111111-0000-0000-0000-000000000003', id,
  'Incredible to see so many LatAm founders on this flight to Miami. We''re building amazing things. 🌎🚀 DM me if you want to connect!',
  now() - interval '1 day' from auth.users limit 1;
