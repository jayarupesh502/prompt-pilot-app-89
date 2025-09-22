import React, { useState } from 'react';
import { ResumeUpload } from '@/components/resume/ResumeUpload';
import { ResumePreview } from '@/components/resume/ResumePreview';
import { JobDescriptionInput } from '@/components/job/JobDescriptionInput';
import { JobAnalysisResults } from '@/components/job/JobAnalysisResults';
import { TailoringInterface } from '@/components/tailoring/TailoringInterface';
import { useResumeStore } from '@/stores/resumeStore';

const ResumeBuilder: React.FC = () => {
  const { currentResume } = useResumeStore();
  const [currentJob, setCurrentJob] = useState<any>(null);

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">AI Resume Builder</h1>
        <p className="text-muted-foreground">Upload your resume and tailor it for any job with AI</p>
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
            <ResumePreview 
              resume={currentResume.parsedContent}
              atsScore={currentResume.atsScore}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ResumeBuilder;