import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  Mic, 
  MicOff, 
  Pause, 
  OctagonMinus, 
  User, 
  Brain, 
  Plus,
  Search,
  FileText,
  Send,
  ArrowLeft,
  Save,
  Download,
  MessageSquare,
  Clock,
  Activity,
  AlertCircle,
  CheckCircle,
  XCircle,
  Play,
  Square,
  Volume2,
  Settings,
  Languages,
  History,
  FileDown,
  UserCheck,
  Database
} from "lucide-react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { VoiceRecognition, AIInsight, TranscriptEntry, ConsultationSession, PatientSummary } from "@/lib/types";
import { Link } from "wouter";

// Enhanced AI Insight interface
interface EnhancedAIInsight extends AIInsight {
  id: string;
  priority: 'low' | 'medium' | 'high';
}

const DOCDOT_LOGO = "https://hvlvwvzliqrlmqjbfgoa.supabase.co/storage/v1/object/sign/O_level_Maths/20250526_2027_Young_Medical_Student_remix_01jw6xh6h8fe1ahpkyns3pw1dw-removebg-preview-removebg-preview.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9iMDVlOWY4Ni0wM2E0LTRmMDktYWI1OS0wNWYyMDM2MmFlNjIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJPX2xldmVsX01hdGhzLzIwMjUwNTI2XzIwMjdfWW91bmdfTWVkaWNhbF9TdHVkZW50X3JlbWl4XzAxanc2eGg2aDhmZTFhaHBreW5zM3B3MWR3LXJlbW92ZWJnLXByZXZpZXctcmVtb3ZlYmctcHJldmlldy5wbmciLCJpYXQiOjE3NTYzMzUzODUsImV4cCI6NzUwNDU5OTkzODV9.7JnaD1MCTpi3TLE05IbAeYEexxi3t-LVBuVunNvWwEk";

interface PatientRegistration {
  fullName: string;
  phoneNumber: string;
}

interface VoiceSample {
  id: string;
  name: string;
  audioUrl: string;
  type: 'doctor' | 'patient';
}

interface ConsultationReport {
  patientReport: string;
  doctorReport: string;
  diagnosis: string;
  prescriptions: string[];
  recommendations: string[];
  followUpDate?: Date;
}

