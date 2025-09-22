import React from 'react';
import { Link } from 'react-router-dom';
import { Navigation } from '@/components/ui/navigation';
import { FileText } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link 
            to="/" 
            className="flex items-center space-x-2 font-bold text-xl"
          >
            <div className="p-2 bg-primary text-primary-foreground rounded-lg">
              <FileText className="w-6 h-6" />
            </div>
            <span className="bg-gradient-to-r from-primary to-primary bg-clip-text text-transparent">
              PulpResume
            </span>
          </Link>
          
          <Navigation />
        </div>
      </div>
    </header>
  );
};