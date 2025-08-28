import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import LandingPage from "@/pages/landing";
import DoctorAuth from "@/pages/doctor-auth";
import DoctorDashboard from "@/pages/doctor-dashboard";
import ConsultationRoom from "@/pages/consultation-room";
import PatientAuth from "@/pages/patient-auth";
import PatientPortal from "@/pages/patient-portal";
import Analytics from "@/pages/analytics";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/doctor/auth" component={DoctorAuth} />
      <Route path="/doctor/dashboard" component={DoctorDashboard} />
      <Route path="/doctor/consultation" component={ConsultationRoom} />
      <Route path="/doctor/analytics" component={Analytics} />
      <Route path="/patient/auth" component={PatientAuth} />
      <Route path="/patient/portal" component={PatientPortal} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
