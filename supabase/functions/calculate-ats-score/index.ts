import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { resumeContent, jobDescription, rawResumeText } = await req.json();

    if (!resumeContent || !jobDescription) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Both resume content and job description are required' 
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Calculating ATS score with job-specific context');

    let atsScore = 50; // Default fallback

    // Try AI-powered scoring first
    if (openAIApiKey) {
      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
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
                content: `You are an ATS (Applicant Tracking System) analyzer. Compare this resume against the specific job description and provide a compatibility score from 0-100.

Consider these factors:
- Keyword matching between resume and job requirements
- Relevant skills alignment with job tech stack
- Experience level matching job requirements
- Education requirements fulfillment
- Industry and domain experience relevance
- Technical skills overlap
- Years of experience alignment
- Job title and role progression match

Return ONLY a JSON object:
{
  "score": number (0-100),
  "matchingKeywords": ["string"],
  "missingKeywords": ["string"],
  "strengths": ["string"],
  "improvements": ["string"]
}`
              },
              {
                role: 'user',
                content: `Compare this resume against the job description:

JOB DESCRIPTION:
${JSON.stringify(jobDescription)}

RESUME DATA:
${JSON.stringify(resumeContent)}

RAW RESUME TEXT:
${rawResumeText?.slice(0, 3000) || 'Not available'}`
              }
            ],
            max_tokens: 700,
            temperature: 0.1
          }),
        });

        if (response.ok) {
          const data = await response.json();
          try {
            const result = JSON.parse(data.choices[0].message.content);
            const aiScore = Number(result.score);
            if (!Number.isNaN(aiScore) && aiScore >= 0 && aiScore <= 100) {
              console.log('AI ATS score calculated:', aiScore);
              return new Response(
                JSON.stringify({ 
                  success: true, 
                  atsScore: aiScore,
                  analysis: {
                    matchingKeywords: result.matchingKeywords || [],
                    missingKeywords: result.missingKeywords || [],
                    strengths: result.strengths || [],
                    improvements: result.improvements || []
                  }
                }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
              );
            }
          } catch (parseError) {
            console.error('Failed to parse AI response:', parseError);
          }
        } else {
          const errorText = await response.text();
          console.error('OpenAI API error:', response.status, errorText);
        }
      } catch (error) {
        console.error('AI scoring error:', error);
      }
    }

    // Fallback to heuristic scoring with job context
    console.log('Using heuristic scoring with job context');
    
    const resumeText = rawResumeText?.toLowerCase() || '';
    const jobText = (jobDescription.raw_content || jobDescription.description || '').toLowerCase();
    
    // Extract key requirements from job
    const jobSkills = jobDescription.parsed_content?.skills || [];
    const jobRequirements = jobDescription.parsed_content?.requirements || [];
    
    // Basic heuristic scoring
    let heuristicScore = 40; // Base score
    
    // Skill matching (30 points max)
    const resumeSkills = resumeContent.skills || [];
    let skillMatches = 0;
    let totalJobSkills = jobSkills.length;
    
    if (totalJobSkills > 0) {
      jobSkills.forEach((skill: string) => {
        const skillLower = skill.toLowerCase();
        const hasSkill = resumeSkills.some((rSkill: string) => 
          rSkill.toLowerCase().includes(skillLower) || skillLower.includes(rSkill.toLowerCase())
        ) || resumeText.includes(skillLower);
        
        if (hasSkill) skillMatches++;
      });
      
      const skillMatchPercentage = skillMatches / totalJobSkills;
      heuristicScore += Math.round(skillMatchPercentage * 30);
    } else {
      heuristicScore += 15; // Give some points if no skills specified
    }
    
    // Experience relevance (20 points max)
    const hasRelevantExperience = resumeContent.experience?.some((exp: any) => {
      const expText = (exp.title + ' ' + exp.description + ' ' + (exp.bullets?.join(' ') || '')).toLowerCase();
      return jobText.split(' ').some((word: string) => 
        word.length > 3 && expText.includes(word)
      );
    });
    
    if (hasRelevantExperience) heuristicScore += 20;
    else heuristicScore += 5;
    
    // Education match (10 points max)
    const jobEducation = jobDescription.parsed_content?.education?.toLowerCase() || '';
    const resumeEducation = resumeContent.education?.map((edu: any) => 
      (edu.degree + ' ' + edu.field + ' ' + edu.school).toLowerCase()
    ).join(' ') || '';
    
    if (jobEducation && resumeEducation) {
      const educationMatch = jobEducation.split(' ').some((word: string) =>
        word.length > 3 && resumeEducation.includes(word)
      );
      heuristicScore += educationMatch ? 10 : 3;
    } else {
      heuristicScore += 5;
    }
    
    // Ensure score is within bounds
    atsScore = Math.min(100, Math.max(0, heuristicScore));
    
    console.log('Heuristic ATS score calculated:', atsScore);

    return new Response(
      JSON.stringify({ 
        success: true, 
        atsScore,
        analysis: {
          matchingKeywords: [`${skillMatches}/${totalJobSkills} skills matched`],
          missingKeywords: ['Calculated using heuristic method'],
          strengths: ['Basic resume structure detected'],
          improvements: ['Consider adding more job-specific keywords']
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('ATS calculation error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Failed to calculate ATS score',
        details: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});