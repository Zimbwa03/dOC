import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { 
  ArrowLeft,
  TrendingUp,
  Users,
  Clock,
  Brain,
  DollarSign,
  BookOpen,
  Calendar,
  Target,
  Award,
  Activity,
  BarChart3
} from "lucide-react";
import { Link } from "wouter";
import type { DoctorAnalytics } from "@shared/schema";

const DOCDOT_LOGO = "https://hvlvwvzliqrlmqjbfgoa.supabase.co/storage/v1/object/sign/O_level_Maths/20250526_2027_Young_Medical_Student_remix_01jw6xh6h8fe1ahpkyns3pw1dw-removebg-preview-removebg-preview.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9iMDVlOWY4Ni0wM2E0LTRmMDktYWI1OS0wNWYyMDM2MmFlNjIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJPX2xldmVsX01hdGhzLzIwMjUwNTI2XzIwMjdfWW91bmdfTWVkaWNhbF9TdHVkZW50X3JlbWl4XzAxanc2eGg2aDhmZTFhaHBreW5zM3B3MWR3LXJlbW92ZWJnLXByZXZpZXctcmVtb3ZlYmctcHJldmlldy5wbmciLCJpYXQiOjE3NTYzMzUzODUsImV4cCI6NzUwNDU5OTkzODV9.7JnaD1MCTpi3TLE05IbAeYEexxi3t-LVBuVunNvWwEk";

interface DoctorSession {
  doctor: {
    id: string;
    fullName: string;
    specialization: string;
  };
}

interface AnalyticsData {
  weeklyData: DoctorAnalytics[];
  monthlyTrends: {
    patients: number[];
    hours: number[];
    accuracy: number[];
    revenue: number[];
  };
  performanceMetrics: {
    totalPatients: number;
    totalHours: number;
    averageAccuracy: number;
    totalRevenue: number;
    patientSatisfaction: number;
  };
}

