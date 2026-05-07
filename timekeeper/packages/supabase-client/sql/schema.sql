drop table alerts cascade;
drop table devices cascade;
drop table kids cascade;
drop table laptop_heartbeat cascade;
drop table nudges cascade;
drop table task_events cascade;
drop table routines cascade;
drop table block_commands cascade;
drop table tasks cascade;
-- =========================
-- CORE ENTITIES
-- =========================

create table if not exists kids (
  id            text primary key,
  user_id       uuid references auth.users(id) on delete cascade,
  name          text not null,
  age           int,
  initials      text,
  avatar_color  text default '#C99466',
  created_at    timestamptz default now()
);

create table if not exists routines (
  id            text primary key,
  kid_id        text references kids(id) on delete cascade,
  name          text not null,
  active        boolean not null default true,
  created_at    timestamptz default now()
);

--  NEW: TASKS TABLE
create table if not exists tasks (
  id                text primary key,
  routine_id        text references routines(id) on delete cascade,
  kid_id            text references kids(id) on delete cascade,
  label             text not null,
  icon              text,
  scheduled_time    text not null,
  expected_minutes  int,
  reward_stars      int default 1,
  position          int default 0, -- ordering within routine
  created_at        timestamptz default now()
);

-- =========================
-- EVENTS & ANALYTICS
-- =========================

create table if not exists task_events (
  id          uuid primary key default gen_random_uuid(),
  kid_id      text references kids(id) on delete cascade,
  routine_id  text references routines(id) on delete cascade,
  task_id     text references tasks(id) on delete cascade,
  status      text not null check (status in ('started','done','missed','skipped','retry','paused')),
  source      text not null check (source in ('watch','phone','laptop','system')),
  ts          bigint not null,
  duration_ms bigint
);

create index if not exists task_events_kid_ts_idx 
on task_events (kid_id, ts desc);

-- =========================
-- DEVICES
-- =========================

create table if not exists devices (
  id           text primary key,
  kid_id       text references kids(id) on delete cascade,
  kind         text not null check (kind in ('watch','laptop','phone')),
  label        text not null,
  battery      int,
  last_seen    bigint,
  fw_version   text,
  hardware_id  text,
  paired       boolean not null default false
);

-- =========================
-- ALERTS & NUDGES
-- =========================

create table if not exists alerts (
  id      text primary key,
  kid_id  text references kids(id) on delete cascade,
  kind    text not null check (kind in ('miss-streak','reward','device','compliance')),
  title   text not null,
  body    text not null,
  ts      bigint not null,
  read    boolean not null default false
);

create table if not exists nudges (
  id            uuid primary key default gen_random_uuid(),
  kid_id        text references kids(id) on delete cascade,
  message       text not null,
  tone          text not null check (tone in ('praise','start','break','reminder','custom')),
  sent_at       bigint not null,
  acknowledged  boolean not null default false
);

-- =========================
-- LAPTOP TELEMETRY
-- =========================

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

create index if not exists heartbeat_kid_ts_idx 
on laptop_heartbeat (kid_id, ts desc);

-- =========================
-- BLOCK COMMANDS
-- =========================

create table if not exists block_commands (
  id          uuid primary key default gen_random_uuid(),
  kid_id      text references kids(id) on delete cascade,
  device_id   text references devices(id),
  action      text not null check (action in ('lock_screen','unlock_screen','block_app','unblock_app')),
  payload     jsonb,
  expires_at  bigint,
  created_at  bigint not null
);

create index if not exists block_commands_kid_ts_idx 
on block_commands (kid_id, created_at desc);

-- =========================
-- KID SETTINGS
-- =========================

create table if not exists kid_settings (
  kid_id          text primary key references kids(id) on delete cascade,
  miss_threshold  int not null default 3,
  quiet_hours     boolean not null default true,
  quiet_start     text not null default '21:00',
  quiet_end       text not null default '07:00',
  lock_on_task    boolean not null default false,
  block_games     boolean not null default false,
  updated_at      timestamptz default now()
);

-- =========================
-- REALTIME
-- =========================

alter publication supabase_realtime add table task_events;
alter publication supabase_realtime add table laptop_heartbeat;
alter publication supabase_realtime add table nudges;
alter publication supabase_realtime add table alerts;
alter publication supabase_realtime add table block_commands;
alter publication supabase_realtime add table tasks;

-- =========================
-- ROW LEVEL SECURITY
-- =========================

alter table kids enable row level security;
alter table routines enable row level security;
alter table tasks enable row level security;
alter table task_events enable row level security;
alter table devices enable row level security;
alter table alerts enable row level security;
alter table laptop_heartbeat enable row level security;
alter table nudges enable row level security;
alter table block_commands enable row level security;
alter table kid_settings enable row level security;

-- ownership helper
create or replace function tk_owns_kid(kid text)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from kids
    where kids.id = kid
      and user_id = auth.uid()
  );
$$;

-- policies
create policy "kids: owner" on kids
for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "routines: owner" on routines
for all using (tk_owns_kid(kid_id)) with check (tk_owns_kid(kid_id));

create policy "tasks: owner" on tasks
for all using (tk_owns_kid(kid_id)) with check (tk_owns_kid(kid_id));

create policy "task_events: owner" on task_events
for all using (tk_owns_kid(kid_id)) with check (tk_owns_kid(kid_id));

create policy "devices: owner" on devices
for all using (tk_owns_kid(kid_id)) with check (tk_owns_kid(kid_id));

create policy "alerts: owner" on alerts
for all using (tk_owns_kid(kid_id)) with check (tk_owns_kid(kid_id));

create policy "heartbeat: owner" on laptop_heartbeat
for all using (tk_owns_kid(kid_id)) with check (tk_owns_kid(kid_id));

create policy "nudges: owner" on nudges
for all using (tk_owns_kid(kid_id)) with check (tk_owns_kid(kid_id));

create policy "block_commands: owner" on block_commands
for all using (tk_owns_kid(kid_id)) with check (tk_owns_kid(kid_id));

create policy "kid_settings: owner" on kid_settings
for all using (tk_owns_kid(kid_id)) with check (tk_owns_kid(kid_id));