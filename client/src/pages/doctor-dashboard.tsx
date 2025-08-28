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
  LogOut,
  RefreshCw,
  TrendingUp,
  Activity,
  Calendar,
  Phone
} from "lucide-react";
import type { DoctorStats, PatientSummary, JournalRecommendation, ConsultationSummary } from "@/lib/types";
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
  const [activeTab, setActiveTab] = useState<'overview' | 'patients' | 'consultations'>('overview');

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

  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery<DoctorStats>({
    queryKey: ["/api/doctor/stats", doctorSession?.doctor.id],
    enabled: !!doctorSession?.doctor.id,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const { data: recentPatients, isLoading: patientsLoading, refetch: refetchPatients } = useQuery<PatientSummary[]>({
    queryKey: ["/api/doctor/patients/recent", doctorSession?.doctor.id],
    enabled: !!doctorSession?.doctor.id,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const { data: allPatients, isLoading: allPatientsLoading } = useQuery<PatientSummary[]>({
    queryKey: ["/api/doctor/patients/all", doctorSession?.doctor.id],
    enabled: !!doctorSession?.doctor.id && activeTab === 'patients',
  });

  const { data: consultations, isLoading: consultationsLoading } = useQuery<ConsultationSummary[]>({
    queryKey: ["/api/doctor/consultations", doctorSession?.doctor.id],
    enabled: !!doctorSession?.doctor.id && activeTab === 'consultations',
  });

  const { data: journalRecommendations, isLoading: journalsLoading } = useQuery<JournalRecommendation[]>({
    queryKey: ["/api/doctor/journals", doctorSession?.doctor.id],
    enabled: !!doctorSession?.doctor.id,
    refetchInterval: 60000, // Refetch every minute
  });

  const handleLogout = () => {
    localStorage.removeItem("doctorSession");
    setLocation("/");
  };

  const handleRefresh = () => {
    refetchStats();
    refetchPatients();
  };

  if (!doctorSession) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const { doctor } = doctorSession;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border shadow-sm sticky top-0 z-50" data-testid="dashboard-header">
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
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefresh}
                className="flex items-center space-x-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh</span>
              </Button>
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
        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-muted p-1 rounded-lg mb-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'overview'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('patients')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'patients'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Patients
          </button>
          <button
            onClick={() => setActiveTab('consultations')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'consultations'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Consultations
          </button>
        </div>

        {/* Stats Cards - Only show on overview tab */}
        {activeTab === 'overview' && (
          <>
        <div className="grid md:grid-cols-4 gap-6 mb-8">
              <Card className="stats-card hover:shadow-lg transition-shadow" data-testid="stats-patients">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Patients This Week</p>
                  <p className="text-2xl font-bold text-primary" data-testid="stat-patients-value">
                    {statsLoading ? "..." : stats?.patientsThisWeek || 0}
                  </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        <TrendingUp className="w-3 h-3 inline mr-1" />
                        +12% from last week
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                      <Users className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          
              <Card className="stats-card hover:shadow-lg transition-shadow" data-testid="stats-hours">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Consultation Hours</p>
                  <p className="text-2xl font-bold text-primary" data-testid="stat-hours-value">
                    {statsLoading ? "..." : stats?.consultationHours || 0}
                  </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        <Activity className="w-3 h-3 inline mr-1" />
                        This week
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                      <Clock className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          
              <Card className="stats-card hover:shadow-lg transition-shadow" data-testid="stats-accuracy">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">AI Accuracy</p>
                  <p className="text-2xl font-bold text-success" data-testid="stat-accuracy-value">
                    {statsLoading ? "..." : `${stats?.accuracyScore || 0}%`}
                  </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        <Brain className="w-3 h-3 inline mr-1" />
                        AI-powered insights
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-success/20 rounded-full flex items-center justify-center">
                      <Brain className="w-6 h-6 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>
          
              <Card className="stats-card hover:shadow-lg transition-shadow" data-testid="stats-revenue">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Revenue</p>
                  <p className="text-2xl font-bold text-primary" data-testid="stat-revenue-value">
                    {statsLoading ? "..." : `$${stats?.revenue || 0}`}
                  </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        <Calendar className="w-3 h-3 inline mr-1" />
                        This week
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                      <DollarSign className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
            <Card className="mb-8 hover:shadow-lg transition-shadow" data-testid="quick-actions">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <Link href="/doctor/consultation">
                    <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center space-y-2 hover:bg-primary hover:text-primary-foreground transition-colors" data-testid="action-consultation">
                  <MessageSquare className="w-6 h-6" />
                  <span>Start Consultation</span>
                </Button>
              </Link>
              <Link href="/doctor/analytics">
                    <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center space-y-2 hover:bg-primary hover:text-primary-foreground transition-colors" data-testid="action-analytics">
                  <BarChart3 className="w-6 h-6" />
                  <span>View Analytics</span>
                </Button>
              </Link>
                  <Button 
                    variant="outline" 
                    className="w-full h-20 flex flex-col items-center justify-center space-y-2 hover:bg-primary hover:text-primary-foreground transition-colors" 
                    data-testid="action-patients"
                    onClick={() => setActiveTab('patients')}
                  >
                <FileText className="w-6 h-6" />
                <span>Patient Records</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Recent Patients */}
              <Card data-testid="recent-patients" className="hover:shadow-lg transition-shadow">
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
                          className="flex items-center justify-between p-4 bg-muted rounded-lg hover:bg-muted/80 transition-colors cursor-pointer"
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
              <Card data-testid="journal-recommendations" className="hover:shadow-lg transition-shadow">
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
                          className="consultation-card rounded-lg p-4 hover:bg-muted/50 transition-colors"
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
          </>
        )}

        {/* Patients Tab */}
        {activeTab === 'patients' && (
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="w-5 h-5 mr-2 text-primary" />
                All Patients ({allPatients?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {allPatientsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-16 bg-muted rounded"></div>
                    </div>
                  ))}
                </div>
              ) : allPatients && allPatients.length > 0 ? (
                <div className="space-y-4">
                  {allPatients.map((patient) => (
                    <div 
                      key={patient.id} 
                      className="flex items-center justify-between p-4 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                          <span className="text-primary font-semibold text-lg">
                            {patient.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-lg">{patient.name}</p>
                          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                            <Phone className="w-3 h-3" />
                            <span>{patient.phoneNumber}</span>
                          </div>
                          {patient.lastConsultation && (
                            <p className="text-xs text-muted-foreground">
                              Last visit: {new Date(patient.lastConsultation).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="mb-2">
                          {patient.totalConsultations} consultations
                        </Badge>
                        <p className="text-xs text-muted-foreground">
                          {patient.status}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">No patients yet</p>
                  <p className="text-sm">Start your first consultation to register patients</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Consultations Tab */}
        {activeTab === 'consultations' && (
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="w-5 h-5 mr-2 text-primary" />
                Recent Consultations ({consultations?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {consultationsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-20 bg-muted rounded"></div>
                    </div>
                  ))}
                </div>
              ) : consultations && consultations.length > 0 ? (
                <div className="space-y-4">
                  {consultations.map((consultation) => (
                    <div 
                      key={consultation.id} 
                      className="p-4 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{consultation.patientName}</h4>
                        <Badge variant={consultation.status === 'completed' ? 'default' : 'secondary'}>
                          {consultation.status}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                        <div>
                          <p>Date: {new Date(consultation.consultationDate).toLocaleDateString()}</p>
                          <p>Duration: {consultation.durationMinutes || 0} minutes</p>
                        </div>
                        <div>
                          <p>Patient: {consultation.patientPhone}</p>
                          {consultation.diagnosis && (
                            <p>Diagnosis: {consultation.diagnosis}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">No consultations yet</p>
                  <p className="text-sm">Start your first consultation to see records here</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
