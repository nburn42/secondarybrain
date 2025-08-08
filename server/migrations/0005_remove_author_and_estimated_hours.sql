-- Migration: Remove author_name and estimated_hours from tasks table
ALTER TABLE tasks DROP COLUMN IF EXISTS author_name;
ALTER TABLE tasks DROP COLUMN IF EXISTS estimated_hours;