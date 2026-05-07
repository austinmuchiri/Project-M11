-- Migration: add request_unlock and extend_time to block_commands action constraint
-- request_unlock: laptop → caregiver (child requesting unlock approval)
-- extend_time:    caregiver → laptop (grant N more seconds on the lock screen)

do $$
declare
  cname text;
begin
  -- Locate the auto-generated check constraint on the action column
  select conname into cname
  from pg_constraint
  where conrelid = 'block_commands'::regclass
    and contype = 'c'
    and pg_get_constraintdef(oid) like '%lock_screen%';

  if cname is not null then
    execute 'alter table block_commands drop constraint ' || quote_ident(cname);
  end if;
end $$;

alter table block_commands
  add constraint block_commands_action_check
  check (action in (
    'lock_screen', 'unlock_screen', 'block_app', 'unblock_app',
    'request_unlock', 'extend_time'
  ));
