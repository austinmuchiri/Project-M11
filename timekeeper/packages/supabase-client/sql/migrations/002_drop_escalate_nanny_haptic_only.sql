-- Migration: remove escalate_nanny and haptic_only from kid_settings
-- These settings were removed from the UI and are no longer read or written.

alter table kid_settings drop column if exists escalate_nanny;
alter table kid_settings drop column if exists haptic_only;
