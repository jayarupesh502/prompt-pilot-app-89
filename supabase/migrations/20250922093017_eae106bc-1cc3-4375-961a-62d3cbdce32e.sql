-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- Create profiles table for user data
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create resumes table
CREATE TABLE IF NOT EXISTS public.resumes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  guest_session_id TEXT,
  title TEXT NOT NULL,
  original_filename TEXT,
  parsed_content JSONB NOT NULL,
  ats_score INTEGER DEFAULT 0,
  is_guest BOOLEAN DEFAULT false,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create job_descriptions table
CREATE TABLE IF NOT EXISTS public.job_descriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  guest_session_id TEXT,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  parsed_content JSONB,
  keywords TEXT[],
  required_skills TEXT[],
  is_guest BOOLEAN DEFAULT false,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create resume_bullets table for memory layer
CREATE TABLE IF NOT EXISTS public.resume_bullets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  guest_session_id TEXT,
  text TEXT NOT NULL,
  skills TEXT[],
  impact_score INTEGER DEFAULT 0,
  embedding vector(1536),
  is_guest BOOLEAN DEFAULT false,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create tailoring_sessions table
CREATE TABLE IF NOT EXISTS public.tailoring_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  guest_session_id TEXT,
  resume_id UUID REFERENCES public.resumes(id) ON DELETE CASCADE,
  job_description_id UUID REFERENCES public.job_descriptions(id) ON DELETE CASCADE,
  tailored_content JSONB,
  accepted_changes JSONB,
  ats_score_before INTEGER,
  ats_score_after INTEGER,
  is_guest BOOLEAN DEFAULT false,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create resume_templates table
CREATE TABLE IF NOT EXISTS public.resume_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  template_data JSONB NOT NULL,
  preview_image_url TEXT,
  is_premium BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_descriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resume_bullets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tailoring_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resume_templates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for resumes
CREATE POLICY "Users can view their own resumes" ON public.resumes FOR SELECT USING (
  (NOT is_guest AND auth.uid() = user_id) OR 
  (is_guest AND guest_session_id IS NOT NULL)
);
CREATE POLICY "Users can insert their own resumes" ON public.resumes FOR INSERT WITH CHECK (
  (NOT is_guest AND auth.uid() = user_id) OR 
  (is_guest AND guest_session_id IS NOT NULL)
);
CREATE POLICY "Users can update their own resumes" ON public.resumes FOR UPDATE USING (
  (NOT is_guest AND auth.uid() = user_id) OR 
  (is_guest AND guest_session_id IS NOT NULL)
);
CREATE POLICY "Users can delete their own resumes" ON public.resumes FOR DELETE USING (
  (NOT is_guest AND auth.uid() = user_id) OR 
  (is_guest AND guest_session_id IS NOT NULL)
);

-- Create RLS policies for job_descriptions
CREATE POLICY "Users can view their own job descriptions" ON public.job_descriptions FOR SELECT USING (
  (NOT is_guest AND auth.uid() = user_id) OR 
  (is_guest AND guest_session_id IS NOT NULL)
);
CREATE POLICY "Users can insert their own job descriptions" ON public.job_descriptions FOR INSERT WITH CHECK (
  (NOT is_guest AND auth.uid() = user_id) OR 
  (is_guest AND guest_session_id IS NOT NULL)
);
CREATE POLICY "Users can update their own job descriptions" ON public.job_descriptions FOR UPDATE USING (
  (NOT is_guest AND auth.uid() = user_id) OR 
  (is_guest AND guest_session_id IS NOT NULL)
);
CREATE POLICY "Users can delete their own job descriptions" ON public.job_descriptions FOR DELETE USING (
  (NOT is_guest AND auth.uid() = user_id) OR 
  (is_guest AND guest_session_id IS NOT NULL)
);

-- Create RLS policies for resume_bullets
CREATE POLICY "Users can view their own resume bullets" ON public.resume_bullets FOR SELECT USING (
  (NOT is_guest AND auth.uid() = user_id) OR 
  (is_guest AND guest_session_id IS NOT NULL)
);
CREATE POLICY "Users can insert their own resume bullets" ON public.resume_bullets FOR INSERT WITH CHECK (
  (NOT is_guest AND auth.uid() = user_id) OR 
  (is_guest AND guest_session_id IS NOT NULL)
);

-- Create RLS policies for tailoring_sessions
CREATE POLICY "Users can view their own tailoring sessions" ON public.tailoring_sessions FOR SELECT USING (
  (NOT is_guest AND auth.uid() = user_id) OR 
  (is_guest AND guest_session_id IS NOT NULL)
);
CREATE POLICY "Users can insert their own tailoring sessions" ON public.tailoring_sessions FOR INSERT WITH CHECK (
  (NOT is_guest AND auth.uid() = user_id) OR 
  (is_guest AND guest_session_id IS NOT NULL)
);
CREATE POLICY "Users can update their own tailoring sessions" ON public.tailoring_sessions FOR UPDATE USING (
  (NOT is_guest AND auth.uid() = user_id) OR 
  (is_guest AND guest_session_id IS NOT NULL)
);