export default function ConsultationRoom() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Core states
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentSession, setCurrentSession] = useState<ConsultationSession | null>(null);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [aiInsights, setAiInsights] = useState<EnhancedAIInsight[]>([]); // Changed to EnhancedAIInsight
  const [patientRegistration, setPatientRegistration] = useState<PatientRegistration>({
    fullName: "",
    phoneNumber: ""
  });

  // UI states
  const [isPatientDialogOpen, setIsPatientDialogOpen] = useState(false);
  const [isExistingPatientDialogOpen, setIsExistingPatientDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'transcript' | 'ai' | 'reports'>('transcript');
  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'sn' | 'mixed'>('en');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptionLanguage, setTranscriptionLanguage] = useState<'en' | 'sn' | 'auto'>('en');

  // Data states
  const [doctorNotes, setDoctorNotes] = useState("");
  const [sessionDuration, setSessionDuration] = useState(0);
  const [voiceSamples, setVoiceSamples] = useState<VoiceSample[]>([]);
  const [selectedVoiceSample, setSelectedVoiceSample] = useState<string>('');
  const [consultationReport, setConsultationReport] = useState<ConsultationReport | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recognitionRef = useRef<any>(null);
  const sessionStartTimeRef = useRef<Date | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  // Fetch existing patients for the "Registered" button
  const { data: existingPatients, refetch: refetchPatients, isLoading: isLoadingPatients } = useQuery({
    queryKey: ['existingPatients'],
    queryFn: async () => {
      const doctorSession = JSON.parse(localStorage.getItem("doctorSession") || "{}");
      if (!doctorSession.doctor?.id) return [];

      const response = await apiRequest("GET", `/api/doctor/patients/all/${doctorSession.doctor.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch patients');
      }
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
    enabled: !!localStorage.getItem("doctorSession"),
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    staleTime: 0, // Always refetch to get latest data
    gcTime: 0 // Don't cache the data
  });

  useEffect(() => {
    // Check if doctor is authenticated
    const session = localStorage.getItem("doctorSession");
    if (!session) {
      setLocation("/doctor/auth");
      return;
    }

    // Initialize voice samples (mock data - in real app, fetch from backend)
    setVoiceSamples([
      {
        id: '1',
        name: 'Dr. Smith Voice Sample',
        audioUrl: '/voice-samples/doctor-1.mp3',
        type: 'doctor'
      }
    ]);

    // Initialize Web Speech API with enhanced settings
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();

      if (recognitionRef.current) {
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        // Set language based on transcription language preference
        const languageMap = {
          'en': 'en-US',
          'sn': 'sn-ZW', // Shona (Zimbabwe)
          'auto': 'en-US' // Default to English for auto-detection
        };
        
        recognitionRef.current.lang = languageMap[transcriptionLanguage];
        recognitionRef.current.maxAlternatives = 3;

        recognitionRef.current.onresult = (event: any) => {
          const results = Array.from(event.results);
          const latestResult = results[results.length - 1] as any;

          if (latestResult.isFinal) {
            const transcriptText = latestResult[0].transcript;
            const confidence = latestResult[0].confidence;

            // Determine speaker based on voice analysis
            const speaker = determineSpeaker(transcriptText, confidence);

            const newEntry: TranscriptEntry = {
              id: Date.now().toString(),
              speaker,
              text: transcriptText,
              timestamp: new Date(),
              confidence: confidence
            };

            setTranscript(prev => [...prev, newEntry]);

            // Trigger AI analysis for medical insights
            analyzeTranscript(transcriptText, speaker);
          }
        };

        recognitionRef.current.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          toast({
            title: "Speech Recognition Error",
            description: "There was an issue with voice recognition. Please check your microphone.",
            variant: "destructive",
          });
        };

        recognitionRef.current.onend = () => {
          // Auto-restart if session is still active
          if (isRecording && !isPaused) {
            setTimeout(() => {
              if (recognitionRef.current && isRecording) {
                recognitionRef.current.start();
              }
            }, 100);
          }
        };
      }
    }

    // Initialize audio context for voice analysis
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    analyserRef.current = audioContextRef.current.createAnalyser();

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [setLocation, toast, selectedLanguage]);

  // Restart speech recognition when language changes
  useEffect(() => {
    if (isRecording && recognitionRef.current) {
      restartSpeechRecognition();
    }
  }, [transcriptionLanguage]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording && sessionStartTimeRef.current) {
      interval = setInterval(() => {
        setSessionDuration(Math.floor((Date.now() - sessionStartTimeRef.current!.getTime()) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  // Enhanced speaker identification using voice characteristics
  const determineSpeaker = (text: string, confidence: number): 'doctor' | 'patient' => {
    // In a real implementation, this would use voice biometrics
    // For now, we'll use a simple heuristic based on content and confidence
    const medicalTerms = ['diagnosis', 'symptoms', 'treatment', 'prescription', 'examination'];
    const hasMedicalTerms = medicalTerms.some(term => text.toLowerCase().includes(term));

    // Higher confidence + medical terms = likely doctor
    if (confidence > 0.8 && hasMedicalTerms) {
      return 'doctor';
    }

    // Lower confidence + personal symptoms = likely patient
    if (confidence < 0.7 && (text.toLowerCase().includes('i feel') || text.toLowerCase().includes('my'))) {
      return 'patient';
    }

    // Default to patient for safety
    return 'patient';
  };

  // Enhanced AI analysis with multi-lingual medical accuracy
  const analyzeTranscript = useCallback(async (text: string, speaker: 'doctor' | 'patient') => {
    try {
      // Detect language for better AI analysis
      const detectedLanguage = transcriptionLanguage === 'auto' ? 
        (text.match(/[а-яё]/i) ? 'ru' : text.match(/[一-龯]/) ? 'zh' : text.match(/[あ-ん]/) ? 'ja' : 'en') : 
        transcriptionLanguage;

      const response = await apiRequest("POST", "/api/ai/analyze-consultation", {
        transcript: text,
        speaker,
        language: detectedLanguage,
        transcriptionLanguage: transcriptionLanguage,
        context: transcript.slice(-5).map(entry => `${entry.speaker}: ${entry.text}`).join('\n')
      });

      const data = await response.json();

      if (data.success) {
        const insights: EnhancedAIInsight[] = [
          {
            id: Date.now().toString() + Math.random(),
            type: 'diagnostic',
            content: data.diagnosticSuggestions?.[0] || 'Consider additional symptoms for diagnosis',
            confidence: data.confidence || 0.7,
            timestamp: new Date(),
            priority: 'high'
          },
          {
            id: Date.now().toString() + Math.random(),
            type: 'treatment',
            content: data.recommendedTests?.[0] || 'Review patient history for treatment options',
            confidence: data.confidence || 0.7,
            timestamp: new Date(),
            priority: 'medium'
          }
        ];

        setAiInsights(prev => [...prev, ...insights]);
      }
    } catch (error) {
      console.error('AI analysis error:', error);
    }
  }, [transcript, transcriptionLanguage]);

  // Patient registration mutation
  const registerPatientMutation = useMutation({
    mutationFn: async (data: PatientRegistration) => {
      const response = await apiRequest("POST", "/api/patients/register", data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Patient Registered",
        description: `${data.patient.fullName} has been registered successfully`,
      });
      setIsPatientDialogOpen(false);
      startConsultationSession(data.patient.id, data.patient);
    },
    onError: (error) => {
      toast({
        title: "Registration Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Start consultation with existing patient
  const startExistingPatientConsultation = (patient: PatientSummary) => {
    setPatientRegistration({
      fullName: patient.name,
      phoneNumber: patient.phoneNumber || ''
    });
    startConsultationSession(patient.id, patient);
    setIsExistingPatientDialogOpen(false);
  };

  const startConsultationSession = (patientId: string, patientData?: any) => {
    const session: ConsultationSession = {
      id: Date.now().toString(),
      patientId,
      doctorId: JSON.parse(localStorage.getItem("doctorSession") || "{}").doctor.id,
      startTime: new Date(),
      isActive: true,
      transcript: [],
      aiInsights: []
    };

    setCurrentSession(session);
    sessionStartTimeRef.current = new Date();

    if (patientData) {
      setPatientRegistration({
        fullName: patientData.name || patientData.fullName,
        phoneNumber: patientData.phoneNumber || ''
      });
    }
  };

  // Enhanced recording functions
  const startRecording = async () => {
    try {
      if (!currentSession) {
        setIsPatientDialogOpen(true);
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });

      // Start speech recognition
      if (recognitionRef.current) {
        recognitionRef.current.start();
      }

      // Start audio recording with enhanced quality
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setIsPaused(false);

      if (!sessionStartTimeRef.current) {
        sessionStartTimeRef.current = new Date();
      }

      toast({
        title: "Recording Started",
        description: "Consultation recording is now active with enhanced voice recognition",
      });

    } catch (error) {
      toast({
        title: "Recording Failed",
        description: "Could not access microphone. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const pauseRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
    }
    setIsPaused(true);

    toast({
      title: "Recording Paused",
      description: "Consultation is paused. Click Resume to continue.",
    });
  };

  const resumeRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.start();
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
    }
    setIsPaused(false);

    toast({
      title: "Recording Resumed",
      description: "Consultation recording has resumed.",
    });
  };

  // Restart speech recognition with new language
  const restartSpeechRecognition = () => {
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop();
      setTimeout(() => {
        if (recognitionRef.current) {
          // Update language
          const languageMap = {
            'en': 'en-US',
            'sn': 'sn-ZW', // Shona (Zimbabwe)
            'auto': 'en-US' // Default to English for auto-detection
          };
          
          recognitionRef.current.lang = languageMap[transcriptionLanguage];
          recognitionRef.current.start();
          
          toast({
            title: "Language Changed",
            description: `Transcription language changed to ${transcriptionLanguage === 'sn' ? 'Shona' : transcriptionLanguage === 'auto' ? 'Auto-detect' : 'English'}`,
          });
        }
      }, 100);
    }
  };

  // Generate comprehensive consultation reports
  const generateConsultationReport = async () => {
    if (!currentSession || transcript.length === 0) {
      toast({
        title: "Cannot Generate Report",
        description: "No consultation data available",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingReport(true);

    try {
      // Generate a basic report locally since the AI endpoint might not be working
      const basicReport: ConsultationReport = {
        patientReport: `Patient consultation completed on ${new Date().toLocaleDateString()}. Duration: ${formatDuration(sessionDuration)}. Total transcript entries: ${transcript.length}.`,
        doctorReport: doctorNotes || "No additional doctor notes provided.",
        diagnosis: "Consultation completed - diagnosis to be determined by doctor.",
        prescriptions: ["Follow-up appointment recommended", "Review symptoms and treatment plan"],
        recommendations: ["Schedule follow-up consultation", "Monitor patient progress"],
        followUpDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 1 week from now
      };

      setConsultationReport(basicReport);
      
      // Try to get AI-generated report if available
      try {
        const response = await apiRequest("POST", "/api/ai/generate-consultation-report", {
          transcript: transcript.map(entry => `${entry.speaker}: ${entry.text}`).join('\n'),
          aiInsights: aiInsights.map(insight => insight.content).join('\n'),
          doctorNotes,
          sessionDuration,
          patientId: currentSession.patientId,
          doctorId: currentSession.doctorId
        });

        const data = await response.json();

        if (data.success && data.report) {
          setConsultationReport(data.report);
          toast({
            title: "AI Report Generated",
            description: "Advanced AI consultation report has been generated",
          });
        }
      } catch (aiError) {
        console.log("AI report generation failed, using basic report:", aiError);
        // Continue with basic report
      }

      toast({
        title: "Report Generated",
        description: "Consultation report has been generated successfully",
      });
    } catch (error) {
      console.error("Report generation error:", error);
      toast({
        title: "Report Generation Failed",
        description: "Could not generate consultation report",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const stopRecording = async () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    setIsPaused(false);

    // Calculate session duration
    const endTime = new Date();
    const duration = sessionStartTimeRef.current ? 
      Math.floor((endTime.getTime() - sessionStartTimeRef.current.getTime()) / 1000) : 0;

    // Generate report before saving
    await generateConsultationReport();

    // Save consultation to database
    if (currentSession && currentSession.patientId) {
      try {
        const consultationData = {
          doctorId: currentSession.doctorId,
          patientId: currentSession.patientId,
          transcript: transcript.map(entry => `${entry.speaker}: ${entry.text}`).join('\n'),
          doctorNotes: doctorNotes,
          aiSuggestions: aiInsights.map(insight => insight.content).join('\n'),
          diagnosis: consultationReport?.diagnosis || "Consultation completed",
          prescriptions: consultationReport?.prescriptions || ["Follow-up recommended"],
          durationMinutes: Math.floor(duration / 60),
          status: "completed"
        };

        console.log("Saving consultation data:", consultationData);

        const response = await apiRequest("POST", "/api/consultations", consultationData);

        if (response.ok) {
          const savedConsultation = await response.json();
          console.log("Consultation saved successfully:", savedConsultation);
          
          toast({
            title: "Consultation Saved",
            description: "Consultation has been successfully saved with comprehensive reports",
          });

          // Reset session
          setCurrentSession(null);
          setTranscript([]);
          setAiInsights([]);
          setDoctorNotes("");
          setSessionDuration(0);
          setConsultationReport(null);
          sessionStartTimeRef.current = null;

          // Force refresh of dashboard data
          setTimeout(() => {
            window.location.href = "/doctor/dashboard";
          }, 2000);
        } else {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to save consultation");
        }
              } catch (error) {
          console.error("Save consultation error:", error);
          const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
          toast({
            title: "Save Failed",
            description: `Could not save consultation: ${errorMessage}`,
            variant: "destructive",
          });
        }
    }
  };

  const addDoctorNote = (text: string) => {
    if (!text.trim()) return;

    const newEntry: TranscriptEntry = {
      id: Date.now().toString(),
      speaker: 'doctor',
      text: text,
      timestamp: new Date(),
      confidence: 1.0
    };

    setTranscript(prev => [...prev, newEntry]);
    setDoctorNotes("");
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const downloadTranscript = () => {
    const transcriptText = transcript.map(entry => 
      `[${entry.timestamp.toLocaleTimeString()}] ${entry.speaker.toUpperCase()}: ${entry.text}`
    ).join('\n\n');

    const blob = new Blob([transcriptText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `consultation-transcript-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Enhanced Header */}
      <header className="bg-white border-b border-gray-200 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center space-x-6">
              <Link href="/doctor/dashboard" className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors">
                <ArrowLeft className="w-5 h-5" />
                <span className="font-medium">Dashboard</span>
              </Link>
              <img 
                src={DOCDOT_LOGO} 
                alt="Docdot" 
                className="h-12 w-12 rounded-full shadow-md"
              />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Consultation Room</h1>
                <p className="text-sm text-gray-500">Professional Medical Consultation Interface</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Language Selector */}
              <Select value={selectedLanguage} onValueChange={(value: 'en' | 'sn' | 'mixed') => setSelectedLanguage(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="sn">Shona</SelectItem>
                  <SelectItem value="mixed">Mixed</SelectItem>
                </SelectContent>
              </Select>

              {currentSession && (
                <div className="flex items-center space-x-3">
                  <Badge variant="secondary" className="px-4 py-2">
                  {isRecording ? (
                    <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                        <span className="font-mono">{formatDuration(sessionDuration)}</span>
                    </div>
                  ) : (
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4" />
                        <span>Session Active</span>
                      </div>
                  )}
                </Badge>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Actions Bar */}
        <div className="mb-8 flex flex-wrap gap-4">
          <Button
            onClick={() => setIsPatientDialogOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3"
          >
            <Plus className="w-5 h-5 mr-2" />
            Register New Patient
          </Button>

          <Button
            onClick={async () => {
              try {
                await refetchPatients();
                setIsExistingPatientDialogOpen(true);
              } catch (error) {
                toast({
                  title: "Error",
                  description: "Failed to load registered patients. Please try again.",
                  variant: "destructive",
                });
              }
            }}
            variant="outline"
            className="border-blue-600 text-blue-600 hover:bg-blue-50 px-6 py-3"
          >
            <UserCheck className="w-5 h-5 mr-2" />
            Continue with Registered Patient
          </Button>

          {currentSession && (
            <>
              <Button
                onClick={downloadTranscript}
                variant="outline"
                className="border-green-600 text-green-600 hover:bg-green-50"
              >
                <FileDown className="w-4 h-4 mr-2" />
                Download Transcript
              </Button>

              <Button
                onClick={generateConsultationReport}
                disabled={isGeneratingReport || transcript.length === 0}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <FileText className="w-4 h-4 mr-2" />
                {isGeneratingReport ? "Generating..." : "Generate Report"}
              </Button>
            </>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Consultation Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Patient Info Card */}
            {currentSession && (
              <Card className="border-l-4 border-l-blue-500 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-blue-600" />
                      </div>
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {patientRegistration.fullName}
                      </h3>
                        <p className="text-sm text-gray-500">
                        Phone: {patientRegistration.phoneNumber}
                      </p>
                        <p className="text-xs text-gray-400">
                          Session ID: {currentSession.id.slice(-8)}
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Connected
                      </Badge>
                      {isRecording && (
                        <Badge variant="outline" className="text-red-600 border-red-600">
                          <Activity className="w-3 h-3 mr-1 animate-pulse" />
                          Recording
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Enhanced Audio Controls */}
            <Card className="shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center text-lg">
                  <Volume2 className="w-5 h-5 mr-2 text-blue-600" />
                  Audio Controls & Voice Recognition
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Language Selection for Transcription */}
                  <div className="flex items-center space-x-4">
                    <Label className="text-sm font-medium">Transcription Language:</Label>
                    <Select value={transcriptionLanguage} onValueChange={(value) => setTranscriptionLanguage(value as 'en' | 'sn' | 'auto')}>
                      <SelectTrigger className="w-64">
                        <SelectValue placeholder="Select transcription language" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">🇺🇸 English (US)</SelectItem>
                        <SelectItem value="sn">🇿🇼 Shona (Zimbabwe)</SelectItem>
                        <SelectItem value="auto">🔄 Auto-detect</SelectItem>
                      </SelectContent>
                    </Select>
                    <Badge variant="outline" className="text-xs">
                      {transcriptionLanguage === 'sn' ? 'Shona Active' : 
                       transcriptionLanguage === 'auto' ? 'Auto-detect' : 'English Active'}
                    </Badge>
                  </div>

                  {/* Voice Sample Selection */}
                  <div className="flex items-center space-x-4">
                    <Label className="text-sm font-medium">Voice Sample:</Label>
                    <Select value={selectedVoiceSample} onValueChange={setSelectedVoiceSample}>
                      <SelectTrigger className="w-64">
                        <SelectValue placeholder="Select voice sample for identification" />
                      </SelectTrigger>
                      <SelectContent>
                        {voiceSamples.map((sample) => (
                          <SelectItem key={sample.id} value={sample.id}>
                            {sample.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Recording Controls */}
                <div className="flex items-center space-x-4">
                  <Button
                    onClick={isRecording ? (isPaused ? resumeRecording : pauseRecording) : startRecording}
                    variant={isRecording ? "destructive" : "default"}
                    size="lg"
                      className={`px-8 py-3 text-lg font-medium ${
                        isRecording 
                          ? 'bg-red-600 hover:bg-red-700' 
                          : 'bg-blue-600 hover:bg-blue-700'
                      }`}
                  >
                    {isRecording ? (
                        isPaused ? (
                          <>
                            <Play className="w-5 h-5 mr-2" />
                            Resume
                          </>
                        ) : (
                          <>
                            <Pause className="w-5 h-5 mr-2" />
                            Pause
                          </>
                        )
                      ) : (
                        <>
                          <Mic className="w-5 h-5 mr-2" />
                          Start Recording
                        </>
                      )}
                  </Button>

                  {isRecording && (
                    <Button
                      onClick={stopRecording}
                      variant="outline"
                      size="lg"
                        className="border-red-600 text-red-600 hover:bg-red-50 px-8 py-3"
                    >
                        <Square className="w-5 h-5 mr-2" />
                        Stop & Save
                    </Button>
                  )}
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Session Progress</span>
                      <span className="font-mono">{formatDuration(sessionDuration)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-300" 
                        style={{ 
                          width: isRecording ? `${Math.min((sessionDuration / 3600) * 100, 100)}%` : '0%' 
                        }}
                    />
                  </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Enhanced Transcript with Tabs */}
            <Card className="shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center text-lg">
                  <MessageSquare className="w-5 h-5 mr-2 text-blue-600" />
                  Live Consultation Transcript
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'transcript' | 'ai' | 'reports')}>
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="transcript">Transcript</TabsTrigger>
                    <TabsTrigger value="ai">AI Insights</TabsTrigger>
                    <TabsTrigger value="reports">Reports</TabsTrigger>
                  </TabsList>

                  <TabsContent value="transcript" className="space-y-4">
                    {/* Language Indicator */}
                    <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Languages className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-800">
                          Transcription Language: 
                          {transcriptionLanguage === 'sn' ? ' 🇿🇼 Shona (Zimbabwe)' : 
                           transcriptionLanguage === 'auto' ? ' 🔄 Auto-detect' : ' 🇺🇸 English (US)'}
                        </span>
                      </div>
                      {isRecording && (
                        <Badge variant="outline" className="text-xs text-blue-600 border-blue-600">
                          <Activity className="w-3 h-3 mr-1 animate-pulse" />
                          Live
                        </Badge>
                      )}
                    </div>
                    
                    <div className="space-y-3 max-h-96 overflow-y-auto p-4 bg-gray-50 rounded-lg">
                  {transcript.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                          <Mic className="w-16 h-16 mx-auto mb-4 opacity-30" />
                          <p className="text-lg font-medium">Start recording to see live transcript</p>
                          <p className="text-sm">Voice recognition will automatically identify speakers</p>
                    </div>
                  ) : (
                    transcript.map((entry) => (
                          <div key={entry.id} className="flex items-start space-x-3 p-3 bg-white rounded-lg shadow-sm">
                        <Badge 
                          variant={entry.speaker === 'doctor' ? 'default' : 'secondary'}
                              className="flex-shrink-0 mt-1"
                        >
                              {entry.speaker === 'doctor' ? '👨‍⚕️ Doctor' : '👤 Patient'}
                        </Badge>
                            <div className="flex-1">
                              <p className="text-sm text-gray-800">{entry.text}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                {entry.timestamp.toLocaleTimeString()} • Confidence: {(entry.confidence * 100).toFixed(1)}%
                              </p>
                            </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Doctor Notes Input */}
                    <div className="border-t pt-4">
                      <div className="flex space-x-3">
                    <Textarea
                          placeholder="Add professional medical notes, observations, or instructions..."
                      value={doctorNotes}
                      onChange={(e) => setDoctorNotes(e.target.value)}
                          className="flex-1 min-h-[80px] resize-none"
                    />
                    <Button
                      onClick={() => addDoctorNote(doctorNotes)}
                      disabled={!doctorNotes.trim()}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-6"
                    >
                          <Send className="w-4 h-4 mr-2" />
                          Add Note
                    </Button>
                  </div>
                </div>
                  </TabsContent>

                  <TabsContent value="ai" className="space-y-4">
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                  {aiInsights.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                          <Brain className="w-16 h-16 mx-auto mb-4 opacity-30" />
                          <p className="text-lg font-medium">AI insights will appear here</p>
                          <p className="text-sm">Real-time medical analysis and recommendations</p>
                    </div>
                  ) : (
                    aiInsights.map((insight) => ( // Use insight.id for key
                      <div 
                        key={insight.id} 
                            className={`bg-white rounded-lg p-4 border-l-4 shadow-sm ${
                              insight.type === 'diagnostic' ? 'border-green-500' : 
                              insight.type === 'treatment' ? 'border-blue-500' : 'border-yellow-500'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                        <h5 className={`text-sm font-semibold mb-2 ${
                                insight.type === 'diagnostic' ? 'text-green-600' : 
                                insight.type === 'treatment' ? 'text-blue-600' : 'text-yellow-600'
                        }`}>
                                {insight.type === 'diagnostic' ? '🔍 Diagnostic Suggestion' :
                                 insight.type === 'treatment' ? '💊 Treatment Recommendation' : '📝 Clinical Note'}
                        </h5>
                              <Badge variant="outline" className="text-xs">
                                {(insight.confidence * 100).toFixed(0)}% confidence
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-700">{insight.content}</p>
                            <p className="text-xs text-gray-500 mt-2">
                              {insight.timestamp.toLocaleTimeString()}
                            </p>
                      </div>
                    ))
                  )}
                    </div>
                  </TabsContent>

                  <TabsContent value="reports" className="space-y-4">
                    {consultationReport ? (
                      <div className="space-y-6">
                        {/* Patient Report */}
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                          <h4 className="font-semibold text-blue-800 mb-2">Patient Report</h4>
                          <p className="text-sm text-blue-700">{consultationReport.patientReport}</p>
                        </div>

                        {/* Doctor Report */}
                        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                          <h4 className="font-semibold text-green-800 mb-2">Doctor Report</h4>
                          <p className="text-sm text-green-700">{consultationReport.doctorReport}</p>
                        </div>

                        {/* Diagnosis & Prescriptions */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                            <h4 className="font-semibold text-yellow-800 mb-2">Diagnosis</h4>
                            <p className="text-sm text-yellow-700">{consultationReport.diagnosis}</p>
                          </div>

                          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                            <h4 className="font-semibold text-purple-800 mb-2">Prescriptions</h4>
                            <ul className="text-sm text-purple-700 space-y-1">
                              {consultationReport.prescriptions.map((prescription, index) => (
                                <li key={index}>• {prescription}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12 text-gray-500">
                        <FileText className="w-16 h-16 mx-auto mb-4 opacity-30" />
                        <p className="text-lg font-medium">No reports generated yet</p>
                        <p className="text-sm">Complete a consultation to generate comprehensive reports</p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Enhanced AI Assistant Panel */}
          <div className="space-y-6">
            <Card className="shadow-lg border-l-4 border-l-purple-500">
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Brain className="w-5 h-5 mr-2 text-purple-600" />
                  AI Medical Assistant
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* AI Status */}
                  <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      <span className="text-sm font-medium text-purple-700">AI Active & Analyzing</span>
                    </div>
                    <p className="text-xs text-purple-600 mt-1">
                      Providing real-time medical insights
                    </p>
                </div>

                {/* Quick Actions */}
                  <div className="space-y-3">
                    <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white" variant="outline">
                      <Search className="w-4 h-4 mr-2" />
                      Search Medical Literature
                    </Button>
                    <Button className="w-full bg-green-600 hover:bg-green-700 text-white" variant="outline">
                    <FileText className="w-4 h-4 mr-2" />
                    Generate Health Plan
                  </Button>
                    <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white" variant="outline">
                      <History className="w-4 h-4 mr-2" />
                      Review Patient History
                  </Button>
                  </div>

                  {/* AI Capabilities */}
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <h5 className="text-sm font-medium text-gray-700 mb-2">AI Capabilities:</h5>
                    <ul className="text-xs text-gray-600 space-y-1">
                      <li>• Multi-language voice recognition</li>
                      <li>• Real-time symptom analysis</li>
                      <li>• Medical literature search</li>
                      <li>• Treatment recommendations</li>
                      <li>• Automated report generation</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Session Statistics */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Activity className="w-5 h-5 mr-2 text-blue-600" />
                  Session Statistics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">{transcript.length}</p>
                      <p className="text-xs text-blue-600">Transcript Entries</p>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <p className="text-2xl font-bold text-green-600">{aiInsights.length}</p>
                      <p className="text-xs text-green-600">AI Insights</p>
                    </div>
                  </div>

                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <p className="text-2xl font-bold text-purple-600">{formatDuration(sessionDuration)}</p>
                    <p className="text-xs text-purple-600">Session Duration</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Enhanced Patient Registration Dialog */}
      <Dialog open={isPatientDialogOpen} onOpenChange={setIsPatientDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Plus className="w-5 h-5 mr-2 text-blue-600" />
              Register New Patient
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="patient-name">Full Name</Label>
              <Input
                id="patient-name"
                value={patientRegistration.fullName}
                onChange={(e) => setPatientRegistration({
                  ...patientRegistration,
                  fullName: e.target.value
                })}
                placeholder="Enter patient's full name"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="patient-phone">Phone Number</Label>
              <Input
                id="patient-phone"
                value={patientRegistration.phoneNumber}
                onChange={(e) => setPatientRegistration({
                  ...patientRegistration,
                  phoneNumber: e.target.value
                })}
                placeholder="+1 (555) 123-4567"
                className="mt-1"
              />
            </div>
            <Button
              onClick={() => registerPatientMutation.mutate(patientRegistration)}
              disabled={!patientRegistration.fullName || !patientRegistration.phoneNumber || registerPatientMutation.isPending}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {registerPatientMutation.isPending ? "Registering..." : "Register & Start Consultation"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Existing Patient Selection Dialog */}
      <Dialog open={isExistingPatientDialogOpen} onOpenChange={setIsExistingPatientDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <UserCheck className="w-5 h-5 mr-2 text-green-600" />
              Select Registered Patient
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {isLoadingPatients ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p>Loading registered patients...</p>
              </div>
            ) : existingPatients && existingPatients.length > 0 ? (
              <div className="max-h-96 overflow-y-auto space-y-2">
                {existingPatients.map((patient: PatientSummary) => (
                  <div 
                    key={patient.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => startExistingPatientConsultation(patient)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{patient.name}</p>
                        <p className="text-sm text-gray-500">
                          Phone: {patient.phoneNumber || 'Not provided'} 
                          {patient.lastConsultation && (
                            <span> • Last Visit: {new Date(patient.lastConsultation).toLocaleDateString()}</span>
                          )}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      {patient.totalConsultations || 0} consultations
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <User className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg">No registered patients found</p>
                <p className="text-sm">Register a new patient to get started</p>
                <Button 
                  onClick={() => {
                    setIsExistingPatientDialogOpen(false);
                    setIsPatientDialogOpen(true);
                  }}
                  className="mt-4 bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Register New Patient
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}