export default function Analytics() {
  const [, setLocation] = useLocation();
  const [doctorSession, setDoctorSession] = useState<DoctorSession | null>(null);
  const [timeRange, setTimeRange] = useState("30days");

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

  const { data: analyticsData, isLoading } = useQuery<AnalyticsData>({
    queryKey: ["/api/doctor/analytics", doctorSession?.doctor.id, timeRange],
    enabled: !!doctorSession?.doctor.id,
  });

  if (!doctorSession) {
    return <div>Loading...</div>;
  }

  const { doctor } = doctorSession;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border shadow-sm" data-testid="analytics-header">
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
                data-testid="analytics-logo"
              />
              <div>
                <h1 className="text-xl font-semibold">Analytics Dashboard</h1>
                <p className="text-sm text-muted-foreground" data-testid="doctor-info">
                  Dr. {doctor.fullName} - {doctor.specialization}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-40" data-testid="time-range-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7days" data-testid="option-7days">Last 7 Days</SelectItem>
                  <SelectItem value="30days" data-testid="option-30days">Last 30 Days</SelectItem>
                  <SelectItem value="90days" data-testid="option-90days">Last 3 Months</SelectItem>
                  <SelectItem value="1year" data-testid="option-1year">Last Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Performance Overview */}
        <Card className="mb-8" data-testid="performance-overview">
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-primary" />
              Performance Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="grid md:grid-cols-5 gap-6">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-20 bg-muted rounded"></div>
                  </div>
                ))}
              </div>
            ) : analyticsData?.performanceMetrics ? (
              <div className="grid md:grid-cols-5 gap-6">
                <div className="text-center" data-testid="metric-patients">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Users className="w-8 h-8 text-primary" />
                  </div>
                  <p className="text-2xl font-bold text-primary">{analyticsData.performanceMetrics.totalPatients}</p>
                  <p className="text-sm text-muted-foreground">Total Patients</p>
                </div>
                
                <div className="text-center" data-testid="metric-hours">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Clock className="w-8 h-8 text-primary" />
                  </div>
                  <p className="text-2xl font-bold text-primary">{analyticsData.performanceMetrics.totalHours}</p>
                  <p className="text-sm text-muted-foreground">Consultation Hours</p>
                </div>
                
                <div className="text-center" data-testid="metric-accuracy">
                  <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Brain className="w-8 h-8 text-success" />
                  </div>
                  <p className="text-2xl font-bold text-success">{analyticsData.performanceMetrics.averageAccuracy}%</p>
                  <p className="text-sm text-muted-foreground">AI Accuracy</p>
                </div>
                
                <div className="text-center" data-testid="metric-revenue">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                    <DollarSign className="w-8 h-8 text-primary" />
                  </div>
                  <p className="text-2xl font-bold text-primary">${analyticsData.performanceMetrics.totalRevenue}</p>
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                </div>
                
                <div className="text-center" data-testid="metric-satisfaction">
                  <div className="w-16 h-16 bg-warning/10 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Award className="w-8 h-8 text-warning" />
                  </div>
                  <p className="text-2xl font-bold text-warning">{analyticsData.performanceMetrics.patientSatisfaction}%</p>
                  <p className="text-sm text-muted-foreground">Patient Satisfaction</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground" data-testid="no-performance-data">
                <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No performance data available</p>
                <p className="text-sm">Complete consultations to see analytics</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Weekly Analytics */}
          <Card data-testid="weekly-analytics">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-primary" />
                Weekly Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="animate-pulse space-y-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-16 bg-muted rounded"></div>
                  ))}
                </div>
              ) : analyticsData?.weeklyData && analyticsData.weeklyData.length > 0 ? (
                <div className="space-y-4">
                  {analyticsData.weeklyData.map((week, index) => (
                    <div 
                      key={week.id} 
                      className="bg-muted rounded-lg p-4"
                      data-testid={`week-${index}`}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <h5 className="font-medium">
                          Week of {new Date(week.weekStart).toLocaleDateString()}
                        </h5>
                        <div className="flex space-x-2">
                          <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded">
                            {week.patientsSeen} patients
                          </span>
                          <span className="text-xs bg-success/20 text-success px-2 py-1 rounded">
                            {week.averageAccuracy}% accuracy
                          </span>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Hours</p>
                          <p className="font-semibold">{week.consultationHours}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Revenue</p>
                          <p className="font-semibold">${week.revenue}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Avg. Accuracy</p>
                          <p className="font-semibold">{week.averageAccuracy}%</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground" data-testid="no-weekly-data">
                  <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No weekly data available</p>
                  <p className="text-sm">Analytics will appear as you complete consultations</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Professional Development */}
          <Card data-testid="professional-development">
            <CardHeader>
              <CardTitle className="flex items-center">
                <BookOpen className="w-5 h-5 mr-2 text-primary" />
                Professional Development
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="animate-pulse space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-20 bg-muted rounded"></div>
                  ))}
                </div>
              ) : analyticsData?.weeklyData && analyticsData.weeklyData.length > 0 ? (
                <div className="space-y-4">
                  {analyticsData.weeklyData
                    .filter(week => week.recommendedJournals)
                    .slice(0, 3)
                    .map((week, index) => (
                      <div 
                        key={week.id} 
                        className="consultation-card rounded-lg p-4"
                        data-testid={`journal-week-${index}`}
                      >
                        <h5 className="font-medium text-sm mb-2">
                          Recommended Reading - Week {index + 1}
                        </h5>
                        <div className="text-xs text-muted-foreground">
                          {week.recommendedJournals && Array.isArray(week.recommendedJournals) && 
                            (week.recommendedJournals as any[]).slice(0, 2).map((journal: any, jIndex: number) => (
                              <div key={jIndex} className="mb-2">
                                <p className="font-medium">{journal.title || `Research Article ${jIndex + 1}`}</p>
                                <p className="text-xs">{journal.journal || "Medical Journal"}</p>
                              </div>
                            ))
                          }
                        </div>
                      </div>
                    ))}
                  
                  {(!analyticsData.weeklyData.some(week => week.recommendedJournals)) && (
                    <div className="text-center py-8 text-muted-foreground">
                      <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No journal recommendations yet</p>
                      <p className="text-sm">Complete more consultations to get personalized recommendations</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground" data-testid="no-development-data">
                  <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No development data available</p>
                  <p className="text-sm">Professional development insights will appear here</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Insights and Recommendations */}
        <Card className="mt-8" data-testid="insights-recommendations">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="w-5 h-5 mr-2 text-primary" />
              AI Insights & Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="consultation-card rounded-lg p-6">
                <h5 className="font-semibold mb-2 text-primary">Practice Optimization</h5>
                <p className="text-sm text-muted-foreground">
                  Based on your consultation patterns, consider scheduling longer sessions for complex cases to improve diagnostic accuracy.
                </p>
              </div>
              
              <div className="consultation-card rounded-lg p-6">
                <h5 className="font-semibold mb-2 text-success">Performance Strength</h5>
                <p className="text-sm text-muted-foreground">
                  Your AI accuracy score is above average. Your clear communication style enhances AI understanding.
                </p>
              </div>
              
              <div className="consultation-card rounded-lg p-6">
                <h5 className="font-semibold mb-2 text-warning">Growth Opportunity</h5>
                <p className="text-sm text-muted-foreground">
                  Consider exploring telemedicine options to expand your patient reach and increase consultation efficiency.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