-- Create RLS policies for resume_templates (public read)
CREATE POLICY "Anyone can view resume templates" ON public.resume_templates FOR SELECT USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_resumes_user_id ON public.resumes(user_id);
CREATE INDEX IF NOT EXISTS idx_resumes_guest_session ON public.resumes(guest_session_id);
CREATE INDEX IF NOT EXISTS idx_resumes_created_at ON public.resumes(created_at);
CREATE INDEX IF NOT EXISTS idx_job_descriptions_user_id ON public.job_descriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_job_descriptions_guest_session ON public.job_descriptions(guest_session_id);
CREATE INDEX IF NOT EXISTS idx_resume_bullets_embedding ON public.resume_bullets USING ivfflat (embedding vector_cosine_ops);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_resumes_updated_at ON public.resumes;
CREATE TRIGGER update_resumes_updated_at
  BEFORE UPDATE ON public.resumes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_job_descriptions_updated_at ON public.job_descriptions;
CREATE TRIGGER update_job_descriptions_updated_at
  BEFORE UPDATE ON public.job_descriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_tailoring_sessions_updated_at ON public.tailoring_sessions;
CREATE TRIGGER update_tailoring_sessions_updated_at
  BEFORE UPDATE ON public.tailoring_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample resume templates
INSERT INTO public.resume_templates (name, category, description, template_data) VALUES
(
  'Software Engineer - Modern',
  'Technology',
  'Clean, modern template perfect for software engineers and developers',
  '{
    "profile": {
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@email.com",
      "phone": "(555) 123-4567",
      "location": "San Francisco, CA",
      "summary": "Full-stack software engineer with 5+ years of experience building scalable web applications. Passionate about clean code, user experience, and innovative solutions."
    },
    "experience": [
      {
        "company": "Tech Startup Inc.",
        "title": "Senior Software Engineer",
        "startDate": "2022-01",
        "endDate": "Present",
        "location": "San Francisco, CA",
        "bullets": [
          "Led development of microservices architecture serving 1M+ users daily",
          "Reduced application load time by 40% through optimization and caching strategies",
          "Mentored 3 junior developers and conducted code reviews"
        ],
        "skills": ["React", "Node.js", "AWS", "MongoDB"]
      }
    ],
    "education": [
      {
        "institution": "University of California, Berkeley",
        "degree": "Bachelor of Science in Computer Science",
        "startDate": "2016-09",
        "endDate": "2020-05",
        "gpa": "3.8"
      }
    ],
    "skills": ["JavaScript", "Python", "React", "Node.js", "AWS", "MongoDB", "Docker", "Kubernetes"]
  }'
),
(
  'Marketing Manager - Professional',
  'Marketing',
  'Professional template designed for marketing professionals and managers',
  '{
    "profile": {
      "firstName": "Sarah",
      "lastName": "Johnson",
      "email": "sarah.johnson@email.com",
      "phone": "(555) 987-6543",
      "location": "New York, NY",
      "summary": "Results-driven marketing manager with 7+ years of experience in digital marketing, brand management, and campaign optimization. Proven track record of increasing ROI by 150%."
    },
    "experience": [
      {
        "company": "Global Marketing Corp",
        "title": "Senior Marketing Manager",
        "startDate": "2021-03",
        "endDate": "Present",
        "location": "New York, NY",
        "bullets": [
          "Increased brand awareness by 60% through integrated marketing campaigns",
          "Managed $2M annual marketing budget across multiple channels",
          "Led cross-functional team of 8 marketing professionals"
        ],
        "skills": ["Google Analytics", "HubSpot", "Adobe Creative Suite", "Social Media Marketing"]
      }
    ],
    "education": [
      {
        "institution": "New York University",
        "degree": "Master of Business Administration - Marketing",
        "startDate": "2018-09",
        "endDate": "2020-05",
        "gpa": "3.9"
      }
    ],
    "skills": ["Digital Marketing", "Google Analytics", "HubSpot", "Adobe Creative Suite", "Social Media Marketing", "SEO/SEM", "Content Marketing", "Brand Management"]
  }'
),
(
  'Data Scientist - Analytics',
  'Data Science',
  'Analytical template perfect for data scientists and analysts',
  '{
    "profile": {
      "firstName": "Michael",
      "lastName": "Chen",
      "email": "michael.chen@email.com",
      "phone": "(555) 456-7890",
      "location": "Seattle, WA",
      "summary": "Data scientist with 6+ years of experience in machine learning, statistical analysis, and data visualization. Expert in Python, R, and SQL with a passion for extracting insights from complex datasets."
    },
    "experience": [
      {
        "company": "Data Analytics Inc.",
        "title": "Senior Data Scientist",
        "startDate": "2020-06",
        "endDate": "Present",
        "location": "Seattle, WA",
        "bullets": [
          "Developed ML models that improved customer retention by 25%",
          "Built automated reporting system reducing manual work by 80%",
          "Collaborated with product teams to implement A/B testing framework"
        ],
        "skills": ["Python", "R", "SQL", "TensorFlow", "Tableau"]
      }
    ],
    "education": [
      {
        "institution": "Stanford University",
        "degree": "Master of Science in Statistics",
        "startDate": "2017-09",
        "endDate": "2019-06",
        "gpa": "3.85"
      }
    ],
    "skills": ["Python", "R", "SQL", "Machine Learning", "TensorFlow", "PyTorch", "Tableau", "Power BI", "AWS", "Apache Spark"]
  }'
);