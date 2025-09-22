import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Brain, 
  Target, 
  Zap, 
  Shield, 
  Clock, 
  TrendingUp,
  FileText,
  Users,
  CheckCircle,
  ArrowRight
} from 'lucide-react';

export const FeatureHighlights: React.FC = () => {
  const mainFeatures = [
    {
      icon: <Brain className="w-6 h-6" />,
      title: "GPT-4o Powered Analysis",
      description: "Advanced AI understands job requirements and optimizes your resume accordingly",
      benefit: "85% higher callback rates",
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: <Target className="w-6 h-6" />,
      title: "ATS Optimization Engine",
      description: "Beats Applicant Tracking Systems with keyword optimization and formatting",
      benefit: "Pass 95% of ATS filters",
      color: "from-green-500 to-emerald-500"
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Instant Resume Tailoring",
      description: "Transform your resume for any job in under 10 seconds",
      benefit: "Save 2+ hours per application",
      color: "from-purple-500 to-pink-500"
    }
  ];

  const supportingFeatures = [
    {
      icon: <Shield className="w-5 h-5" />,
      title: "Memory Layer Technology",
      description: "AI remembers your achievements and suggests relevant content",
    },
    {
      icon: <Clock className="w-5 h-5" />,
      title: "Real-time Scoring",
      description: "Get instant ATS score and improvement suggestions",
    },
    {
      icon: <FileText className="w-5 h-5" />,
      title: "Multiple Export Formats",
      description: "Download as PDF, DOCX, or TXT with perfect formatting",
    },
    {
      icon: <Users className="w-5 h-5" />,
      title: "Industry Templates",
      description: "Professional templates for every field and experience level",
    },
    {
      icon: <TrendingUp className="w-5 h-5" />,
      title: "Performance Analytics",
      description: "Track your application success and resume effectiveness",
    },
    {
      icon: <CheckCircle className="w-5 h-5" />,
      title: "Version Control",
      description: "Manage multiple resume versions and track changes",
    }
  ];

  return (
    <section className="py-16 space-y-16">
      {/* Main Features */}
      <div className="text-center space-y-12">
        <div className="space-y-4">
          <Badge variant="outline" className="px-4 py-2">
            <Zap className="w-4 h-4 mr-2" />
            Powered by Advanced AI
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold">
            Everything You Need to{' '}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Land Your Dream Job
            </span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Our AI-powered platform gives you every advantage in today's competitive job market
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {mainFeatures.map((feature, index) => (
            <Card key={index} className="group hover:shadow-2xl transition-all duration-500 border-0 bg-gradient-to-br from-background to-accent/5">
              <CardContent className="p-8 space-y-6">
                <div className={`w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  {feature.icon}
                </div>
                
                <div className="space-y-3">
                  <h3 className="text-xl font-bold">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
                
                <div className="pt-4 border-t border-border/50">
                  <Badge className={`bg-gradient-to-r ${feature.color} text-white`}>
                    {feature.benefit}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Supporting Features Grid */}
      <div className="space-y-8">
        <div className="text-center space-y-4">
          <h3 className="text-2xl md:text-3xl font-bold">
            Complete Resume Management Platform
          </h3>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Beyond AI optimization, get tools for managing your entire job application process
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {supportingFeatures.map((feature, index) => (
            <Card key={index} className="group hover:shadow-lg transition-all duration-300">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    {feature.icon}
                  </div>
                  <div className="flex-1 space-y-2">
                    <h4 className="font-semibold">{feature.title}</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <Card className="bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 border-primary/20">
        <CardContent className="p-8 text-center space-y-6">
          <div className="space-y-2">
            <h3 className="text-2xl font-bold">
              Ready to Transform Your Job Search?
            </h3>
            <p className="text-muted-foreground">
              Join thousands of job seekers who've boosted their interview rates with PulpResume
            </p>
          </div>
          
          <div className="flex items-center justify-center space-x-4">
            <Button size="lg" className="btn-primary">
              Start Free Trial
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button size="lg" variant="outline">
              See Pricing
            </Button>
          </div>
          
          <div className="flex items-center justify-center space-x-6 text-sm text-muted-foreground">
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
              No setup required
            </div>
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
              Free for 7 days
            </div>
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
              Cancel anytime
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
};