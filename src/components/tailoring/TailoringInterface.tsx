import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { useResumeStore } from '@/stores/resumeStore';
import { Resume, JobDescription } from '@/types';
import { 
  Loader2, 
  Wand2, 
  Zap, 
  MessageSquare,
  ArrowRight,
  TrendingUp,
  Check,
  X
} from 'lucide-react';

interface TailoringInterfaceProps {
  resume: Resume;
  jobDescription: JobDescription;
  onTailoringComplete?: (tailoringData: any) => void;
  className?: string;
}

export const TailoringInterface: React.FC<TailoringInterfaceProps> = ({
  resume,
  jobDescription,
  onTailoringComplete,
  className = ''
}) => {
  const { toast } = useToast();
  const { isGuest, guestSessionId, user } = useAuthStore();
  const [isTailoring, setIsTailoring] = useState(false);
  const [mode, setMode] = useState<'fast' | 'assistive'>('fast');
  const [suggestions, setSuggestions] = useState<any>(null);
  const [acceptedChanges, setAcceptedChanges] = useState<Record<string, boolean>>({});

  const handleTailor = async () => {
    setIsTailoring(true);

    try {
      // Call tailor-resume edge function
      const { data, error } = await supabase.functions.invoke('tailor-resume', {
        body: {
          resumeContent: resume.parsedContent,
          jobDescription: {
            parsedContent: jobDescription.parsedContent,
            rawContent: jobDescription.rawContent
          },
          mode,
          isGuest,
          guestSessionId,
          userId: user?.id
        }
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || 'Failed to tailor resume');
      }

      setSuggestions(data.suggestions);

      // Create tailoring session in database
      const sessionData = {
        resume_id: resume.id,
        job_description_id: jobDescription.id,
        original_content: resume.parsedContent as any,
        suggested_content: data.suggestions as any,
        ats_score_before: resume.atsScore || 0,
        ats_score_after: data.newAtsScore,
        mode,
        is_guest: isGuest,
        ...(isGuest && guestSessionId ? {
          guest_session_id: guestSessionId,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        } : { user_id: user?.id })
      };

      const { data: session, error: sessionError } = await supabase
        .from('tailoring_sessions')
        .insert(sessionData)
        .select()
        .single();

      if (sessionError) throw sessionError;

      toast({
        title: "Resume tailored successfully!",
        description: `Generated ${data.suggestions.changes?.length || 0} improvements. ATS score: ${data.newAtsScore}/100`,
      });

      onTailoringComplete?.({
        session,
        suggestions: data.suggestions,
        newAtsScore: data.newAtsScore
      });

    } catch (error: any) {
      console.error('Tailoring error:', error);
      toast({
        title: "Tailoring failed",
        description: error.message || "Failed to tailor resume.",
        variant: "destructive"
      });
    } finally {
      setIsTailoring(false);
    }
  };

  const handleAcceptChange = (changeId: string, accept: boolean) => {
    setAcceptedChanges(prev => ({
      ...prev,
      [changeId]: accept
    }));
  };

  const handleApplyChanges = async () => {
    if (!suggestions) return;

    // Apply accepted changes to resume content
    let updatedContent = { ...resume.parsedContent };
    
    suggestions.changes?.forEach((change: any, index: number) => {
      const changeId = `${change.section}-${change.index}-${change.field}`;
      
      if (acceptedChanges[changeId]) {
        // Apply the change based on section and field
        if (change.section === 'experience' && updatedContent.experience) {
          if (change.field === 'bullets' && updatedContent.experience[change.index]) {
            // Replace specific bullet point
            const bulletIndex = updatedContent.experience[change.index].bullets?.findIndex(
              (bullet: string) => bullet === change.original
            );
            if (bulletIndex !== -1) {
              updatedContent.experience[change.index].bullets![bulletIndex] = change.suggested;
            }
          }
        }
        // Add more section handling as needed
      }
    });

    // Update resume in database
    try {
      await useResumeStore.getState().updateResume(resume.id, {
        parsedContent: updatedContent,
        atsScore: suggestions.atsImprovements?.estimatedScoreIncrease 
          ? (resume.atsScore || 0) + suggestions.atsImprovements.estimatedScoreIncrease
          : resume.atsScore
      });

      toast({
        title: "Changes applied successfully!",
        description: `Updated resume with ${Object.values(acceptedChanges).filter(Boolean).length} improvements.`,
      });

    } catch (error: any) {
      toast({
        title: "Failed to apply changes",
        description: error.message || "Could not update resume.",
        variant: "destructive"
      });
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Wand2 className="w-5 h-5 mr-2" />
            AI Resume Tailoring
          </div>
          {suggestions && (
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              {suggestions.changes?.length || 0} suggestions
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {!suggestions ? (
          <>
            {/* Mode Selection */}
            <Tabs value={mode} onValueChange={(value) => setMode(value as 'fast' | 'assistive')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="fast" className="flex items-center">
                  <Zap className="w-4 h-4 mr-2" />
                  Fast Mode
                </TabsTrigger>
                <TabsTrigger value="assistive" className="flex items-center">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Assistive Mode
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="fast" className="space-y-2">
                <Alert>
                  <TrendingUp className="h-4 w-4" />
                  <AlertDescription>
                    Automatically optimizes your resume for ATS compatibility and keyword matching. 
                    Perfect for quick applications.
                  </AlertDescription>
                </Alert>
              </TabsContent>
              
              <TabsContent value="assistive" className="space-y-2">
                <Alert>
                  <MessageSquare className="h-4 w-4" />
                  <AlertDescription>
                    Asks clarifying questions about your experience before making suggestions. 
                    More personalized but takes longer.
                  </AlertDescription>
                </Alert>
              </TabsContent>
            </Tabs>

            {/* Job Match Summary */}
            <div className="bg-muted/50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Target Position</h3>
              <p className="text-sm text-muted-foreground mb-3">
                {jobDescription.parsedContent.title} at {jobDescription.parsedContent.company}
              </p>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium">Required Skills</p>
                  <p className="text-muted-foreground">
                    {jobDescription.parsedContent.requirements?.required_skills?.length || 0} skills identified
                  </p>
                </div>
                <div>
                  <p className="font-medium">Current ATS Score</p>
                  <p className="text-muted-foreground">{resume.atsScore || 0}/100</p>
                </div>
              </div>
            </div>

            {/* Tailor Button */}
            <Button 
              onClick={handleTailor}
              disabled={isTailoring}
              className="w-full"
              size="lg"
            >
              {isTailoring ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Tailoring Resume...
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4 mr-2" />
                  Tailor Resume with AI
                </>
              )}
            </Button>
          </>
        ) : (
          <>
            {/* Results */}
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div>
                  <h3 className="font-semibold text-green-800">Tailoring Complete!</h3>
                  <p className="text-sm text-green-600">
                    Projected ATS Score: {suggestions.atsImprovements?.estimatedScoreIncrease 
                      ? (resume.atsScore || 0) + suggestions.atsImprovements.estimatedScoreIncrease
                      : 'N/A'}/100
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-green-600" />
              </div>

              {/* Suggestions List */}
              <div className="space-y-3">
                <h4 className="font-semibold">Review Suggestions</h4>
                {suggestions.changes?.map((change: any, index: number) => {
                  const changeId = `${change.section}-${change.index}-${change.field}`;
                  const isAccepted = acceptedChanges[changeId];
                  
                  return (
                    <Card key={index} className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="text-xs">
                            {change.section} • {change.field}
                          </Badge>
                          <div className="flex items-center space-x-2">
                            <Button
                              size="sm"
                              variant={isAccepted === true ? "default" : "outline"}
                              onClick={() => handleAcceptChange(changeId, true)}
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant={isAccepted === false ? "destructive" : "outline"}
                              onClick={() => handleAcceptChange(changeId, false)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div>
                            <p className="text-xs font-medium text-muted-foreground">Original:</p>
                            <p className="text-sm">{change.original}</p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-muted-foreground">Suggested:</p>
                            <p className="text-sm text-green-700">{change.suggested}</p>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Reasoning: {change.reasoning}
                          </p>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>

              {/* Apply Changes */}
              <Button 
                onClick={handleApplyChanges}
                className="w-full"
                disabled={Object.keys(acceptedChanges).length === 0}
              >
                Apply Selected Changes
              </Button>
            </div>
          </>
        )}

        {isGuest && (
          <Alert>
            <AlertDescription>
              As a guest, your tailoring session will be stored for 7 days. 
              Sign up to save your tailored resumes permanently.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};