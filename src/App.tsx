import React, { useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useAuthStore } from '@/stores/authStore';
import { Header } from '@/components/layout/Header';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { useIsMobile } from '@/hooks/use-mobile';

// Pages
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import ResumeBuilder from "./pages/ResumeBuilder";
import History from "./pages/History";
import Templates from "./pages/Templates";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppContent = () => {
  const { initializeAuth } = useAuthStore();
  const isMobile = useIsMobile();

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        {/* Mobile header with hamburger */}
        {isMobile && (
          <header className="fixed top-0 left-0 right-0 h-14 flex items-center justify-between px-4 bg-background border-b z-50">
            <SidebarTrigger className="md:hidden" />
            <div className="text-lg font-semibold">PulpResume</div>
            <div></div> {/* Spacer for centering */}
          </header>
        )}
        
        {/* Sidebar */}
        <AppSidebar />
        
        {/* Main content */}
        <div className="flex-1 flex flex-col">
          {/* Desktop header */}
          {!isMobile && <Header />}
          
          <main className={`flex-1 container mx-auto px-4 py-8 ${isMobile ? 'pt-20' : ''}`}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/builder" element={<ResumeBuilder />} />
              <Route path="/history" element={<History />} />
              <Route path="/templates" element={<Templates />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

