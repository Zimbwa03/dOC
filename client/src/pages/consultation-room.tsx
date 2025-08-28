import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
  ArrowLeft
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { VoiceRecognition, AIInsight, TranscriptEntry, ConsultationSession } from "@/lib/types";
import { Link } from "wouter";

const DOCDOT_LOGO = "https://hvlvwvzliqrlmqjbfgoa.supabase.co/storage/v1/object/sign/O_level_Maths/20250526_2027_Young_Medical_Student_remix_01jw6xh6h8fe1ahpkyns3pw1dw-removebg-preview-removebg-preview.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9iMDVlOWY4Ni0wM2E0LTRmMDktYWI1OS0wNWYyMDM2MmFlNjIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJPX2xldmVsX01hdGhzLzIwMjUwNTI2XzIwMjdfWW91bmdfTWVkaWNhbF9TdHVkZW50X3JlbWl4XzAxanc2eGg2aDhmZTFhaHBreW5zM3B3MWR3LXJlbW92ZWJnLXByZXZpZXctcmVtb3ZlYmctcHJldmlldy5wbmciLCJpYXQiOjE3NTYzMzUzODUsImV4cCI6NzUwNDU5OTkzODV9.7JnaD1MCTpi3TLE05IbAeYEexxi3t-LVBuVunNvWwEk";

interface PatientRegistration {
  fullName: string;
  phoneNumber: string;
}

