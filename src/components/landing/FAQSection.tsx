import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: 'general' | 'pricing' | 'technical' | 'features';
}

export const FAQSection: React.FC = () => {
  const [openItems, setOpenItems] = useState<string[]>(['1', '5']); // Some FAQs open by default

  const faqs: FAQ[] = [
    {
      id: '1',
      question: 'How does AI resume optimization work?',
      answer: 'Our GPT-4o powered AI analyzes your resume against specific job descriptions, identifying keyword gaps, skill matches, and content improvements. It then suggests targeted changes to increase your ATS score and appeal to recruiters. The process takes just seconds and provides detailed explanations for each suggestion.',
      category: 'features'
    },
    {
      id: '2',
      question: 'What is an ATS score and why does it matter?',
      answer: 'ATS (Applicant Tracking System) score measures how well your resume will perform in automated screening systems used by 99% of Fortune 500 companies. A score above 80 significantly increases your chances of getting past the initial screening. Our AI optimizes your resume to achieve scores of 85+ consistently.',
      category: 'general'
    },
    {
      id: '3',
      question: 'Can I use PulpResume for free?',
      answer: 'Yes! We offer a comprehensive guest mode that lets you optimize up to 3 resumes over 7 days with no account required. You\'ll get full AI optimization, ATS scoring, and export capabilities (with watermark). Perfect for trying out the platform before committing.',
      category: 'pricing'
    },
    {
      id: '4',
      question: 'What file formats do you support?',
      answer: 'We support PDF, DOCX, and TXT file uploads for resume parsing. You can export your optimized resumes in PDF, DOCX, or TXT formats. Our AI can extract content from most resume layouts and formats, including complex designs and multi-column layouts.',
      category: 'technical'
    },
    {
      id: '5',
      question: 'How is this different from other resume tools?',
      answer: 'Unlike template-based tools, PulpResume uses advanced AI to understand job requirements and intelligently optimize your content. We don\'t just format - we analyze, suggest improvements, and maintain a memory layer of your achievements for future optimizations. Our ATS optimization is also more sophisticated than keyword stuffing.',
      category: 'features'
    },
    {
      id: '6',
      question: 'Is my data secure and private?',
      answer: 'Absolutely. We use enterprise-grade encryption for all data transmission and storage. Guest data is automatically deleted after 7 days. Registered users control their data and can delete it anytime. We never share your personal information with employers or third parties.',
      category: 'technical'
    },
    {
      id: '7',
      question: 'Can I create multiple resume versions?',
      answer: 'Yes! Professional users can create unlimited resume versions for different roles, industries, or career levels. Our version control system helps you track changes and maintain different resume variants for different job applications.',
      category: 'features'
    },
    {
      id: '8',
      question: 'Do you offer cover letter generation?',
      answer: 'Yes, Professional and Enterprise plans include AI-powered cover letter generation. Our AI creates personalized cover letters that complement your optimized resume and match the specific job requirements. LinkedIn summary generation is also included.',
      category: 'features'
    },
    {
      id: '9',
      question: 'What if I need help or have issues?',
      answer: 'We provide email support for all users, with priority support for Professional subscribers. Our help center includes detailed guides, video tutorials, and best practices. Enterprise customers get dedicated account management and SLA guarantees.',
      category: 'general'
    },
    {
      id: '10',
      question: 'Can I cancel my subscription anytime?',
      answer: 'Yes, you can cancel your subscription at any time with no penalties or long-term commitments. If you cancel during your trial period, you won\'t be charged. We also offer full refunds within 30 days if you\'re not satisfied with the service.',
      category: 'pricing'
    },
    {
      id: '11',
      question: 'How accurate is the AI optimization?',
      answer: 'Our AI achieves 94% accuracy in keyword matching and content relevance. We continuously train our models on successful resume patterns and current hiring trends. Users typically see a 40+ point increase in ATS scores and 3x more interview callbacks.',
      category: 'technical'
    },
    {
      id: '12',
      question: 'Do you support international resume formats?',
      answer: 'Currently we focus on US, Canadian, and UK resume formats. We\'re expanding to support European CV formats, Australian resumes, and other international standards. Our AI adapts content suggestions based on regional hiring preferences.',
      category: 'technical'
    }
  ];

  const categories = [
    { id: 'general', label: 'General', count: faqs.filter(f => f.category === 'general').length },
    { id: 'features', label: 'Features', count: faqs.filter(f => f.category === 'features').length },
    { id: 'pricing', label: 'Pricing', count: faqs.filter(f => f.category === 'pricing').length },
    { id: 'technical', label: 'Technical', count: faqs.filter(f => f.category === 'technical').length }
  ];

  const [selectedCategory, setSelectedCategory] = useState<string>('general');

  const toggleItem = (itemId: string) => {
    setOpenItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const filteredFAQs = faqs.filter(faq => faq.category === selectedCategory);

  return (
    <section className="py-16 space-y-12">
      <div className="text-center space-y-4">
        <Badge variant="outline" className="px-4 py-2">
          <HelpCircle className="w-4 h-4 mr-2" />
          Got Questions?
        </Badge>
        <h2 className="text-3xl md:text-4xl font-bold">
          Frequently Asked{' '}
          <span className="text-primary">Questions</span>
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Everything you need to know about PulpResume and AI-powered resume optimization
        </p>
      </div>

      {/* Category Filters */}
      <div className="flex flex-wrap justify-center gap-2">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`px-4 py-2 rounded-lg transition-all duration-200 ${
              selectedCategory === category.id
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted hover:bg-muted/80'
            }`}
          >
            {category.label} ({category.count})
          </button>
        ))}
      </div>

      {/* FAQ Items */}
      <div className="max-w-4xl mx-auto space-y-4">
        {filteredFAQs.map((faq) => (
          <Card key={faq.id} className="overflow-hidden">
            <Collapsible 
              open={openItems.includes(faq.id)}
              onOpenChange={() => toggleItem(faq.id)}
            >
              <CollapsibleTrigger className="w-full">
                <CardContent className="p-6 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <h3 className="text-left font-semibold">{faq.question}</h3>
                    {openItems.includes(faq.id) ? (
                      <ChevronUp className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                    )}
                  </div>
                </CardContent>
              </CollapsibleTrigger>
              
              <CollapsibleContent>
                <CardContent className="px-6 pb-6 pt-0">
                  <div className="border-t border-border pt-4">
                    <p className="text-muted-foreground leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        ))}
      </div>

      {/* Contact Support CTA */}
      <Card className="max-w-2xl mx-auto bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
        <CardContent className="p-6 text-center space-y-4">
          <div className="space-y-2">
            <h3 className="text-xl font-bold">Still have questions?</h3>
            <p className="text-muted-foreground">
              Our support team is here to help you succeed in your job search
            </p>
          </div>
          
          <div className="flex items-center justify-center space-x-4">
            <button className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
              Contact Support
            </button>
            <button className="px-6 py-2 border border-border rounded-lg hover:bg-muted transition-colors">
              View Help Center
            </button>
          </div>
        </CardContent>
      </Card>
    </section>
  );
};