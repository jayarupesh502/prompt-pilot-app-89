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

    // Enhanced heuristic resume detector with stricter validation
    function isLikelyResume(input: string): boolean {
      const lower = input.toLowerCase();
      const hasEmail = /[\w.+-]+@\w+\.[\w.-]+/.test(input);
      const hasPhone = /\+?\d[\d\s().-]{7,}/.test(input);
      const hasExperience = /(experience|work|employment|job|position|role|developer|engineer|manager|analyst|coordinator|specialist|director|lead)/i.test(lower);
      const hasEducation = /(education|university|college|bachelor|master|degree|diploma|certification|school)/i.test(lower);
      const hasSkills = /(skills|technical|programming|software|tools|technologies|languages|frameworks)/i.test(lower);
      const hasResumePhrases = /(resume|cv|curriculum vitae)/i.test(lower);
      const hasActionWords = /(developed|managed|created|implemented|designed|built|led|coordinated|achieved|improved|responsible for|worked on)/i.test(lower);
      const hasDateRanges = /(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)\.?\s?\d{4}\s*[-–]\s*(present|\w+\.?\s?\d{4})|\b\d{4}\s*[-–]\s*(present|\d{4})/i.test(lower);
      const bulletCount = (input.match(/(^|\n)\s*[-•·]/g) || []).length;
      const wordCount = input.trim().split(/\s+/).length;
      
      // Strong disqualifiers for common non-resume documents
      const strongDisqualifiers = /(withholding|\bw-?4\b|internal revenue service|irs|tax|certificate|form\s?\d+|schedule\s?[a-z0-9]+|department of the treasury|invoice|purchase order|terms and conditions|privacy policy|cookie policy|table of contents|application form|agreement|contract|license|manual|handbook|report|specification|requirements|documentation)/i;
      
      // Additional common file types that aren't resumes
      const fileTypeDisqualifiers = /(readme|installation|tutorial|guide|how[\s-]?to|faq|frequently asked|about us|company overview|product description|service agreement|user manual)/i;
      
      // Check for too many form fields or technical specs
      const formFieldCount = (input.match(/\b(field|input|checkbox|radio|dropdown|select|option|required|optional)\b/gi) || []).length;
      const technicalSpecCount = (input.match(/\b(api|endpoint|method|parameter|response|request|json|xml|protocol|specification)\b/gi) || []).length;
      
      // Hard disqualify documents that are clearly not resumes
      if (strongDisqualifiers.test(lower)) {
        console.log('Heuristic disqualified by strong disqualifier keywords');
        return false;
      }
      
      if (fileTypeDisqualifiers.test(lower)) {
        console.log('Heuristic disqualified by file type keywords');
        return false;
      }
      
      if (formFieldCount > 5) {
        console.log('Heuristic disqualified by too many form fields');
        return false;
      }
      
      if (technicalSpecCount > 10 && !hasExperience) {
        console.log('Heuristic disqualified by technical specification patterns');
        return false;
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
        wordCount,
        formFieldCount,
        technicalSpecCount
      });
      
      // Lenient requirements for resume detection - accept if any reasonable combination
      const hasContactInfo = hasEmail || hasPhone;
      const hasWorkIndicators = hasExperience || hasActionWords || hasDateRanges;
      const hasEducationOrSkills = hasEducation || hasSkills;
      const hasProperStructure = bulletCount >= 1 || hasResumePhrases;
      const hasReasonableLength = wordCount >= 50 && wordCount <= 10000;
      
      // Accept if we have contact + work OR education + reasonable length
      // OR if it has explicit resume phrases
      const isResume = hasResumePhrases || 
                      (hasReasonableLength && (
                        (hasContactInfo && (hasWorkIndicators || hasEducationOrSkills)) ||
                        (hasWorkIndicators && hasEducationOrSkills) ||
                        (hasContactInfo && hasProperStructure)
                      ));
      
      console.log(`Resume detection: result: ${isResume}`);
      console.log('Detection factors:', { hasContactInfo, hasWorkIndicators, hasEducationOrSkills, hasProperStructure, hasReasonableLength, hasResumePhrases });
      
      return isResume;
    }

    // First validate if this is actually a resume
    console.log('Validating if content is a resume...');
    const validation = await validateIsResume(text);
    const heuristicGuess = isLikelyResume(text);

    let proceedAsResume = validation.isResume;
    if (!proceedAsResume) {
      // Fallback to heuristic detection if AI validation fails
      if (!heuristicGuess) {
        console.log('File is not a resume:', validation.reason);
        return new Response(JSON.stringify({
          success: false,
          error: 'This file does not appear to be a resume.',
          reason: validation.reason || 'Heuristic checks failed',
          suggestion: 'Please upload a document that contains work experience, education, and contact information.',
          diagnostics: { heuristic: true }
        }), {
          status: 200, // return 200 so the client can show a friendly message
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      proceedAsResume = true;
      console.log('AI validation failed, but heuristic detection indicates a resume. Proceeding...');
    }

    const validationMeta = {
      aiValidated: validation.reason !== 'AI validation skipped - no API key',
      aiIsResume: validation.isResume,
      aiReason: validation.reason,
      heuristicGuess,
    };

    console.log('File validated as resume, proceeding with parsing...');

    // Proceed with parsing
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
      validation: validationMeta
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
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // Convert to string safely
    let text = '';
    try {
      // Try UTF-8 first
      const decoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: false });
      text = decoder.decode(uint8Array);
    } catch {
      // Fallback to latin1 if UTF-8 fails
      const decoder = new TextDecoder('latin1', { ignoreBOM: true, fatal: false });
      text = decoder.decode(uint8Array);
    }
    
    // Extract text patterns commonly found in PDFs
    const patterns = [
      // Text in parentheses (common PDF text encoding)
      /\(([^)]+)\)/g,
      // Text after Tj or TJ operators
      /(?:Tj|TJ)\s*(.+?)(?:\s+|$)/g,
      // Text in brackets
      /\[([^\]]+)\]/g,
      // Simple text patterns
      /[A-Za-z][A-Za-z0-9\s,.\-@()]{10,}/g
    ];
    
    let extractedText = '';
    for (const pattern of patterns) {
      const matches = text.match(pattern);
      if (matches && matches.length > 0) {
        extractedText += matches.map(match => {
          // Clean up the match
          return match.replace(/[()[\]]/g, '').trim();
        }).join(' ') + ' ';
      }
    }
    
    // If no patterns worked, try to extract readable ASCII text
    if (extractedText.trim().length < 50) {
      extractedText = text.replace(/[^\x20-\x7E\n\r\t]/g, ' ').replace(/\s+/g, ' ');
    }
    
    return extractedText.length > 50 ? extractedText : 
           'PDF text extraction was limited. Please try converting your PDF to a Word document or plain text for better results.';
           
  } catch (error) {
    console.error('PDF extraction error:', error);
    return 'Unable to extract text from PDF. Please try uploading a Word document or plain text file.';
  }
}

async function extractWordText(file: File): Promise<string> {
  try {
    // For Word documents, try to read as text first
    // This works for simple .doc files and some .docx files
    const text = await file.text();
    
    // If we get readable text, return it
    if (text && text.length > 50 && /[a-zA-Z]/.test(text)) {
      return text;
    }
    
    // If direct text reading doesn't work, try to extract from binary
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    const decoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: false });
    const rawText = decoder.decode(uint8Array);
    
    // Extract readable text patterns
    const readableText = rawText.replace(/[^\x20-\x7E\n\r\t]/g, ' ').replace(/\s+/g, ' ');
    
    return readableText.length > 50 ? readableText : 
           'Word document text extraction was limited. Please try saving your document as a plain text file or PDF.';
           
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