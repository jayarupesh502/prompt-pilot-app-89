-- Enable pgvector extension for embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create resumes table
CREATE TABLE public.resumes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  guest_session_id TEXT, -- For guest users
  title TEXT NOT NULL DEFAULT 'Untitled Resume',
  original_filename TEXT,
  parsed_content JSONB NOT NULL,
  ats_score INTEGER DEFAULT 0,
  is_guest BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMP WITH TIME ZONE, -- For guest sessions (7 days)
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on resumes
ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;

-- Create policies for resumes
CREATE POLICY "Users can view their own resumes" 
ON public.resumes 
FOR SELECT 
USING (
  (auth.uid() = user_id) OR 
  (is_guest = true AND guest_session_id IS NOT NULL)
);

CREATE POLICY "Users can create resumes" 
ON public.resumes 
FOR INSERT 
WITH CHECK (
  (auth.uid() = user_id) OR 
  (is_guest = true AND guest_session_id IS NOT NULL)
);

CREATE POLICY "Users can update their own resumes" 
ON public.resumes 
FOR UPDATE 
USING (
  (auth.uid() = user_id) OR 
  (is_guest = true AND guest_session_id IS NOT NULL)
);

CREATE POLICY "Users can delete their own resumes" 
ON public.resumes 
FOR DELETE 
USING (
  (auth.uid() = user_id) OR 
  (is_guest = true AND guest_session_id IS NOT NULL)
);

-- Create job_descriptions table
CREATE TABLE public.job_descriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  guest_session_id TEXT,
  title TEXT NOT NULL,
  company TEXT,
  raw_content TEXT NOT NULL,
  parsed_content JSONB NOT NULL,
  source_url TEXT,
  is_guest BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on job_descriptions
ALTER TABLE public.job_descriptions ENABLE ROW LEVEL SECURITY;

-- Create policies for job_descriptions
CREATE POLICY "Users can view their own job descriptions" 
ON public.job_descriptions 
FOR SELECT 
USING (
  (auth.uid() = user_id) OR 
  (is_guest = true AND guest_session_id IS NOT NULL)
);

CREATE POLICY "Users can create job descriptions" 
ON public.job_descriptions 
FOR INSERT 
WITH CHECK (
  (auth.uid() = user_id) OR 
  (is_guest = true AND guest_session_id IS NOT NULL)
);

-- Create resume_bullets table for embeddings
CREATE TABLE public.resume_bullets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  guest_session_id TEXT,
  resume_id UUID REFERENCES public.resumes(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  skills TEXT[] DEFAULT '{}',
  impact_score INTEGER DEFAULT 0,
  embedding vector(1536), -- text-embedding-3-small dimensions
  is_guest BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on resume_bullets
ALTER TABLE public.resume_bullets ENABLE ROW LEVEL SECURITY;

-- Create policies for resume_bullets
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

-- Create tailoring_sessions table
CREATE TABLE public.tailoring_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  guest_session_id TEXT,
  resume_id UUID REFERENCES public.resumes(id) ON DELETE CASCADE,
  job_description_id UUID REFERENCES public.job_descriptions(id) ON DELETE CASCADE,
  original_content JSONB NOT NULL,
  suggested_content JSONB NOT NULL,
  accepted_changes JSONB DEFAULT '{}',
  ats_score_before INTEGER DEFAULT 0,
  ats_score_after INTEGER DEFAULT 0,
  mode TEXT CHECK (mode IN ('assistive', 'fast')) DEFAULT 'fast',
  is_guest BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on tailoring_sessions
ALTER TABLE public.tailoring_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for tailoring_sessions
CREATE POLICY "Users can view their own tailoring sessions" 
ON public.tailoring_sessions 
FOR SELECT 
USING (
  (auth.uid() = user_id) OR 
  (is_guest = true AND guest_session_id IS NOT NULL)
);

CREATE POLICY "Users can create tailoring sessions" 
ON public.tailoring_sessions 
FOR INSERT 
WITH CHECK (
  (auth.uid() = user_id) OR 
  (is_guest = true AND guest_session_id IS NOT NULL)
);

CREATE POLICY "Users can update their own tailoring sessions" 
ON public.tailoring_sessions 
FOR UPDATE 
USING (
  (auth.uid() = user_id) OR 
  (is_guest = true AND guest_session_id IS NOT NULL)
);

-- Create templates table
CREATE TABLE public.templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  template_content JSONB NOT NULL,
  industry TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on templates
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;

-- Create policies for templates
CREATE POLICY "Users can view public templates or their own" 
ON public.templates 
FOR SELECT 
USING (is_public = true OR auth.uid() = user_id);

CREATE POLICY "Users can create their own templates" 
ON public.templates 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own templates" 
ON public.templates 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, first_name, last_name, email)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name',
    NEW.email
  );
  RETURN NEW;
END;
$$;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for updating timestamps
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_resumes_updated_at
  BEFORE UPDATE ON public.resumes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tailoring_sessions_updated_at
  BEFORE UPDATE ON public.tailoring_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_templates_updated_at
  BEFORE UPDATE ON public.templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to automatically delete expired guest data
CREATE OR REPLACE FUNCTION public.cleanup_guest_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Delete expired guest resume bullets
  DELETE FROM public.resume_bullets 
  WHERE is_guest = true AND expires_at < now();
  
  -- Delete expired guest tailoring sessions
  DELETE FROM public.tailoring_sessions 
  WHERE is_guest = true AND expires_at < now();
  
  -- Delete expired guest job descriptions
  DELETE FROM public.job_descriptions 
  WHERE is_guest = true AND expires_at < now();
  
  -- Delete expired guest resumes
  DELETE FROM public.resumes 
  WHERE is_guest = true AND expires_at < now();
END;
$$;

-- Create indexes for performance
CREATE INDEX idx_resumes_user_id ON public.resumes(user_id);
CREATE INDEX idx_resumes_guest_session ON public.resumes(guest_session_id) WHERE is_guest = true;
CREATE INDEX idx_resumes_expires_at ON public.resumes(expires_at) WHERE is_guest = true;
CREATE INDEX idx_resume_bullets_user_id ON public.resume_bullets(user_id);
CREATE INDEX idx_resume_bullets_resume_id ON public.resume_bullets(resume_id);
CREATE INDEX idx_resume_bullets_embedding ON public.resume_bullets USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX idx_job_descriptions_user_id ON public.job_descriptions(user_id);
CREATE INDEX idx_tailoring_sessions_user_id ON public.tailoring_sessions(user_id);
CREATE INDEX idx_tailoring_sessions_resume_id ON public.tailoring_sessions(resume_id);
CREATE INDEX idx_templates_user_id ON public.templates(user_id);
CREATE INDEX idx_templates_public ON public.templates(is_public) WHERE is_public = true;