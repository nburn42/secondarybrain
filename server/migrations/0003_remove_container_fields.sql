-- Remove unnecessary fields from containers table
ALTER TABLE containers 
  DROP COLUMN IF EXISTS name,
  DROP COLUMN IF EXISTS image_tag,
  DROP COLUMN IF EXISTS task_id,
  DROP COLUMN IF EXISTS logs;