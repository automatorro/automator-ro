-- Clean up duplicate views/tables first
DROP VIEW IF EXISTS stripe_user_orders;
DROP VIEW IF EXISTS stripe_user_subscriptions;

-- Update users table to include trial information
ALTER TABLE users ADD COLUMN IF NOT EXISTS trial_ends_at timestamp with time zone;
ALTER TABLE users ADD COLUMN IF NOT EXISTS trial_used boolean DEFAULT false;

-- Create courses table
CREATE TABLE public.courses (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  subject text NOT NULL,
  duration text NOT NULL,
  level text NOT NULL CHECK (level IN ('beginner', 'intermediate', 'advanced')),
  environment text NOT NULL CHECK (environment IN ('academic', 'corporate')),
  tone text NOT NULL CHECK (tone IN ('formal', 'casual', 'professional', 'friendly')),
  language text NOT NULL DEFAULT 'en' CHECK (language IN ('en', 'ro')),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'generating', 'completed', 'failed')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create generation_pipelines table
CREATE TABLE public.generation_pipelines (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  current_step integer DEFAULT 1,
  total_steps integer DEFAULT 8,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'paused')),
  progress_percent integer DEFAULT 0 CHECK (progress_percent >= 0 AND progress_percent <= 100),
  step_data jsonb DEFAULT '{}',
  error_message text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create course_materials table
CREATE TABLE public.course_materials (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  material_type text NOT NULL CHECK (material_type IN ('agenda', 'objectives', 'slides', 'trainer_notes', 'exercises', 'manual', 'tests', 'roleplay', 'resources')),
  step_order integer NOT NULL,
  title text NOT NULL,
  content text,
  file_path text,
  file_size bigint,
  download_url text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'generating', 'completed', 'failed')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(course_id, material_type)
);

-- Create generation_steps reference table
CREATE TABLE public.generation_steps (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  step_name text NOT NULL UNIQUE,
  step_order integer NOT NULL UNIQUE,
  display_name text NOT NULL,
  description text,
  material_type text NOT NULL,
  dependencies text[] DEFAULT '{}',
  ai_prompt_template text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Insert default generation steps
INSERT INTO public.generation_steps (step_name, step_order, display_name, description, material_type, dependencies, ai_prompt_template) VALUES
('agenda', 1, 'Course Agenda', 'Generate the main course agenda and structure', 'agenda', '{}', 'Generate a detailed course agenda for "{subject}" with duration {duration}, level {level}, for {environment} environment with {tone} tone in {language}. Include timing, main topics and learning outcomes.'),
('objectives', 2, 'Learning Objectives', 'Define clear learning objectives', 'objectives', '{"agenda"}', 'Based on this agenda: {agenda_content}, create specific, measurable learning objectives for the course "{subject}" at {level} level for {environment} environment.'),
('slides', 3, 'Presentation Slides', 'Create slide content and structure', 'slides', '{"agenda", "objectives"}', 'Create detailed slide content for "{subject}" course. Use agenda: {agenda_content} and objectives: {objectives_content}. Generate slide titles, key points, and visual suggestions for {environment} environment with {tone} tone.'),
('trainer_notes', 4, 'Trainer Notes', 'Generate detailed trainer guidance', 'trainer_notes', '{"slides"}', 'Create comprehensive trainer notes for each slide: {slides_content}. Include what to say, real-life analogies, examples, timing, and interaction suggestions for {level} level audience in {environment} setting.'),
('exercises', 5, 'Practical Exercises', 'Design hands-on activities', 'exercises', '{"objectives", "slides"}', 'Design practical exercises and activities for "{subject}" course. Base on objectives: {objectives_content} and slides: {slides_content}. Include instructions, materials needed, timing, and expected outcomes for {level} level in {environment} environment.'),
('manual', 6, 'Participant Manual', 'Create comprehensive student guide', 'manual', '{"agenda", "objectives", "slides"}', 'Create a detailed participant manual for "{subject}" course including: course overview, learning objectives, key concepts, summaries, and reference materials. Use content from agenda: {agenda_content}, objectives: {objectives_content}, slides: {slides_content}.'),
('tests', 7, 'Tests & Quizzes', 'Generate assessment materials', 'tests', '{"objectives", "slides"}', 'Create comprehensive tests and quizzes for "{subject}" course. Base questions on objectives: {objectives_content} and slide content: {slides_content}. Include multiple choice, true/false, and open questions with answer keys for {level} level.'),
('resources', 8, 'Additional Resources', 'Compile supplementary materials', 'resources', '{"agenda", "objectives"}', 'Compile a list of additional learning resources for "{subject}" course including books, articles, websites, videos, and tools relevant to {level} level learners in {environment} environment.');

-- Enable RLS on all tables
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generation_pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generation_steps ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for courses
CREATE POLICY "Users can manage their own courses" ON public.courses
  FOR ALL USING (auth.uid() = user_id);

-- Create RLS policies for generation_pipelines
CREATE POLICY "Users can view their own pipelines" ON public.generation_pipelines
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.courses WHERE id = generation_pipelines.course_id AND user_id = auth.uid()
  ));

-- Create RLS policies for course_materials
CREATE POLICY "Users can view their own materials" ON public.course_materials
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.courses WHERE id = course_materials.course_id AND user_id = auth.uid()
  ));

-- Create RLS policies for generation_steps (public read)
CREATE POLICY "Generation steps are publicly readable" ON public.generation_steps
  FOR SELECT USING (true);

-- Create update trigger for courses
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;