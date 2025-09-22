// Core types for PulpResume

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  createdAt: string;
}

export interface Profile {
  id: string;
  userId: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ParsedResume {
  profile: {
    name?: string;
    email?: string;
    phone?: string;
    location?: string;
    summary?: string;
  };
  experience: ExperienceItem[];
  education: EducationItem[];
  skills: string[];
  projects?: ProjectItem[];
}

export interface ExperienceItem {
  id?: string;
  company: string;
  title: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  bullets: string[];
  skills: string[];
}

export interface EducationItem {
  id?: string;
  institution: string;
  degree: string;
  field?: string;
  startDate?: string;
  endDate?: string;
  graduationDate?: string;
  gpa?: string;
}

export interface ProjectItem {
  id?: string;
  name: string;
  description: string;
  technologies: string[];
  bullets: string[];
  url?: string;
  github?: string;
}

export interface Resume {
  id: string;
  userId?: string;
  guestSessionId?: string;
  title: string;
  originalFilename?: string;
  rawContent?: string;
  parsedContent: ParsedResume;
  atsScore: number;
  analysisDetails?: {
    matchingKeywords: string[];
    missingKeywords: string[];
    strengths: string[];
    improvements: string[];
  };
  isGuest: boolean;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ParsedJobDescription {
  title: string;
  company?: string;
  location?: string;
  employment_type?: string;
  salary_range?: string;
  industry?: string;
  requirements: {
    required_skills?: string[];
    preferred_skills?: string[];
    experience_years?: string;
    education?: string;
    certifications?: string[];
  };
  responsibilities: string[];
  keywords: string[];
  tech_stack: string[];
}

export interface JobDescription {
  id: string;
  userId?: string;
  guestSessionId?: string;
  title: string;
  company?: string;
  rawContent: string;
  parsedContent: ParsedJobDescription;
  sourceUrl?: string;
  isGuest: boolean;
  expiresAt?: string;
  createdAt: string;
}

export interface ResumeBullet {
  id: string;
  userId?: string;
  guestSessionId?: string;
  resumeId: string;
  text: string;
  skills: string[];
  impactScore: number;
  embedding?: number[];
  isGuest: boolean;
  expiresAt?: string;
  createdAt: string;
}

export interface TailoringSession {
  id: string;
  userId?: string;
  guestSessionId?: string;
  resumeId: string;
  jobDescriptionId: string;
  originalContent: ParsedResume;
  suggestedContent: ParsedResume;
  acceptedChanges: Record<string, any>;
  atsScoreBefore: number;
  atsScoreAfter: number;
  mode: 'assistive' | 'fast';
  isGuest: boolean;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Template {
  id: string;
  userId: string;
  name: string;
  description?: string;
  templateContent: ParsedResume;
  industry?: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ATSScore {
  overall: number;
  keywordMatch: number;
  formatCompliance: number;
  contentQuality: number;
  suggestions: string[];
}

export interface TailoringDiff {
  type: 'add' | 'modify' | 'remove';
  section: 'profile' | 'experience' | 'education' | 'skills' | 'projects';
  path: string[];
  original?: any;
  suggested?: any;
  reason?: string;
  isExternal?: boolean; // For [SUGGESTED] content
}

export interface ExportOptions {
  format: 'pdf' | 'docx' | 'txt';
  includeWatermark?: boolean;
  fontSize?: number;
  margins?: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
}

export interface GuestSession {
  id: string;
  expiresAt: string;
  createdAt: string;
}

export interface UserAnalytics {
  totalResumes: number;
  avgATSScore: number;
  improvementTrend: number;
  applicationsTracked: number;
  successRate: number;
}