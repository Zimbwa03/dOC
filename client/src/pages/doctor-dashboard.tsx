import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { 
  Users, 
  Clock, 
  Brain, 
  DollarSign, 
  Plus, 
  BarChart3, 
  MessageSquare,
  FileText,
  BookOpen,
  ArrowRight,
  LogOut
} from "lucide-react";
import type { DoctorStats, PatientSummary, JournalRecommendation } from "@/lib/types";
import { Link } from "wouter";

const DOCDOT_LOGO = "https://hvlvwvzliqrlmqjbfgoa.supabase.co/storage/v1/object/sign/O_level_Maths/20250526_2027_Young_Medical_Student_remix_01jw6xh6h8fe1ahpkyns3pw1dw-removebg-preview-removebg-preview.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9iMDVlOWY4Ni0wM2E0LTRmMDktYWI1OS0wNWYyMDM2MmFlNjIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJPX2xldmVsX01hdGhzLzIwMjUwNTI2XzIwMjdfWW91bmdfTWVkaWNhbF9TdHVkZW50X3JlbWl4XzAxanc2eGg2aDhmZTFhaHBreW5zM3B3MWR3LXJlbW92ZWJnLXByZXZpZXctcmVtb3ZlYmctcHJldmlldy5wbmciLCJpYXQiOjE3NTYzMzUzODUsImV4cCI6NzUwNDU5OTkzODV9.7JnaD1MCTpi3TLE05IbAeYEexxi3t-LVBuVunNvWwEk";

interface DoctorSession {
  doctor: {
    id: string;
    fullName: string;
    specialization: string;
    email: string;
  };
}

