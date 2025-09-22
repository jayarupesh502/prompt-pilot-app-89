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
    <div className="space-y-32 pb-20">
      {/* Sophisticated Hero Section */}
      <section className="relative text-center space-y-8 py-16 overflow-hidden">
        {/* Compact background pattern */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-0 w-48 h-48 bg-gradient-to-br from-primary/20 to-transparent rounded-full blur-3xl"></div>
          <div className="absolute top-16 right-0 w-40 h-40 bg-gradient-to-bl from-accent/20 to-transparent rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-1/2 w-32 h-32 bg-gradient-to-t from-primary-variant/20 to-transparent rounded-full blur-3xl"></div>
        </div>
        
        {/* Smaller floating elements */}
        <div className="absolute top-10 left-8 w-12 h-12 bg-accent/10 rounded-full blur-2xl animate-float"></div>
        <div className="absolute top-24 right-16 w-10 h-10 bg-primary/10 rounded-full blur-xl animate-float" style={{animationDelay: '1.5s'}}></div>
        <div className="absolute bottom-16 left-1/3 w-8 h-8 bg-primary-variant/10 rounded-full blur-xl animate-float" style={{animationDelay: '3s'}}></div>
        
        <div className="relative z-10 space-y-6 animate-fade-in">
          <Badge variant="outline" className="px-4 py-2 text-sm border-accent/30 bg-accent/10 hover:bg-accent/20 transition-all duration-500 hover:scale-105 font-medium">
            <Sparkles className="w-4 h-4 mr-2 text-accent" />
            AI-Powered Resume Optimization
          </Badge>
          
          <div className="space-y-4">
            <h1 className="font-display font-bold leading-tight tracking-tight text-3xl md:text-4xl lg:text-5xl">
              Transform Your Career with{' '}
              <span className="hero-gradient block mt-1">
                Intelligent Resume Optimization
              </span>
            </h1>
            
            <p className="text-base md:text-lg text-foreground/80 max-w-3xl mx-auto leading-relaxed">
              Our AI analyzes job requirements and crafts personalized resumes that pass ATS filters 
              and capture recruiter attention.
            </p>
          </div>
        </div>
        
        <div className="relative z-10 flex flex-col sm:flex-row items-center justify-center gap-8 animate-slide-up" style={{animationDelay: '0.4s'}}>
          <Button 
            size="lg" 
            className="btn-primary text-xl px-12 py-6 rounded-2xl min-w-64 hover:scale-105 transition-all duration-500 shadow-luxury" 
            onClick={handleTryAsGuest}
          >
            <FileText className="w-7 h-7 mr-4" />
            Start Free Trial
          </Button>
          <Button 
            size="lg" 
            variant="outline" 
            className="text-xl px-12 py-6 rounded-2xl min-w-64 border-2 border-primary/30 bg-white/80 backdrop-blur-sm hover:border-primary/50 hover:bg-white/90 hover:scale-105 transition-all duration-500 font-semibold group" 
            onClick={handleSignUp}
          >
            View Demo
            <ArrowRight className="w-7 h-7 ml-4 group-hover:translate-x-2 transition-transform duration-300" />
          </Button>
        </div>
        
        <div className="relative z-10 flex flex-wrap items-center justify-center gap-12 text-lg text-foreground/70 animate-fade-in font-medium" style={{animationDelay: '0.8s'}}>
          {[
            { icon: CheckCircle, text: "No Credit Card Required" },
            { icon: CheckCircle, text: "7-Day Full Access" },
            { icon: CheckCircle, text: "Instant Results" }
          ].map((item, index) => (
            <div key={index} className="flex items-center space-x-3 hover:text-accent transition-colors duration-500 group">
              <item.icon className="w-6 h-6 text-accent group-hover:scale-110 transition-transform duration-300" />
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
