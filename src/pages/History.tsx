import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useResumeStore } from '@/stores/resumeStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { FileText, MoreVertical, Download, Edit, Trash2, Search, Calendar, Award } from 'lucide-react';
import { ATSScore } from '@/components/common/ATSScore';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

const History: React.FC = () => {
  const { user, isGuest, guestSessionId } = useAuthStore();
  const { resumes, fetchResumes, deleteResume, setCurrentResume } = useResumeStore();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadResumes = async () => {
      setIsLoading(true);
      await fetchResumes(isGuest, guestSessionId);
      setIsLoading(false);
    };
    loadResumes();
  }, [fetchResumes, isGuest, guestSessionId]);

  const filteredResumes = resumes.filter(resume =>
    resume.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    resume.originalFilename?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const recentResumes = filteredResumes.slice(0, 5);
  const highScoreResumes = filteredResumes.filter(resume => resume.atsScore >= 80);

  const handleDownload = async (resumeId: string) => {
    try {
      // Call export function
      toast({
        title: "Download started",
        description: "Your resume download will begin shortly.",
      });
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Failed to download resume. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (resume: any) => {
    setCurrentResume(resume);
    window.location.href = '/builder';
  };

  const handleDelete = async (resumeId: string) => {
    try {
      await deleteResume(resumeId);
      toast({
        title: "Resume deleted",
        description: "Resume has been deleted successfully.",
      });
    } catch (error) {
      toast({
        title: "Delete failed",
        description: "Failed to delete resume. Please try again.",
        variant: "destructive"
      });
    }
  };

  const ResumeCard = ({ resume }: { resume: any }) => (
    <Card className="relative group hover:shadow-lg transition-all duration-300">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">{resume.title}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {resume.originalFilename}
              </p>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-popover border">
              <DropdownMenuItem onClick={() => handleEdit(resume)}>
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDownload(resume.id)}>
                <Download className="w-4 h-4 mr-2" />
                Download
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => handleDelete(resume.id)}
                className="text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <ATSScore score={resume.atsScore || 0} />
            <div className="flex items-center text-sm text-muted-foreground">
              <Calendar className="w-4 h-4 mr-1" />
              {format(new Date(resume.createdAt), 'MMM dd, yyyy')}
            </div>
          </div>
          
          {isGuest && (
            <Badge variant="outline" className="text-xs">
              Expires {format(new Date(resume.expiresAt), 'MMM dd')}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="space-y-8">
        <h1 className="text-3xl font-bold">Resume History</h1>
        <div className="grid gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-muted rounded w-1/3"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-4 bg-muted rounded w-1/4"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Resume History</h1>
        <p className="text-muted-foreground">
          {isGuest 
            ? "Your recent resumes (stored for 7 days)" 
            : "Manage your resume versions and downloads"
          }
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-md mx-auto">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder="Search resumes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Resumes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resumes.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">High ATS Scores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">{highScoreResumes.length}</div>
            <p className="text-xs text-muted-foreground">80+ ATS score</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Avg ATS Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {resumes.length > 0 
                ? Math.round(resumes.reduce((sum, r) => sum + (r.atsScore || 0), 0) / resumes.length)
                : 0
              }
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">All Resumes ({filteredResumes.length})</TabsTrigger>
          <TabsTrigger value="recent">Recent</TabsTrigger>
          <TabsTrigger value="high-score">High Scores</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="space-y-4">
          {filteredResumes.length === 0 ? (
            <Card className="text-center p-8">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No resumes found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm ? 'Try a different search term' : 'Create your first resume to get started'}
              </p>
              <Button asChild>
                <a href="/builder">Create New Resume</a>
              </Button>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredResumes.map((resume) => (
                <ResumeCard key={resume.id} resume={resume} />
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="recent" className="space-y-4">
          <div className="grid gap-4">
            {recentResumes.map((resume) => (
              <ResumeCard key={resume.id} resume={resume} />
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="high-score" className="space-y-4">
          {highScoreResumes.length === 0 ? (
            <Card className="text-center p-8">
              <Award className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No high-scoring resumes yet</h3>
              <p className="text-muted-foreground">
                Keep optimizing your resumes to achieve 80+ ATS scores
              </p>
            </Card>
          ) : (
            <div className="grid gap-4">
              {highScoreResumes.map((resume) => (
                <ResumeCard key={resume.id} resume={resume} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default History;