-- Add columns to support interactive editing workflow
ALTER TABLE public.course_materials 
ADD COLUMN IF NOT EXISTS approved_content TEXT,
ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
ADD COLUMN IF NOT EXISTS edited_at TIMESTAMP WITH TIME ZONE;

-- Add material versions table for tracking edits
CREATE TABLE IF NOT EXISTS public.material_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id UUID NOT NULL REFERENCES public.course_materials(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL DEFAULT 1,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS on material_versions
ALTER TABLE public.material_versions ENABLE ROW LEVEL SECURITY;

-- Create policy for material versions
CREATE POLICY "Users can manage versions of their materials" 
ON public.material_versions 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.course_materials cm
    JOIN public.courses c ON c.id = cm.course_id
    WHERE cm.id = material_versions.material_id 
    AND c.user_id = auth.uid()
  )
);

-- Update generation_pipelines to support step-by-step generation
ALTER TABLE public.generation_pipelines
ADD COLUMN IF NOT EXISTS current_material_id UUID REFERENCES public.course_materials(id),
ADD COLUMN IF NOT EXISTS waiting_for_approval BOOLEAN DEFAULT false;