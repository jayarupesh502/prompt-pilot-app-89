import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/authStore';
import { 
  Home, 
  FileText, 
  History, 
  Layout, 
  BarChart3, 
  Settings, 
  LogOut,
  User
} from 'lucide-react';

interface NavigationProps {
  className?: string;
}

export const Navigation: React.FC<NavigationProps> = ({ className = '' }) => {
  const { user, isGuest, signOut } = useAuthStore();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const navigationItems = [
    { to: '/dashboard', icon: Home, label: 'Dashboard' },
    { to: '/builder', icon: FileText, label: 'Resume Builder' },
    { to: '/history', icon: History, label: 'History' },
    { to: '/templates', icon: Layout, label: 'Templates' },
    { to: '/analytics', icon: BarChart3, label: 'Analytics' },
    { to: '/settings', icon: Settings, label: 'Settings' },
  ];

  if (isGuest) {
    // Simplified navigation for guests
    return (
      <nav className={`flex items-center space-x-6 ${className}`}>
        <NavLink
          to="/builder"
          className={({ isActive }) =>
            `nav-link px-6 py-3 rounded-xl text-lg font-medium transition-all duration-300 ${
              isActive
                ? 'bg-gradient-to-r from-primary to-primary-variant text-primary-foreground shadow-lg'
                : 'text-foreground/80 hover:text-foreground hover:bg-background/80'
            }`
          }
        >
          Resume Builder
        </NavLink>
        <Button
          variant="outline"
          size="lg"
          className="px-6 py-3 text-lg font-medium border-2 border-accent/30 bg-accent/10 hover:bg-accent/20 hover:border-accent/50 transition-all duration-300 hover:scale-105"
          onClick={() => navigate('/auth')}
        >
          Sign Up
        </Button>
      </nav>
    );
  }

  return (
    <nav className={`flex items-center justify-between ${className}`}>
      <div className="flex items-center space-x-8">
        {navigationItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `nav-link flex items-center space-x-3 px-4 py-3 rounded-xl text-lg font-medium transition-all duration-300 ${
                isActive
                  ? 'bg-gradient-to-r from-primary to-primary-variant text-primary-foreground shadow-lg'
                  : 'text-foreground/80 hover:text-foreground hover:bg-background/80'
              }`
            }
          >
            <Icon className="w-5 h-5" />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
      
      {user && (
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-3 text-lg text-foreground/80 font-medium">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center text-white shadow-lg">
              <User className="w-5 h-5" />
            </div>
            <span>{user.email}</span>
          </div>
          <Button
            variant="outline"
            size="lg"
            onClick={handleSignOut}
            className="flex items-center space-x-3 px-6 py-3 text-lg font-medium border-2 border-primary/30 hover:border-primary/50 hover:bg-primary/10 transition-all duration-300 hover:scale-105"
          >
            <LogOut className="w-5 h-5" />
            <span>Sign Out</span>
          </Button>
        </div>
      )}
    </nav>
  );
};