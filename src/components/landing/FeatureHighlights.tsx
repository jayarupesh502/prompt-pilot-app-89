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
      icon: <Brain className="w-8 h-8" />,
      title: "GPT-4o Powered Analysis",
      description: "Advanced AI understands job requirements and optimizes your resume accordingly",
      benefit: "85% higher callback rates",
      color: "from-blue-500 to-cyan-500",
      gradient: "bg-gradient-to-br from-blue-50 to-cyan-50"
    },
    {
      icon: <Target className="w-8 h-8" />,
      title: "ATS Optimization Engine",
      description: "Beats Applicant Tracking Systems with keyword optimization and formatting",
      benefit: "Pass 95% of ATS filters",
      color: "from-green-500 to-emerald-500",
      gradient: "bg-gradient-to-br from-green-50 to-emerald-50"
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Instant Resume Tailoring",
      description: "Transform your resume for any job in under 10 seconds",
      benefit: "Save 2+ hours per application",
      color: "from-purple-500 to-pink-500",
      gradient: "bg-gradient-to-br from-purple-50 to-pink-50"
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
    <section className="py-32 space-y-20 relative">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-gradient-to-br from-accent/30 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-bl from-primary/30 to-transparent rounded-full blur-3xl"></div>
      </div>
      
      {/* Main Features */}
      <div className="relative z-10 text-center space-y-16">
        <div className="space-y-6">
          <Badge variant="outline" className="px-8 py-4 text-lg border-primary/30 bg-primary/10 hover:bg-primary/20 transition-all duration-300 hover:scale-105 font-medium">
            <Zap className="w-6 h-6 mr-3 text-primary" />
            Powered by Advanced AI Technology
          </Badge>
          <h2 className="font-display text-5xl md:text-6xl font-bold leading-tight">
            Everything You Need to{' '}
            <span className="hero-gradient">
              Land Your Dream Job
            </span>
          </h2>
          <p className="text-2xl text-foreground/80 max-w-4xl mx-auto leading-relaxed font-light">
            Our comprehensive AI platform provides every advantage you need in today's competitive job market
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 max-w-7xl mx-auto">
          {mainFeatures.map((feature, index) => (
            <Card 
              key={index} 
              className={`glass-card group cursor-pointer overflow-hidden relative border-0 ${feature.gradient} hover:scale-105 transition-all duration-700 shadow-luxury hover:shadow-glow`}
              style={{animationDelay: `${index * 0.3}s`}}
            >
              {/* Sophisticated overlay effects */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-white/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000"></div>
              
              <CardContent className="p-12 space-y-8 relative z-10 text-center">
                <div className={`w-28 h-28 mx-auto rounded-3xl bg-gradient-to-br ${feature.color} flex items-center justify-center text-white shadow-luxury group-hover:scale-110 group-hover:rotate-12 transition-all duration-700`}>
                  {feature.icon}
                </div>
                
                <div className="space-y-6">
                  <h3 className="font-display text-3xl font-bold text-gray-800 group-hover:text-gray-900 transition-colors leading-tight">
                    {feature.title}
                  </h3>
                  <p className="text-gray-700 leading-relaxed text-xl font-light">
                    {feature.description}
                  </p>
                </div>
                
                <div className="pt-6">
                  <Badge className={`bg-gradient-to-r ${feature.color} text-white text-lg px-6 py-3 font-semibold mx-auto block w-fit group-hover:scale-105 transition-transform duration-500 shadow-lg`}>
                    ✨ {feature.benefit}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Supporting Features Grid */}
      <div className="relative z-10 space-y-12">
        <div className="text-center space-y-6">
          <h3 className="font-display text-4xl md:text-5xl font-bold">
            Complete Resume Management Platform
          </h3>
          <p className="text-xl text-foreground/80 max-w-3xl mx-auto font-light">
            Beyond AI optimization, get powerful tools for managing your entire job application process
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {supportingFeatures.map((feature, index) => (
            <Card 
              key={index} 
              className="premium-card hover:shadow-xl transition-all duration-500 group border-0 bg-white/80 backdrop-blur-sm hover:bg-white"
              style={{animationDelay: `${index * 0.1}s`}}
            >
              <CardContent className="p-6 space-y-4">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary-variant rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg">
                    <div className="text-white">
                      {feature.icon}
                    </div>
                  </div>
                  <div className="flex-1 space-y-2">
                    <h4 className="font-bold text-lg text-gray-800 group-hover:text-primary transition-colors">
                      {feature.title}
                    </h4>
                    <p className="text-gray-600 leading-relaxed">
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