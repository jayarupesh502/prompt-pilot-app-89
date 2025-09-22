-- Fix the vector extension by recreating the table without the vector column first
DROP TABLE IF EXISTS public.resume_bullets CASCADE;

-- Drop and recreate the vector extension in the correct schema
DROP EXTENSION IF EXISTS vector CASCADE;
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

-- Recreate the resume_bullets table with the vector column
CREATE TABLE public.resume_bullets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  guest_session_id TEXT,
  resume_id UUID REFERENCES public.resumes(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  skills TEXT[] DEFAULT '{}',
  impact_score INTEGER DEFAULT 0,
  embedding extensions.vector(1536), -- text-embedding-3-small dimensions in extensions schema
  is_guest BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on resume_bullets
ALTER TABLE public.resume_bullets ENABLE ROW LEVEL SECURITY;

-- Recreate policies for resume_bullets
CREATE POLICY "Users can view their own resume bullets" 
ON public.resume_bullets 
FOR SELECT 
USING (
  (auth.uid() = user_id) OR 
  (is_guest = true AND guest_session_id IS NOT NULL)
);

CREATE POLICY "Users can create resume bullets" 
ON public.resume_bullets 
FOR INSERT 
WITH CHECK (
  (auth.uid() = user_id) OR 
  (is_guest = true AND guest_session_id IS NOT NULL)
);

-- Recreate indexes
CREATE INDEX idx_resume_bullets_user_id ON public.resume_bullets(user_id);
CREATE INDEX idx_resume_bullets_resume_id ON public.resume_bullets(resume_id);
CREATE INDEX idx_resume_bullets_embedding ON public.resume_bullets USING ivfflat (embedding extensions.vector_cosine_ops);