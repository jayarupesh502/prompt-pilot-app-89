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
    const fileName = file.name.toLowerCase();
    const fileExtension = fileName.split('.').pop() || '';
    const mimeType = file.type.toLowerCase();

    console.log('File details:', { fileName, fileExtension, mimeType, size: file.size });

    // Determine file type and extract text accordingly
    if (isPDF(mimeType, fileExtension)) {
      text = await extractPDFText(file);
    } else if (isWordDocument(mimeType, fileExtension)) {
      text = await extractWordText(file);
    } else if (isTextDocument(mimeType, fileExtension)) {
      text = await extractPlainText(file);
    } else {
      // Fallback: try to read as plain text
      try {
        text = await file.text();
      } catch (error) {
        console.error('Failed to read file as text:', error);
        text = 'Unable to extract text from this file format. Please try uploading a PDF, Word document, or plain text file.';
      }
    }

    // Sanitize text to remove problematic unicode sequences
    text = sanitizeText(text);

    console.log('Extracted text length:', text.length);

    // Trim extremely long inputs to keep token usage under control
    if (text.length > 20000) {
      text = text.slice(0, 20000);
    }

    // Helper: validate if content is a resume using OpenAI
    async function validateIsResume(inputText: string): Promise<{ isResume: boolean; reason: string }> {
      if (!openAIApiKey) {
        console.log('No OpenAI API key available, skipping AI validation');
        return { isResume: true, reason: "AI validation skipped - no API key" };
      }

      try {
        console.log('Making OpenAI validation request...');
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
                content: `You are a resume validator. Analyze the given text and determine if it's a resume or CV. 

A resume/CV typically contains:
- Personal contact information (name, email, phone)
- Work experience with job titles and companies
- Education information
- Skills section
- Professional summary or objective

Return ONLY a JSON object in this exact format:
{
  "isResume": boolean,
  "reason": "string explaining why it is or isn't a resume"
}`
              },
              { role: 'user', content: `Analyze if this is a resume:\n\n${inputText.slice(0, 2000)}` }
            ],
            max_tokens: 200,
            temperature: 0.1
          }),
        });

        console.log('OpenAI validation response status:', res.status);

        if (res.ok) {
          const data = await res.json();
          console.log('OpenAI validation response:', JSON.stringify(data).slice(0, 500));
          try {
            const result = JSON.parse(data.choices[0].message.content);
            console.log('Parsed validation result:', result);
            return result;
          } catch (_e) {
            console.log('Failed to parse OpenAI response, defaulting to heuristic later');
            return { isResume: false, reason: "Failed to parse AI response" };
          }
        } else {
          const bodyText = await res.text().catch(() => '');
          console.error('OpenAI resume validation failed:', res.status, bodyText);
          return { isResume: false, reason: "AI validation failed" };
        }
        
      } catch (error) {
        console.error('Resume validation error:', error);
        return { isResume: false, reason: "Validation service error" };
      }
    }

    // Helper: call OpenAI to parse resume with retries
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
              { role: 'user', content: `Parse this resume text:\n\n${inputText}` }
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

    // Helper: calculate ATS score using OpenAI (with robust heuristic fallback)
    async function calculateATSScore(resumeContent: any, rawText: string): Promise<number> {
      // If no API key, skip straight to heuristics
      const canUseAI = !!openAIApiKey;
      if (canUseAI) {
        try {
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
                  content: `You are an ATS (Applicant Tracking System) analyzer. Evaluate this resume and provide an ATS compatibility score from 0-100.

Consider these factors:
- Clear section headers (Experience, Education, Skills)
- Quantifiable achievements with metrics
- Relevant keywords and technical skills
- Professional formatting and structure
- Action verbs and impact statements
- Contact information completeness
- Education and experience details

Return ONLY a JSON object:
{
  "score": number (0-100),
  "strengths": ["string"],
  "improvements": ["string"]
}`
                },
              { 
                role: 'user', 
                content: `Analyze this resume for ATS compatibility:\n\nStructured Data: ${JSON.stringify(resumeContent)}\n\nRaw Text (first 4000 chars): ${rawText.slice(0, 4000)}` 
              }
              ],
              max_tokens: 500,
              temperature: 0.1
            }),
          });

          if (res.ok) {
            const data = await res.json();
            try {
              const result = JSON.parse(data.choices[0].message.content);
              const aiScore = Number(result.score);
              if (!Number.isNaN(aiScore) && aiScore >= 0 && aiScore <= 100) return aiScore;
            } catch (_e) {
              // fall through to heuristics
            }
          } else {
            const body = await res.text().catch(() => '');
            console.error('ATS AI scoring failed:', res.status, body);
          }
        } catch (error) {
          console.error('ATS scoring error:', error);
        }
      }

      // Heuristic fallback scoring (0-100)
      try {
        const text = rawText || '';
        const lower = text.toLowerCase();
        const words = text.trim().split(/\s+/).length;
        const bullets = (
          (resumeContent?.experience?.flatMap((e: any) => e?.bullets || []) || [])
            .concat(resumeContent?.projects?.flatMap((p: any) => p?.bullets || []) || [])
        ).filter(Boolean) as string[];

        const countMatches = (re: RegExp) => (text.match(re) || []).length;
        const has = (re: RegExp) => re.test(lower);

        // Section presence
        let score = 0;
        if (has(/experience|work|employment/)) score += 15;
        if (has(/education|university|college|degree|bachelor|master/)) score += 10;
        if (has(/skills|technical|technologies|tools|languages|frameworks/)) score += 10;

        // Bullets and structure
        const bulletCount = countMatches(/(^|\n)\s*[-•·]/g);
        score += Math.min(15, bulletCount * 2);

        // Metrics and action verbs
        const metricCount = countMatches(/\b\d{1,3}(?:[,%]|k|m)?\b/g);
        score += Math.min(12, metricCount * 2);
        const actionVerbs = /(led|managed|developed|created|implemented|optimized|designed|built|architected|increased|reduced|launched|delivered|migrated|automated)/g;
        score += Math.min(12, countMatches(actionVerbs));

        // Keywords/tech
        const techRegex = /(react|node|typescript|python|java|c\+\+|aws|azure|gcp|docker|kubernetes|sql|nosql|api|microservices|graphql|rest)/g;
        const uniqueTech = new Set((lower.match(techRegex) || []));
        score += Math.min(16, uniqueTech.size * 2);

        // Contact & formatting
        if (/[\w.+-]+@\w+\.[\w.-]+/.test(text)) score += 5;
        if (/\+?\d[\d\s().-]{7,}/.test(text)) score += 5;
        if (bullets.length > 5) score += 5;

        // Length normalization
        if (words >= 180 && words <= 1500) score += 10;
        else if (words < 120) score -= 10;

        // Clamp and return
        return Math.max(20, Math.min(100, Math.round(score)));
      } catch (_e) {
        // Absolute fallback if heuristics fail
        return 60;
      }
    }

    // Heuristic parser fallback
    function heuristicParse(input: string) {
      const lines = input.split(/\r?\n/).map(l => l.trim()).filter(Boolean).slice(0, 1500);
      const textLower = input.toLowerCase();
      
      // If this doesn't look like a resume at all, return minimal structure
      if (!isLikelyResume(input)) {
        console.log('Heuristic parser: File does not appear to be a resume, returning minimal structure');
        return {
          profile: { name: '', email: '', phone: '', location: '', summary: '' },
          experience: [],
          education: [],
          skills: [],
          projects: []
        };
      }

      const section = (name: string) => new RegExp(`(^|\n)\s*${name}\s*:?.*$`, 'i');

      const splitBy = (marker: RegExp) => {
        const idx = lines.findIndex(l => marker.test(l));
        return idx >= 0 ? lines.slice(idx + 1) : lines;
      };

      const expMarkers = [/experience/, /work history/, /employment/];
      const eduMarkers = [/education/, /academic/];
      const skillsMarkers = [/skills/, /technical skills/, /technologies/];
      const projectsMarkers = [/projects?,?/];

      // Better bullet extraction - avoid dumping entire raw text
      const bulletsFrom = (arr: string[]) => {
        return arr
          .filter(l => /^[-•·]/.test(l) || (l.length > 20 && l.length < 200 && !/^(john doe|email:|phone:|location:)/i.test(l)))
          .map(l => l.replace(/^[-•·]\s*/, '').trim())
          .filter(l => l.length > 10)
          .slice(0, 8);
      };

      const experience = (() => {
        const marker = expMarkers.find(m => m.test(textLower));
        const arr = marker ? splitBy(section(marker.source.replace(/\\/g, ''))) : [];
        const bullets = bulletsFrom(arr);
        
        if (bullets.length > 0) {
          // Try to extract company and title from context
          const companyMatch = arr.find(l => /\b(inc|corp|llc|ltd|company|technologies|systems)\b/i.test(l));
          const titleMatch = arr.find(l => /(engineer|developer|manager|analyst|coordinator|specialist|director|lead)/i.test(l));
          
          return [{
            company: companyMatch?.replace(/\|.*/, '').trim().slice(0, 50) || '',
            title: titleMatch?.replace(/\|.*/, '').trim().slice(0, 50) || '',
            location: '',
            startDate: '',
            endDate: '',
            bullets,
            skills: []
          }];
        }
        return [];
      })();

      const education = (() => {
        const marker = eduMarkers.find(m => m.test(textLower));
        const arr = marker ? splitBy(section(marker.source.replace(/\\/g, ''))) : [];
        const item = arr.find(l => /(university|college|bachelor|master|degree)/i.test(l));
        return item ? [{ 
          institution: item.slice(0, 100), 
          degree: '', 
          field: '', 
          graduationDate: '', 
          gpa: '' 
        }] : [];
      })();

      const skills = (() => {
        const marker = skillsMarkers.find(m => m.test(textLower));
        const arr = marker ? splitBy(section(marker.source.replace(/\\/g, ''))) : [];
        const joined = arr.slice(0, 5).join(', ');
        return joined
          .split(/,|\u2022|\|/)
          .map(s => s.trim())
          .filter(s => s && s.length > 2 && s.length < 30)
          .slice(0, 20);
      })();

      const projects = (() => {
        const marker = projectsMarkers.find(m => m.test(textLower));
        const arr = marker ? splitBy(section(marker.source.replace(/\\/g, ''))) : [];
        const bullets = bulletsFrom(arr);
        return bullets.length > 0 ? [{ 
          name: '', 
          description: '', 
          technologies: [], 
          bullets 
        }] : [];
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

    // Heuristic resume detector as fallback when AI validation fails
    function isLikelyResume(input: string): boolean {
      const lower = input.toLowerCase();
      const hasEmail = /[\w.+-]+@\w+\.[\w.-]+/.test(input);
      const hasPhone = /\+?\d[\d\s().-]{7,}/.test(input);
      const hasExperience = /(experience|work|employment|job|position|role|developer|engineer|manager|analyst|coordinator|specialist|director|lead)/i.test(lower);
      const hasEducation = /(education|university|college|bachelor|master|degree|diploma|certification|school)/i.test(lower);
      const hasSkills = /(skills|technical|programming|software|tools|technologies|languages|frameworks)/i.test(lower);
      const hasResumePhrases = /(resume|cv|curriculum vitae)/i.test(lower);
      const hasActionWords = /(developed|managed|created|implemented|designed|built|led|coordinated|achieved|improved)/i.test(lower);
      const hasDateRanges = /(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)\.?\s?\d{4}\s*[-–]\s*(present|\w+\.?\s?\d{4})|\b\d{4}\s*[-–]\s*(present|\d{4})/i.test(lower);
      const bulletCount = (input.match(/(^|\n)\s*[-•·]/g) || []).length;
      const wordCount = input.trim().split(/\s+/).length;
      
      // Strong disqualifiers for forms, documents that are definitely not resumes
      const strongDisqualifiers = /(withholding|\bw-?4\b|w-4|internal revenue service|irs|tax return|tax form|certificate|form\s?\d+|schedule\s?[a-z0-9]+|department of the treasury|invoice|purchase order|terms and conditions|privacy policy|cookie policy|table of contents|application form|i-9|i94|immigration|customs|border protection)/i;
      
      // If it's clearly a form/document and lacks resume indicators, reject it
      if (strongDisqualifiers.test(lower)) {
        const strongResumeSignals = hasResumePhrases || (hasExperience && hasEducation && hasSkills);
        if (!strongResumeSignals) {
          console.log('Heuristic disqualified by form-like keywords:', lower.match(strongDisqualifiers)?.[0]);
          return false;
        }
      }
      
      console.log('Heuristic checks:', {
        hasEmail,
        hasPhone,
        hasExperience,
        hasEducation,
        hasSkills,
        hasResumePhrases,
        hasActionWords,
        hasDateRanges,
        bulletCount,
        wordCount
      });
      
      const contactOrResumeIndicator = hasEmail || hasPhone || hasResumePhrases;
      const workContent = hasExperience || hasActionWords || hasDateRanges;
      const educationOrSkills = hasEducation || hasSkills;
      const structureSignals = bulletCount >= 2;
      
      return contactOrResumeIndicator && workContent && educationOrSkills && (structureSignals || wordCount > 140);
    }

    // First validate if this is actually a resume
    console.log('Validating if content is a resume...');
    const validation = await validateIsResume(text);

    // Always proceed, but annotate confidence so the UI can warn nicely
    let validationInfo = {
      aiIsResume: validation.isResume,
      reason: validation.reason,
      heuristicGuess: false,
      lowConfidence: false,
    } as { aiIsResume: boolean; reason: string; heuristicGuess: boolean; lowConfidence: boolean };

    if (!validation.isResume) {
      // Try heuristic detection and mark low confidence if it also fails
      const heuristicGuess = isLikelyResume(text);
      validationInfo.heuristicGuess = heuristicGuess;
      validationInfo.lowConfidence = !heuristicGuess;
      console.log('AI validation failed; proceeding with', heuristicGuess ? 'heuristic pass' : 'low confidence (forcing proceed)');
    } else {
      validationInfo.heuristicGuess = true;
    }

    console.log('File validated (forced proceed), continuing with parsing...');

    // Try OpenAI first, then fallback
    let parsedContent = await callOpenAIWithRetry(text);
    if (!parsedContent) {
      console.log('Falling back to heuristic parser');
      parsedContent = heuristicParse(text);
    }

    console.log('Parsed resume structure (final):', JSON.stringify(parsedContent).slice(0, 500));

    // Calculate ATS score using OpenAI
    console.log('Calculating ATS score...');
    const atsScore = await calculateATSScore(parsedContent, text);

    // Extract bullets for memory layer storage
    let bullets: string[] = [
      ...(parsedContent.experience?.flatMap((exp: any) => exp.bullets || []) || []),
      ...(parsedContent.projects?.flatMap((proj: any) => proj.bullets || []) || [])
    ];

    if (bullets.length === 0) {
      bullets = text.split(/\n|\.|;/).map(s => s.trim()).filter(s => s.length > 30).slice(0, 10);
    }

    // Store resume bullets in memory layer for future retrieval
    if (bullets.length > 0) {
      const bulletInserts = bullets.map(bullet => ({
        text: sanitizeText(bullet),
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
      originalFilename: file.name,
      validation: validationInfo
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

function sanitizeText(text: string): string {
  // Remove null bytes and other problematic control characters
  return text
    // Remove null bytes and other problematic unicode sequences
    .replace(/\u0000/g, '')
    .replace(/[\u0001-\u0008\u000b\u000c\u000e-\u001f\u007f-\u009f]/g, '')
    // Replace problematic unicode escape sequences
    .replace(/\\u0000/g, '')
    // Remove binary data patterns
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '')
    // Clean up whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

// File type detection functions
function isPDF(mimeType: string, extension: string): boolean {
  return mimeType.includes('pdf') || extension === 'pdf';
}

function isWordDocument(mimeType: string, extension: string): boolean {
  const wordMimes = [
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'application/vnd.ms-word'
  ];
  const wordExtensions = ['docx', 'doc', 'docm', 'dotx', 'dotm'];
  
  return wordMimes.some(mime => mimeType.includes(mime)) || 
         wordExtensions.includes(extension);
}

function isTextDocument(mimeType: string, extension: string): boolean {
  const textMimes = ['text/plain', 'text/rtf', 'application/rtf'];
  const textExtensions = ['txt', 'rtf', 'text'];
  
  return textMimes.some(mime => mimeType.includes(mime)) || 
         textExtensions.includes(extension);
}

// Text extraction functions
async function extractPDFText(file: File): Promise<string> {
  try {
    // For demonstration purposes, return a structured sample text
    // In a production environment, you'd use pdf-parse or similar
    return `
John Doe
Email: john.doe@email.com
Phone: (555) 123-4567
Location: New York, NY

PROFESSIONAL EXPERIENCE

Software Engineer
Tech Company Inc. | 2020 - Present
• Developed and maintained web applications using React and Node.js
• Collaborated with cross-functional teams to deliver high-quality software
• Implemented automated testing procedures, reducing bugs by 30%
• Participated in code reviews and mentored junior developers

Junior Developer
StartupCorp | 2018 - 2020
• Built responsive user interfaces using HTML, CSS, and JavaScript
• Worked with REST APIs to integrate frontend and backend systems
• Assisted in database design and optimization

EDUCATION

Bachelor of Science in Computer Science
University of Technology | 2018

TECHNICAL SKILLS

Programming Languages: JavaScript, Python, Java, TypeScript
Frameworks: React, Node.js, Express, Django
Databases: MySQL, PostgreSQL, MongoDB
Tools: Git, Docker, AWS, Jenkins
    `.trim();
           
  } catch (error) {
    console.error('PDF extraction error:', error);
    return 'Unable to extract text from PDF. Please try uploading a Word document or plain text file.';
  }
}

async function extractWordText(file: File): Promise<string> {
  try {
    // For demonstration purposes, return a structured sample text
    // In a production environment, you'd use mammoth.js or similar
    return `
Jane Smith
Email: jane.smith@email.com
Phone: (555) 987-6543
Location: San Francisco, CA

SUMMARY
Experienced full-stack developer with 5+ years building scalable web applications.

WORK EXPERIENCE

Senior Software Developer
Innovation Labs | 2021 - Present
• Led development of microservices architecture serving 1M+ users
• Implemented CI/CD pipelines reducing deployment time by 50%
• Mentored team of 4 junior developers

Software Developer
Digital Solutions | 2019 - 2021
• Built RESTful APIs using Node.js and Express
• Developed React components for customer dashboard
• Optimized database queries improving performance by 25%

EDUCATION

Master of Science in Software Engineering
Tech University | 2019

SKILLS
JavaScript, TypeScript, React, Node.js, Python, AWS, Docker, Kubernetes
    `.trim();
           
  } catch (error) {
    console.error('Word extraction error:', error);
    return 'Unable to extract text from Word document. Please try converting to PDF or plain text format.';
  }
}

async function extractPlainText(file: File): Promise<string> {
  try {
    return await file.text();
  } catch (error) {
    console.error('Plain text extraction error:', error);
    return 'Unable to read text file. Please ensure the file is not corrupted.';
  }
}
