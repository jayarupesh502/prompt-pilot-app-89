import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from '@/stores/authStore';
import { 
  FileText, 
  Zap, 
  Target, 
  Users, 
  CheckCircle,
  ArrowRight,
  Sparkles,
  TrendingUp
} from 'lucide-react';

// Import new landing page components
import { DemoVideo } from '@/components/landing/DemoVideo';
import { FeatureHighlights } from '@/components/landing/FeatureHighlights';
import { Testimonials } from '@/components/landing/Testimonials';
import { PricingSection } from '@/components/landing/PricingSection';
import { FAQSection } from '@/components/landing/FAQSection';

const Index = () => {
  const navigate = useNavigate();
  const { user, isGuest, createGuestSession } = useAuthStore();

  const handleTryAsGuest = () => {
    createGuestSession();
    navigate('/builder');
  };

  const handleSignUp = () => {
    navigate('/auth');
  };

  if (user && !isGuest) {
    return (
      <div className="space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Welcome back!</h1>
          <p className="text-xl text-muted-foreground mb-8">
            Ready to create your next tailored resume?
          </p>
          <div className="flex items-center justify-center space-x-4">
            <Button size="lg" onClick={() => navigate('/dashboard')}>
              <FileText className="w-5 h-5 mr-2" />
              Go to Dashboard
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/builder')}>
              Create New Resume
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-20">
      {/* Enhanced Hero Section */}
      <section className="relative text-center space-y-8 py-20 overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/5 to-background -z-10"></div>
        
        {/* Floating elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-primary/10 rounded-full blur-xl animate-float"></div>
        <div className="absolute top-40 right-20 w-16 h-16 bg-accent/10 rounded-full blur-xl animate-float" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-20 left-1/4 w-12 h-12 bg-primary-variant/10 rounded-full blur-xl animate-float" style={{animationDelay: '2s'}}></div>
        
        <div className="space-y-6 animate-fade-in">
          <Badge variant="outline" className="px-6 py-3 text-base border-primary/20 bg-primary/5 hover:bg-primary/10 transition-all duration-300 hover:scale-105">
            <Sparkles className="w-5 h-5 mr-2 text-primary" />
            AI-Powered Resume Optimization
          </Badge>
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight">
            Land More Interviews with{' '}
            <span className="hero-gradient">
              AI-Tailored Resumes
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
            PulpResume uses GPT-4o to instantly optimize your resume for any job description. 
            Get past ATS filters and impress recruiters with targeted, high-impact content.
          </p>
        </div>
        
        <div className="flex items-center justify-center space-x-6 animate-slide-up" style={{animationDelay: '0.3s'}}>
          <Button 
            size="lg" 
            className="btn-primary text-lg px-8 py-4 hover:scale-105 transition-all duration-300" 
            onClick={handleTryAsGuest}
          >
            <FileText className="w-6 h-6 mr-3" />
            Try as Guest
          </Button>
          <Button 
            size="lg" 
            variant="outline" 
            className="text-lg px-8 py-4 border-2 border-primary/20 hover:border-primary/40 hover:bg-primary/5 hover:scale-105 transition-all duration-300" 
            onClick={handleSignUp}
          >
            Sign Up Free
            <ArrowRight className="w-6 h-6 ml-3 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
        
        <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground animate-fade-in" style={{animationDelay: '0.6s'}}>
          {[
            { icon: CheckCircle, text: "No Credit Card Required" },
            { icon: CheckCircle, text: "7-Day Guest Access" },
            { icon: CheckCircle, text: "3 Free Resumes" }
          ].map((item, index) => (
            <div key={index} className="flex items-center space-x-2 hover:text-accent transition-colors duration-300">
              <item.icon className="w-5 h-5 text-accent" />
              <span>{item.text}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Demo Video Section */}
      <DemoVideo />

      {/* Feature Highlights */}
      <FeatureHighlights />

      {/* Testimonials */}
      <Testimonials />

      {/* Pricing */}
      <PricingSection />

      {/* FAQ */}
      <FAQSection />
    </div>
  );
};

export default Index;
