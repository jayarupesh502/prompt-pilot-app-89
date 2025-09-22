import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseKey);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const isGuest = formData.get('isGuest') === 'true';
    const guestSessionId = formData.get('guestSessionId') as string;

    if (!file) {
      throw new Error('No file provided');
    }

    console.log('Processing file:', file.name, 'Type:', file.type);

    // Extract text based on file type
    let text = '';
    const fileType = file.type || file.name.split('.').pop()?.toLowerCase();

    if (fileType?.includes('pdf')) {
      // For PDF files, we'll use a simple text extraction approach
      // In production, you'd want to use a proper PDF parsing library
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      
      // Simple PDF text extraction (this is a simplified approach)
      const decoder = new TextDecoder();
      text = decoder.decode(uint8Array);
      
      // Extract readable text using regex patterns for PDF
      const textMatches = text.match(/\(([^)]+)\)/g);
      if (textMatches) {
        text = textMatches.map(match => match.slice(1, -1)).join(' ');
      } else {
        text = 'Unable to extract text from PDF. Please try a different format.';
      }
    } else if (fileType?.includes('word') || fileType?.includes('docx')) {
      text = await file.text();
    } else {
      text = await file.text();
    }

    console.log('Extracted text length:', text.length);

    // Trim extremely long inputs to keep token usage under control
    if (text.length > 20000) {
      text = text.slice(0, 20000);
    }

    // Helper: call OpenAI with retries
    async function callOpenAIWithRetry(inputText: string, retries = 3): Promise<any | null> {
      for (let attempt = 1; attempt <= retries; attempt++) {
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
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
                content: `You are a resume parser. Extract structured data from resume text and return ONLY valid JSON in this exact format:
{
  "profile": {
    "name": "string",
    "email": "string", 
    "phone": "string",
    "location": "string",
    "summary": "string"
  },
  "experience": [
    {
      "company": "string",
      "title": "string", 
      "location": "string",
      "startDate": "string",
      "endDate": "string",
      "bullets": ["string"],
      "skills": ["string"]
    }
  ],
  "education": [
    {
      "institution": "string",
      "degree": "string",
      "field": "string", 
      "graduationDate": "string",
      "gpa": "string"
    }
  ],
  "skills": ["string"],
  "projects": [
    {
      "name": "string",
      "description": "string",
      "technologies": ["string"],
      "bullets": ["string"]
    }
  ]
}
Return only the JSON, no other text.`
              },
              { role: 'user', content: `Parse this resume text (truncated):\n\n${inputText}` }
            ],
            max_tokens: 1500,
            temperature: 0.2
          }),
        });

        if (res.ok) {
          const data = await res.json();
          try {
            return JSON.parse(data.choices[0].message.content);
          } catch (_e) {
            return null;
          }
        }

        // If rate limited, exponential backoff then retry
        if (res.status === 429 || res.status >= 500) {
          const delay = 500 * Math.pow(3, attempt - 1);
          await new Promise(r => setTimeout(r, delay));
          continue;
        }

        // Non-retryable error
        console.error('OpenAI error status:', res.status, await res.text());
        return null;
      }
      return null;
    }

    // Heuristic parser fallback
    function heuristicParse(input: string) {
      const lines = input.split(/\r?\n/).map(l => l.trim()).filter(Boolean).slice(0, 1500);
      const textLower = input.toLowerCase();
      const section = (name: string) => new RegExp(`(^|\n)\s*${name}\s*:?.*$`, 'i');

      const splitBy = (marker: RegExp) => {
        const idx = lines.findIndex(l => marker.test(l));
        return idx >= 0 ? lines.slice(idx + 1) : lines;
      };

      const expMarkers = [/experience/, /work history/, /employment/];
      const eduMarkers = [/education/, /academic/];
      const skillsMarkers = [/skills/, /technical skills/, /technologies/];
      const projectsMarkers = [/projects?,?/];

      const bulletsFrom = (arr: string[]) => arr.filter(l => /^[-•·]/.test(l) || l.length > 40).slice(0, 10);

      const experience = (() => {
        const marker = expMarkers.find(m => m.test(textLower));
        const arr = marker ? splitBy(section(marker.source.replace(/\\/g, ''))) : lines;
        const bullets = bulletsFrom(arr);
        return bullets.length
          ? [{ company: '', title: '', location: '', startDate: '', endDate: '', bullets, skills: [] }]
          : [];
      })();

      const education = (() => {
        const marker = eduMarkers.find(m => m.test(textLower));
        const arr = marker ? splitBy(section(marker.source.replace(/\\/g, ''))) : [];
        const item = arr.find(l => /(university|college|bachelor|master|degree)/i.test(l));
        return item ? [{ institution: item, degree: '', field: '', graduationDate: '', gpa: '' }] : [];
      })();

      const skills = (() => {
        const marker = skillsMarkers.find(m => m.test(textLower));
        const arr = marker ? splitBy(section(marker.source.replace(/\\/g, ''))) : [];
        const joined = arr.slice(0, 10).join(', ');
        return joined.split(/,|\u2022|\|/).map(s => s.trim()).filter(s => s && s.length < 30).slice(0, 30);
      })();

      const projects = (() => {
        const marker = projectsMarkers.find(m => m.test(textLower));
        const arr = marker ? splitBy(section(marker.source.replace(/\\/g, ''))) : [];
        const bullets = bulletsFrom(arr);
        return bullets.length
          ? [{ name: '', description: '', technologies: [], bullets }]
          : [];
      })();

      // Basic profile extraction
      const email = (input.match(/[\w.+-]+@\w+\.[\w.-]+/g) || [''])[0];
      const phone = (input.match(/\+?\d[\d\s().-]{7,}/g) || [''])[0];

      return {
        profile: { name: '', email, phone, location: '', summary: '' },
        experience,
        education,
        skills,
        projects,
      };
    }

    // Try OpenAI first, then fallback
    let parsedContent = await callOpenAIWithRetry(text);
    if (!parsedContent) {
      console.log('Falling back to heuristic parser');
      parsedContent = heuristicParse(text);
    }

    console.log('Parsed resume structure (final):', JSON.stringify(parsedContent).slice(0, 500));

    // Calculate overall ATS score (heuristic if no bullets)
    let bullets: string[] = [
      ...(parsedContent.experience?.flatMap((exp: any) => exp.bullets || []) || []),
      ...(parsedContent.projects?.flatMap((proj: any) => proj.bullets || []) || [])
    ];

    if (bullets.length === 0) {
      bullets = text.split(/\n|\.|;/).map(s => s.trim()).filter(s => s.length > 30).slice(0, 10);
    }

    let atsScore = 0;
    bullets.forEach(bullet => {
      if (/\d+/.test(bullet)) atsScore += 3;
      if (/^(Led|Managed|Developed|Created|Implemented|Optimized|Increased|Reduced)/i.test(bullet)) atsScore += 2;
      if (bullet.length > 50) atsScore += 1;
      if (/(React|Node|Java|Python|AWS|Azure|GCP|SQL|API|Docker|Kubernetes)/i.test(bullet)) atsScore += 2;
    });
    atsScore = bullets.length ? Math.min(100, Math.round((atsScore / (bullets.length * 8)) * 100)) : 60;

    // Store resume bullets in memory layer for future retrieval
    if (bullets.length > 0) {
      const bulletInserts = bullets.map(bullet => ({
        text: bullet,
        user_id: isGuest ? null : undefined,
        guest_session_id: isGuest ? guestSessionId : null,
        is_guest: isGuest,
        impact_score: calculateImpactScore(bullet),
        expires_at: isGuest ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() : null,
        skills: extractSkillsFromBullet(bullet, parsedContent.skills || [])
      }));

      await supabase.from('resume_bullets').insert(bulletInserts);
    }

    return new Response(JSON.stringify({
      success: true,
      parsedContent,
      atsScore,
      originalFilename: file.name
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in parse-resume function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function calculateImpactScore(bullet: string): number {
  let score = 0;
  
  // Metrics present
  if (/\d+/.test(bullet)) score += 3;
  
  // Strong action verbs
  if (/^(Led|Managed|Developed|Created|Implemented|Optimized|Increased|Reduced|Built|Designed|Architected)/i.test(bullet)) score += 2;
  
  // Technical terms
  if (/(API|database|framework|system|algorithm|cloud|automation|CI\/CD|microservices)/i.test(bullet)) score += 2;
  
  // Length/detail
  if (bullet.length > 80) score += 1;
  
  return Math.min(10, score);
}

function extractSkillsFromBullet(bullet: string, allSkills: string[]): string[] {
  const foundSkills: string[] = [];
  const lowerBullet = bullet.toLowerCase();
  
  allSkills.forEach(skill => {
    if (lowerBullet.includes(skill.toLowerCase())) {
      foundSkills.push(skill);
    }
  });
  
  return foundSkills;
}