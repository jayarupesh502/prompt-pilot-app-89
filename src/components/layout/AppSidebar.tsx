import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  Sidebar, 
  SidebarContent, 
  SidebarGroup, 
  SidebarGroupContent, 
  SidebarGroupLabel, 
  SidebarMenu, 
  SidebarMenuButton, 
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  FileText, 
  History, 
  Layout, 
  BarChart3, 
  Settings,
  LogOut,
  User,
  Home,
  X
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useIsMobile } from '@/hooks/use-mobile';

interface AppSidebarProps {
  className?: string;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({ className }) => {
  const { user, isGuest, signOut } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const { setOpenMobile } = useSidebar();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleNavClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const navigationItems = [
    { to: '/', icon: Home, label: 'Home' },
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/builder', icon: FileText, label: 'Resume Builder' },
    { to: '/history', icon: History, label: 'History' },
    { to: '/templates', icon: Layout, label: 'Templates' },
    { to: '/analytics', icon: BarChart3, label: 'Analytics' },
    { to: '/settings', icon: Settings, label: 'Settings' },
  ];

  // Guest user view
  if (isGuest) {
    return (
      <Sidebar className={`bg-sidebar border-sidebar-border ${className}`}>
        <SidebarHeader className="p-4 bg-sidebar-header border-b border-sidebar-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FileText className="w-6 h-6 text-primary" />
              <span className="font-bold text-lg">PulpResume</span>
            </div>
            {isMobile && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setOpenMobile(false)}
                className="h-8 w-8 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </SidebarHeader>
        
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Quick Access</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink to="/" onClick={handleNavClick}>
                      <Home className="w-4 h-4" />
                      <span>Home</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink to="/builder" onClick={handleNavClick}>
                      <FileText className="w-4 h-4" />
                      <span>Resume Builder</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink to="/templates" onClick={handleNavClick}>
                      <Layout className="w-4 h-4" />
                      <span>Templates</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        
        <SidebarFooter className="p-4">
          <Button asChild className="w-full" onClick={handleNavClick}>
            <NavLink to="/auth">Sign Up Free</NavLink>
          </Button>
        </SidebarFooter>
      </Sidebar>
    );
  }

  // Authenticated user view
  return (
    <Sidebar className={`bg-sidebar border-sidebar-border ${className}`}>
      <SidebarHeader className="p-4 bg-sidebar-header border-b border-sidebar-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileText className="w-6 h-6 text-primary" />
            <span className="font-bold text-lg">PulpResume</span>
          </div>
          {isMobile && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setOpenMobile(false)}
              className="h-8 w-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.to}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.to}
                      onClick={handleNavClick}
                      className={({ isActive }) =>
                        isActive ? 'bg-accent text-accent-foreground' : ''
                      }
                    >
                      <item.icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter className="p-4">
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <User className="w-4 h-4" />
            <span className="truncate">{user?.email}</span>
          </div>
          <Button 
            variant="outline" 
            onClick={() => {
              handleSignOut();
              handleNavClick();
            }}
            className="w-full"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};