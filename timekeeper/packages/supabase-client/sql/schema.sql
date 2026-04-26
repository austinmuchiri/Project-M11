-- TimeKeeper Supabase schema
-- Apply with: supabase db push  (or paste into the SQL editor)

create table if not exists kids (
  id          text primary key,
  user_id     uuid references auth.users(id) on delete cascade,
  name        text not null,
  age         int,
  initials    text,
  avatar_color text default '#C99466',
  created_at  timestamptz default now()
);

create table if not exists routines (
  id           text primary key,
  kid_id       text references kids(id) on delete cascade,
  name         text not null,
  tasks        jsonb not null default '[]'::jsonb,
  days_of_week int[] not null default '{}',
  start_time   text not null,
  active       boolean not null default true,
  created_at   timestamptz default now()
);

create table if not exists task_events (
  id          uuid primary key default gen_random_uuid(),
  kid_id      text references kids(id) on delete cascade,
  routine_id  text not null,
  task_id     text not null,
  status      text not null check (status in ('started','done','missed','skipped','retry','paused')),
  source      text not null check (source in ('watch','phone','laptop','system')),
  ts          bigint not null,
  duration_ms bigint
);
create index if not exists task_events_kid_ts_idx on task_events (kid_id, ts desc);

create table if not exists devices (
  id          text primary key,
  kid_id      text references kids(id) on delete cascade,
  kind        text not null check (kind in ('watch','laptop','phone')),
  label       text not null,
  battery     int,
  last_seen   bigint,
  fw_version  text,
  paired      boolean not null default false
);

create table if not exists alerts (
  id      text primary key,
  kid_id  text references kids(id) on delete cascade,
  kind    text not null check (kind in ('miss-streak','reward','device','compliance')),
  title   text not null,
  body    text not null,
  ts      bigint not null,
  read    boolean not null default false
);

create table if not exists laptop_heartbeat (
  id            uuid primary key default gen_random_uuid(),
  device_id     text references devices(id) on delete cascade,
  kid_id        text references kids(id) on delete cascade,
  ts            bigint not null,
  focus         jsonb,
  idle_sec      int not null default 0,
  locked        boolean not null default false,
  audio_active  boolean not null default false
);
create index if not exists heartbeat_kid_ts_idx on laptop_heartbeat (kid_id, ts desc);

create table if not exists nudges (
  id            uuid primary key default gen_random_uuid(),
  kid_id        text references kids(id) on delete cascade,
  message       text not null,
  tone          text not null check (tone in ('praise','start','break','reminder','custom')),
  sent_at       bigint not null,
  acknowledged  boolean not null default false
);

-- Realtime publications
alter publication supabase_realtime add table task_events;
alter publication supabase_realtime add table laptop_heartbeat;
alter publication supabase_realtime add table nudges;
alter publication supabase_realtime add table alerts;

-- Row-level security: caregiver owns the kid
alter table kids               enable row level security;
alter table routines           enable row level security;
alter table task_events        enable row level security;
alter table devices            enable row level security;
alter table alerts             enable row level security;
alter table laptop_heartbeat   enable row level security;
alter table nudges             enable row level security;

create policy "kids: owner reads"      on kids
  for select using (user_id = auth.uid());
create policy "kids: owner writes"     on kids
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Helper: kid belongs to current user
create or replace function tk_owns_kid(kid text) returns boolean
  language sql stable as $$
    select exists (select 1 from kids where id = kid and user_id = auth.uid())
$$;

create policy "routines: owner"        on routines
  for all using (tk_owns_kid(kid_id))   with check (tk_owns_kid(kid_id));
create policy "task_events: owner"     on task_events
  for all using (tk_owns_kid(kid_id))   with check (tk_owns_kid(kid_id));
create policy "devices: owner"         on devices
  for all using (tk_owns_kid(kid_id))   with check (tk_owns_kid(kid_id));
create policy "alerts: owner"          on alerts
  for all using (tk_owns_kid(kid_id))   with check (tk_owns_kid(kid_id));
create policy "heartbeat: owner"       on laptop_heartbeat
  for all using (tk_owns_kid(kid_id))   with check (tk_owns_kid(kid_id));
create policy "nudges: owner"          on nudges
  for all using (tk_owns_kid(kid_id))   with check (tk_owns_kid(kid_id));
