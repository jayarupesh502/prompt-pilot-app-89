import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Volume2 } from 'lucide-react';

export const DemoVideo: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlayVideo = () => {
    setIsPlaying(true);
    // For demo purposes, we'll show a placeholder. In production, this would be a real video.
  };

  return (
    <section className="py-16">
      <div className="text-center space-y-8">
        <div className="space-y-4">
          <Badge variant="outline" className="px-4 py-2">
            <Volume2 className="w-4 h-4 mr-2" />
            See PulpResume in Action
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold">
            Watch How AI Transforms Your Resume in{' '}
            <span className="text-primary">60 Seconds</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            See real-time resume optimization, ATS scoring, and job-specific tailoring
          </p>
        </div>

        <Card className="max-w-4xl mx-auto overflow-hidden bg-gradient-to-br from-background to-accent/5">
          <CardContent className="p-0 relative">
            {!isPlaying ? (
              <div className="relative">
                {/* Video Thumbnail */}
                <div className="aspect-video bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                  <div className="text-center space-y-4">
                    <div className="w-24 h-24 mx-auto bg-white/90 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group" onClick={handlePlayVideo}>
                      <Play className="w-8 h-8 text-primary ml-1 group-hover:scale-110 transition-transform" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-semibold">Resume Transformation Demo</h3>
                      <p className="text-muted-foreground">3:45 minutes</p>
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

        {/* Key Features Highlighted */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 mx-auto bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">⚡</span>
            </div>
            <h4 className="font-semibold">Instant Analysis</h4>
            <p className="text-sm text-muted-foreground">AI analyzes your resume in seconds</p>
          </div>
          <div className="text-center space-y-2">
            <div className="w-12 h-12 mx-auto bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🎯</span>
            </div>
            <h4 className="font-semibold">Smart Tailoring</h4>
            <p className="text-sm text-muted-foreground">Customizes content for each job</p>
          </div>
          <div className="text-center space-y-2">
            <div className="w-12 h-12 mx-auto bg-purple-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">📈</span>
            </div>
            <h4 className="font-semibold">ATS Optimization</h4>
            <p className="text-sm text-muted-foreground">Boost your ATS score by 40+ points</p>
          </div>
        </div>
      </div>
    </section>
  );
};