export default function ConsultationRoom() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentSession, setCurrentSession] = useState<ConsultationSession | null>(null);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [aiInsights, setAiInsights] = useState<AIInsight[]>([]);
  const [patientRegistration, setPatientRegistration] = useState<PatientRegistration>({
    fullName: "",
    phoneNumber: ""
  });
  const [isPatientDialogOpen, setIsPatientDialogOpen] = useState(false);
  const [doctorNotes, setDoctorNotes] = useState("");
  const [sessionDuration, setSessionDuration] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const sessionStartTimeRef = useRef<Date | null>(null);

  useEffect(() => {
    // Check if doctor is authenticated
    const session = localStorage.getItem("doctorSession");
    if (!session) {
      setLocation("/doctor/auth");
      return;
    }

    // Initialize Web Speech API
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      if (recognitionRef.current) {
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'en-US';

        recognitionRef.current.onresult = (event) => {
          const results = Array.from(event.results);
          const latestResult = results[results.length - 1];
          
          if (latestResult.isFinal) {
            const transcriptText = latestResult[0].transcript;
            const confidence = latestResult[0].confidence;
            
            const newEntry: TranscriptEntry = {
              id: Date.now().toString(),
              speaker: 'patient', // Default to patient, could be enhanced with speaker identification
              text: transcriptText,
              timestamp: new Date(),
              confidence: confidence
            };
            
            setTranscript(prev => [...prev, newEntry]);
            
            // Trigger AI analysis
            analyzeTranscript(transcriptText);
          }
        };

        recognitionRef.current.onerror = (event) => {
          console.error('Speech recognition error:', event.error);
          toast({
            title: "Speech Recognition Error",
            description: "There was an issue with voice recognition",
            variant: "destructive",
          });
        };
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, [setLocation, toast]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording && sessionStartTimeRef.current) {
      interval = setInterval(() => {
        setSessionDuration(Math.floor((Date.now() - sessionStartTimeRef.current!.getTime()) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

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
      startConsultationSession(data.patient.id);
    },
    onError: (error) => {
      toast({
        title: "Registration Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const analyzeTranscriptMutation = useMutation({
    mutationFn: async (transcriptText: string) => {
      const response = await apiRequest("POST", "/api/ai/analyze-consultation", {
        transcript: transcriptText,
        symptoms: extractSymptoms(transcriptText),
      });
      return response.json();
    },
    onSuccess: (data) => {
      const insights: AIInsight[] = [
        ...data.diagnosticSuggestions.map((suggestion: string) => ({
          type: 'diagnostic' as const,
          content: suggestion,
          confidence: data.confidence,
        })),
        ...data.recommendedTests.map((test: string) => ({
          type: 'treatment' as const,
          content: test,
          confidence: data.confidence,
        })),
      ];
      
      setAiInsights(prev => [...prev, ...insights]);
    },
    onError: (error) => {
      console.error('AI analysis error:', error);
    },
  });

  const extractSymptoms = (text: string): string[] => {
    // Simple symptom extraction - could be enhanced with NLP
    const commonSymptoms = ['pain', 'headache', 'fever', 'cough', 'nausea', 'fatigue', 'dizziness'];
    return commonSymptoms.filter(symptom => 
      text.toLowerCase().includes(symptom)
    );
  };

  const analyzeTranscript = (text: string) => {
    analyzeTranscriptMutation.mutate(text);
  };

  const startConsultationSession = (patientId: string) => {
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
  };

  const startRecording = async () => {
    try {
      if (!currentSession) {
        setIsPatientDialogOpen(true);
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Start speech recognition
      if (recognitionRef.current) {
        recognitionRef.current.start();
      }
      
      // Start audio recording
      mediaRecorderRef.current = new MediaRecorder(stream);
      mediaRecorderRef.current.start();
      
      setIsRecording(true);
      setIsPaused(false);
      
      if (!sessionStartTimeRef.current) {
        sessionStartTimeRef.current = new Date();
      }
      
      toast({
        title: "Recording Started",
        description: "Consultation recording is now active",
      });
      
    } catch (error) {
      toast({
        title: "Recording Failed",
        description: "Could not access microphone",
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
  };

  const resumeRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.start();
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
    }
    setIsPaused(false);
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
    
    // Save consultation to database
    if (currentSession && currentSession.patientId) {
      try {
        const consultationData = {
          doctorId: currentSession.doctorId,
          patientId: currentSession.patientId,
          transcript: transcript.map(entry => `${entry.speaker}: ${entry.text}`).join('\n'),
          doctorNotes: doctorNotes,
          aiSuggestions: aiInsights.map(insight => insight.content).join('\n'),
          diagnosis: "", // Could be extracted from AI insights or added manually
          prescriptions: {},
          durationMinutes: Math.floor(duration / 60)
        };

        const response = await apiRequest("POST", "/api/consultations", consultationData);
        
        if (response.success) {
          toast({
            title: "Consultation Saved",
            description: "Consultation has been successfully saved to your records",
          });
          
          // Reset session
          setCurrentSession(null);
          setTranscript([]);
          setAiInsights([]);
          setDoctorNotes("");
          setSessionDuration(0);
          sessionStartTimeRef.current = null;
        }
      } catch (error) {
        toast({
          title: "Save Failed",
          description: "Could not save consultation. Please try again.",
          variant: "destructive",
        });
      }
    }
    
    toast({
      title: "Recording Stopped",
      description: "Consultation has been saved",
    });
  };

  const addDoctorNote = (text: string) => {
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border shadow-sm" data-testid="consultation-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/doctor/dashboard" className="flex items-center space-x-2 text-muted-foreground hover:text-primary" data-testid="back-dashboard">
                <ArrowLeft className="w-4 h-4" />
                <span>Dashboard</span>
              </Link>
              <img 
                src={DOCDOT_LOGO} 
                alt="Docdot" 
                className="h-8 w-8 rounded-full"
                data-testid="consultation-logo"
              />
              <h1 className="text-xl font-semibold">Consultation Room</h1>
            </div>
            
            <div className="flex items-center space-x-2">
              {currentSession && (
                <Badge variant="secondary" data-testid="session-status">
                  {isRecording ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full recording-indicator" />
                      <span>Recording - {formatDuration(sessionDuration)}</span>
                    </div>
                  ) : (
                    "Session Active"
                  )}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Consultation Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Patient Info */}
            {currentSession && (
              <Card data-testid="patient-info">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold" data-testid="patient-name">
                        Patient: {patientRegistration.fullName}
                      </h3>
                      <p className="text-sm text-muted-foreground" data-testid="patient-phone">
                        Phone: {patientRegistration.phoneNumber}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <Badge variant="outline" className="text-success border-success">Connected</Badge>
                      {isRecording && (
                        <Badge variant="outline" className="text-destructive border-destructive">Recording</Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Audio Controls */}
            <Card data-testid="audio-controls">
              <CardHeader>
                <CardTitle>Audio Controls</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-4">
                  <Button
                    onClick={isRecording ? (isPaused ? resumeRecording : pauseRecording) : startRecording}
                    variant={isRecording ? "destructive" : "default"}
                    size="lg"
                    className="flex items-center space-x-2"
                    data-testid="button-record"
                  >
                    {isRecording ? (
                      isPaused ? <Mic className="w-5 h-5" /> : <Pause className="w-5 h-5" />
                    ) : (
                      <Mic className="w-5 h-5" />
                    )}
                    <span>
                      {isRecording ? (isPaused ? "Resume" : "Pause") : "Start Recording"}
                    </span>
                  </Button>
                  
                  {isRecording && (
                    <Button
                      onClick={stopRecording}
                      variant="outline"
                      size="lg"
                      data-testid="button-stop"
                    >
                      <OctagonMinus className="w-5 h-5" />
                    </Button>
                  )}
                  
                  <div className="flex-1 bg-muted rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-300" 
                      style={{ width: isRecording ? '65%' : '0%' }}
                    />
                  </div>
                  
                  <span className="text-sm text-muted-foreground font-mono" data-testid="session-duration">
                    {formatDuration(sessionDuration)}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Live Transcript */}
            <Card data-testid="live-transcript">
              <CardHeader>
                <CardTitle>Live Transcript</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto" data-testid="transcript-entries">
                  {transcript.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Mic className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Start recording to see live transcript</p>
                    </div>
                  ) : (
                    transcript.map((entry) => (
                      <div key={entry.id} className="flex" data-testid={`transcript-entry-${entry.id}`}>
                        <Badge 
                          variant={entry.speaker === 'doctor' ? 'default' : 'secondary'}
                          className="mr-3 flex-shrink-0"
                        >
                          {entry.speaker === 'doctor' ? 'Doctor' : 'Patient'}
                        </Badge>
                        <p className="text-sm">{entry.text}</p>
                      </div>
                    ))
                  )}
                </div>
                
                {/* Doctor Notes Input */}
                <div className="mt-4 pt-4 border-t">
                  <div className="flex space-x-2">
                    <Textarea
                      placeholder="Add doctor notes..."
                      value={doctorNotes}
                      onChange={(e) => setDoctorNotes(e.target.value)}
                      className="flex-1"
                      data-testid="input-doctor-notes"
                    />
                    <Button
                      onClick={() => addDoctorNote(doctorNotes)}
                      disabled={!doctorNotes.trim()}
                      data-testid="button-add-note"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* AI Assistant Panel */}
          <div className="space-y-6">
            <Card className="consultation-card" data-testid="ai-assistant">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Brain className="w-5 h-5 mr-2 text-primary" />
                  AI Assistant
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {aiInsights.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Brain className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>AI insights will appear here</p>
                      <p className="text-sm">Start consultation to get real-time suggestions</p>
                    </div>
                  ) : (
                    aiInsights.map((insight, index) => (
                      <div 
                        key={index} 
                        className={`bg-card rounded-lg p-4 border-l-4 ${
                          insight.type === 'diagnostic' ? 'border-success' : 
                          insight.type === 'treatment' ? 'border-primary' : 'border-warning'
                        }`}
                        data-testid={`ai-insight-${index}`}
                      >
                        <h5 className={`text-sm font-semibold mb-2 ${
                          insight.type === 'diagnostic' ? 'text-success' : 
                          insight.type === 'treatment' ? 'text-primary' : 'text-warning'
                        }`}>
                          {insight.type === 'diagnostic' ? 'Diagnostic Suggestion' :
                           insight.type === 'treatment' ? 'Treatment Recommendation' : 'Clinical Note'}
                        </h5>
                        <p className="text-sm">{insight.content}</p>
                      </div>
                    ))
                  )}
                </div>

                {/* Quick Actions */}
                <div className="mt-6 space-y-2">
                  <Button className="w-full" variant="outline" data-testid="button-generate-plan">
                    <FileText className="w-4 h-4 mr-2" />
                    Generate Health Plan
                  </Button>
                  <Button className="w-full" variant="outline" data-testid="button-search-literature">
                    <Search className="w-4 h-4 mr-2" />
                    Search Medical Literature
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Patient Registration Dialog */}
      <Dialog open={isPatientDialogOpen} onOpenChange={setIsPatientDialogOpen}>
        <DialogContent data-testid="patient-registration-dialog">
          <DialogHeader>
            <DialogTitle>Register New Patient</DialogTitle>
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
                data-testid="input-patient-name"
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
                data-testid="input-patient-phone"
              />
            </div>
            <Button
              onClick={() => registerPatientMutation.mutate(patientRegistration)}
              disabled={!patientRegistration.fullName || !patientRegistration.phoneNumber || registerPatientMutation.isPending}
              className="w-full"
              data-testid="button-register-patient"
            >
              {registerPatientMutation.isPending ? "Registering..." : "Register Patient"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
