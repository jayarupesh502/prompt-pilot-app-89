import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Upload, FileText, Target, Brain, CheckCircle, ArrowRight, RotateCcw, AlertCircle } from 'lucide-react';

// New components
import { ResumeUpload } from '@/components/resume/ResumeUpload';
import { JobDescriptionInput } from '@/components/job/JobDescriptionInput';
import { JobAnalysisResults } from '@/components/job/JobAnalysisResults';
import { TailoringInterface } from '@/components/tailoring/TailoringInterface';
import { ResumePreview } from '@/components/resume/ResumePreview';
import { useResumeParser } from '@/hooks/useResumeParser';
import { useAuthStore } from '@/stores/authStore';

type WorkflowStep = 'upload' | 'job-analysis' | 'tailoring' | 'review' | 'complete';

const ResumeBuilder: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<WorkflowStep>('upload');
  const [resumeData, setResumeData] = useState<any>(null);
  const [jobData, setJobData] = useState<any>(null);
  const [tailoringResult, setTailoringResult] = useState<any>(null);
  const [workflowProgress, setWorkflowProgress] = useState(0);
  const [resumeText, setResumeText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const { isGuest, user, guestSessionId, createGuestSession } = useAuthStore();
  const { calculateAtsScore, isLoading, parseJobDescription } = useResumeParser();

  // Create guest session if user is guest and no session exists
  useEffect(() => {
    if (isGuest && !guestSessionId) {
      createGuestSession();
    }
  }, [isGuest, guestSessionId, createGuestSession]);

  // Update progress based on current step
  useEffect(() => {
    const progressMap = {
      'upload': 20,
      'job-analysis': 40,
      'tailoring': 60,
      'review': 80,
      'complete': 100
    };
    setWorkflowProgress(progressMap[currentStep]);
  }, [currentStep]);

  // Calculate ATS score when both resume and job are available
  useEffect(() => {
    const calculateJobSpecificATS = async () => {
      if (!resumeData || !jobData || currentStep !== 'job-analysis') return;
      
      const result = await calculateAtsScore(
        resumeData.parsed_content, 
        jobData.parsed_content || jobData.parsedContent
      );
      
      if (result) {
        setResumeData(prev => ({
          ...prev,
          jobSpecificScore: result.score,
          analysis: result.analysis
        }));
      }
    };

    calculateJobSpecificATS();
  }, [resumeData?.id, jobData?.id, currentStep]);

  const handleResumeUploaded = (resume: any) => {
    setResumeData(resume);
    setCurrentStep('job-analysis');
  };

  const handleResumeTextSubmit = async () => {
    if (!resumeText.trim()) return;
    
    setIsProcessing(true);
    try {
      // Create a mock parsed resume structure from the text
      const mockResume = {
        id: `text_${Date.now()}`,
        title: 'Pasted Resume',
        parsed_content: {
          profile: { name: '', email: '', phone: '', location: '', summary: resumeText },
          experience: [],
          education: [],
          skills: [],
          projects: []
        },
        ats_score: 50, // Default score
        created_at: new Date().toISOString(),
        originalFilename: 'pasted-resume.txt'
      };

      setResumeData(mockResume);
      setCurrentStep('job-analysis');
    } catch (error) {
      console.error('Error processing resume text:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleJobAnalyzed = (job: any) => {
    setJobData(job);
    setCurrentStep('tailoring');
  };

  const handleTailoringComplete = (result: any) => {
    setTailoringResult(result);
    setCurrentStep('review');
  };

  const resetWorkflow = () => {
    setCurrentStep('upload');
    setResumeData(null);
    setJobData(null);
    setResumeText('');
    setIsProcessing(false);
  };

  const getStepStatus = (step: WorkflowStep) => {
    const steps: WorkflowStep[] = ['upload', 'job-analysis', 'tailoring', 'review', 'complete'];
    const currentIndex = steps.indexOf(currentStep);
    const stepIndex = steps.indexOf(step);
    
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'current';
    return 'upcoming';
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold hero-gradient">AI Resume Builder</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Upload your resume, analyze it against a job posting, and get AI-powered tailoring suggestions
        </p>
        
        {/* Workflow Progress */}
        <Card className="max-w-4xl mx-auto">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Progress</span>
                <span className="text-muted-foreground">{workflowProgress}%</span>
              </div>
              <Progress value={workflowProgress} className="w-full" />
              
              {/* Step indicators */}
              <div className="flex items-center justify-between">
                {[
                  { key: 'upload', label: 'Upload Resume', icon: Upload },
                  { key: 'job-analysis', label: 'Job Analysis', icon: FileText },
                  { key: 'tailoring', label: 'AI Tailoring', icon: Brain },
                  { key: 'review', label: 'Review & Export', icon: CheckCircle }
                ].map(({ key, label, icon: Icon }, index) => {
                  const status = getStepStatus(key as WorkflowStep);
                  return (
                    <div key={key} className="flex flex-col items-center space-y-2">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                        status === 'completed' ? 'bg-emerald-500 border-emerald-500 text-white' :
                        status === 'current' ? 'bg-accent border-accent text-white' :
                        'bg-muted border-muted-foreground/30 text-muted-foreground'
                      }`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className={`text-xs font-medium ${
                        status === 'current' ? 'text-accent' : 'text-muted-foreground'
                      }`}>
                        {label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-12 gap-8">
        {/* Left Column - Main Workflow */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Step 1: Resume Upload */}
          {currentStep === 'upload' && (
            <div className="space-y-6">
              {/* Commented out file upload for now */}
              {/* <ResumeUpload onUploadSuccess={handleResumeUploaded} /> */}
              
              {/* Text input for resume content */}
              <Card>
                <CardHeader>
                  <CardTitle>Paste Your Resume Text</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    placeholder="Paste your resume content here..."
                    value={resumeText}
                    onChange={(e) => setResumeText(e.target.value)}
                    className="min-h-[300px] font-mono text-sm"
                  />
                  <Button 
                    onClick={handleResumeTextSubmit}
                    disabled={!resumeText.trim() || isProcessing}
                    className="w-full"
                  >
                    {isProcessing ? 'Processing...' : 'Process Resume Text'}
                  </Button>
                </CardContent>
              </Card>
              
              {isGuest && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Guest Mode:</strong> Your resume will be stored for 7 days. 
                    <Button variant="link" className="p-0 h-auto font-normal underline ml-1" onClick={() => window.location.href = '/auth'}>
                      Sign up for permanent storage
                    </Button>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Step 2: Job Analysis */}
          {currentStep === 'job-analysis' && resumeData && (
            <div className="space-y-6">
              <Card className="premium-card">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-emerald-500" />
                      Resume Uploaded Successfully
                    </span>
                    <Button variant="outline" size="sm" onClick={resetWorkflow}>
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Start Over
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-accent/10 rounded-lg">
                      <div className="text-2xl font-bold text-accent">
                        {resumeData.ats_score || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">Base ATS Score</div>
                    </div>
                    <div className="text-center p-4 bg-accent/10 rounded-lg">
                      <div className="text-2xl font-bold text-accent">
                        {resumeData.parsed_content?.experience?.length || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">Experiences</div>
                    </div>
                    <div className="text-center p-4 bg-accent/10 rounded-lg">
                      <div className="text-2xl font-bold text-accent">
                        {resumeData.parsed_content?.skills?.length || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">Skills</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <JobDescriptionInput onAnalysisComplete={handleJobAnalyzed} />
            </div>
          )}

          {/* Step 3: Tailoring */}
          {currentStep === 'tailoring' && resumeData && jobData && (
            <div className="space-y-6">
              <Card className="premium-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-accent" />
                    Job Match Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-2">Job Requirements</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Required Skills:</span>
                          <Badge>{jobData.required_skills?.length || 0}</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Tech Stack:</span>
                          <Badge>{jobData.tech_stack?.length || 0}</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Keywords:</span>
                          <Badge>{jobData.keywords?.length || 0}</Badge>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">ATS Score</h4>
                      <div className="text-center p-4 bg-gradient-to-r from-accent/10 to-primary/10 rounded-lg">
                        <div className="text-3xl font-bold text-accent">
                          {resumeData.jobSpecificScore || resumeData.ats_score || 0}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Job-Specific Score
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <TailoringInterface 
                resume={resumeData}
                jobDescription={jobData}
              />
            </div>
          )}

          {/* Step 4: Review */}
          {currentStep === 'review' && resumeData && jobData && tailoringResult && (
            <div className="space-y-6">
              <Card className="premium-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                    Tailoring Complete!
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-emerald-50 rounded-lg">
                      <div className="text-2xl font-bold text-emerald-600">
                        {tailoringResult.diffs?.length || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">Improvements</div>
                    </div>
                    <div className="text-center p-4 bg-emerald-50 rounded-lg">
                      <div className="text-2xl font-bold text-emerald-600">
                        +{tailoringResult.atsScoreImprovement || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">ATS Score Boost</div>
                    </div>
                    <div className="text-center p-4 bg-emerald-50 rounded-lg">
                      <div className="text-2xl font-bold text-emerald-600">
                        {Math.round((tailoringResult.diffs?.length || 0) / (resumeData.parsed_content?.experience?.length || 1) * 100)}%
                      </div>
                      <div className="text-sm text-muted-foreground">Enhanced</div>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex justify-center">
                    <Button onClick={() => setCurrentStep('complete')} className="btn-primary">
                      <ArrowRight className="w-4 h-4 mr-2" />
                      Complete Workflow
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 5: Complete */}
          {currentStep === 'complete' && (
            <Card className="premium-card text-center">
              <CardContent className="p-8">
                <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
                <h3 className="text-2xl font-bold mb-2">Resume Optimization Complete!</h3>
                <p className="text-muted-foreground mb-6">
                  Your resume has been successfully tailored for this job. You can export it or start a new optimization.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button onClick={() => window.location.href = '/dashboard'} className="btn-primary">
                    View Dashboard
                  </Button>
                  <Button onClick={resetWorkflow} variant="outline">
                    Optimize Another Resume
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Resume Preview */}
        <div className="lg:col-span-4">
          {resumeData && (
            <div className="sticky top-6">
              <ResumePreview 
                resume={resumeData.parsed_content}
                atsScore={resumeData.jobSpecificScore || resumeData.ats_score}
                isCalculatingATS={isLoading}
              />
              
              {jobData && (
                <Card className="mt-4 premium-card">
                  <CardHeader>
                    <CardTitle className="text-lg">Job Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <JobAnalysisResults jobData={jobData} />
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResumeBuilder;