import { create } from 'zustand';
import { Resume, ParsedResume, JobDescription, TailoringSession } from '@/types';
import { supabase } from '@/integrations/supabase/client';

interface ResumeState {
  resumes: Resume[];
  currentResume: Resume | null;
  currentJobDescription: JobDescription | null;
  currentTailoringSession: TailoringSession | null;
  isLoading: boolean;
  
  // Actions
  fetchResumes: (isGuest?: boolean, guestSessionId?: string) => Promise<void>;
  createResume: (title: string, parsedContent: ParsedResume, isGuest?: boolean, guestSessionId?: string) => Promise<Resume>;
  updateResume: (id: string, updates: Partial<Resume>) => Promise<void>;
  deleteResume: (id: string) => Promise<void>;
  setCurrentResume: (resume: Resume | null) => void;
  setCurrentJobDescription: (jd: JobDescription | null) => void;
  setCurrentTailoringSession: (session: TailoringSession | null) => void;
}

export const useResumeStore = create<ResumeState>((set, get) => ({
  resumes: [],
  currentResume: null,
  currentJobDescription: null,
  currentTailoringSession: null,
  isLoading: false,

  fetchResumes: async (isGuest = false, guestSessionId) => {
    set({ isLoading: true });
    
    try {
      let query = supabase.from('resumes').select('*').order('created_at', { ascending: false });
      
      if (isGuest && guestSessionId) {
        query = query.eq('guest_session_id', guestSessionId).eq('is_guest', true);
      } else {
        // For authenticated users
        query = query.eq('is_guest', false);
      }
      
      const { data: resumes, error } = await query;
      
      if (error) {
        console.error('Error fetching resumes:', error);
        return;
      }
      
      const mappedResumes: Resume[] = (resumes || []).map(resume => ({
        id: resume.id,
        userId: resume.user_id,
        guestSessionId: resume.guest_session_id,
        title: resume.title,
        originalFilename: resume.original_filename,
        parsedContent: resume.parsed_content as unknown as ParsedResume,
        atsScore: resume.ats_score,
        isGuest: resume.is_guest,
        expiresAt: resume.expires_at,
        createdAt: resume.created_at,
        updatedAt: resume.updated_at,
      }));
      
      set({ resumes: mappedResumes });
    } catch (error) {
      console.error('Error fetching resumes:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  createResume: async (title: string, parsedContent: ParsedResume, isGuest = false, guestSessionId) => {
    const { data: { user } } = await supabase.auth.getUser();
    
    const resumeData = {
      title,
      parsed_content: parsedContent as any,
      is_guest: isGuest,
      ...(isGuest && guestSessionId ? { 
        guest_session_id: guestSessionId,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
      } : { user_id: user?.id }),
    };

    const { data: resume, error } = await supabase
      .from('resumes')
      .insert(resumeData)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    const newResume: Resume = {
      id: resume.id,
      userId: resume.user_id,
      guestSessionId: resume.guest_session_id,
      title: resume.title,
      originalFilename: resume.original_filename,
      parsedContent: resume.parsed_content as unknown as ParsedResume,
      atsScore: resume.ats_score,
      isGuest: resume.is_guest,
      expiresAt: resume.expires_at,
      createdAt: resume.created_at,
      updatedAt: resume.updated_at,
    };

    set(state => ({ resumes: [newResume, ...state.resumes] }));
    return newResume;
  },

  updateResume: async (id: string, updates: Partial<Resume>) => {
    const { error } = await supabase
      .from('resumes')
      .update({
        title: updates.title,
        parsed_content: updates.parsedContent as any,
        ats_score: updates.atsScore,
      })
      .eq('id', id);

    if (error) {
      throw new Error(error.message);
    }

    set(state => ({
      resumes: state.resumes.map(resume => 
        resume.id === id ? { ...resume, ...updates } : resume
      ),
      currentResume: state.currentResume?.id === id 
        ? { ...state.currentResume, ...updates } 
        : state.currentResume
    }));
  },

  deleteResume: async (id: string) => {
    const { error } = await supabase
      .from('resumes')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(error.message);
    }

    set(state => ({
      resumes: state.resumes.filter(resume => resume.id !== id),
      currentResume: state.currentResume?.id === id ? null : state.currentResume
    }));
  },

  setCurrentResume: (resume: Resume | null) => {
    set({ currentResume: resume });
  },

  setCurrentJobDescription: (jd: JobDescription | null) => {
    set({ currentJobDescription: jd });
  },

  setCurrentTailoringSession: (session: TailoringSession | null) => {
    set({ currentTailoringSession: session });
  },
}));