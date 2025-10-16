-- Fix RLS errors when inserting into generation_pipelines
-- Adds explicit INSERT/UPDATE/DELETE policies tied to course ownership
-- Also adds INSERT policy for courses to allow client-side creation by owners

-- Ensure RLS is enabled (idempotent, already enabled in earlier migrations)
ALTER TABLE public.generation_pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

-- generation_pipelines: allow owners of the parent course to INSERT
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'generation_pipelines' 
      AND policyname = 'Users can insert pipelines for own courses'
  ) THEN
    CREATE POLICY "Users can insert pipelines for own courses" ON public.generation_pipelines
      FOR INSERT
      WITH CHECK (
        EXISTS (
          SELECT 1 
          FROM public.courses c 
          WHERE c.id = course_id AND c.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- generation_pipelines: allow owners to UPDATE their pipelines
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'generation_pipelines' 
      AND policyname = 'Users can update their pipelines'
  ) THEN
    CREATE POLICY "Users can update their pipelines" ON public.generation_pipelines
      FOR UPDATE
      USING (
        EXISTS (
          SELECT 1 
          FROM public.courses c 
          WHERE c.id = generation_pipelines.course_id AND c.user_id = auth.uid()
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 
          FROM public.courses c 
          WHERE c.id = generation_pipelines.course_id AND c.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- generation_pipelines: allow owners to DELETE their pipelines
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'generation_pipelines' 
      AND policyname = 'Users can delete their pipelines'
  ) THEN
    CREATE POLICY "Users can delete their pipelines" ON public.generation_pipelines
      FOR DELETE
      USING (
        EXISTS (
          SELECT 1 
          FROM public.courses c 
          WHERE c.id = generation_pipelines.course_id AND c.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- courses: allow owners to INSERT their own courses from client
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'courses' 
      AND policyname = 'Users can insert their own courses'
  ) THEN
    CREATE POLICY "Users can insert their own courses" ON public.courses
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Optional: ensure updates keep ownership consistent (uses both USING and WITH CHECK)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'courses' 
      AND policyname = 'Users can update their own courses'
  ) THEN
    CREATE POLICY "Users can update their own courses" ON public.courses
      FOR UPDATE
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;