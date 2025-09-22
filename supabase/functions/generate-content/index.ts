import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { resumeContent, jobDescription, type = 'cover_letter' } = await req.json();

    if (!resumeContent || !jobDescription) {
      throw new Error('Resume content and job description are required');
    }

    console.log('Generating content, type:', type);

    let systemPrompt = '';
    let userPrompt = '';

    if (type === 'cover_letter') {
      systemPrompt = `You are an expert cover letter writer. Create a compelling, personalized cover letter that:
1. Demonstrates genuine interest in the specific company and role
2. Highlights relevant experience from the resume
3. Shows clear value proposition
4. Maintains professional yet engaging tone
5. Is concise (3-4 paragraphs maximum)

Format as a proper business letter with placeholders for [Company Name], [Hiring Manager], [Your Name], etc.
Do not fabricate specific details not present in the resume.`;

      userPrompt = `Create a cover letter for this position:

JOB DESCRIPTION:
${jobDescription.title} at ${jobDescription.company}
${jobDescription.rawContent}

RESUME:
${JSON.stringify(resumeContent, null, 2)}`;
    } else if (type === 'linkedin_summary') {
      systemPrompt = `You are a LinkedIn profile optimization expert. Create a compelling LinkedIn summary that:
1. Starts with a strong hook
2. Highlights key achievements and skills
3. Shows personality and professional brand
4. Uses relevant keywords for SEO
5. Ends with a call to action
6. Is 3-5 sentences maximum
7. Written in first person

Make it engaging and professional while staying truthful to the resume content.`;

      userPrompt = `Create a LinkedIn summary based on this resume:

${JSON.stringify(resumeContent, null, 2)}

Target keywords from this job description:
${jobDescription.rawContent}`;
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 1000,
        temperature: 0.7
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const generatedContent = data.choices[0].message.content;

    console.log('Generated content successfully');

    return new Response(JSON.stringify({
      success: true,
      content: generatedContent,
      type,
      generatedAt: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-content function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});