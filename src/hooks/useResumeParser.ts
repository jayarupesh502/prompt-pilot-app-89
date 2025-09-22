import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { toast } from '@/hooks/use-toast';

interface ParsedResume {
  id: string;
  title: string;
  parsed_content: any;
  ats_score: number;
  created_at: string;
}

export const useResumeParser = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, isGuest, guestSessionId } = useAuthStore();

  const parseResume = async (file: File): Promise<any | null> => {
    setIsLoading(true);
    setError(null);

    try {
      // Create FormData to send the file to the edge function
      const formData = new FormData();
      formData.append('file', file);
      formData.append('isGuest', isGuest.toString());
      if (isGuest && guestSessionId) {
        formData.append('guestSessionId', guestSessionId);
      }

      // Call the parse-resume edge function with the file
      const { data, error: functionError } = await supabase.functions.invoke('parse-resume', {
        body: formData
      });

      if (functionError) {
        throw new Error(functionError.message);
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to parse resume');
      }

      toast({
        title: "Resume parsed successfully!",
        description: "Your resume has been analyzed.",
      });

      return data;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to parse resume';
      setError(errorMessage);
      
      toast({
        title: "Parsing failed",
        description: errorMessage,
        variant: "destructive",
      });
      
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const parseJobDescription = async (jobText: string, sourceUrl?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: functionError } = await supabase.functions.invoke('analyze-job', {
        body: {
          jobDescription: jobText,
          sourceUrl,
          userId: user?.id,
          isGuest,
          guestSessionId
        }
      });

      if (functionError) {
        throw new Error(functionError.message);
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to analyze job description');
      }

      toast({
        title: "Job description analyzed!",
        description: "We've extracted key requirements and skills.",
      });

      return data.jobDescription;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to analyze job description';
      setError(errorMessage);
      
      toast({
        title: "Analysis failed",
        description: errorMessage,
        variant: "destructive",
      });
      
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const tailorResume = async (resumeId: string, jobDescriptionId: string, mode: 'fast' | 'assistive' = 'fast') => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: functionError } = await supabase.functions.invoke('tailor-resume', {
        body: {
          resumeId,
          jobDescriptionId,
          mode,
          userId: user?.id,
          isGuest,
          guestSessionId
        }
      });

      if (functionError) {
        throw new Error(functionError.message);
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to tailor resume');
      }

      toast({
        title: "Resume tailored successfully!",
        description: `Generated ${data.diffs?.length || 0} suggestions for improvement.`,
      });

      return data;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to tailor resume';
      setError(errorMessage);
      
      toast({
        title: "Tailoring failed",
        description: errorMessage,
        variant: "destructive",
      });
      
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const calculateAtsScore = async (resumeContent: any, jobRequirements: any) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: functionError } = await supabase.functions.invoke('calculate-ats-score', {
        body: {
          resumeContent,
          jobRequirements
        }
      });

      if (functionError) {
        throw new Error(functionError.message);
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to calculate ATS score');
      }

      return data;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to calculate ATS score';
      setError(errorMessage);
      
      toast({
        title: "Score calculation failed",
        description: errorMessage,
        variant: "destructive",
      });
      
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const exportResume = async (resumeContent: any, format: 'pdf' | 'docx' | 'txt') => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: functionError } = await supabase.functions.invoke('generate-export', {
        body: {
          resumeContent,
          format,
          isGuest
        }
      });

      if (functionError) {
        throw new Error(functionError.message);
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to export resume');
      }

      // Create and download the file
      const blob = new Blob([data.content], { type: data.contentType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = data.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Export successful!",
        description: `Your resume has been downloaded as ${format.toUpperCase()}.`,
      });

      return true;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to export resume';
      setError(errorMessage);
      
      toast({
        title: "Export failed",
        description: errorMessage,
        variant: "destructive",
      });
      
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    parseResume,
    parseJobDescription,
    tailorResume,
    calculateAtsScore,
    exportResume,
    isLoading,
    error
  };
};