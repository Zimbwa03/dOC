import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Real-time subscription helpers
export const subscribeToConsultations = (doctorId: string, callback: (payload: any) => void) => {
  return supabase
    .channel('consultations')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'consultations',
      filter: `doctor_id=eq.${doctorId}`,
    }, callback)
    .subscribe();
};

export const subscribeToAIInteractions = (patientId: string, callback: (payload: any) => void) => {
  return supabase
    .channel('ai_interactions')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'ai_interactions',
      filter: `patient_id=eq.${patientId}`,
    }, callback)
    .subscribe();
};

// Authentication helpers
export const signInDoctor = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
};

export const signUpDoctor = async (email: string, password: string, doctorData: any) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: doctorData,
    },
  });
  return { data, error };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

// Storage helpers for voice samples
export const uploadVoiceSample = async (file: File, doctorId: string) => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${doctorId}-voice-sample.${fileExt}`;
  
  const { data, error } = await supabase.storage
    .from('voice-samples')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: true,
    });
    
  if (error) return { data: null, error };
  
  const { data: urlData } = supabase.storage
    .from('voice-samples')
    .getPublicUrl(fileName);
    
  return { data: urlData.publicUrl, error: null };
};
