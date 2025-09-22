import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Volume2 } from 'lucide-react';

export const DemoVideo: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlayVideo = () => {
    setIsPlaying(true);
  };

  return (
    <section className="py-20 animate-fade-in">
      <div className="text-center space-y-12">
        <div className="space-y-6">
          <Badge variant="outline" className="px-6 py-3 text-base border-accent/30 bg-accent/10 hover:bg-accent/20 transition-all duration-300 hover:scale-105">
            <Volume2 className="w-5 h-5 mr-2 text-accent" />
            See PulpResume in Action
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold">
            Watch How AI Transforms Your Resume in{' '}
            <span className="hero-gradient">60 Seconds</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            See real-time resume optimization, ATS scoring, and job-specific tailoring with our advanced AI engine
          </p>
        </div>

        <Card className="max-w-5xl mx-auto overflow-hidden premium-card hover:shadow-2xl transition-all duration-500 hover:scale-[1.02] group">
          <CardContent className="p-0 relative">
            {!isPlaying ? (
              <div className="relative">
                {/* Enhanced Video Thumbnail */}
                <div className="aspect-video bg-gradient-to-br from-primary/20 via-accent/20 to-primary-variant/20 flex items-center justify-center relative overflow-hidden">
                  {/* Animated background elements */}
                  <div className="absolute inset-0">
                    <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-primary/10 rounded-full blur-3xl animate-float"></div>
                    <div className="absolute bottom-1/4 right-1/4 w-24 h-24 bg-accent/10 rounded-full blur-2xl animate-float" style={{animationDelay: '1s'}}></div>
                  </div>
                  
                  <div className="text-center space-y-6 z-10 relative">
                    <div 
                      className="w-32 h-32 mx-auto bg-white/95 rounded-full flex items-center justify-center shadow-2xl hover:shadow-glow transition-all duration-500 cursor-pointer group-hover:scale-110 hover:rotate-6 animate-pulse-glow" 
                      onClick={handlePlayVideo}
                    >
                      <Play className="w-12 h-12 text-primary ml-2 transition-transform group-hover:scale-110" />
                    </div>
                    <div className="space-y-3">
                      <h3 className="text-2xl font-bold text-gray-800">Resume Transformation Demo</h3>
                      <p className="text-gray-600 text-lg">Watch the magic happen in real-time</p>
                      <Badge className="bg-gradient-to-r from-primary to-accent text-white px-4 py-2">
                        🎬 3:45 minutes
                      </Badge>
                    </div>
                  </div>
                </div>
                
                {/* Demo Stats Overlay */}
                <div className="absolute top-4 left-4 right-4 flex justify-between">
                  <Badge className="bg-green-500/90">
                    ATS Score: 45 → 89
                  </Badge>
                  <Badge className="bg-blue-500/90">
                    Keywords: +12 matched
                  </Badge>
                </div>
              </div>
            ) : (
              <div className="aspect-video bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 mx-auto border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-muted-foreground">Demo video would load here...</p>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsPlaying(false)}
                  >
                    Back to Thumbnail
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Enhanced Key Features Highlighted */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {[
            { emoji: "⚡", title: "Instant Analysis", desc: "AI analyzes your resume in seconds", color: "from-yellow-400 to-orange-500" },
            { emoji: "🎯", title: "Smart Tailoring", desc: "Customizes content for each job", color: "from-blue-400 to-indigo-500" },
            { emoji: "📈", title: "ATS Optimization", desc: "Boost your ATS score by 40+ points", color: "from-green-400 to-emerald-500" }
          ].map((feature, index) => (
            <div 
              key={index} 
              className="text-center space-y-4 group hover:scale-105 transition-all duration-300"
              style={{animationDelay: `${index * 0.2}s`}}
            >
              <div className={`w-16 h-16 mx-auto bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center text-3xl shadow-lg group-hover:shadow-xl group-hover:rotate-6 transition-all duration-300`}>
                {feature.emoji}
              </div>
              <h4 className="font-bold text-lg text-gray-800">{feature.title}</h4>
              <p className="text-gray-600">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};