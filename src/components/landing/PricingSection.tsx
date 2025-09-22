import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Star, Zap, Crown } from 'lucide-react';

interface PricingPlan {
  id: string;
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  isPopular?: boolean;
  isPro?: boolean;
  buttonText: string;
  buttonVariant: 'default' | 'outline';
}

export const PricingSection: React.FC = () => {
  const plans: PricingPlan[] = [
    {
      id: 'guest',
      name: 'Guest Access',
      price: 'Free',
      period: '7 days',
      description: 'Perfect for trying out PulpResume',
      features: [
        'Up to 3 resume tailoring sessions',
        'Basic ATS score analysis',
        'Standard templates',
        'PDF/DOCX exports (watermarked)',
        '7-day temporary storage',
        'Email support'
      ],
      buttonText: 'Try as Guest',
      buttonVariant: 'outline'
    },
    {
      id: 'pro',
      name: 'Professional',
      price: '$19',
      period: 'per month',
      description: 'For active job seekers',
      features: [
        'Unlimited resume tailoring',
        'Advanced ATS optimization',
        'Premium templates library',
        'Unlimited exports (no watermark)',
        'Cover letter generation',
        'LinkedIn summary creation',
        'Resume performance analytics',
        'Permanent storage',
        'Priority email support'
      ],
      isPopular: true,
      buttonText: 'Start Free Trial',
      buttonVariant: 'default'
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: '$99',
      period: 'per month',
      description: 'For teams and organizations',
      features: [
        'Everything in Professional',
        'Team collaboration tools',
        'Custom template creation',
        'Bulk resume processing',
        'Advanced analytics dashboard',
        'API access',
        'Custom integrations',
        'Dedicated account manager',
        'SLA guarantee',
        'Custom branding'
      ],
      isPro: true,
      buttonText: 'Contact Sales',
      buttonVariant: 'outline'
    }
  ];

  const faqs = [
    {
      question: 'Can I cancel anytime?',
      answer: 'Yes, you can cancel your subscription at any time. No long-term commitments.'
    },
    {
      question: 'Do you offer refunds?',
      answer: 'We offer a 7-day free trial. If you\'re not satisfied, we provide full refunds within 30 days.'
    },
    {
      question: 'How does the free trial work?',
      answer: 'Start with full Professional access for 7 days. No credit card required for guest access.'
    },
    {
      question: 'What formats can I export?',
      answer: 'PDF, DOCX, and TXT formats. Professional users get unlimited exports without watermarks.'
    }
  ];

  const PricingCard = ({ plan }: { plan: PricingPlan }) => (
    <Card className={`relative h-full transition-all duration-300 ${
      plan.isPopular 
        ? 'border-primary shadow-lg scale-105 bg-gradient-to-br from-background to-primary/5' 
        : 'hover:shadow-lg'
    }`}>
      {plan.isPopular && (
        <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-primary to-accent text-white">
          <Star className="w-3 h-3 mr-1" />
          Most Popular
        </Badge>
      )}
      
      {plan.isPro && (
        <Badge className="absolute -top-3 right-6 bg-gradient-to-r from-amber-500 to-orange-500 text-white">
          <Crown className="w-3 h-3 mr-1" />
          Pro
        </Badge>
      )}

      <CardHeader className="text-center space-y-4">
        <div>
          <CardTitle className="text-xl">{plan.name}</CardTitle>
          <div className="mt-2">
            <span className="text-3xl font-bold">{plan.price}</span>
            {plan.price !== 'Free' && (
              <span className="text-muted-foreground">/{plan.period}</span>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            {plan.description}
          </p>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <ul className="space-y-3">
          {plan.features.map((feature, index) => (
            <li key={index} className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
              <span className="text-sm">{feature}</span>
            </li>
          ))}
        </ul>

        <Button 
          className={`w-full ${plan.isPopular ? 'btn-primary' : ''}`}
          variant={plan.buttonVariant}
          size="lg"
        >
          {plan.buttonText}
          {plan.isPopular && <Zap className="w-4 h-4 ml-2" />}
        </Button>
      </CardContent>
    </Card>
  );

  return (
    <section className="py-16 space-y-16">
      <div className="text-center space-y-4">
        <Badge variant="outline" className="px-4 py-2">
          <Crown className="w-4 h-4 mr-2" />
          Simple, Transparent Pricing
        </Badge>
        <h2 className="text-3xl md:text-4xl font-bold">
          Choose the Perfect Plan for{' '}
          <span className="text-primary">Your Job Search</span>
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Start free and upgrade as your career grows. All plans include our AI-powered resume optimization.
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {plans.map((plan) => (
          <PricingCard key={plan.id} plan={plan} />
        ))}
      </div>

      {/* Value Proposition */}
      <Card className="max-w-4xl mx-auto bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
        <CardContent className="p-8 text-center space-y-4">
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-green-800">
              🎯 Average ROI: $50,000+ in Salary Increases
            </h3>
            <p className="text-green-700">
              Our users report landing jobs with 20-40% higher salaries after using PulpResume
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="text-green-600">
              <div className="font-semibold">2.5 weeks faster</div>
              <div>Average time to job offer</div>
            </div>
            <div className="text-green-600">
              <div className="font-semibold">3.2x more interviews</div>
              <div>Compared to standard resumes</div>
            </div>
            <div className="text-green-600">
              <div className="font-semibold">89% success rate</div>
              <div>Users land job within 60 days</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* FAQ Section */}
      <div className="max-w-3xl mx-auto space-y-8">
        <h3 className="text-2xl font-bold text-center">Frequently Asked Questions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {faqs.map((faq, index) => (
            <Card key={index}>
              <CardContent className="p-6 space-y-2">
                <h4 className="font-semibold">{faq.question}</h4>
                <p className="text-sm text-muted-foreground">{faq.answer}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};