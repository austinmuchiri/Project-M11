-- Migration: add hardware_id column to devices
-- Stores the first non-loopback MAC address of the laptop so caregivers
-- can visually verify they paired the correct physical machine.

alter table devices add column if not exists hardware_id text;
