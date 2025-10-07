-- Add participant_type column to courses table
ALTER TABLE courses 
ADD COLUMN IF NOT EXISTS participant_type text NULL;

-- Add RLS policies for users to UPDATE their own course materials
CREATE POLICY "Users can update their own materials"
ON course_materials
FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM courses 
  WHERE courses.id = course_materials.course_id 
  AND courses.user_id = auth.uid()
));

-- Add comment for documentation
COMMENT ON COLUMN courses.participant_type IS 'Target participant type based on environment: specialists/middle-management/top-management for corporate, or elevi/studenti/profesori for academic';