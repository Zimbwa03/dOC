import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer } from "ws";
import { storage } from "./storage";
import { geminiService } from "./services/gemini";
import { whatsappService } from "./services/whatsapp";
import { medicalResearchService } from "./services/medical-research";
import multer from "multer";
import path from "path";
import fs from "fs";
import DigitalDoctorService from './services/digital-doctor';

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Doctor Authentication Routes
  app.post("/api/auth/doctor/register", upload.single('voiceSample'), async (req, res) => {
    try {
      const { email, password, fullName, specialization, practiceName, phoneNumber } = req.body;
      
      if (!email || !password || !fullName || !specialization) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Check if doctor already exists
      const existingDoctor = await storage.getDoctorByEmail(email);
      if (existingDoctor) {
        return res.status(409).json({ message: "Doctor with this email already exists" });
      }

      let voiceSampleUrl = null;
      if (req.file) {
        // In production, you would upload this to a cloud storage service
        voiceSampleUrl = `/uploads/${req.file.filename}`;
      }

      const doctor = await storage.createDoctor({
        email,
        password,
        fullName,
        specialization,
        practiceName,
        phoneNumber,
        voiceSampleUrl,
      });

      // Remove password from response
      const { password: _, ...doctorResponse } = doctor;
      
      res.status(201).json({ 
        message: "Doctor registered successfully", 
        doctor: doctorResponse 
      });
    } catch (error) {
      console.error("Doctor registration error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/doctor/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      const doctor = await storage.authenticateDoctor(email, password);
      if (!doctor) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Remove password from response
      const { password: _, ...doctorResponse } = doctor;
      
      res.json({ 
        message: "Login successful", 
        doctor: doctorResponse 
      });
    } catch (error) {
      console.error("Doctor login error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Patient Authentication Routes
  app.post("/api/auth/patient/login", async (req, res) => {
    try {
      const { fullName, phoneNumber } = req.body;
      
      if (!fullName || !phoneNumber) {
        return res.status(400).json({ message: "Name and phone number are required" });
      }

      const patient = await storage.authenticatePatient(fullName, phoneNumber);
      if (!patient) {
        return res.status(401).json({ message: "Patient not found. Please contact your doctor to register." });
      }

      res.json({ 
        message: "Login successful", 
        patient 
      });
    } catch (error) {
      console.error("Patient login error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Patient Registration (by doctors during consultation)
  app.post("/api/patients/register", async (req, res) => {
    try {
      const { fullName, phoneNumber, doctorId } = req.body;
      
      if (!fullName || !phoneNumber) {
        return res.status(400).json({ message: "Name and phone number are required" });
      }

      // Check if patient already exists
      const existingPatient = await storage.getPatientByPhone(phoneNumber);
      if (existingPatient) {
        return res.status(409).json({ message: "Patient with this phone number already exists" });
      }

      const patient = await storage.createPatient({
        fullName,
        phoneNumber,
        doctorId,
      });

      res.status(201).json({ 
        message: "Patient registered successfully", 
        patient 
      });
    } catch (error) {
      console.error("Patient registration error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Doctor Dashboard Routes
  app.get("/api/doctor/stats/:doctorId", async (req, res) => {
    try {
      const { doctorId } = req.params;
      
      // Get current week analytics
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of current week
      weekStart.setHours(0, 0, 0, 0);
      
      const analytics = await storage.getDoctorAnalytics(doctorId, weekStart);
      const currentWeek = analytics[0];
      
      const stats = {
        patientsThisWeek: currentWeek?.patientsSeen || 0,
        consultationHours: parseFloat(currentWeek?.consultationHours || "0"),
        accuracyScore: parseFloat(currentWeek?.averageAccuracy || "0"),
        revenue: parseFloat(currentWeek?.revenue || "0"),
      };

      res.json(stats);
    } catch (error) {
      console.error("Stats fetch error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/doctor/patients/recent/:doctorId", async (req, res) => {
    try {
      const { doctorId } = req.params;
      const consultations = await storage.getConsultationsByDoctorId(doctorId, 10);
      
      const recentPatients = [];
      for (const consultation of consultations) {
        const patient = await storage.getPatientById(consultation.patientId);
        if (patient) {
          recentPatients.push({
            id: patient.id,
            name: patient.fullName,
            lastConsultation: consultation.consultationDate,
            condition: consultation.diagnosis || "General consultation",
            status: consultation.status,
          });
        }
      }

      res.json(recentPatients);
    } catch (error) {
      console.error("Recent patients fetch error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/doctor/patients/all/:doctorId", async (req, res) => {
    try {
      const { doctorId } = req.params;
      const patients = await storage.getPatientsByDoctorId(doctorId);
      
      const patientsWithConsultations = [];
      for (const patient of patients) {
        const latestConsultation = await storage.getLatestConsultationByPatientId(patient.id);
        patientsWithConsultations.push({
          id: patient.id,
          name: patient.fullName,
          phoneNumber: patient.phoneNumber,
          lastConsultation: latestConsultation?.consultationDate || null,
          totalConsultations: latestConsultation ? 1 : 0, // This could be enhanced to count all consultations
          status: latestConsultation?.status || 'no_consultations'
        });
      }

      res.json(patientsWithConsultations);
    } catch (error) {
      console.error("All patients fetch error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/doctor/consultations/:doctorId", async (req, res) => {
    try {
      const { doctorId } = req.params;
      const { limit = 20, status } = req.query;
      
      let consultations = await storage.getConsultationsByDoctorId(doctorId, parseInt(limit as string));
      
      if (status) {
        consultations = consultations.filter(c => c.status === status);
      }

      const consultationsWithPatients = [];
      for (const consultation of consultations) {
        const patient = await storage.getPatientById(consultation.patientId);
        if (patient) {
          consultationsWithPatients.push({
            ...consultation,
            patientName: patient.fullName,
            patientPhone: patient.phoneNumber
          });
        }
      }

      res.json(consultationsWithPatients);
    } catch (error) {
      console.error("Consultations fetch error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/doctor/journals/:doctorId", async (req, res) => {
    try {
      const { doctorId } = req.params;
      const doctor = await storage.getDoctorById(doctorId);
      
      if (!doctor) {
        return res.status(404).json({ message: "Doctor not found" });
      }

      // Get recent cases for context
      const recentConsultations = await storage.getConsultationsByDoctorId(doctorId, 10);
      const recentCases = recentConsultations
        .map(c => c.diagnosis)
        .filter(d => d)
        .slice(0, 5);

      const recommendations = await geminiService.recommendJournals(
        doctor.specialization, 
        recentCases
      );

      res.json(recommendations);
    } catch (error) {
      console.error("Journal recommendations error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Consultation Management Routes
  app.post("/api/consultations", async (req, res) => {
    try {
      const { doctorId, patientId, transcript, doctorNotes, aiSuggestions, diagnosis, prescriptions, durationMinutes } = req.body;
      
      if (!doctorId || !patientId) {
        return res.status(400).json({ message: "Doctor ID and Patient ID are required" });
      }

      // Create consultation
      const consultation = await storage.createConsultation({
        doctorId,
        patientId,
        transcript: transcript || "",
        doctorNotes: doctorNotes || "",
        aiSuggestions: aiSuggestions || "",
        diagnosis: diagnosis || "",
        prescriptions: prescriptions || {},
        durationMinutes: durationMinutes || 0,
        status: "completed"
      });

      // Update doctor analytics
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      weekStart.setHours(0, 0, 0, 0);

      const existingAnalytics = await storage.getDoctorAnalytics(doctorId, weekStart);
      const currentWeek = existingAnalytics[0];

      if (currentWeek) {
        // Update existing week
        await storage.createOrUpdateDoctorAnalytics({
          doctorId,
          weekStart,
          patientsSeen: (currentWeek.patientsSeen || 0) + 1,
          consultationHours: parseFloat(currentWeek.consultationHours || "0") + (durationMinutes / 60),
          averageAccuracy: parseFloat(currentWeek.averageAccuracy || "0"), // Will be updated with AI accuracy
          revenue: parseFloat(currentWeek.revenue || "0") + 150, // Assuming $150 per consultation
          recommendedJournals: currentWeek.recommendedJournals
        });
      } else {
        // Create new week
        await storage.createOrUpdateDoctorAnalytics({
          doctorId,
          weekStart,
          patientsSeen: 1,
          consultationHours: durationMinutes / 60,
          averageAccuracy: 0,
          revenue: 150,
          recommendedJournals: []
        });
      }

      res.status(201).json({ 
        message: "Consultation created successfully", 
        consultation 
      });
    } catch (error) {
      console.error("Consultation creation error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // AI Analysis Routes
  app.post("/api/ai/analyze-consultation", async (req, res) => {
    try {
      const { transcript, symptoms, patientHistory, doctorSpecialization } = req.body;
      
      if (!transcript && !symptoms) {
        return res.status(400).json({ message: "Transcript or symptoms required" });
      }

      const analysis = await geminiService.analyzeMedicalConsultation({
        symptoms: symptoms || [],
        patientHistory,
        transcript,
        doctorSpecialization,
      });

      res.json({
        success: true,
        ...analysis
      });
    } catch (error) {
      console.error("AI analysis error:", error);
      res.status(500).json({ message: "AI analysis failed", error: error.message });
    }
  });

  app.post("/api/ai/generate-health-plan", async (req, res) => {
    try {
      const { patientId, consultationNotes } = req.body;
      
      if (!patientId || !consultationNotes) {
        return res.status(400).json({ message: "Patient ID and consultation notes required" });
      }

      const patient = await storage.getPatientById(patientId);
      if (!patient) {
        return res.status(404).json({ message: "Patient not found" });
      }

      const healthPlan = await geminiService.generateHealthPlan(patient, consultationNotes);
      
      // Save health plan to database
      const savedPlan = await storage.createHealthPlan({
        patientId,
        medications: healthPlan.medications,
        dietPlan: healthPlan.dietPlan,
        exercisePlan: healthPlan.exercisePlan,
        reminders: healthPlan.reminders,
      });

      res.json({ healthPlan: savedPlan });
    } catch (error) {
      console.error("Health plan generation error:", error);
      res.status(500).json({ message: "Health plan generation failed" });
    }
  });

  // Patient Portal Routes
  app.get("/api/patient/consultation/latest/:patientId", async (req, res) => {
    try {
      const { patientId } = req.params;
      const consultation = await storage.getLatestConsultationByPatientId(patientId);
      
      if (!consultation) {
        return res.status(404).json({ message: "No consultations found" });
      }

      // Get doctor name
      const doctor = await storage.getDoctorById(consultation.doctorId);
      const consultationWithDoctor = {
        ...consultation,
        doctorName: doctor?.fullName,
      };

      res.json(consultationWithDoctor);
    } catch (error) {
      console.error("Latest consultation fetch error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/patient/health-plan/:patientId", async (req, res) => {
    try {
      const { patientId } = req.params;
      const healthPlan = await storage.getHealthPlanByPatientId(patientId);
      
      if (!healthPlan) {
        return res.status(404).json({ message: "No health plan found" });
      }

      res.json(healthPlan);
    } catch (error) {
      console.error("Health plan fetch error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/patient/ai-chat/:patientId", async (req, res) => {
    try {
      const { patientId } = req.params;
      const interactions = await storage.getAiInteractionsByPatientId(patientId);
      
      res.json(interactions);
    } catch (error) {
      console.error("AI chat fetch error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/patient/ai-chat", async (req, res) => {
    try {
      const { patientId, message } = req.body;
      
      if (!patientId || !message) {
        return res.status(400).json({ message: "Patient ID and message required" });
      }

      const patient = await storage.getPatientById(patientId);
      if (!patient) {
        return res.status(404).json({ message: "Patient not found" });
      }

      // Get patient's medical history
      const consultations = await storage.getConsultationsByPatientId(patientId);
      const healthPlan = await storage.getHealthPlanByPatientId(patientId);
      
      const patientHistory = {
        consultations: consultations.slice(0, 5), // Last 5 consultations
        healthPlan,
        basicInfo: {
          name: patient.fullName,
          phone: patient.phoneNumber,
        }
      };

      const response = await geminiService.chatWithPatient(message, patientHistory);
      
      // Save interaction
      const interaction = await storage.createAiInteraction({
        patientId,
        message,
        response,
        interactionType: 'chat',
      });

      res.json({ interaction });
    } catch (error) {
      console.error("AI chat error:", error);
      res.status(500).json({ message: "AI chat failed" });
    }
  });

  // Analytics Routes
  app.get("/api/doctor/analytics/:doctorId", async (req, res) => {
    try {
      const { doctorId } = req.params;
      const { timeRange = "30days" } = req.query;
      
      let startDate = new Date();
      switch (timeRange) {
        case "7days":
          startDate.setDate(startDate.getDate() - 7);
          break;
        case "90days":
          startDate.setDate(startDate.getDate() - 90);
          break;
        case "1year":
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
        default: // 30days
          startDate.setDate(startDate.getDate() - 30);
      }

      const weeklyData = await storage.getDoctorAnalytics(doctorId, startDate);
      
      // Calculate performance metrics
      const totalPatients = weeklyData.reduce((sum, week) => sum + (week.patientsSeen || 0), 0);
      const totalHours = weeklyData.reduce((sum, week) => sum + parseFloat(week.consultationHours || "0"), 0);
      const totalRevenue = weeklyData.reduce((sum, week) => sum + parseFloat(week.revenue || "0"), 0);
      const avgAccuracy = weeklyData.length > 0 
        ? weeklyData.reduce((sum, week) => sum + parseFloat(week.averageAccuracy || "0"), 0) / weeklyData.length 
        : 0;

      const analyticsData = {
        weeklyData,
        monthlyTrends: {
          patients: weeklyData.map(w => w.patientsSeen || 0),
          hours: weeklyData.map(w => parseFloat(w.consultationHours || "0")),
          accuracy: weeklyData.map(w => parseFloat(w.averageAccuracy || "0")),
          revenue: weeklyData.map(w => parseFloat(w.revenue || "0")),
        },
        performanceMetrics: {
          totalPatients,
          totalHours: Math.round(totalHours * 100) / 100,
          averageAccuracy: Math.round(avgAccuracy * 100) / 100,
          totalRevenue: Math.round(totalRevenue * 100) / 100,
          patientSatisfaction: 92, // Mock data - would come from patient feedback
        }
      };

      res.json(analyticsData);
    } catch (error) {
      console.error("Analytics fetch error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Medical Research Routes
  app.post("/api/research/search", async (req, res) => {
    try {
      const { query, type = "general" } = req.body;
      
      if (!query) {
        return res.status(400).json({ message: "Search query required" });
      }

      const results = await medicalResearchService.searchMedicalLiterature(query, type);
      res.json(results);
    } catch (error) {
      console.error("Medical research search error:", error);
      res.status(500).json({ message: "Research search failed" });
    }
  });

  // WhatsApp Integration Routes
  app.post("/api/whatsapp/send-reminder", async (req, res) => {
    try {
      const { patientId, type, message } = req.body;
      
      if (!patientId || !type || !message) {
        return res.status(400).json({ message: "Patient ID, type, and message required" });
      }

      const patient = await storage.getPatientById(patientId);
      if (!patient) {
        return res.status(404).json({ message: "Patient not found" });
      }

      const doctor = await storage.getDoctorById(patient.doctorId!);
      if (!doctor) {
        return res.status(404).json({ message: "Doctor not found" });
      }

      await whatsappService.sendReminder(patient.phoneNumber, doctor.fullName, message, type);
      
      res.json({ message: "Reminder sent successfully" });
    } catch (error) {
      console.error("WhatsApp reminder error:", error);
      res.status(500).json({ message: "Failed to send reminder" });
    }
  });

  // Digital Doctor API
  app.post('/api/digital-doctor/chat', async (req, res) => {
    try {
      const { patientId, message, language, doctorId } = req.body;
      
      if (!patientId || !message || !language || !doctorId) {
        return res.status(400).json({ 
          success: false, 
          error: 'Missing required fields' 
        });
      }

      const digitalDoctor = new DigitalDoctorService();
      const response = await digitalDoctor.generateResponse({
        patientId,
        message,
        language,
        doctorId
      });

      res.json({
        success: true,
        response
      });
    } catch (error) {
      console.error('Digital doctor error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to generate digital doctor response' 
      });
    }
  });

  // Voice cloning endpoint for doctors
  app.post('/api/doctor/clone-voice', upload.single('audio'), async (req, res) => {
    try {
      const { doctorId, doctorName } = req.body;
      const audioFile = req.file;

      if (!audioFile || !doctorId || !doctorName) {
        return res.status(400).json({ 
          success: false, 
          error: 'Missing required fields' 
        });
      }

      const digitalDoctor = new DigitalDoctorService();
      const voiceId = await digitalDoctor.cloneDoctorVoice(audioFile.buffer, doctorName);

      // Update doctor record with voice ID
      await storage.updateDoctorVoiceId(doctorId, voiceId);

      res.json({
        success: true,
        voiceId,
        message: 'Voice cloned successfully'
      });
    } catch (error) {
      console.error('Voice cloning error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to clone voice' 
      });
    }
  });

  // Test voice clone endpoint
  app.post('/api/digital-doctor/test-voice', async (req, res) => {
    try {
      const { voiceId, text, language } = req.body;
      
      if (!voiceId || !text || !language) {
        return res.status(400).json({ 
          success: false, 
          error: 'Missing required fields' 
        });
      }

      const digitalDoctor = new DigitalDoctorService();
      const voiceMessage = await digitalDoctor.textToSpeech(text, voiceId, language);

      res.json({
        success: true,
        audioUrl: voiceMessage.audioUrl,
        duration: voiceMessage.duration
      });
    } catch (error) {
      console.error('Voice test error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to test voice' 
      });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);

  // Add WebSocket support for real-time features
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  wss.on('connection', (ws) => {
    console.log('WebSocket client connected');
    
    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        // Handle different types of real-time updates
        switch (data.type) {
          case 'join_consultation':
            ws.consultationId = data.consultationId;
            ws.send(JSON.stringify({ type: 'joined', consultationId: data.consultationId }));
            break;
            
          case 'live_transcript':
            // Broadcast transcript updates to other participants
            wss.clients.forEach((client) => {
              if (client !== ws && client.consultationId === data.consultationId) {
                client.send(JSON.stringify({
                  type: 'transcript_update',
                  data: data.transcript
                }));
              }
            });
            break;
            
          case 'ai_insight':
            // Broadcast AI insights to consultation participants
            wss.clients.forEach((client) => {
              if (client !== ws && client.consultationId === data.consultationId) {
                client.send(JSON.stringify({
                  type: 'ai_insight_update',
                  data: data.insight
                }));
              }
            });
            break;
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });
    
    ws.on('close', () => {
      console.log('WebSocket client disconnected');
    });
  });

  return httpServer;
}
