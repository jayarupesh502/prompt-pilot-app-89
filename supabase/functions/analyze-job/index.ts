import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { jobText, sourceUrl, userId, isGuest, guestSessionId } = await req.json();

    if (!jobText) {
      throw new Error('Job description text is required');
    }

    console.log('Analyzing job description, length:', jobText.length);

    let parsedContent;
    
    try {
      // Try AI analysis first
      const analysisResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `You are a job description analyzer. Extract structured data and return ONLY valid JSON in this exact format:
{
  "title": "string",
  "company": "string", 
  "location": "string",
  "requirements": {
    "required_skills": ["string"],
    "preferred_skills": ["string"],
    "experience_years": "string",
    "education": "string",
    "certifications": ["string"]
  },
  "responsibilities": ["string"],
  "keywords": ["string"],
  "tech_stack": ["string"],
  "industry": "string",
  "employment_type": "string",
  "salary_range": "string"
}

Focus on extracting:
- All technical skills and technologies mentioned
- Required vs preferred qualifications
- Key action words and industry terms
- Educational requirements
- Experience level needed

Return only the JSON, no other text.`
            },
            { role: 'user', content: `Analyze this job description:\n\n${jobText}` }
          ],
          max_tokens: 1500,
          temperature: 0.2
        }),
      });

      if (!analysisResponse.ok) {
        const errorData = await analysisResponse.json();
        console.log('OpenAI API error:', analysisResponse.status, JSON.stringify(errorData));
        throw new Error(`OpenAI API error: ${analysisResponse.statusText}`);
      }

      const analysisData = await analysisResponse.json();
      parsedContent = JSON.parse(analysisData.choices[0].message.content);
      console.log('AI analysis successful');
      
    } catch (aiError) {
      console.log('AI analysis failed, falling back to heuristic analysis:', aiError.message);
      
      // Fallback to heuristic analysis
      parsedContent = performHeuristicAnalysis(jobText);
    }

    console.log('Analyzed job structure:', JSON.stringify(parsedContent, null, 2));

    // Calculate keyword density and importance
    const allKeywords = [
      ...(parsedContent.requirements?.required_skills || []),
      ...(parsedContent.requirements?.preferred_skills || []),
      ...(parsedContent.tech_stack || []),
      ...(parsedContent.keywords || [])
    ];

    // Create technology stack equivalence mapping
    const techEquivalents = createTechStackMapping(parsedContent.tech_stack || []);

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Save job description to database
    let jobDescriptionData = null;
    try {
      const jobDescriptionRecord = {
        title: parsedContent.title || 'Job Position',
        company: parsedContent.company || '',
        raw_content: jobText,
        parsed_content: parsedContent,
        source_url: sourceUrl || null,
        tech_stack: parsedContent.tech_stack || [],
        required_skills: parsedContent.requirements?.required_skills || [],
        keywords: allKeywords,
        user_id: isGuest ? null : userId,
        is_guest: isGuest || false,
        guest_session_id: isGuest ? guestSessionId : null,
        expires_at: isGuest ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() : null // 7 days for guests
      };

      const { data: savedJob, error: saveError } = await supabase
        .from('job_descriptions')
        .insert(jobDescriptionRecord)
        .select()
        .single();

      if (saveError) {
        console.error('Error saving job description:', saveError);
        // Continue without failing the entire request
      } else {
        jobDescriptionData = savedJob;
        console.log('Job description saved with ID:', savedJob.id);
      }
    } catch (saveError) {
      console.error('Unexpected error saving job description:', saveError);
      // Continue without failing the entire request
    }

    return new Response(JSON.stringify({
      success: true,
      jobDescription: jobDescriptionData,
      parsedContent,
      sourceUrl,
      techEquivalents,
      keywordCount: allKeywords.length,
      analysisMetadata: {
        extractedAt: new Date().toISOString(),
        confidence: 0.85 // Could be calculated based on content quality
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in analyze-job function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function performHeuristicAnalysis(jobText: string) {
  console.log('Performing heuristic job analysis...');
  
  const text = jobText.toLowerCase();
  
  // Extract common skills using regex patterns
  const skillPatterns = {
    languages: ['javascript', 'typescript', 'python', 'java', 'c#', 'php', 'ruby', 'go', 'rust', 'swift'],
    frameworks: ['react', 'angular', 'vue', 'node.js', 'express', 'django', 'flask', 'spring', '.net'],
    databases: ['sql', 'mysql', 'postgresql', 'mongodb', 'redis', 'oracle'],
    tools: ['git', 'docker', 'kubernetes', 'aws', 'azure', 'gcp', 'jenkins', 'jira'],
    methodologies: ['agile', 'scrum', 'devops', 'ci/cd', 'tdd', 'api']
  };
  
  const extractedSkills: string[] = [];
  const techStack: string[] = [];
  
  // Find skills in the text
  Object.values(skillPatterns).flat().forEach(skill => {
    if (text.includes(skill.toLowerCase())) {
      extractedSkills.push(skill);
      if (['languages', 'frameworks', 'databases', 'tools'].some(category => 
        skillPatterns[category as keyof typeof skillPatterns]?.includes(skill))) {
        techStack.push(skill);
      }
    }
  });
  
  // Extract experience requirements
  const experienceMatch = text.match(/(\d+)[\s\-]*(?:years?|yrs?)\s+(?:of\s+)?experience/i);
  const experienceYears = experienceMatch ? `${experienceMatch[1]} years` : 'Not specified';
  
  // Extract education requirements
  const educationKeywords = ['bachelor', 'master', 'phd', 'degree', 'diploma', 'certification'];
  const education = educationKeywords.some(keyword => text.includes(keyword)) 
    ? 'Bachelor\'s degree or equivalent' 
    : 'Not specified';
  
  // Extract job title (usually in first few lines)
  const lines = jobText.split('\n').filter(line => line.trim());
  const title = lines[0]?.trim() || 'Job Position';
  
  // Extract responsibilities (lines with action verbs)
  const actionVerbs = ['develop', 'design', 'implement', 'maintain', 'create', 'build', 'manage', 'lead', 'collaborate'];
  const responsibilities = lines.filter(line => 
    actionVerbs.some(verb => line.toLowerCase().includes(verb)) && line.length > 20
  ).slice(0, 5);
  
  return {
    title,
    company: 'Company Name',
    location: 'Location',
    requirements: {
      required_skills: extractedSkills.slice(0, 8),
      preferred_skills: extractedSkills.slice(8, 12),
      experience_years: experienceYears,
      education,
      certifications: []
    },
    responsibilities,
    keywords: extractedSkills.slice(0, 10),
    tech_stack: techStack,
    industry: 'Technology',
    employment_type: text.includes('contract') ? 'Contract' : 'Full-time',
    salary_range: 'Not specified'
  };
}

function createTechStackMapping(techStack: string[]): Record<string, string[]> {
  const mappings: Record<string, string[]> = {};
  
  // Common technology equivalences
  const equivalenceMap = {
    'JavaScript': ['TypeScript', 'Node.js', 'React', 'Vue', 'Angular'],
    'Python': ['Django', 'Flask', 'FastAPI', 'NumPy', 'Pandas'],
    'Java': ['Spring', 'Spring Boot', 'Hibernate', 'Maven'],
    'C#': ['.NET', '.NET Core', 'ASP.NET', 'Entity Framework'],
    'React': ['Vue.js', 'Angular', 'Svelte', 'Next.js'],
    'PostgreSQL': ['MySQL', 'SQL Server', 'Oracle', 'MongoDB'],
    'AWS': ['Azure', 'Google Cloud', 'IBM Cloud'],
    'Docker': ['Kubernetes', 'Podman', 'containerd'],
    'Git': ['GitHub', 'GitLab', 'Bitbucket', 'SVN']
  };

  techStack.forEach(tech => {
    const normalizedTech = tech.trim();
    
    // Find equivalents
    for (const [key, equivalents] of Object.entries(equivalenceMap)) {
      if (normalizedTech.toLowerCase().includes(key.toLowerCase()) || 
          equivalents.some(eq => normalizedTech.toLowerCase().includes(eq.toLowerCase()))) {
        mappings[normalizedTech] = [key, ...equivalents].filter(item => 
          !item.toLowerCase().includes(normalizedTech.toLowerCase())
        );
      }
    }
    
    if (!mappings[normalizedTech]) {
      mappings[normalizedTech] = [];
    }
  });

  return mappings;
}