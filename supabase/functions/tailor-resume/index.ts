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
    const { 
      resumeContent, 
      jobDescription, 
      mode = 'fast',
      isGuest = false,
      guestSessionId,
      userId 
    } = await req.json();

    if (!resumeContent || !jobDescription) {
      throw new Error('Resume content and job description are required');
    }

    console.log('Tailoring resume, mode:', mode);

    // Retrieve relevant bullets from memory layer using semantic search
    const retrievedBullets = await retrieveRelevantBullets(
      jobDescription.parsedContent,
      isGuest,
      guestSessionId,
      userId
    );

    console.log('Retrieved bullets for enhancement:', retrievedBullets.length);

    let systemPrompt = `You are an expert resume tailoring AI. Your job is to rewrite resume bullets to be more ATS-friendly and job-specific while maintaining truthfulness.

RULES:
1. NEVER fabricate companies, dates, or responsibilities
2. Only enhance existing experiences with better wording
3. Tag any external suggestions with [SUGGESTED] 
4. Focus on keywords from the job description
5. Use strong action verbs and quantifiable metrics
6. Return changes in JSON diff format

Job Requirements: ${JSON.stringify(jobDescription.parsedContent.requirements)}
Tech Stack: ${JSON.stringify(jobDescription.parsedContent.tech_stack)}

Return ONLY valid JSON in this format:
{
  "changes": [
    {
      "section": "experience|projects|skills",
      "index": 0,
      "field": "bullets|title|description", 
      "original": "original text",
      "suggested": "improved text",
      "reasoning": "why this change improves ATS score",
      "confidence": 0.85,
      "isExternal": false
    }
  ],
  "atsImprovements": {
    "keywordMatches": 15,
    "estimatedScoreIncrease": 25,
    "missingKeywords": ["keyword1", "keyword2"]
  }
}`;

    if (mode === 'assistive') {
      systemPrompt += '\n\nASK clarifying questions if you need more context about specific experiences before making suggestions.';
    }

    // Include retrieved bullets as potential enhancements
    if (retrievedBullets.length > 0) {
      systemPrompt += `\n\nAdditional bullets from memory for inspiration (mark as [SUGGESTED]):\n${retrievedBullets.map(b => `- ${b.text} (impact: ${b.impact_score})`).join('\n')}`;
    }

    const tailorResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-2025-08-07',
        messages: [
          { role: 'system', content: systemPrompt },
          { 
            role: 'user', 
            content: `Tailor this resume for the job:\n\nRESUME:\n${JSON.stringify(resumeContent, null, 2)}\n\nJOB DESCRIPTION:\n${jobDescription.rawContent}` 
          }
        ],
        max_completion_tokens: 2000,
        response_format: { type: "json_object" }
      }),
    });

    if (!tailorResponse.ok) {
      throw new Error(`OpenAI API error: ${tailorResponse.statusText}`);
    }

    const tailorData = await tailorResponse.json();
    const suggestions = JSON.parse(tailorData.choices[0].message.content);

    console.log('Generated suggestions:', suggestions.changes?.length || 0);

    // Calculate new ATS score
    const newAtsScore = calculateNewAtsScore(resumeContent, jobDescription.parsedContent, suggestions);

    return new Response(JSON.stringify({
      success: true,
      suggestions,
      newAtsScore,
      mode,
      retrievedBulletsCount: retrievedBullets.length,
      processingTime: Date.now()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in tailor-resume function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function retrieveRelevantBullets(
  jobContent: any,
  isGuest: boolean,
  guestSessionId?: string,
  userId?: string
): Promise<any[]> {
  try {
    // Get all required and preferred skills for matching
    const targetSkills = [
      ...(jobContent.requirements?.required_skills || []),
      ...(jobContent.requirements?.preferred_skills || []),
      ...(jobContent.tech_stack || [])
    ];

    let query = supabase
      .from('resume_bullets')
      .select('*')
      .order('impact_score', { ascending: false })
      .limit(10);

    if (isGuest && guestSessionId) {
      query = query.eq('is_guest', true).eq('guest_session_id', guestSessionId);
    } else if (userId) {
      query = query.eq('user_id', userId).eq('is_guest', false);
    }

    const { data: bullets, error } = await query;

    if (error) {
      console.error('Error retrieving bullets:', error);
      return [];
    }

    // Filter bullets by skill relevance
    const relevantBullets = (bullets || []).filter(bullet => {
      const bulletSkills = bullet.skills || [];
      const hasRelevantSkill = targetSkills.some(skill => 
        bulletSkills.some((bulletSkill: string) => 
          bulletSkill.toLowerCase().includes(skill.toLowerCase()) ||
          skill.toLowerCase().includes(bulletSkill.toLowerCase())
        )
      );
      return hasRelevantSkill || bullet.impact_score >= 7;
    });

    return relevantBullets.slice(0, 5); // Return top 5 most relevant

  } catch (error) {
    console.error('Error in retrieveRelevantBullets:', error);
    return [];
  }
}

function calculateNewAtsScore(
  resumeContent: any,
  jobContent: any,
  suggestions: any
): number {
  let score = 60; // Base score

  const jobKeywords = [
    ...(jobContent.requirements?.required_skills || []),
    ...(jobContent.requirements?.preferred_skills || []),
    ...(jobContent.tech_stack || []),
    ...(jobContent.keywords || [])
  ].map(k => k.toLowerCase());

  // Count keyword matches in suggested content
  let keywordMatches = 0;
  suggestions.changes?.forEach((change: any) => {
    const suggestedText = change.suggested.toLowerCase();
    jobKeywords.forEach(keyword => {
      if (suggestedText.includes(keyword.toLowerCase())) {
        keywordMatches++;
      }
    });
  });

  // Calculate score improvements
  score += Math.min(30, keywordMatches * 2); // Up to 30 points for keywords
  score += (suggestions.changes?.length || 0) * 2; // 2 points per improvement
  
  return Math.min(100, Math.round(score));
}