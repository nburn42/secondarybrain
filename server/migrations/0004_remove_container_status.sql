-- Migration: Remove status column from containers table
-- Date: 2025-01-08
-- Description: Remove the status column as we now fetch live status directly from Kubernetes

ALTER TABLE containers DROP COLUMN IF EXISTS status;