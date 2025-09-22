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

    // Use GPT-4o-mini to parse and structure the resume
    const parseResponse = await fetch('https://api.openai.com/v1/chat/completions', {
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

Calculate impact scores for each bullet point (0-10) based on:
- Metrics present (+3)
- Strong action verbs (+2) 
- Technical depth (+2)
- Recency (+1)
Return only the JSON, no other text.`
          },
          { role: 'user', content: `Parse this resume text:\n\n${text}` }
        ],
        max_tokens: 2000,
        temperature: 0.3
      }),
    });

    if (!parseResponse.ok) {
      throw new Error(`OpenAI API error: ${parseResponse.statusText}`);
    }

    const parseData = await parseResponse.json();
    const parsedContent = JSON.parse(parseData.choices[0].message.content);

    console.log('Parsed resume structure:', JSON.stringify(parsedContent, null, 2));

    // Calculate overall ATS score
    let atsScore = 0;
    const bullets = [
      ...(parsedContent.experience?.flatMap(exp => exp.bullets || []) || []),
      ...(parsedContent.projects?.flatMap(proj => proj.bullets || []) || [])
    ];
    
    bullets.forEach(bullet => {
      if (/\d+/.test(bullet)) atsScore += 3; // Has metrics
      if (/^(Led|Managed|Developed|Created|Implemented|Optimized|Increased|Reduced)/i.test(bullet)) atsScore += 2; // Strong action verbs
      if (bullet.length > 50) atsScore += 1; // Detailed
    });

    atsScore = Math.min(100, Math.round(atsScore / bullets.length * 20));

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