export default function DoctorDashboard() {
  const [, setLocation] = useLocation();
  const [doctorSession, setDoctorSession] = useState<DoctorSession | null>(null);

  useEffect(() => {
    const session = localStorage.getItem("doctorSession");
    if (!session) {
      setLocation("/doctor/auth");
      return;
    }
    try {
      setDoctorSession(JSON.parse(session));
    } catch {
      setLocation("/doctor/auth");
    }
  }, [setLocation]);

  const { data: stats, isLoading: statsLoading } = useQuery<DoctorStats>({
    queryKey: ["/api/doctor/stats", doctorSession?.doctor.id],
    enabled: !!doctorSession?.doctor.id,
  });

  const { data: recentPatients, isLoading: patientsLoading } = useQuery<PatientSummary[]>({
    queryKey: ["/api/doctor/patients/recent", doctorSession?.doctor.id],
    enabled: !!doctorSession?.doctor.id,
  });

  const { data: journalRecommendations, isLoading: journalsLoading } = useQuery<JournalRecommendation[]>({
    queryKey: ["/api/doctor/journals", doctorSession?.doctor.id],
    enabled: !!doctorSession?.doctor.id,
  });

  const handleLogout = () => {
    localStorage.removeItem("doctorSession");
    setLocation("/");
  };

  if (!doctorSession) {
    return <div>Loading...</div>;
  }

  const { doctor } = doctorSession;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border shadow-sm" data-testid="dashboard-header">
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
                <h1 className="text-xl font-semibold" data-testid="doctor-name">
                  Dr. {doctor.fullName}
                </h1>
                <p className="text-sm text-muted-foreground" data-testid="doctor-specialization">
                  {doctor.specialization}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link href="/doctor/consultation">
                <Button className="flex items-center space-x-2" data-testid="button-new-consultation">
                  <Plus className="w-4 h-4" />
                  <span>New Consultation</span>
                </Button>
              </Link>
              <Button variant="outline" onClick={handleLogout} data-testid="button-logout">
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="stats-card" data-testid="stats-patients">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Patients This Week</p>
                  <p className="text-2xl font-bold text-primary" data-testid="stat-patients-value">
                    {statsLoading ? "..." : stats?.patientsThisWeek || 0}
                  </p>
                </div>
                <Users className="w-8 h-8 text-primary/30" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="stats-card" data-testid="stats-hours">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Consultation Hours</p>
                  <p className="text-2xl font-bold text-primary" data-testid="stat-hours-value">
                    {statsLoading ? "..." : stats?.consultationHours || 0}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-primary/30" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="stats-card" data-testid="stats-accuracy">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">AI Accuracy</p>
                  <p className="text-2xl font-bold text-success" data-testid="stat-accuracy-value">
                    {statsLoading ? "..." : `${stats?.accuracyScore || 0}%`}
                  </p>
                </div>
                <Brain className="w-8 h-8 text-success/30" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="stats-card" data-testid="stats-revenue">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Revenue</p>
                  <p className="text-2xl font-bold text-primary" data-testid="stat-revenue-value">
                    {statsLoading ? "..." : `$${stats?.revenue || 0}`}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-primary/30" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="mb-8" data-testid="quick-actions">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <Link href="/doctor/consultation">
                <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center space-y-2" data-testid="action-consultation">
                  <MessageSquare className="w-6 h-6" />
                  <span>Start Consultation</span>
                </Button>
              </Link>
              <Link href="/doctor/analytics">
                <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center space-y-2" data-testid="action-analytics">
                  <BarChart3 className="w-6 h-6" />
                  <span>View Analytics</span>
                </Button>
              </Link>
              <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center space-y-2" data-testid="action-patients">
                <FileText className="w-6 h-6" />
                <span>Patient Records</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Recent Patients */}
          <Card data-testid="recent-patients">
            <CardHeader>
              <CardTitle>Recent Patients</CardTitle>
            </CardHeader>
            <CardContent>
              {patientsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-16 bg-muted rounded"></div>
                    </div>
                  ))}
                </div>
              ) : recentPatients && recentPatients.length > 0 ? (
                <div className="space-y-4">
                  {recentPatients.map((patient) => (
                    <div 
                      key={patient.id} 
                      className="flex items-center justify-between p-4 bg-muted rounded-lg"
                      data-testid={`patient-${patient.id}`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                          <span className="text-primary font-semibold text-sm">
                            {patient.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium" data-testid={`patient-name-${patient.id}`}>
                            {patient.name}
                          </p>
                          <p className="text-sm text-muted-foreground" data-testid={`patient-condition-${patient.id}`}>
                            {patient.condition}
                          </p>
                        </div>
                      </div>
                      <Badge 
                        variant={patient.status === 'completed' ? 'default' : 'secondary'}
                        data-testid={`patient-status-${patient.id}`}
                      >
                        {patient.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground" data-testid="no-patients">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No recent patients</p>
                  <p className="text-sm">Start a consultation to see patients here</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* AI Journal Recommendations */}
          <Card data-testid="journal-recommendations">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Brain className="w-5 h-5 mr-2 text-primary" />
                AI Journal Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              {journalsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-20 bg-muted rounded"></div>
                    </div>
                  ))}
                </div>
              ) : journalRecommendations && journalRecommendations.length > 0 ? (
                <div className="space-y-4">
                  {journalRecommendations.map((journal, index) => (
                    <div 
                      key={index} 
                      className="consultation-card rounded-lg p-4"
                      data-testid={`journal-${index}`}
                    >
                      <h5 className="font-medium text-sm mb-2" data-testid={`journal-title-${index}`}>
                        {journal.title}
                      </h5>
                      <p className="text-xs text-muted-foreground mb-2" data-testid={`journal-source-${index}`}>
                        {journal.journal}
                      </p>
                      <p className="text-xs" data-testid={`journal-summary-${index}`}>
                        {journal.summary}
                      </p>
                      {journal.url && (
                        <Button 
                          variant="link" 
                          size="sm" 
                          className="p-0 h-auto text-xs mt-2"
                          data-testid={`journal-link-${index}`}
                        >
                          <ArrowRight className="w-3 h-3 mr-1" />
                          Read More
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground" data-testid="no-journals">
                  <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No recommendations yet</p>
                  <p className="text-sm">Complete consultations to get personalized journal recommendations</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
