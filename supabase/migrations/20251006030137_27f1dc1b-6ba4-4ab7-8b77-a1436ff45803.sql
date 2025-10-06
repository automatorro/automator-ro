-- Update generation_steps with new detailed prompts
-- Note: The actual prompts are now in the edge function code
-- This migration just ensures the table structure supports the new system

-- Update existing steps to mark them for reference
UPDATE generation_steps 
SET description = 'Legacy prompt - new prompts are in edge function'
WHERE is_active = true;

-- Add a column for storing validation metadata if needed
ALTER TABLE course_materials 
ADD COLUMN IF NOT EXISTS pedagogical_metadata jsonb DEFAULT '{}'::jsonb;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_course_materials_pedagogical_metadata 
ON course_materials USING gin(pedagogical_metadata);

-- Update generation_pipelines to support new validation states
ALTER TABLE generation_pipelines 
ADD COLUMN IF NOT EXISTS validation_level text DEFAULT 'PASS';

ALTER TABLE generation_pipelines 
ADD COLUMN IF NOT EXISTS validation_warnings text[] DEFAULT '{}'::text[];

-- Comment explaining the new system
COMMENT ON COLUMN course_materials.pedagogical_metadata IS 'Stores Bloom taxonomy levels, Merrill principles coverage, and other pedagogical validation data from AI generation';

COMMENT ON COLUMN generation_pipelines.validation_level IS 'Validation result: PASS, WARNING, or CRITICAL';

COMMENT ON COLUMN generation_pipelines.validation_warnings IS 'List of validation warnings from pedagogical checks';