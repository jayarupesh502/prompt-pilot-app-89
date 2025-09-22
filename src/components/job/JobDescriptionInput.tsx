import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { Loader2, Link, FileText, Sparkles } from 'lucide-react';

interface JobDescriptionInputProps {
  onAnalysisComplete?: (jobData: any) => void;
  className?: string;
}

export const JobDescriptionInput: React.FC<JobDescriptionInputProps> = ({
  onAnalysisComplete,
  className = ''
}) => {
  const { toast } = useToast();
  const { isGuest, guestSessionId, user } = useAuthStore();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [jobText, setJobText] = useState('');
  const [jobUrl, setJobUrl] = useState('');
  const [activeTab, setActiveTab] = useState('text');

  const handleAnalyze = async () => {
    if (!jobText.trim()) {
      toast({
        title: "Job description required",
        description: "Please enter a job description to analyze.",
        variant: "destructive"
      });
      return;
    }

    setIsAnalyzing(true);

    try {
      // Call analyze-job edge function
      const { data, error } = await supabase.functions.invoke('analyze-job', {
        body: {
          jobText: jobText.trim(),
          sourceUrl: activeTab === 'url' ? jobUrl : null,
          userId: user?.id,
          isGuest,
          guestSessionId
        }
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || 'Failed to analyze job description');
      }

      toast({
        title: "Job analyzed successfully!",
        description: `Found ${data.keywordCount || 0} keywords and requirements.`,
      });

      // Use the job description data returned from the edge function
      onAnalysisComplete?.(data.jobDescription || {
        parsedContent: data.parsedContent,
        techEquivalents: data.techEquivalents
      });

    } catch (error: any) {
      console.error('Analysis error:', error);
      toast({
        title: "Analysis failed",
        description: error.message || "Failed to analyze job description.",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleUrlFetch = async () => {
    if (!jobUrl.trim()) {
      toast({
        title: "URL required",
        description: "Please enter a job posting URL.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Simple URL validation
      new URL(jobUrl);
      
      toast({
        title: "URL scraping coming soon",
        description: "For now, please copy and paste the job description text.",
      });
      
      setActiveTab('text');
    } catch {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid job posting URL.",
        variant: "destructive"
      });
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center">
          <FileText className="w-5 h-5 mr-2" />
          Job Description Analysis
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="text">Paste Text</TabsTrigger>
            <TabsTrigger value="url">From URL</TabsTrigger>
          </TabsList>
          
          <TabsContent value="text" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="job-text">Job Description</Label>
              <Textarea
                id="job-text"
                placeholder="Paste the complete job description here..."
                value={jobText}
                onChange={(e) => setJobText(e.target.value)}
                rows={12}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Include requirements, responsibilities, and tech stack for best results
              </p>
            </div>
          </TabsContent>
          
          <TabsContent value="url" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="job-url">Job Posting URL</Label>
              <div className="flex space-x-2">
                <Input
                  id="job-url"
                  placeholder="https://company.com/careers/job-id"
                  value={jobUrl}
                  onChange={(e) => setJobUrl(e.target.value)}
                />
                <Button onClick={handleUrlFetch} variant="outline">
                  <Link className="w-4 h-4 mr-2" />
                  Fetch
                </Button>
              </div>
            </div>
            
            <Alert>
              <Sparkles className="h-4 w-4" />
              <AlertDescription>
                URL scraping feature coming soon! For now, copy and paste the job text manually.
              </AlertDescription>
            </Alert>
          </TabsContent>
        </Tabs>

        <Button 
          onClick={handleAnalyze}
          disabled={isAnalyzing || !jobText.trim()}
          className="w-full"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Analyzing Job...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Analyze Job Description
            </>
          )}
        </Button>

        {isGuest && (
          <Alert>
            <AlertDescription>
              As a guest, your job analysis will be stored for 7 days. 
              Sign up to save your analyses permanently.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};