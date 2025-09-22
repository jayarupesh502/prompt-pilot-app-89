-- Enable pgvector extension for embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Update resume_bullets table to use proper vector type
ALTER TABLE public.resume_bullets ALTER COLUMN embedding TYPE vector(1536);

-- Create index for vector similarity search
CREATE INDEX IF NOT EXISTS resume_bullets_embedding_idx ON public.resume_bullets 
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Add missing columns for enhanced functionality
ALTER TABLE public.resumes ADD COLUMN IF NOT EXISTS file_url text;
ALTER TABLE public.resumes ADD COLUMN IF NOT EXISTS file_type text;

ALTER TABLE public.job_descriptions ADD COLUMN IF NOT EXISTS keywords text[];
ALTER TABLE public.job_descriptions ADD COLUMN IF NOT EXISTS required_skills text[];
ALTER TABLE public.job_descriptions ADD COLUMN IF NOT EXISTS tech_stack text[];

-- Create storage bucket for resume files
INSERT INTO storage.buckets (id, name, public) VALUES ('resumes', 'resumes', false)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for resume storage
CREATE POLICY "Users can upload their own resumes" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'resumes' AND 
  (auth.uid()::text = (storage.foldername(name))[1] OR 
   (storage.foldername(name))[1] LIKE 'guest_%')
);

CREATE POLICY "Users can view their own resumes" ON storage.objects
FOR SELECT USING (
  bucket_id = 'resumes' AND 
  (auth.uid()::text = (storage.foldername(name))[1] OR 
   (storage.foldername(name))[1] LIKE 'guest_%')
);

CREATE POLICY "Users can delete their own resumes" ON storage.objects
FOR DELETE USING (
  bucket_id = 'resumes' AND 
  (auth.uid()::text = (storage.foldername(name))[1] OR 
   (storage.foldername(name))[1] LIKE 'guest_%')
);