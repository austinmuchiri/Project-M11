
-- Migration: add date_of_birth to kids table
-- date_of_birth replaces the manually-entered age column as the source of truth.
-- The app computes age at read-time via calcAge(); the age column is kept for
-- backward-compat and updated automatically on write.

alter table kids add column if not exists date_of_birth date;
