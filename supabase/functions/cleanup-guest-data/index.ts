import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseKey);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Running guest data cleanup...');

    // Delete expired guest resume bullets
    const { error: bulletsError } = await supabase
      .from('resume_bullets')
      .delete()
      .eq('is_guest', true)
      .lt('expires_at', new Date().toISOString());

    if (bulletsError) {
      console.error('Error cleaning bullets:', bulletsError);
    } else {
      console.log('Cleaned expired guest resume bullets');
    }

    // Delete expired guest tailoring sessions
    const { error: sessionsError } = await supabase
      .from('tailoring_sessions')
      .delete()
      .eq('is_guest', true)
      .lt('expires_at', new Date().toISOString());

    if (sessionsError) {
      console.error('Error cleaning sessions:', sessionsError);
    } else {
      console.log('Cleaned expired guest tailoring sessions');
    }

    // Delete expired guest job descriptions
    const { error: jobsError } = await supabase
      .from('job_descriptions')
      .delete()
      .eq('is_guest', true)
      .lt('expires_at', new Date().toISOString());

    if (jobsError) {
      console.error('Error cleaning job descriptions:', jobsError);
    } else {
      console.log('Cleaned expired guest job descriptions');
    }

    // Delete expired guest resumes
    const { error: resumesError } = await supabase
      .from('resumes')
      .delete()
      .eq('is_guest', true)
      .lt('expires_at', new Date().toISOString());

    if (resumesError) {
      console.error('Error cleaning resumes:', resumesError);
    } else {
      console.log('Cleaned expired guest resumes');
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Guest data cleanup completed',
      cleanedAt: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in cleanup-guest-data function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});