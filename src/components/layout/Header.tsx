import React from 'react';
import { Link } from 'react-router-dom';
import { Navigation } from '@/components/ui/navigation';
import { FileText } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/30 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-6 max-w-7xl">
        <div className="flex h-20 items-center justify-between">
          <Link 
            to="/" 
            className="flex items-center space-x-3 font-bold text-2xl group transition-all duration-300"
          >
            <div className="p-3 bg-gradient-to-br from-primary to-primary-variant text-primary-foreground rounded-2xl shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
              <FileText className="w-8 h-8" />
            </div>
            <span className="font-display font-bold hero-gradient">
              PulpResume
            </span>
          </Link>
          
          <Navigation />
        </div>
      </div>
    </header>
  );
};