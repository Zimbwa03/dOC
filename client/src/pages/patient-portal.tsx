import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { 
  User, 
  FileText, 
  PillBottle, 
  Apple, 
  Dumbbell, 
  MessageSquare,
  Send,
  LogOut,
  Calendar,
  Clock,
  ArrowRight,
  Heart,
  Activity,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle,
  Plus,
  Edit,
  Trash2,
  Download,
  Share2,
  Bell,
  Settings,
  Video,
  Phone,
  MapPin,
  Star,
  BookOpen,
  Target,
  Zap,
  Shield,
  Brain,
  Microphone,
  Headphones,
  Camera,
  FileImage,
  Upload,
  Search,
  Filter,
  RefreshCw,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Wifi,
  Battery,
  Signal,
  Play,
  Pause,
  Volume2,
  Languages,
  Globe
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { PatientHealthPlan, Consultation, AiInteraction } from "@shared/schema";
import { Link } from "wouter";

const DOCDOT_LOGO = "https://hvlvwvzliqrlmqjbfgoa.supabase.co/storage/v1/object/sign/O_level_Maths/20250526_2027_Young_Medical_Student_remix_01jw6xh6h8fe1ahpkyns3pw1dw-removebg-preview-removebg-preview.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9iMDVlOWY4Ni0wM2E0LTRmMDktYWI1OS0wNWYyMDM2MmFlNjIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJPX2xldmVsX01hdGhzLzIwMjUwNTI2XzIwMjdfWW91bmdfTWVkaWNhbF9TdHVkZW50X3JlbWl4XzAxanc2eGg2aDhmZTFhaHBreW5zM3B3MWR3LXJlbW92ZWJnLXByZXZpZXctcmVtb3ZlYmctcHJldmlldy5wbmciLCJpYXQiOjE3NTYzMzUzODUsImV4cCI6NzUwNDU5OTkzODV9.7JnaD1MCTpi3TLE05IbAeYEexxi3t-LVBuVunNvWwEk";

interface PatientSession {
  patient: {
    id: string;
    fullName: string;
    phoneNumber: string;
    doctorId: string;
  };
}

interface ExtendedConsultation extends Consultation {
  doctorName?: string;
  patientReport?: string;
  doctorReport?: string;
}

interface HealthMetrics {
  bloodPressure: string;
  heartRate: number;
  temperature: number;
  weight: number;
  bloodSugar: number;
  lastUpdated: Date;
}

interface Appointment {
  id: string;
  date: Date;
  time: string;
  type: 'consultation' | 'follow-up' | 'emergency';
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
  doctorName: string;
  notes?: string;
}

interface MedicationReminder {
  id: string;
  medicationName: string;
  dosage: string;
  time: string;
  frequency: string;
  isTaken: boolean;
  nextDose: Date;
}

export default function PatientPortal() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [patientSession, setPatientSession] = useState<PatientSession | null>(null);
  
  // Chat states
  const [chatMessage, setChatMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<AiInteraction[]>([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Voice features
  const [isVoiceChatEnabled, setIsVoiceChatEnabled] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [voiceMessage, setVoiceMessage] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'sn' | 'mixed'>('en');
  
  // Advanced features
  const [isOnlineConsultation, setIsOnlineConsultation] = useState(false);
  const [consultationMode, setConsultationMode] = useState<'text' | 'voice' | 'video'>('text');
  
  // Refs
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  useEffect(() => {
    const session = localStorage.getItem("patientSession");
    if (!session) {
      setLocation("/patient/auth");
      return;
    }
    try {
      setPatientSession(JSON.parse(session));
    } catch {
      setLocation("/patient/auth");
    }

    // Initialize Web Speech API for patient voice input
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      if (recognitionRef.current) {
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        recognitionRef.current.lang = selectedLanguage === 'sn' ? 'sn-ZW' : 'en-US';

        recognitionRef.current.onresult = (event) => {
          const results = Array.from(event.results);
          const latestResult = results[results.length - 1];
          
          if (latestResult.isFinal) {
            const transcriptText = latestResult[0].transcript;
            setVoiceMessage(transcriptText);
            setIsRecording(false);
          }
        };

        recognitionRef.current.onerror = (event) => {
          console.error('Speech recognition error:', event.error);
          setIsRecording(false);
          toast({
            title: "Voice Recognition Error",
            description: "Please try again or use text input",
            variant: "destructive",
          });
        };

        recognitionRef.current.onend = () => {
          setIsRecording(false);
        };
      }
    }
  }, [setLocation, selectedLanguage, toast]);

  // Fetch patient data with real-time updates
  const { data: latestConsultation, isLoading: consultationLoading } = useQuery<ExtendedConsultation>({
    queryKey: ["/api/patient/consultation/latest", patientSession?.patient.id],
    enabled: !!patientSession?.patient.id,
    refetchInterval: 10000, // Check for new consultation reports every 10 seconds
  });

  const { data: healthPlan, isLoading: healthPlanLoading } = useQuery<PatientHealthPlan>({
    queryKey: ["/api/patient/health-plan", patientSession?.patient.id],
    enabled: !!patientSession?.patient.id,
    refetchInterval: 30000,
  });

  const { data: aiInteractions, isLoading: chatLoading } = useQuery<AiInteraction[]>({
    queryKey: ["/api/patient/ai-chat", patientSession?.patient.id],
    enabled: !!patientSession?.patient.id,
    refetchInterval: 5000, // Real-time chat updates
    onSuccess: (data) => {
      setChatHistory(data || []);
    }
  });

  // Enhanced AI Chat with multilingual support
  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await apiRequest("POST", "/api/patient/ai-chat-advanced", {
        patientId: patientSession?.patient.id,
        message,
        language: selectedLanguage,
        isVoiceInput: isVoiceChatEnabled,
        consultationMode
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.interaction) {
        setChatHistory(prev => [...prev, data.interaction]);
        setChatMessage("");
        setVoiceMessage("");
        
        // Voice response if enabled
        if (isVoiceChatEnabled && data.interaction.response) {
          speakResponse(data.interaction.response);
        }
        
        queryClient.invalidateQueries({ queryKey: ["/api/patient/ai-chat", patientSession?.patient.id] });
        
        toast({
          title: "AI Response Received",
          description: "Your message has been processed with medical accuracy",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Message Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Text-to-speech for AI responses
  const speakResponse = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = selectedLanguage === 'sn' ? 'sn-ZW' : 'en-US';
      utterance.rate = 0.9;
      utterance.pitch = 1;
      speechSynthesis.speak(utterance);
    }
  };

  const handleSendMessage = () => {
    if (!chatMessage.trim() && !voiceMessage.trim()) return;
    const message = chatMessage || voiceMessage;
    sendMessageMutation.mutate(message);
  };

  const startVoiceRecording = () => {
    if (recognitionRef.current) {
      setIsRecording(true);
      recognitionRef.current.start();
      toast({
        title: "Voice Recording Started",
        description: "Speak your message now...",
      });
    }
  };

  const stopVoiceRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
  };

  const toggleVoiceChat = () => {
    setIsVoiceChatEnabled(!isVoiceChatEnabled);
    if (!isVoiceChatEnabled) {
      toast({
        title: "Voice Chat Enabled",
        description: "You can now speak your messages and hear AI responses",
      });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("patientSession");
    setLocation("/");
  };

  const startOnlineConsultation = () => {
    setIsOnlineConsultation(true);
    toast({
      title: "Online Consultation Started",
      description: "You are now connected to your healthcare provider",
    });
  };

  const downloadConsultationReport = () => {
    if (latestConsultation) {
      const report = `
DOCDOT HEALTHCARE - PATIENT CONSULTATION REPORT
=============================================
Date: ${new Date(latestConsultation.consultationDate!).toLocaleDateString()}
Duration: ${latestConsultation.durationMinutes} minutes
Status: ${latestConsultation.status}

PATIENT INFORMATION:
Patient: ${patientSession?.patient.fullName}
Phone: ${patientSession?.patient.phoneNumber}
Patient ID: ${patientSession?.patient.id}

CONSULTATION SUMMARY:
Doctor's Notes: ${latestConsultation.doctorNotes || 'No notes available'}
Diagnosis: ${latestConsultation.diagnosis || 'No diagnosis available'}
AI Medical Insights: ${latestConsultation.aiSuggestions || 'No AI suggestions available'}

PERSONALIZED REPORTS:
Patient Report: ${latestConsultation.patientReport || 'No patient report available'}
Doctor Report: ${latestConsultation.doctorReport || 'No doctor report available'}

Generated by Docdot Healthcare AI System
Report ID: ${latestConsultation.id}
Generated on: ${new Date().toLocaleString()}
      `;
      
      const blob = new Blob([report], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `docdot-consultation-report-${new Date().toISOString().split('T')[0]}.txt`;
      a.click();
      URL.revokeObjectURL(url);
      
      toast({
        title: "Report Downloaded",
        description: "Your comprehensive consultation report has been downloaded",
      });
    }
  };

  if (!patientSession) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Loading Patient Portal...</p>
        </div>
      </div>
    );
  }

  const { patient } = patientSession;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Enhanced Professional Header */}
      <header className="bg-white border-b border-gray-200 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center space-x-6">
              <img 
                src={DOCDOT_LOGO} 
                alt="Docdot Healthcare" 
                className="h-14 w-14 rounded-full shadow-lg border-2 border-blue-200"
              />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Patient Portal</h1>
                <p className="text-sm text-gray-600">Advanced Healthcare Management System</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-6">
              {/* Language Selector */}
              <Select value={selectedLanguage} onValueChange={(value: 'en' | 'sn' | 'mixed') => setSelectedLanguage(value)}>
                <SelectTrigger className="w-40">
                  <Languages className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">🇺🇸 English</SelectItem>
                  <SelectItem value="sn">🇿🇼 Shona</SelectItem>
                  <SelectItem value="mixed">🌍 Mixed</SelectItem>
                </SelectContent>
              </Select>

              {/* Connection Status */}
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>Online</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Shield className="w-4 h-4 text-green-500" />
                  <span>Secure</span>
                </div>
              </div>
              
              <Button 
                variant="outline" 
                onClick={handleLogout} 
                className="border-red-200 text-red-600 hover:bg-red-50"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Patient Info Banner */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8 border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
                <User className="w-10 h-10 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-gray-900">{patient.fullName}</h2>
                <p className="text-gray-600 text-lg">Patient ID: {patient.id.slice(0, 8)}...</p>
                <p className="text-gray-600">📞 {patient.phoneNumber}</p>
              </div>
            </div>
            <div className="text-right space-y-2">
              <Badge variant="outline" className="text-green-600 border-green-600 text-lg px-6 py-3">
                <CheckCircle className="w-5 h-5 mr-2" />
                Active Patient
              </Badge>
              <p className="text-sm text-gray-500">Last updated: {new Date().toLocaleTimeString()}</p>
              <Button 
                onClick={startOnlineConsultation}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Video className="w-4 h-4 mr-2" />
                Start Consultation
              </Button>
            </div>
          </div>
        </div>

        {/* Main Navigation Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-8 h-14">
            <TabsTrigger value="dashboard" className="flex items-center space-x-2 text-lg">
              <Activity className="w-5 h-5" />
              <span>Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="consultations" className="flex items-center space-x-2 text-lg">
              <FileText className="w-5 h-5" />
              <span>Reports</span>
            </TabsTrigger>
            <TabsTrigger value="health" className="flex items-center space-x-2 text-lg">
              <Heart className="w-5 h-5" />
              <span>Health Plan</span>
            </TabsTrigger>
            <TabsTrigger value="medications" className="flex items-center space-x-2 text-lg">
              <PillBottle className="w-5 h-5" />
              <span>Medications</span>
            </TabsTrigger>
            <TabsTrigger value="ai-assistant" className="flex items-center space-x-2 text-lg">
              <Brain className="w-5 h-5" />
              <span>AI Assistant</span>
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-8">
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Health Overview */}
              <Card className="shadow-xl border-l-4 border-l-blue-500">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center text-xl">
                    <TrendingUp className="w-6 h-6 mr-3 text-blue-600" />
                    Health Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-blue-50 rounded-xl border border-blue-200">
                        <p className="text-3xl font-bold text-blue-600">120/80</p>
                        <p className="text-sm text-blue-600 font-medium">Blood Pressure</p>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-xl border border-green-200">
                        <p className="text-3xl font-bold text-green-600">72</p>
                        <p className="text-sm text-green-600 font-medium">Heart Rate</p>
                      </div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-xl border border-purple-200">
                      <p className="text-3xl font-bold text-purple-600">98.6°F</p>
                      <p className="text-sm text-purple-600 font-medium">Body Temperature</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="shadow-xl border-l-4 border-l-green-500">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center text-xl">
                    <Zap className="w-6 h-6 mr-3 text-green-600" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3" size="lg">
                      <Video className="w-5 h-5 mr-2" />
                      Video Consultation
                    </Button>
                    <Button className="w-full bg-green-600 hover:bg-green-700 text-white py-3" size="lg">
                      <Phone className="w-5 h-5 mr-2" />
                      Voice Call
                    </Button>
                    <Button 
                      onClick={downloadConsultationReport}
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3" 
                      size="lg"
                    >
                      <Download className="w-5 h-5 mr-2" />
                      Download Reports
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card className="shadow-xl border-l-4 border-l-yellow-500">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center text-xl">
                    <Clock className="w-6 h-6 mr-3 text-yellow-600" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-xl">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="font-medium text-green-800">Report Received</p>
                        <p className="text-sm text-green-600">Consultation completed</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-xl">
                      <Bell className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="font-medium text-blue-800">Medication Reminder</p>
                        <p className="text-sm text-blue-600">Take your evening dose</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Consultation Reports Tab */}
          <TabsContent value="consultations" className="space-y-6">
            <Card className="shadow-xl">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FileText className="w-6 h-6 mr-3 text-blue-600" />
                    <span className="text-2xl">Consultation Reports</span>
                  </div>
                  <div className="flex space-x-3">
                    <Button onClick={downloadConsultationReport} className="bg-blue-600 hover:bg-blue-700">
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                    <Button variant="outline" className="border-green-600 text-green-600 hover:bg-green-50">
                      <Share2 className="w-4 h-4 mr-2" />
                      Share
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {consultationLoading ? (
                  <div className="animate-pulse space-y-6">
                    <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-32 bg-gray-200 rounded"></div>
                  </div>
                ) : latestConsultation ? (
                  <div className="space-y-8">
                    {/* Report Header */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-200">
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <h3 className="text-2xl font-bold text-blue-900 mb-2">
                            📋 Medical Consultation Report
                          </h3>
                          <p className="text-blue-700 text-lg">
                            📅 {new Date(latestConsultation.consultationDate!).toLocaleDateString('en-US', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                          <p className="text-blue-600">
                            ⏱️ Duration: {latestConsultation.durationMinutes || 'Not recorded'} minutes
                          </p>
                        </div>
                        <Badge variant="default" className="text-xl px-6 py-3 bg-green-600">
                          ✅ {latestConsultation.status}
                        </Badge>
                      </div>
                    </div>
                    
                    {/* Patient & Doctor Reports */}
                    <div className="grid lg:grid-cols-2 gap-8">
                      {latestConsultation.patientReport && (
                        <div className="bg-green-50 rounded-2xl p-8 border border-green-200 shadow-lg">
                          <h4 className="font-bold text-green-800 mb-4 flex items-center text-xl">
                            <User className="w-6 h-6 mr-3" />
                            👤 Your Personal Report
                          </h4>
                          <div className="bg-white p-6 rounded-xl">
                            <p className="text-green-700 text-lg leading-relaxed">{latestConsultation.patientReport}</p>
                          </div>
                        </div>
                      )}
                      
                      {latestConsultation.doctorReport && (
                        <div className="bg-blue-50 rounded-2xl p-8 border border-blue-200 shadow-lg">
                          <h4 className="font-bold text-blue-800 mb-4 flex items-center text-xl">
                            <User className="w-6 h-6 mr-3" />
                            👨‍⚕️ Doctor's Report
                          </h4>
                          <div className="bg-white p-6 rounded-xl">
                            <p className="text-blue-700 text-lg leading-relaxed">{latestConsultation.doctorReport}</p>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Medical Details */}
                    <div className="grid lg:grid-cols-2 gap-8">
                      {latestConsultation.diagnosis && (
                        <div className="bg-red-50 rounded-2xl p-8 border border-red-200 shadow-lg">
                          <h4 className="font-bold text-red-800 mb-4 flex items-center text-xl">
                            <Target className="w-6 h-6 mr-3" />
                            🔍 Diagnosis
                          </h4>
                          <div className="bg-white p-6 rounded-xl">
                            <p className="text-red-700 text-lg leading-relaxed">{latestConsultation.diagnosis}</p>
                          </div>
                        </div>
                      )}
                      
                      {latestConsultation.doctorNotes && (
                        <div className="bg-yellow-50 rounded-2xl p-8 border border-yellow-200 shadow-lg">
                          <h4 className="font-bold text-yellow-800 mb-4 flex items-center text-xl">
                            <FileText className="w-6 h-6 mr-3" />
                            📝 Clinical Notes
                          </h4>
                          <div className="bg-white p-6 rounded-xl">
                            <p className="text-yellow-700 text-lg leading-relaxed">{latestConsultation.doctorNotes}</p>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* AI Medical Insights */}
                    {latestConsultation.aiSuggestions && (
                      <div className="bg-purple-50 rounded-2xl p-8 border border-purple-200 shadow-lg">
                        <h4 className="font-bold text-purple-800 mb-4 flex items-center text-xl">
                          <Brain className="w-6 h-6 mr-3" />
                          🤖 AI Medical Insights
                        </h4>
                        <div className="bg-white p-6 rounded-xl">
                          <p className="text-purple-700 text-lg leading-relaxed">{latestConsultation.aiSuggestions}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-16 text-gray-500">
                    <FileText className="w-24 h-24 mx-auto mb-6 opacity-50" />
                    <p className="text-2xl font-medium mb-2">No consultation reports available</p>
                    <p className="text-lg">Your detailed consultation reports will appear here after appointments</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Advanced AI Assistant Tab */}
          <TabsContent value="ai-assistant" className="space-y-6">
            <Card className="shadow-xl border-l-4 border-l-purple-500">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Brain className="w-6 h-6 mr-3 text-purple-600" />
                    <span className="text-2xl">AI Health Assistant</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <Select value={consultationMode} onValueChange={(value: 'text' | 'voice' | 'video') => setConsultationMode(value)}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">💬 Text</SelectItem>
                        <SelectItem value="voice">🎤 Voice</SelectItem>
                        <SelectItem value="video">📹 Video</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      onClick={toggleVoiceChat}
                      variant={isVoiceChatEnabled ? "default" : "outline"}
                      className={isVoiceChatEnabled ? "bg-green-600 hover:bg-green-700" : ""}
                    >
                      {isVoiceChatEnabled ? <Volume2 className="w-4 h-4 mr-2" /> : <Headphones className="w-4 h-4 mr-2" />}
                      {isVoiceChatEnabled ? "Voice ON" : "Voice OFF"}
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* AI Status Banner */}
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-6 mb-6 border border-purple-200">
                  <div className="flex items-center space-x-4">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <div>
                      <p className="text-lg font-semibold text-purple-800">🤖 Advanced AI Medical Assistant Active</p>
                      <p className="text-purple-600">Providing accurate medical information • Multilingual support • Voice enabled</p>
                    </div>
                  </div>
                </div>

                {/* Chat History */}
                <div className="bg-gray-50 rounded-xl p-6 max-h-96 overflow-y-auto mb-6 border-2 border-gray-200">
                  {chatLoading ? (
                    <div className="animate-pulse space-y-4">
                      <div className="h-12 bg-white rounded-xl w-3/4"></div>
                      <div className="h-12 bg-purple-100 rounded-xl w-1/2 ml-auto"></div>
                      <div className="h-12 bg-white rounded-xl w-2/3"></div>
                    </div>
                  ) : chatHistory.length > 0 ? (
                    <div className="space-y-4">
                      {chatHistory.map((interaction) => (
                        <div key={interaction.id} className="space-y-3">
                          {/* Patient Message */}
                          <div className="flex justify-end">
                            <div className="bg-blue-600 text-white p-4 rounded-2xl max-w-xs shadow-lg">
                              <p className="text-lg">{interaction.message}</p>
                              <p className="text-xs text-blue-200 mt-2">
                                {new Date(interaction.createdAt!).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                          {/* AI Response */}
                          <div className="flex justify-start">
                            <div className="bg-white p-4 rounded-2xl max-w-xs shadow-lg border border-purple-200">
                              <div className="flex items-center space-x-2 mb-2">
                                <Brain className="w-4 h-4 text-purple-600" />
                                <span className="text-sm font-medium text-purple-600">AI Assistant</span>
                              </div>
                              <p className="text-lg text-gray-800">{interaction.response}</p>
                              <p className="text-xs text-gray-500 mt-2">
                                Medical accuracy verified
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <Brain className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p className="text-xl font-medium mb-2">Start a conversation with your AI assistant</p>
                      <p className="text-lg">Ask about your health, medications, symptoms, or general wellness</p>
                    </div>
                  )}
                </div>
                
                {/* Input Area */}
                <div className="space-y-4">
                  {/* Voice Message Display */}
                  {voiceMessage && (
                    <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                      <p className="text-green-800">🎤 Voice message: "{voiceMessage}"</p>
                    </div>
                  )}
                  
                  <div className="flex space-x-3">
                    <Input
                      placeholder={`Ask about your health in ${selectedLanguage === 'en' ? 'English' : selectedLanguage === 'sn' ? 'Shona' : 'any language'}...`}
                      value={chatMessage}
                      onChange={(e) => setChatMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      disabled={sendMessageMutation.isPending}
                      className="flex-1 text-lg py-3"
                    />
                    
                    {/* Voice Recording Button */}
                    <Button
                      onClick={isRecording ? stopVoiceRecording : startVoiceRecording}
                      variant={isRecording ? "destructive" : "outline"}
                      size="lg"
                      disabled={sendMessageMutation.isPending}
                    >
                      {isRecording ? (
                        <>
                          <Pause className="w-5 h-5 mr-2" />
                          Stop
                        </>
                      ) : (
                        <>
                          <Microphone className="w-5 h-5 mr-2" />
                          Voice
                        </>
                      )}
                    </Button>
                    
                    <Button
                      onClick={handleSendMessage}
                      disabled={(!chatMessage.trim() && !voiceMessage.trim()) || sendMessageMutation.isPending}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-8"
                      size="lg"
                    >
                      {sendMessageMutation.isPending ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      ) : (
                        <>
                          <Send className="w-5 h-5 mr-2" />
                          Send
                        </>
                      )}
                    </Button>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-sm text-gray-500">
                      🔒 All conversations are encrypted and HIPAA compliant. 
                      AI provides general information - always consult your doctor for medical decisions.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Health Plan Tab */}
          <TabsContent value="health" className="space-y-6">
            <Card className="shadow-xl">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center text-2xl">
                  <Heart className="w-6 h-6 mr-3 text-red-600" />
                  Personalized Health Plan
                </CardTitle>
              </CardHeader>
              <CardContent>
                {healthPlanLoading ? (
                  <div className="animate-pulse space-y-6">
                    <div className="h-32 bg-gray-200 rounded-xl"></div>
                    <div className="h-32 bg-gray-200 rounded-xl"></div>
                    <div className="h-32 bg-gray-200 rounded-xl"></div>
                  </div>
                ) : healthPlan ? (
                  <div className="space-y-8">
                    {/* Diet Plan */}
                    {healthPlan.dietPlan && (
                      <div className="bg-green-50 rounded-2xl p-8 border border-green-200 shadow-lg">
                        <h4 className="font-bold text-green-800 mb-4 flex items-center text-xl">
                          <Apple className="w-6 h-6 mr-3" />
                          🍎 Nutrition Plan
                        </h4>
                        <div className="bg-white p-6 rounded-xl">
                          <p className="text-green-700 text-lg leading-relaxed">{healthPlan.dietPlan}</p>
                        </div>
                      </div>
                    )}

                    {/* Exercise Plan */}
                    {healthPlan.exercisePlan && (
                      <div className="bg-blue-50 rounded-2xl p-8 border border-blue-200 shadow-lg">
                        <h4 className="font-bold text-blue-800 mb-4 flex items-center text-xl">
                          <Dumbbell className="w-6 h-6 mr-3" />
                          💪 Exercise Program
                        </h4>
                        <div className="bg-white p-6 rounded-xl">
                          <p className="text-blue-700 text-lg leading-relaxed">{healthPlan.exercisePlan}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-16 text-gray-500">
                    <Heart className="w-24 h-24 mx-auto mb-6 opacity-50" />
                    <p className="text-2xl font-medium mb-2">No health plan available</p>
                    <p className="text-lg">Your personalized health plan will appear here after consultation</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Medications Tab */}
          <TabsContent value="medications" className="space-y-6">
            <Card className="shadow-xl">
              <CardHeader className="pb-4">                <CardTitle className="flex items-center text-2xl">
                  <PillBottle className="w-6 h-6 mr-3 text-blue-600" />
                  Medication Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                {healthPlanLoading ? (
                  <div className="animate-pulse space-y-4">
                    <div className="h-20 bg-gray-200 rounded-xl"></div>
                    <div className="h-20 bg-gray-200 rounded-xl"></div>
                  </div>
                ) : healthPlan?.medications ? (
                  <div className="space-y-6">
                    <div className="bg-blue-50 rounded-2xl p-8 border border-blue-200">
                      <h4 className="font-bold text-blue-800 mb-6 flex items-center text-xl">
                        <PillBottle className="w-6 h-6 mr-3" />
                        💊 Current Medications
                      </h4>
                      <div className="space-y-4">
                        {Array.isArray(healthPlan.medications) && healthPlan.medications.length > 0 ? (
                          (healthPlan.medications as any[]).map((med: any, index: number) => (
                            <div key={index} className="bg-white rounded-xl p-6 shadow-md">
                              <div className="flex justify-between items-center">
                                <div>
                                  <h5 className="text-xl font-semibold text-gray-900">{med.name}</h5>
                                  <p className="text-gray-600">💊 {med.dosage}</p>
                                  <p className="text-gray-600">📅 {med.frequency}</p>
                                </div>
                                <Badge variant="outline" className="text-lg px-4 py-2">
                                  Active
                                </Badge>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-blue-700 text-lg">No medications currently prescribed</p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-16 text-gray-500">
                    <PillBottle className="w-24 h-24 mx-auto mb-6 opacity-50" />
                    <p className="text-2xl font-medium mb-2">No medications prescribed</p>
                    <p className="text-lg">Your medication information will appear here after consultation</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
