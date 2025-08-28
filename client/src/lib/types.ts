export interface VoiceRecognition {
  isListening: boolean;
  transcript: string;
  confidence: number;
  speaker: 'doctor' | 'patient' | 'unknown';
}

export interface AIInsight {
  type: 'diagnostic' | 'treatment' | 'clinical_note' | 'warning';
  content: string;
  confidence: number;
  sources?: string[];
}

export interface HealthPlan {
  medications: Medication[];
  dietPlan: string;
  exercisePlan: string;
  reminders: Reminder[];
}

export interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  instructions: string;
}

export interface Reminder {
  type: 'medication' | 'appointment' | 'follow_up';
  message: string;
  scheduledTime: string;
  recurring: boolean;
}

export interface JournalRecommendation {
  title: string;
  journal: string;
  summary: string;
  relevanceScore: number;
  url?: string;
}

export interface ConsultationSession {
  id: string;
  patientId: string;
  doctorId: string;
  startTime: Date;
  isActive: boolean;
  transcript: TranscriptEntry[];
  aiInsights: AIInsight[];
}

export interface TranscriptEntry {
  id: string;
  speaker: 'doctor' | 'patient';
  text: string;
  timestamp: Date;
  confidence: number;
}

export interface DoctorStats {
  patientsThisWeek: number;
  consultationHours: number;
  accuracyScore: number;
  revenue: number;
}

export interface PatientSummary {
  id: string;
  name: string;
  lastConsultation: Date;
  condition: string;
  status: 'completed' | 'in_progress' | 'scheduled';
  phoneNumber?: string;
  totalConsultations?: number;
}

export interface ConsultationSummary {
  id: string;
  patientName: string;
  patientPhone: string;
  consultationDate: Date;
  durationMinutes: number;
  status: string;
  diagnosis?: string;
}
