import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/stores/authStore';
import { useResumeStore } from '@/stores/resumeStore';
import { ATSScore } from '@/components/common/ATSScore';
import { 
  Plus, 
  FileText, 
  TrendingUp, 
  Clock, 
  Target,
  BarChart3,
  Calendar,
  Sparkles
} from 'lucide-react';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, isGuest, profile } = useAuthStore();
  const { resumes, fetchResumes, isLoading } = useResumeStore();

  useEffect(() => {
    if (!user && !isGuest) {
      navigate('/auth');
      return;
    }
    
    fetchResumes();
  }, [user, isGuest, fetchResumes, navigate]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const getName = () => {
    if (isGuest) return 'Guest';
    return profile?.firstName || user?.email?.split('@')[0] || 'there';
  };

  const stats = {
    totalResumes: resumes.length,
    averageScore: resumes.length > 0 
      ? Math.round(resumes.reduce((sum, resume) => sum + resume.atsScore, 0) / resumes.length)
      : 0,
    recentActivity: resumes.filter(resume => {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return new Date(resume.updatedAt) > weekAgo;
    }).length,
    bestScore: resumes.length > 0 ? Math.max(...resumes.map(r => r.atsScore)) : 0,
  };

  const recentResumes = resumes.slice(0, 5);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 bg-muted rounded w-64 loading-shimmer" />
            <div className="h-4 bg-muted rounded w-96 loading-shimmer" />
          </div>
          <div className="h-10 bg-muted rounded w-32 loading-shimmer" />
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-3">
                <div className="h-4 bg-muted rounded loading-shimmer" />
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded loading-shimmer" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">
            {getGreeting()}, {getName()}!
          </h1>
          <p className="text-muted-foreground">
            {isGuest 
              ? "Welcome to your guest session. Create up to 3 resumes to try PulpResume."
              : "Ready to create your next job-winning resume?"
            }
          </p>
        </div>
        
        <Button 
          size="lg" 
          onClick={() => navigate('/builder')}
          className="btn-primary"
        >
          <Plus className="w-5 h-5 mr-2" />
          New Resume
        </Button>
      </div>

      {/* Guest Banner */}
      {isGuest && (
        <Card className="border-primary bg-primary/5">
          <CardContent className="flex items-center justify-between p-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Guest Mode Active</h3>
                <p className="text-sm text-muted-foreground">
                  Sign up to save your resumes permanently and unlock unlimited access
                </p>
              </div>
            </div>
            <Button onClick={() => navigate('/auth')}>
              Sign Up Free
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Resumes</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalResumes}</div>
            <p className="text-xs text-muted-foreground">
              {isGuest ? `${3 - stats.totalResumes} remaining in guest mode` : 'All time'}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average ATS Score</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageScore}%</div>
            <p className="text-xs text-muted-foreground">
              Across all resumes
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Best Score</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.bestScore}%</div>
            <p className="text-xs text-muted-foreground">
              Personal best
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.recentActivity}</div>
            <p className="text-xs text-muted-foreground">
              Resumes created/updated
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Resumes */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Resumes</CardTitle>
            <CardDescription>
              Your latest resume projects and their ATS scores
            </CardDescription>
          </div>
          <Button variant="outline" onClick={() => navigate('/history')}>
            View All
          </Button>
        </CardHeader>
        <CardContent>
          {recentResumes.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No resumes yet</h3>
              <p className="text-muted-foreground mb-4">
                Get started by creating your first AI-optimized resume
              </p>
              <Button onClick={() => navigate('/builder')}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Resume
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {recentResumes.map((resume) => (
                <div 
                  key={resume.id}
                  className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => navigate(`/builder?resumeId=${resume.id}`)}
                >
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium">{resume.title}</h4>
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span>Updated {new Date(resume.updatedAt).toLocaleDateString()}</span>
                        {isGuest && (
                          <Badge variant="outline" className="text-xs">
                            Guest
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <ATSScore score={resume.atsScore} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="cursor-pointer hover:shadow-lg transition-all duration-300" onClick={() => navigate('/builder')}>
          <CardHeader>
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <Plus className="w-6 h-6 text-primary" />
            </div>
            <CardTitle>Create New Resume</CardTitle>
            <CardDescription>
              Start with a blank slate or use one of our templates
            </CardDescription>
          </CardHeader>
        </Card>
        
        <Card className="cursor-pointer hover:shadow-lg transition-all duration-300" onClick={() => navigate('/templates')}>
          <CardHeader>
            <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
              <FileText className="w-6 h-6 text-accent" />
            </div>
            <CardTitle>Browse Templates</CardTitle>
            <CardDescription>
              Industry-specific templates to get you started faster
            </CardDescription>
          </CardHeader>
        </Card>
        
        <Card className="cursor-pointer hover:shadow-lg transition-all duration-300" onClick={() => navigate('/analytics')}>
          <CardHeader>
            <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center mb-4">
              <BarChart3 className="w-6 h-6 text-blue-500" />
            </div>
            <CardTitle>View Analytics</CardTitle>
            <CardDescription>
              Track your resume performance and improvement trends
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;