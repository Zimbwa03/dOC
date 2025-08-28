import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  ArrowRight
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
}

export default function PatientPortal() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [patientSession, setPatientSession] = useState<PatientSession | null>(null);
  const [chatMessage, setChatMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<AiInteraction[]>([]);

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
  }, [setLocation]);

  const { data: latestConsultation, isLoading: consultationLoading } = useQuery<ExtendedConsultation>({
    queryKey: ["/api/patient/consultation/latest", patientSession?.patient.id],
    enabled: !!patientSession?.patient.id,
  });

  const { data: healthPlan, isLoading: healthPlanLoading } = useQuery<PatientHealthPlan>({
    queryKey: ["/api/patient/health-plan", patientSession?.patient.id],
    enabled: !!patientSession?.patient.id,
  });

  const { data: aiInteractions, isLoading: chatLoading } = useQuery<AiInteraction[]>({
    queryKey: ["/api/patient/ai-chat", patientSession?.patient.id],
    enabled: !!patientSession?.patient.id,
    onSuccess: (data) => {
      setChatHistory(data || []);
    }
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await apiRequest("POST", "/api/patient/ai-chat", {
        patientId: patientSession?.patient.id,
        message
      });
      return response.json();
    },
    onSuccess: (data) => {
      setChatHistory(prev => [...prev, data.interaction]);
      setChatMessage("");
      queryClient.invalidateQueries(["/api/patient/ai-chat", patientSession?.patient.id]);
      toast({
        title: "Message Sent",
        description: "AI assistant has responded to your message",
      });
    },
    onError: (error) => {
      toast({
        title: "Message Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = () => {
    if (!chatMessage.trim()) return;
    sendMessageMutation.mutate(chatMessage);
  };

  const handleLogout = () => {
    localStorage.removeItem("patientSession");
    setLocation("/");
  };

  if (!patientSession) {
    return <div>Loading...</div>;
  }

  const { patient } = patientSession;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border shadow-sm" data-testid="patient-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <img 
                src={DOCDOT_LOGO} 
                alt="Docdot" 
                className="h-10 w-10 rounded-full"
                data-testid="header-logo"
              />
              <div>
                <h1 className="text-xl font-semibold" data-testid="patient-name">
                  {patient.fullName}
                </h1>
                <p className="text-sm text-muted-foreground" data-testid="patient-id">
                  Patient ID: {patient.id.slice(0, 8)}...
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button variant="outline" onClick={handleLogout} data-testid="button-logout">
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Latest Consultation Report */}
          <Card className="mb-8" data-testid="consultation-report">
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="w-5 h-5 mr-2 text-primary" />
                Latest Consultation Report
              </CardTitle>
            </CardHeader>
            <CardContent>
              {consultationLoading ? (
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                  <div className="h-20 bg-muted rounded"></div>
                </div>
              ) : latestConsultation ? (
                <div className="bg-muted rounded-lg p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h5 className="font-semibold" data-testid="consultation-title">
                        Medical Consultation
                      </h5>
                      <p className="text-sm text-muted-foreground" data-testid="consultation-date">
                        {new Date(latestConsultation.consultationDate!).toLocaleDateString()} - 
                        {latestConsultation.durationMinutes ? ` ${latestConsultation.durationMinutes} minutes` : ' Duration not recorded'}
                      </p>
                    </div>
                    <Badge variant="default" data-testid="consultation-status">
                      {latestConsultation.status}
                    </Badge>
                  </div>
                  
                  <div className="space-y-3">
                    {latestConsultation.doctorNotes && (
                      <div>
                        <h6 className="font-medium text-sm">Doctor's Notes:</h6>
                        <p className="text-sm text-muted-foreground" data-testid="doctor-notes">
                          {latestConsultation.doctorNotes}
                        </p>
                      </div>
                    )}
                    {latestConsultation.diagnosis && (
                      <div>
                        <h6 className="font-medium text-sm">Diagnosis:</h6>
                        <p className="text-sm text-muted-foreground" data-testid="diagnosis">
                          {latestConsultation.diagnosis}
                        </p>
                      </div>
                    )}
                    {latestConsultation.aiSuggestions && (
                      <div>
                        <h6 className="font-medium text-sm">AI Insights:</h6>
                        <p className="text-sm text-muted-foreground" data-testid="ai-suggestions">
                          {latestConsultation.aiSuggestions}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground" data-testid="no-consultation">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No consultation reports available</p>
                  <p className="text-sm">Your consultation reports will appear here after your appointments</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Health Plan & Medications */}
          <Card className="mb-8" data-testid="health-plan">
            <CardHeader>
              <CardTitle className="flex items-center">
                <PillBottle className="w-5 h-5 mr-2 text-primary" />
                Current Health Plan
              </CardTitle>
            </CardHeader>
            <CardContent>
              {healthPlanLoading ? (
                <div className="animate-pulse space-y-4">
                  <div className="h-20 bg-muted rounded"></div>
                  <div className="h-20 bg-muted rounded"></div>
                  <div className="h-20 bg-muted rounded"></div>
                </div>
              ) : healthPlan ? (
                <div className="space-y-4">
                  {/* Medications */}
                  {healthPlan.medications && (
                    <div className="bg-muted rounded-lg p-4">
                      <h5 className="font-medium mb-2 flex items-center">
                        <PillBottle className="w-4 h-4 text-primary mr-2" />
                        Medications
                      </h5>
                      <div className="space-y-2" data-testid="medications-list">
                        {Array.isArray(healthPlan.medications) && healthPlan.medications.length > 0 ? (
                          (healthPlan.medications as any[]).map((med: any, index: number) => (
                            <div key={index} className="flex justify-between items-center">
                              <span className="text-sm" data-testid={`medication-${index}`}>
                                {med.name} {med.dosage}
                              </span>
                              <Badge variant="outline" data-testid={`medication-frequency-${index}`}>
                                {med.frequency}
                              </Badge>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground">No medications prescribed</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Diet Plan */}
                  {healthPlan.dietPlan && (
                    <div className="bg-muted rounded-lg p-4">
                      <h5 className="font-medium mb-2 flex items-center">
                        <Apple className="w-4 h-4 text-success mr-2" />
                        Diet Recommendations
                      </h5>
                      <p className="text-sm text-muted-foreground" data-testid="diet-plan">
                        {healthPlan.dietPlan}
                      </p>
                    </div>
                  )}

                  {/* Exercise Plan */}
                  {healthPlan.exercisePlan && (
                    <div className="bg-muted rounded-lg p-4">
                      <h5 className="font-medium mb-2 flex items-center">
                        <Dumbbell className="w-4 h-4 text-warning mr-2" />
                        Exercise Plan
                      </h5>
                      <p className="text-sm text-muted-foreground" data-testid="exercise-plan">
                        {healthPlan.exercisePlan}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground" data-testid="no-health-plan">
                  <PillBottle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No health plan available</p>
                  <p className="text-sm">Your personalized health plan will appear here after consultation</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* AI Health Assistant */}
        <Card data-testid="ai-chat">
          <CardHeader>
            <CardTitle className="flex items-center">
              <MessageSquare className="w-5 h-5 mr-2 text-primary" />
              AI Health Assistant
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-muted rounded-lg p-4 max-h-96 overflow-y-auto mb-4" data-testid="chat-history">
              {chatLoading ? (
                <div className="animate-pulse space-y-4">
                  <div className="h-10 bg-background rounded w-3/4"></div>
                  <div className="h-10 bg-background rounded w-1/2 ml-auto"></div>
                </div>
              ) : chatHistory.length > 0 ? (
                <div className="space-y-3">
                  {chatHistory.map((interaction) => (
                    <div key={interaction.id} className="space-y-2">
                      {/* User Message */}
                      <div className="flex justify-end">
                        <div className="bg-primary text-primary-foreground p-3 rounded-lg max-w-xs" data-testid={`user-message-${interaction.id}`}>
                          <p className="text-sm">{interaction.message}</p>
                        </div>
                      </div>
                      {/* AI Response */}
                      <div className="flex justify-start">
                        <div className="bg-background p-3 rounded-lg max-w-xs" data-testid={`ai-response-${interaction.id}`}>
                          <p className="text-sm">{interaction.response}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Start a conversation with your AI health assistant</p>
                  <p className="text-sm">Ask questions about your health, medications, or general wellness</p>
                </div>
              )}
            </div>
            
            <div className="flex space-x-2">
              <Input
                placeholder="Ask about your health..."
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                disabled={sendMessageMutation.isPending}
                data-testid="chat-input"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!chatMessage.trim() || sendMessageMutation.isPending}
                data-testid="send-message"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="mt-4 text-xs text-muted-foreground text-center">
              <p>This AI assistant provides general health information. Always consult your doctor for medical advice.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
