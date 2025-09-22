import React, { useState, useEffect } from 'react';
import { ResumeUpload } from '@/components/resume/ResumeUpload';
import { ResumePreview } from '@/components/resume/ResumePreview';
import { JobDescriptionInput } from '@/components/job/JobDescriptionInput';
import { JobAnalysisResults } from '@/components/job/JobAnalysisResults';
import { TailoringInterface } from '@/components/tailoring/TailoringInterface';
import { useResumeStore } from '@/stores/resumeStore';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const ResumeBuilder: React.FC = () => {
  const { currentResume, updateResume } = useResumeStore();
  const [currentJob, setCurrentJob] = useState<any>(null);
  const [isCalculatingATS, setIsCalculatingATS] = useState(false);
  const { toast } = useToast();

  // Calculate ATS score when both resume and job are available
  useEffect(() => {
    const calculateJobSpecificATS = async () => {
      if (!currentResume || !currentJob || isCalculatingATS) return;
      
      setIsCalculatingATS(true);
      
      try {
        const { data, error } = await supabase.functions.invoke('calculate-ats-score', {
          body: {
            resumeContent: currentResume.parsedContent,
            jobDescription: currentJob,
            rawResumeText: currentResume.rawContent || ''
          }
        });

        if (error) throw error;
        
        if (data.success) {
          // Update the resume with the new ATS score
          await updateResume(currentResume.id, {
            atsScore: data.atsScore,
            analysisDetails: data.analysis
          });
          
          toast({
            title: "ATS Score Updated",
            description: `Your resume scores ${data.atsScore}/100 for this job!`,
          });
        }
      } catch (error: any) {
        console.error('ATS calculation failed:', error);
        toast({
          title: "ATS Calculation Failed",
          description: error.message || "Could not calculate job-specific ATS score",
          variant: "destructive"
        });
      } finally {
        setIsCalculatingATS(false);
      }
    };

    calculateJobSpecificATS();
  }, [currentResume?.id, currentJob?.id]);

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">AI Resume Builder</h1>
        <p className="text-muted-foreground">Upload your resume and analyze it against a specific job with AI</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          {!currentResume ? (
            <ResumeUpload />
          ) : (
            <JobDescriptionInput onAnalysisComplete={setCurrentJob} />
          )}
          
          {currentJob && (
            <JobAnalysisResults jobData={currentJob} />
          )}
          
          {currentResume && currentJob && (
            <TailoringInterface 
              resume={currentResume} 
              jobDescription={currentJob}
            />
          )}
        </div>
        
        <div>
          {currentResume && (
            <div className="space-y-4">
              <ResumePreview 
                resume={currentResume.parsedContent}
                atsScore={currentResume.atsScore}
                isCalculatingATS={isCalculatingATS}
              />
              {!currentJob && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    📝 <strong>Next Step:</strong> Enter a job description on the left to get your job-specific ATS score!
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResumeBuilder;