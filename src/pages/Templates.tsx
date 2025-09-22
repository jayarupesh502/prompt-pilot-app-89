import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { FileText, Search, Eye, Download, Star, Briefcase, Code, BarChart3, Heart, Palette } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { useResumeStore } from '@/stores/resumeStore';
import { useToast } from '@/hooks/use-toast';
import { ResumePreview } from '@/components/resume/ResumePreview';

interface Template {
  id: string;
  name: string;
  industry: string;
  description: string;
  template_content: any;
  is_public: boolean;
  created_at: string;
}

const Templates: React.FC = () => {
  const { isGuest, guestSessionId } = useAuthStore();
  const { createResume } = useResumeStore();
  const { toast } = useToast();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast({
        title: "Failed to load templates",
        description: "Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUseTemplate = async (template: Template) => {
    try {
      const resumeTitle = `${template.name} Resume`;
      const newResume = await createResume(
        resumeTitle,
        template.template_content,
        isGuest,
        guestSessionId
      );

      toast({
        title: "Template applied!",
        description: `Created new resume: ${resumeTitle}`,
      });

      // Redirect to builder
      window.location.href = '/builder';
    } catch (error) {
      console.error('Error using template:', error);
      toast({
        title: "Failed to use template",
        description: "Please try again.",
        variant: "destructive"
      });
    }
  };

  const getCategories = () => {
    const categories = [...new Set(templates.map(t => t.industry))];
    return ['All', ...categories];
  };

  const getCategoryIcon = (industry: string) => {
    switch (industry.toLowerCase()) {
      case 'technology':
        return <Code className="w-4 h-4" />;
      case 'marketing':
        return <Palette className="w-4 h-4" />;
      case 'data science':
        return <BarChart3 className="w-4 h-4" />;
      case 'business':
        return <Briefcase className="w-4 h-4" />;
      case 'healthcare':
        return <Heart className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const getTemplatesByCategory = (category: string) => {
    if (category === 'All') return filteredTemplates;
    return filteredTemplates.filter(t => t.industry === category);
  };

  const TemplateCard = ({ template }: { template: Template }) => (
    <Card className="group hover:shadow-lg transition-all duration-300 relative overflow-hidden">
      {!template.is_public && (
        <Badge className="absolute top-3 right-3 z-10 bg-gradient-to-r from-amber-500 to-orange-500">
          <Star className="w-3 h-3 mr-1" />
          Pro
        </Badge>
      )}
      
      <CardHeader className="pb-3">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            {getCategoryIcon(template.industry)}
          </div>
          <div className="flex-1">
            <CardTitle className="text-lg">{template.name}</CardTitle>
            <Badge variant="outline" className="text-xs mt-1">
              {template.industry}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground line-clamp-2">
          {template.description}
        </p>
        
        <div className="flex space-x-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1"
                onClick={() => setSelectedTemplate(template)}
              >
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
              <DialogHeader>
                <DialogTitle>{template.name} Preview</DialogTitle>
              </DialogHeader>
              {selectedTemplate && (
                <div className="mt-4">
                  <ResumePreview 
                    resume={selectedTemplate.template_content}
                    atsScore={85}
                  />
                </div>
              )}
            </DialogContent>
          </Dialog>
          
          <Button 
            size="sm" 
            onClick={() => handleUseTemplate(template)}
            className="flex-1 bg-gradient-to-r from-primary to-blue-600 hover:shadow-lg"
          >
            Use Template
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="space-y-8">
        <h1 className="text-3xl font-bold">Resume Templates</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-muted rounded w-2/3"></div>
                <div className="h-4 bg-muted rounded w-1/3"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded"></div>
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-8 bg-muted rounded mt-4"></div>
                </div>
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
        <h1 className="text-3xl font-bold">Resume Templates</h1>
        <p className="text-muted-foreground">
          Choose from professionally designed templates optimized for ATS systems
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-md mx-auto">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder="Search templates..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Categories */}
      <Tabs defaultValue="All" className="w-full">
        <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:grid-cols-none lg:inline-flex">
          {getCategories().map((category) => (
            <TabsTrigger key={category} value={category} className="text-xs lg:text-sm">
              {category} ({getTemplatesByCategory(category).length})
            </TabsTrigger>
          ))}
        </TabsList>
        
        {getCategories().map((category) => (
          <TabsContent key={category} value={category} className="space-y-6">
            {getTemplatesByCategory(category).length === 0 ? (
              <Card className="text-center p-8">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No templates found</h3>
                <p className="text-muted-foreground">
                  {searchTerm ? 'Try a different search term' : 'Templates will be added soon'}
                </p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {getTemplatesByCategory(category).map((template) => (
                  <TemplateCard key={template.id} template={template} />
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Feature Highlight */}
      <Card className="bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Star className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold">Pro Templates Coming Soon</h3>
              <p className="text-muted-foreground">
                Get access to premium templates with advanced designs and layouts
              </p>
            </div>
            <Button variant="outline">
              Learn More
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Templates;