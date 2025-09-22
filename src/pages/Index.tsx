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
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="text-center space-y-8">
        <div className="space-y-4">
          <Badge variant="outline" className="px-4 py-2">
            <Sparkles className="w-4 h-4 mr-2" />
            AI-Powered Resume Optimization
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold leading-tight">
            Land More Interviews with{' '}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              AI-Tailored Resumes
            </span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            PulpResume uses GPT-4o to instantly optimize your resume for any job description. 
            Get past ATS filters and impress recruiters with targeted, high-impact content.
          </p>
        </div>
        
        <div className="flex items-center justify-center space-x-4">
          <Button size="lg" className="btn-primary" onClick={handleTryAsGuest}>
            <FileText className="w-5 h-5 mr-2" />
            Try as Guest
          </Button>
          <Button size="lg" variant="outline" onClick={handleSignUp}>
            Sign Up Free
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
        
        <div className="flex items-center justify-center space-x-8 text-sm text-muted-foreground">
          <div className="flex items-center">
            <CheckCircle className="w-4 h-4 mr-2 text-accent" />
            No Credit Card Required
          </div>
          <div className="flex items-center">
            <CheckCircle className="w-4 h-4 mr-2 text-accent" />
            7-Day Guest Access
          </div>
          <div className="flex items-center">
            <CheckCircle className="w-4 h-4 mr-2 text-accent" />
            3 Free Resumes
          </div>
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
