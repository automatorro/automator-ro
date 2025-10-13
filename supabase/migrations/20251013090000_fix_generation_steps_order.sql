-- Purpose: Align generation_steps order and dependencies with pedagogical logic
-- Objectives should be step 1 (no dependencies)
-- Agenda should be step 2 (depends on objectives)
-- Also realign existing course_materials step_order for consistency

BEGIN;

-- Temporarily move orders to avoid UNIQUE(step_order) conflicts
UPDATE public.generation_steps SET step_order = 100 WHERE step_name = 'objectives';
UPDATE public.generation_steps SET step_order = 200 WHERE step_name = 'agenda';

-- Set correct dependencies
UPDATE public.generation_steps SET dependencies = '{}'::text[] WHERE step_name = 'objectives';
UPDATE public.generation_steps SET dependencies = ARRAY['objectives']::text[] WHERE step_name = 'agenda';

-- Set final step_order
UPDATE public.generation_steps SET step_order = 1 WHERE step_name = 'objectives';
UPDATE public.generation_steps SET step_order = 2 WHERE step_name = 'agenda';

-- Optional: realign existing course materials to the corrected order
UPDATE public.course_materials SET step_order = 1 WHERE material_type = 'objectives' AND step_order <> 1;
UPDATE public.course_materials SET step_order = 2 WHERE material_type = 'agenda' AND step_order <> 2;
UPDATE public.course_materials SET step_order = 3 WHERE material_type = 'slides' AND step_order <> 3;
UPDATE public.course_materials SET step_order = 5 WHERE material_type = 'exercises' AND step_order <> 5;
UPDATE public.course_materials SET step_order = 6 WHERE material_type = 'manual' AND step_order <> 6;
UPDATE public.course_materials SET step_order = 7 WHERE material_type = 'tests' AND step_order <> 7;
UPDATE public.course_materials SET step_order = 8 WHERE material_type = 'resources' AND step_order <> 8;

COMMIT;

-- Verification (for manual use after migration):
-- SELECT step_name, step_order, dependencies FROM public.generation_steps ORDER BY step_order;
-- SELECT course_id, material_type, step_order, status FROM public.course_materials ORDER BY course_id, step_order;