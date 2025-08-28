import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Stethoscope, 
  Brain, 
  ClipboardList, 
  BarChart3, 
  Shield, 
  BookOpen,
  Mic,
  Users,
  Clock,
  DollarSign,
  CheckCircle,
  Star,
  ArrowRight,
  Menu,
  X
} from "lucide-react";

const DOCDOT_LOGO = "https://hvlvwvzliqrlmqjbfgoa.supabase.co/storage/v1/object/sign/O_level_Maths/20250526_2027_Young_Medical_Student_remix_01jw6xh6h8fe1ahpkyns3pw1dw-removebg-preview-removebg-preview.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9iMDVlOWY4Ni0wM2E0LTRmMDktYWI1OS0wNWYyMDM2MmFlNjIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJPX2xldmVsX01hdGhzLzIwMjUwNTI2XzIwMjdfWW91bmdfTWVkaWNhbF9TdHVkZW50X3JlbWl4XzAxanc2eGg2aDhmZTFhaHBreW5zM3B3MWR3LXJlbW92ZWJnLXByZXZpZXctcmVtb3ZlYmctcHJldmlldy5wbmciLCJpYXQiOjE3NTYzMzUzODUsImV4cCI6NzUwNDU5OTkzODV9.7JnaD1MCTpi3TLE05IbAeYEexxi3t-LVBuVunNvWwEk";

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const features = [
    {
      icon: Mic,
      title: "Real-time Voice Analysis",
      description: "Live audio-to-text conversion with voice separation between doctor and patient during consultations.",
      features: ["Speech-to-text transcription", "Speaker identification", "Real-time processing"]
    },
    {
      icon: Brain,
      title: "AI Medical Assistant",
      description: "Google Gemini API integration providing intelligent diagnostic suggestions and medical insights.",
      features: ["Diagnostic suggestions", "Treatment recommendations", "Medical reference search"]
    },
    {
      icon: ClipboardList,
      title: "Patient Care Plans",
      description: "Automated health plan generation and medication tracking with WhatsApp reminders.",
      features: ["Health plan automation", "Medication reminders", "Progress tracking"]
    },
    {
      icon: BarChart3,
      title: "Professional Analytics",
      description: "Comprehensive dashboard showing consultation metrics, accuracy scores, and revenue analytics.",
      features: ["Performance metrics", "Patient outcomes", "Revenue tracking"]
    },
    {
      icon: Shield,
      title: "Secure Platform",
      description: "HIPAA-compliant security with encrypted communication and secure patient data management.",
      features: ["End-to-end encryption", "HIPAA compliance", "Secure authentication"]
    },
    {
      icon: BookOpen,
      title: "Medical Research",
      description: "Integrated medical research tools with journal recommendations and evidence-based insights.",
      features: ["Journal recommendations", "PubMed integration", "Evidence-based care"]
    }
  ];

  const trustIndicators = [
    {
      icon: Shield,
      title: "HIPAA Compliant",
      description: "End-to-end encryption and secure patient data management"
    },
    {
      icon: CheckCircle,
      title: "Medical Grade AI",
      description: "Trained on validated medical literature and clinical guidelines"
    },
    {
      icon: Users,
      title: "24/7 Support",
      description: "Dedicated technical and clinical support team"
    }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation Header */}
      <nav className="bg-background border-b border-border shadow-sm sticky top-0 z-50" data-testid="navigation">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3" data-testid="logo-section">
              <img 
                src={DOCDOT_LOGO} 
                alt="Docdot Logo" 
                className="h-10 w-10 rounded-full"
                data-testid="logo-image"
              />
              <span className="text-2xl font-bold text-primary" data-testid="brand-name">Docdot</span>
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-muted-foreground hover:text-primary transition-colors" data-testid="nav-features">
                Features
              </a>
              <a href="#trust" className="text-muted-foreground hover:text-primary transition-colors" data-testid="nav-about">
                About
              </a>
              <a href="#contact" className="text-muted-foreground hover:text-primary transition-colors" data-testid="nav-contact">
                Contact
              </a>
              <Button data-testid="nav-get-started">Get Started</Button>
            </div>
            
            <button 
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              data-testid="mobile-menu-toggle"
            >
              {mobileMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="medical-gradient text-white py-20" data-testid="hero-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="hero-text text-4xl lg:text-5xl font-bold mb-6 leading-tight" data-testid="hero-title">
                AI-Powered Healthcare Bridge System
              </h1>
              <p className="text-xl mb-8 opacity-90" data-testid="hero-description">
                Connecting doctors and patients through intelligent automation. Real-time consultation assistance, 
                patient care management, and advanced analytics with professional medical-grade design.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/doctor/auth">
                  <Button 
                    size="lg" 
                    className="bg-white text-primary hover:bg-gray-50 flex items-center space-x-2"
                    data-testid="button-doctor-login"
                  >
                    <Users className="w-5 h-5" />
                    <span>Doctor Login</span>
                  </Button>
                </Link>
                <Link href="/patient/auth">
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="border-white text-white hover:bg-white hover:text-primary flex items-center space-x-2"
                    data-testid="button-patient-portal"
                  >
                    <Users className="w-5 h-5" />
                    <span>Patient Portal</span>
                  </Button>
                </Link>
              </div>
            </div>
            
            <div className="hidden lg:block">
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardContent className="p-8 text-center">
                  <Stethoscope className="w-16 h-16 mx-auto mb-4 text-white" />
                  <h3 className="text-xl font-semibold mb-2">Smart Medical Consultations</h3>
                  <p className="opacity-80">Real-time AI assistance during patient consultations</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-muted" data-testid="features-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4" data-testid="features-title">
              Comprehensive Healthcare Solutions
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto" data-testid="features-description">
              Advanced AI-powered features designed to enhance medical practice efficiency and patient care quality.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card 
                key={index} 
                className="border hover:shadow-lg transition-shadow"
                data-testid={`feature-card-${index}`}
              >
                <CardContent className="p-8">
                  <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center mb-6">
                    <feature.icon className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-4" data-testid={`feature-title-${index}`}>
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground mb-4" data-testid={`feature-description-${index}`}>
                    {feature.description}
                  </p>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {feature.features.map((item, itemIndex) => (
                      <li key={itemIndex} className="flex items-center" data-testid={`feature-item-${index}-${itemIndex}`}>
                        <CheckCircle className="w-4 h-4 text-primary mr-2" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Dashboard Preview */}
      <section className="py-20" data-testid="dashboard-preview">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4" data-testid="dashboard-title">
              Professional Doctor Dashboard
            </h2>
            <p className="text-xl text-muted-foreground" data-testid="dashboard-description">
              Complete analytics and patient management in one interface
            </p>
          </div>

          <Card className="border shadow-xl">
            <CardContent className="p-8">
              {/* Dashboard Header */}
              <div className="flex items-center justify-between mb-8 pb-6 border-b">
                <div className="flex items-center space-x-4">
                  <img 
                    src={DOCDOT_LOGO} 
                    alt="Docdot" 
                    className="h-10 w-10 rounded-full"
                    data-testid="dashboard-logo"
                  />
                  <div>
                    <h3 className="text-xl font-semibold" data-testid="doctor-name">Dr. Sarah Johnson</h3>
                    <p className="text-muted-foreground" data-testid="doctor-specialty">Cardiology Specialist</p>
                  </div>
                </div>
                <Button className="flex items-center space-x-2" data-testid="new-consultation-button">
                  <ArrowRight className="w-4 h-4" />
                  <span>New Consultation</span>
                </Button>
              </div>

              {/* Stats Cards */}
              <div className="grid md:grid-cols-4 gap-6 mb-8">
                <Card className="stats-card">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Patients This Week</p>
                        <p className="text-2xl font-bold text-primary" data-testid="stat-patients">24</p>
                      </div>
                      <Users className="w-8 h-8 text-primary/30" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="stats-card">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Consultation Hours</p>
                        <p className="text-2xl font-bold text-primary" data-testid="stat-hours">32.5</p>
                      </div>
                      <Clock className="w-8 h-8 text-primary/30" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="stats-card">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">AI Accuracy</p>
                        <p className="text-2xl font-bold text-success" data-testid="stat-accuracy">94.2%</p>
                      </div>
                      <Brain className="w-8 h-8 text-success/30" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="stats-card">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Revenue</p>
                        <p className="text-2xl font-bold text-primary" data-testid="stat-revenue">$12,450</p>
                      </div>
                      <DollarSign className="w-8 h-8 text-primary/30" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Trust & Security Section */}
      <section id="trust" className="py-20 bg-muted" data-testid="trust-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4" data-testid="trust-title">
              Trusted by Healthcare Professionals
            </h2>
            <p className="text-xl text-muted-foreground" data-testid="trust-description">
              HIPAA-compliant security and professional-grade reliability
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {trustIndicators.map((indicator, index) => (
              <div key={index} className="text-center" data-testid={`trust-indicator-${index}`}>
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <indicator.icon className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2" data-testid={`trust-title-${index}`}>
                  {indicator.title}
                </h3>
                <p className="text-muted-foreground" data-testid={`trust-description-${index}`}>
                  {indicator.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="medical-gradient text-white py-16" data-testid="footer">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <img 
                  src={DOCDOT_LOGO} 
                  alt="Docdot Logo" 
                  className="h-10 w-10 rounded-full"
                  data-testid="footer-logo"
                />
                <span className="text-2xl font-bold">Docdot</span>
              </div>
              <p className="text-white/80 mb-4" data-testid="footer-description">
                AI-powered healthcare bridge connecting doctors and patients through intelligent automation.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">For Doctors</h4>
              <ul className="space-y-2 text-white/80">
                <li><Link href="/doctor/auth" className="hover:text-white" data-testid="footer-doctor-login">Doctor Login</Link></li>
                <li><Link href="/doctor/dashboard" className="hover:text-white" data-testid="footer-dashboard">Dashboard</Link></li>
                <li><Link href="/doctor/analytics" className="hover:text-white" data-testid="footer-analytics">Analytics</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">For Patients</h4>
              <ul className="space-y-2 text-white/80">
                <li><Link href="/patient/auth" className="hover:text-white" data-testid="footer-patient-portal">Patient Portal</Link></li>
                <li><a href="#" className="hover:text-white" data-testid="footer-health-records">Health Records</a></li>
                <li><a href="#" className="hover:text-white" data-testid="footer-ai-assistant">AI Assistant</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <ul className="space-y-2 text-white/80">
                <li data-testid="contact-email">support@docdot.com</li>
                <li data-testid="contact-phone">+1 (555) 123-4567</li>
                <li data-testid="contact-address">Medical District, Healthcare City</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-white/20 mt-12 pt-8 text-center text-white/60">
            <p data-testid="copyright">&copy; 2024 Docdot Healthcare AI System. All rights reserved. HIPAA Compliant.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
