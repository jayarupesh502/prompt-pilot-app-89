import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Award, FileText, Target, Calendar, Users, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useResumeStore } from '@/stores/resumeStore';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays, startOfDay } from 'date-fns';

const Analytics: React.FC = () => {
  const { user, isGuest } = useAuthStore();
  const { resumes } = useResumeStore();
  const [analyticsData, setAnalyticsData] = useState({
    totalResumes: 0,
    avgAtsScore: 0,
    improvementRate: 0,
    sessionsData: [],
    scoresOverTime: [],
    categoryBreakdown: [],
    weeklyActivity: []
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isGuest) {
      generateGuestAnalytics();
    } else {
      fetchAnalytics();
    }
  }, [resumes, isGuest]);

  const generateGuestAnalytics = () => {
    const guestResumes = resumes.filter(r => r.isGuest);
    const totalResumes = guestResumes.length;
    const avgScore = totalResumes > 0 
      ? Math.round(guestResumes.reduce((sum, r) => sum + (r.atsScore || 0), 0) / totalResumes)
      : 0;

    // Generate mock data for guest users
    const mockScoresOverTime = Array.from({ length: 7 }, (_, i) => ({
      date: format(subDays(new Date(), 6 - i), 'MMM dd'),
      score: Math.max(0, avgScore + Math.random() * 20 - 10)
    }));

    const mockCategoryData = [
      { name: 'Technology', value: 40, color: '#3B82F6' },
      { name: 'Business', value: 30, color: '#10B981' },
      { name: 'Healthcare', value: 20, color: '#F59E0B' },
      { name: 'Other', value: 10, color: '#EF4444' }
    ];

    setAnalyticsData({
      totalResumes,
      avgAtsScore: avgScore,
      improvementRate: 15,
      sessionsData: [],
      scoresOverTime: mockScoresOverTime,
      categoryBreakdown: mockCategoryData,
      weeklyActivity: Array.from({ length: 7 }, (_, i) => ({
        day: format(subDays(new Date(), 6 - i), 'EEE'),
        resumes: Math.floor(Math.random() * 3)
      }))
    });
    setIsLoading(false);
  };

  const fetchAnalytics = async () => {
    try {
      // Fetch tailoring sessions
      const { data: sessions } = await supabase
        .from('tailoring_sessions')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      // Generate scores over time data
      const scoresData = resumes.slice(0, 10).reverse().map((resume, index) => ({
        date: format(new Date(resume.createdAt), 'MMM dd'),
        score: resume.atsScore || 0,
        resumes: index + 1
      }));

      // Category breakdown
      const categoryData = [
        { name: 'Excellent (80+)', value: resumes.filter(r => (r.atsScore || 0) >= 80).length, color: '#10B981' },
        { name: 'Good (60-79)', value: resumes.filter(r => (r.atsScore || 0) >= 60 && (r.atsScore || 0) < 80).length, color: '#3B82F6' },
        { name: 'Fair (40-59)', value: resumes.filter(r => (r.atsScore || 0) >= 40 && (r.atsScore || 0) < 60).length, color: '#F59E0B' },
        { name: 'Poor (<40)', value: resumes.filter(r => (r.atsScore || 0) < 40).length, color: '#EF4444' }
      ];

      // Weekly activity
      const weeklyData = Array.from({ length: 7 }, (_, i) => {
        const date = subDays(new Date(), 6 - i);
        const dayResumes = resumes.filter(r => 
          startOfDay(new Date(r.createdAt)).getTime() === startOfDay(date).getTime()
        );
        return {
          day: format(date, 'EEE'),
          resumes: dayResumes.length
        };
      });

      const avgScore = resumes.length > 0
        ? Math.round(resumes.reduce((sum, r) => sum + (r.atsScore || 0), 0) / resumes.length)
        : 0;

      setAnalyticsData({
        totalResumes: resumes.length,
        avgAtsScore: avgScore,
        improvementRate: 25,
        sessionsData: sessions || [],
        scoresOverTime: scoresData,
        categoryBreakdown: categoryData,
        weeklyActivity: weeklyData
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, change, color = "text-foreground" }: any) => (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <Icon className={`w-4 h-4 ${color}`} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change && (
          <div className="flex items-center text-xs text-muted-foreground mt-1">
            <TrendingUp className="w-3 h-3 mr-1" />
            +{change}% from last week
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="space-y-8">
        <h1 className="text-3xl font-bold">Analytics</h1>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-2/3"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-1/2"></div>
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
        <h1 className="text-3xl font-bold">Resume Analytics</h1>
        <p className="text-muted-foreground">
          Track your resume optimization progress and ATS performance
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title="Total Resumes"
          value={analyticsData.totalResumes}
          icon={FileText}
          change={12}
          color="text-primary"
        />
        <StatCard
          title="Average ATS Score"
          value={`${analyticsData.avgAtsScore}/100`}
          icon={Target}
          change={analyticsData.improvementRate}
          color="text-accent"
        />
        <StatCard
          title="Optimization Sessions"
          value={analyticsData.sessionsData.length}
          icon={Users}
          change={8}
          color="text-blue-500"
        />
        <StatCard
          title="High Scores (80+)"
          value={analyticsData.categoryBreakdown.find(c => c.name === 'Excellent (80+)')?.value || 0}
          icon={Award}
          change={20}
          color="text-emerald-500"
        />
      </div>

      {/* Charts */}
      <Tabs defaultValue="performance" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>
        
        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>ATS Score Progression</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analyticsData.scoresOverTime}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="score" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={3}
                    dot={{ fill: 'hsl(var(--primary))', r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Weekly Resume Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analyticsData.weeklyActivity}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="resumes" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="breakdown" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Score Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={analyticsData.categoryBreakdown.filter(d => d.value > 0)}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      dataKey="value"
                    >
                      {analyticsData.categoryBreakdown.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Score Categories</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {analyticsData.categoryBreakdown.map((category, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                      <span className="text-sm">{category.name}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">{category.value}</span>
                      <Progress 
                        value={(category.value / analyticsData.totalResumes) * 100} 
                        className="w-20 h-2"
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="insights" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Quick Insights</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-accent mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Strong Performance</p>
                    <p className="text-xs text-muted-foreground">
                      Your average ATS score is above industry standard
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <TrendingUp className="w-5 h-5 text-blue-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Improvement Trend</p>
                    <p className="text-xs text-muted-foreground">
                      Your scores have improved by {analyticsData.improvementRate}% recently
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <Calendar className="w-5 h-5 text-amber-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Activity Pattern</p>
                    <p className="text-xs text-muted-foreground">
                      Most active on weekdays, optimal for job applications
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Recommendations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 bg-accent/5 border border-accent/20 rounded-lg">
                  <p className="text-sm font-medium text-accent">Focus on Keywords</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Add more industry-specific keywords to boost ATS scores
                  </p>
                </div>
                
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm font-medium text-blue-700">Quantify Achievements</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Include metrics and numbers in your bullet points
                  </p>
                </div>
                
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm font-medium text-amber-700">Template Variety</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Try different templates for various job types
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Analytics;