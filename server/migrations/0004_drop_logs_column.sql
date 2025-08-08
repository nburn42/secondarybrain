-- Migration: Drop logs column from containers table
ALTER TABLE containers DROP COLUMN IF EXISTS logs;