import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface SymptomAnalysis {
  id: string;
  user_id: string;
  symptoms_text: string;
  audio_url?: string;
  analysis_result: AnalysisResult;
  urgency_level: 'normal' | 'moderate' | 'critical';
  created_at: string;
}

export interface AnalysisResult {
  possibleConditions: Array<{
    condition: string;
    probability: string;
    description: string;
  }>;
  urgencyLevel: 'normal' | 'moderate' | 'critical';
  preventiveSuggestions: string[];
  whenToSeekHelp: string[];
  generalAdvice: string;
}

export interface UserProfile {
  id: string;
  full_name: string;
  age?: number;
  medical_history?: string;
  created_at: string;
  updated_at: string;
}
