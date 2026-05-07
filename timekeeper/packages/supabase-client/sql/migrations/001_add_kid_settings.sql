-- Migration: add kid_settings table
-- Stores per-kid notification and focus preferences.
-- Previously these were only in client-side state (never persisted),
-- causing all settings including miss_threshold to reset on reload.

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

alter table kid_settings enable row level security;

create policy "kid_settings: owner" on kid_settings
for all using (tk_owns_kid(kid_id)) with check (tk_owns_kid(kid_id));
