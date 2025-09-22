import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Check, X, Edit, Download, FileText, Star } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface ReviewInterfaceProps {
  originalResume: any;
  suggestedChanges: any[];
  atsScoreImprovement: number;
  onAcceptChange: (changeId: string) => void;
  onRejectChange: (changeId: string) => void;
  onAcceptAll: () => void;
  onExportResume: (format: 'pdf' | 'docx' | 'txt') => void;
  isGuest?: boolean;
}

const ReviewInterface: React.FC<ReviewInterfaceProps> = ({
  originalResume,
  suggestedChanges,
  atsScoreImprovement,
  onAcceptChange,
  onRejectChange,
  onAcceptAll,
  onExportResume,
  isGuest = false
}) => {
  const [acceptedChanges, setAcceptedChanges] = useState<Set<string>>(new Set());
  const [rejectedChanges, setRejectedChanges] = useState<Set<string>>(new Set());

  const handleAcceptChange = (changeId: string) => {
    setAcceptedChanges(prev => new Set(prev).add(changeId));
    setRejectedChanges(prev => {
      const next = new Set(prev);
      next.delete(changeId);
      return next;
    });
    onAcceptChange(changeId);
  };

  const handleRejectChange = (changeId: string) => {
    setRejectedChanges(prev => new Set(prev).add(changeId));
    setAcceptedChanges(prev => {
      const next = new Set(prev);
      next.delete(changeId);
      return next;
    });
    onRejectChange(changeId);
  };

  const handleAcceptAll = () => {
    suggestedChanges.forEach(change => {
      setAcceptedChanges(prev => new Set(prev).add(change.id));
    });
    setRejectedChanges(new Set());
    onAcceptAll();
    toast({
      title: "All changes accepted",
      description: "Your resume has been updated with all suggestions.",
    });
  };

  const getChangeStatus = (changeId: string) => {
    if (acceptedChanges.has(changeId)) return 'accepted';
    if (rejectedChanges.has(changeId)) return 'rejected';
    return 'pending';
  };

  const pendingChanges = suggestedChanges.filter(change => 
    getChangeStatus(change.id) === 'pending'
  );
  const acceptedCount = acceptedChanges.size;
  const rejectedCount = rejectedChanges.size;

  return (
    <div className="space-y-6">
      {/* Header with Score Improvement */}
      <Card className="premium-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Star className="w-5 h-5 text-accent" />
              Resume Review & Optimization
            </CardTitle>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="text-lg px-4 py-2">
                +{atsScoreImprovement} ATS Score
              </Badge>
              <Button 
                onClick={handleAcceptAll}
                className="btn-accent"
                disabled={pendingChanges.length === 0}
              >
                Accept All Changes
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-accent">
                {suggestedChanges.length}
              </div>
              <div className="text-sm text-muted-foreground">
                Total Suggestions
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-600">
                {acceptedCount}
              </div>
              <div className="text-sm text-muted-foreground">
                Accepted
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-500">
                {rejectedCount}
              </div>
              <div className="text-sm text-muted-foreground">
                Rejected
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Changes Review */}
      <Tabs defaultValue="changes" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="changes">Review Changes</TabsTrigger>
          <TabsTrigger value="preview">Preview Resume</TabsTrigger>
        </TabsList>

        <TabsContent value="changes" className="space-y-4">
          {suggestedChanges.map((change, index) => {
            const status = getChangeStatus(change.id);
            
            return (
              <Card 
                key={change.id} 
                className={`premium-card transition-all duration-300 ${
                  status === 'accepted' ? 'border-emerald-500 bg-emerald-50/50' :
                  status === 'rejected' ? 'border-red-500 bg-red-50/50' :
                  'border-border hover:border-primary/50'
                }`}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">
                        {change.section} #{change.index + 1}
                      </Badge>
                      <Badge 
                        variant={change.isExternal ? "destructive" : "secondary"}
                      >
                        {change.isExternal ? "SUGGESTED" : "Enhanced"}
                      </Badge>
                      {change.confidence && (
                        <Badge variant="outline">
                          {Math.round(change.confidence * 100)}% confident
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAcceptChange(change.id)}
                            className="text-emerald-600 hover:bg-emerald-50"
                          >
                            <Check className="w-4 h-4 mr-2" />
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRejectChange(change.id)}
                            className="text-red-600 hover:bg-red-50"
                          >
                            <X className="w-4 h-4 mr-2" />
                            Reject
                          </Button>
                        </>
                      )}
                      {status === 'accepted' && (
                        <Badge className="bg-emerald-100 text-emerald-700">
                          <Check className="w-3 h-3 mr-1" />
                          Accepted
                        </Badge>
                      )}
                      {status === 'rejected' && (
                        <Badge className="bg-red-100 text-red-700">
                          <X className="w-3 h-3 mr-1" />
                          Rejected
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-2">
                        Original:
                      </h4>
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-sm">{change.original}</p>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-2">
                        Suggested:
                      </h4>
                      <div className="p-3 bg-accent/10 rounded-lg border border-accent/20">
                        <p className="text-sm font-medium">{change.suggested}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-2">
                      <Edit className="w-4 h-4 text-accent mt-0.5" />
                      <div>
                        <h4 className="font-medium text-sm">Why this change helps:</h4>
                        <p className="text-sm text-muted-foreground">
                          {change.reasoning}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {suggestedChanges.length === 0 && (
            <Card className="premium-card">
              <CardContent className="text-center py-8">
                <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Suggestions Available</h3>
                <p className="text-muted-foreground">
                  Your resume is already well-optimized for this job posting!
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="preview" className="space-y-4">
          <Card className="premium-card">
            <CardHeader>
              <CardTitle>Updated Resume Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Profile Section */}
                {originalResume.profile && (
                  <div>
                    <h3 className="text-xl font-bold mb-2">
                      {originalResume.profile.name}
                    </h3>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      {originalResume.profile.email && (
                        <p>{originalResume.profile.email}</p>
                      )}
                      {originalResume.profile.phone && (
                        <p>{originalResume.profile.phone}</p>
                      )}
                      {originalResume.profile.location && (
                        <p>{originalResume.profile.location}</p>
                      )}
                    </div>
                    {originalResume.profile.summary && (
                      <p className="mt-4 text-sm">{originalResume.profile.summary}</p>
                    )}
                  </div>
                )}

                <Separator />

                {/* Experience Section */}
                {originalResume.experience && originalResume.experience.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Experience</h3>
                    <div className="space-y-4">
                      {originalResume.experience.map((exp: any, index: number) => (
                        <div key={index} className="border-l-2 border-accent/30 pl-4">
                          <h4 className="font-medium">{exp.title}</h4>
                          <p className="text-sm text-muted-foreground mb-2">
                            {exp.company} • {exp.startDate} - {exp.endDate || 'Present'}
                          </p>
                          {exp.bullets && (
                            <ul className="space-y-1">
                              {exp.bullets.map((bullet: string, bulletIndex: number) => {
                                const change = suggestedChanges.find(c => 
                                  c.section === 'experience' && 
                                  c.index === index && 
                                  c.field === 'bullets'
                                );
                                const isAccepted = change && acceptedChanges.has(change.id);
                                
                                return (
                                  <li 
                                    key={bulletIndex} 
                                    className={`text-sm ${
                                      isAccepted ? 'text-accent font-medium' : ''
                                    }`}
                                  >
                                    • {isAccepted ? change.suggested : bullet}
                                  </li>
                                );
                              })}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Separator />

                {/* Skills Section */}
                {originalResume.skills && originalResume.skills.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {originalResume.skills.map((skill: string, index: number) => (
                        <Badge key={index} variant="outline">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Export Actions */}
      <Card className="premium-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="w-5 h-5 text-accent" />
            Export Your Resume
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button 
              onClick={() => onExportResume('pdf')}
              variant="outline"
              className="hover-lift"
            >
              <FileText className="w-4 h-4 mr-2" />
              Export as PDF
            </Button>
            <Button 
              onClick={() => onExportResume('docx')}
              variant="outline"
              className="hover-lift"
            >
              <FileText className="w-4 h-4 mr-2" />
              Export as DOCX
            </Button>
            <Button 
              onClick={() => onExportResume('txt')}
              variant="outline"
              className="hover-lift"
            >
              <FileText className="w-4 h-4 mr-2" />
              Export as TXT
            </Button>
          </div>
          {isGuest && (
            <div className="mt-4 p-3 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Guest Mode:</strong> Exported resumes will include a PulpResume watermark. 
                Sign up for a free account to remove watermarks and access more features.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ReviewInterface;