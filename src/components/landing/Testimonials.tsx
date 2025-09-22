import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, Quote, TrendingUp, Users } from 'lucide-react';

interface Testimonial {
  id: string;
  name: string;
  role: string;
  company: string;
  avatar: string;
  content: string;
  rating: number;
  improvement: string;
  industry: string;
}

export const Testimonials: React.FC = () => {
  const testimonials: Testimonial[] = [
    {
      id: '1',
      name: 'Sarah Chen',
      role: 'Software Engineer',
      company: 'Google',
      avatar: '👩‍💻',
      content: 'PulpResume helped me land my dream job at Google! The AI optimization increased my ATS score from 45 to 89, and I started getting interviews within a week.',
      rating: 5,
      improvement: 'ATS Score +44 points',
      industry: 'Technology'
    },
    {
      id: '2',
      name: 'Marcus Rodriguez',
      role: 'Marketing Manager',
      company: 'Spotify',
      avatar: '👨‍💼',
      content: 'The job-specific tailoring is incredible. I used to spend hours customizing my resume for each application. Now it takes 30 seconds and gets better results.',
      rating: 5,
      improvement: '3x more interviews',
      industry: 'Marketing'
    },
    {
      id: '3',
      name: 'Dr. Emily Watson',
      role: 'Data Scientist',
      company: 'Netflix',
      avatar: '👩‍🔬',
      content: 'As someone transitioning from academia to tech, PulpResume helped me translate my research experience into industry-relevant achievements. Landed 5 interviews in 2 weeks!',
      rating: 5,
      improvement: '5 interviews in 2 weeks',
      industry: 'Data Science'
    },
    {
      id: '4',
      name: 'James Park',
      role: 'Product Manager',
      company: 'Meta',
      avatar: '👨‍💻',
      content: 'The AI suggestions were spot-on. It identified gaps I never noticed and suggested improvements that made my achievements stand out. Got my Meta PM role thanks to this!',
      rating: 5,
      improvement: 'Landed dream job',
      industry: 'Product'
    },
    {
      id: '5',
      name: 'Lisa Thompson',
      role: 'UX Designer',
      company: 'Airbnb',
      avatar: '👩‍🎨',
      content: 'The template selection and formatting are beautiful. My resume looks professional and the ATS optimization means it actually gets seen by recruiters.',
      rating: 5,
      improvement: 'Resume response +200%',
      industry: 'Design'
    },
    {
      id: '6',
      name: 'Alex Kumar',
      role: 'Sales Director',
      company: 'Salesforce',
      avatar: '👨‍💼',
      content: 'PulpResume transformed my career transition from retail to tech sales. The AI understood how to position my transferable skills perfectly.',
      rating: 5,
      improvement: 'Career transition success',
      industry: 'Sales'
    }
  ];

  const stats = [
    { label: 'Average ATS Score Increase', value: '+42 points', icon: <TrendingUp className="w-5 h-5" /> },
    { label: 'Job Seekers Helped', value: '50,000+', icon: <Users className="w-5 h-5" /> },
    { label: 'Interview Rate Increase', value: '3.2x', icon: <Star className="w-5 h-5" /> },
    { label: 'Success Rate', value: '89%', icon: <TrendingUp className="w-5 h-5" /> }
  ];

  const TestimonialCard = ({ testimonial }: { testimonial: Testimonial }) => (
    <Card className="h-full premium-card hover:shadow-2xl transition-all duration-500 group hover:scale-[1.02] overflow-hidden relative">
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      
      <CardContent className="p-8 space-y-6 relative z-10">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <div className="text-4xl p-3 bg-gradient-to-br from-primary/10 to-accent/10 rounded-2xl group-hover:scale-110 transition-transform duration-300">
              {testimonial.avatar}
            </div>
            <div>
              <h4 className="font-bold text-lg text-gray-800 group-hover:text-primary transition-colors">
                {testimonial.name}
              </h4>
              <p className="text-gray-600 font-medium">
                {testimonial.role}
              </p>
              <p className="text-sm text-gray-500">
                at {testimonial.company}
              </p>
            </div>
          </div>
          <div className="flex">
            {Array.from({ length: testimonial.rating }).map((_, i) => (
              <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400 group-hover:scale-110 transition-transform duration-300" style={{transitionDelay: `${i * 0.1}s`}} />
            ))}
          </div>
        </div>
        
        <div className="relative">
          <Quote className="w-8 h-8 text-primary/30 absolute -top-3 -left-2" />
          <p className="text-gray-700 leading-relaxed pl-8 text-lg italic">
            "{testimonial.content}"
          </p>
        </div>
        
        <div className="flex items-center justify-between pt-6 border-t border-gray-200">
          <Badge variant="outline" className="text-sm px-3 py-1 border-gray-300">
            {testimonial.industry}
          </Badge>
          <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white text-sm px-3 py-1 font-semibold">
            ✨ {testimonial.improvement}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <section className="py-16 space-y-12">
      <div className="text-center space-y-4">
        <Badge variant="outline" className="px-4 py-2">
          <Star className="w-4 h-4 mr-2" />
          Trusted by Professionals
        </Badge>
        <h2 className="text-3xl md:text-4xl font-bold">
          Success Stories from{' '}
          <span className="text-primary">Real Users</span>
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          See how PulpResume has helped professionals across industries land their dream jobs
        </p>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="text-center">
            <CardContent className="p-6 space-y-2">
              <div className="w-12 h-12 mx-auto bg-primary/10 rounded-lg flex items-center justify-center">
                {stat.icon}
              </div>
              <div className="text-2xl font-bold text-primary">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Testimonials Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {testimonials.map((testimonial) => (
          <TestimonialCard key={testimonial.id} testimonial={testimonial} />
        ))}
      </div>

      {/* Social Proof */}
      <Card className="bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
        <CardContent className="p-8 text-center space-y-4">
          <div className="flex items-center justify-center space-x-2">
            <div className="flex">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <span className="text-lg font-semibold">4.9/5</span>
          </div>
          <p className="text-muted-foreground">
            Based on 12,000+ reviews from verified users
          </p>
          <div className="flex items-center justify-center space-x-8 text-sm text-muted-foreground">
            <span>⭐ Rated #1 AI Resume Tool</span>
            <span>🏆 Product Hunt Featured</span>
            <span>📰 Featured in TechCrunch</span>
          </div>
        </CardContent>
      </Card>
    </section>
  );
};