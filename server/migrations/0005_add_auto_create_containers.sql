-- Migration: Add auto_create_containers column to projects table
-- Date: 2025-01-08
-- Description: Add a boolean flag to enable automatic container creation when tasks are available

ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS auto_create_containers BOOLEAN NOT NULL DEFAULT false;