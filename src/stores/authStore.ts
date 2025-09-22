import { create } from 'zustand';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Profile } from '@/types';

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  isGuest: boolean;
  guestSessionId: string | null;
  
  // Actions
  signUp: (email: string, password: string, firstName?: string, lastName?: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  initializeAuth: () => Promise<void>;
  createGuestSession: () => string;
  clearGuestSession: () => void;
  fetchProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  profile: null,
  isLoading: true,
  isGuest: false,
  guestSessionId: null,

  signUp: async (email: string, password: string, firstName?: string, lastName?: string) => {
    const redirectUrl = `${window.location.origin}/dashboard`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          first_name: firstName,
          last_name: lastName,
        }
      }
    });
    
    return { error };
  },

  signIn: async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    return { error };
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ 
      user: null, 
      session: null, 
      profile: null,
      isGuest: false,
      guestSessionId: null
    });
  },

  initializeAuth: async () => {
    set({ isLoading: true });

    // Set up auth state listener
    supabase.auth.onAuthStateChange((event, session) => {
      set({ 
        session, 
        user: session?.user ?? null,
        isGuest: false,
        guestSessionId: null
      });
      
      // Fetch profile when user signs in
      if (session?.user) {
        setTimeout(() => {
          get().fetchProfile();
        }, 0);
      } else {
        set({ profile: null });
      }
    });

    // Check for existing session
    const { data: { session } } = await supabase.auth.getSession();
    set({ 
      session, 
      user: session?.user ?? null,
      isLoading: false
    });

    if (session?.user) {
      await get().fetchProfile();
    }
  },

  createGuestSession: () => {
    const guestId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    set({ 
      isGuest: true, 
      guestSessionId: guestId,
      user: null,
      session: null 
    });
    return guestId;
  },

  clearGuestSession: () => {
    set({ 
      isGuest: false, 
      guestSessionId: null 
    });
  },

  fetchProfile: async () => {
    const { user } = get();
    if (!user) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (profile) {
      const mappedProfile: Profile = {
        id: profile.id,
        userId: profile.user_id,
        firstName: profile.first_name,
        lastName: profile.last_name,
        email: profile.email,
        createdAt: profile.created_at,
        updatedAt: profile.updated_at,
      };
      set({ profile: mappedProfile });
    }
  },
}));