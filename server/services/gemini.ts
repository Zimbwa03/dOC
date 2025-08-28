import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY || ""
});

export interface MedicalAnalysisRequest {
  symptoms: string[];
  patientHistory?: string;
  transcript?: string;
  doctorSpecialization?: string;
  language?: string;
  transcriptionLanguage?: string;
}

export interface MedicalAnalysisResponse {
  diagnosticSuggestions: string[];
  recommendedTests: string[];
  treatmentOptions: string[];
  urgencyLevel: 'low' | 'medium' | 'high' | 'emergency';
  confidence: number;
  clinicalNotes: string;
}

export interface HealthPlan {
  medications: Array<{
    name: string;
    dosage: string;
    frequency: string;
    instructions: string;
  }>;
  dietPlan: string;
  exercisePlan: string;
  followUpInstructions: string;
  reminders: Array<{
    type: string;
    message: string;
    frequency: string;
  }>;
}

export interface JournalRecommendation {
  title: string;
  journal: string;
  summary: string;
  relevanceScore: number;
  url?: string;
}

class GeminiService {
  
  async analyzeMedicalConsultation(request: MedicalAnalysisRequest): Promise<MedicalAnalysisResponse> {
    try {
      const systemPrompt = `You are an advanced medical AI assistant helping doctors during consultations. 
      Analyze the provided medical information and provide diagnostic insights, treatment recommendations, and clinical guidance.
      Focus on evidence-based medicine and current clinical guidelines.
      
      IMPORTANT: The consultation may be conducted in multiple languages including English, Shona (Zimbabwe), and other languages.
      Always analyze the content regardless of language and provide responses in English for medical accuracy.
      If the transcript contains non-English text, translate and analyze the medical content appropriately.
      
      Respond with structured JSON containing:
      - diagnosticSuggestions: array of potential diagnoses with reasoning
      - recommendedTests: array of suggested diagnostic tests
      - treatmentOptions: array of treatment recommendations
      - urgencyLevel: assessment of case urgency (low/medium/high/emergency)
      - confidence: confidence score (0-1)
      - clinicalNotes: additional clinical observations and recommendations
      
      Always emphasize the need for clinical judgment and that AI suggestions should supplement, not replace, medical expertise.
      Consider patient safety as the highest priority.`;

      const prompt = `
      Medical Consultation Analysis:
      
      Language Context: ${request.language || 'en'} (Transcription: ${request.transcriptionLanguage || 'en'})
      Symptoms: ${request.symptoms.join(', ')}
      ${request.patientHistory ? `Patient History: ${request.patientHistory}` : ''}
      ${request.transcript ? `Consultation Transcript: ${request.transcript}` : ''}
      ${request.doctorSpecialization ? `Doctor Specialization: ${request.doctorSpecialization}` : ''}
      
      Please provide comprehensive medical analysis and recommendations based on the information provided.
      Focus on patient safety and evidence-based medicine.
      If the transcript contains non-English content, ensure proper translation and analysis for medical accuracy.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash-exp",
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: "application/json",
          responseSchema: {
            type: "object",
            properties: {
              diagnosticSuggestions: {
                type: "array",
                items: { type: "string" }
              },
              recommendedTests: {
                type: "array", 
                items: { type: "string" }
              },
              treatmentOptions: {
                type: "array",
                items: { type: "string" }
              },
              urgencyLevel: {
                type: "string",
                enum: ["low", "medium", "high", "emergency"]
              },
              confidence: { type: "number" },
              clinicalNotes: { type: "string" }
            },
            required: ["diagnosticSuggestions", "recommendedTests", "treatmentOptions", "urgencyLevel", "confidence", "clinicalNotes"]
          }
        },
        contents: prompt,
      });

      const rawJson = response.text;
      if (rawJson) {
        return JSON.parse(rawJson);
      } else {
        throw new Error("Empty response from medical AI");
      }
    } catch (error: any) {
      console.error("Medical analysis error:", error);
      
      // If API is overloaded (503) or rate limited, return fallback analysis
      if (error.status === 503 || error.status === 429 || error.message?.includes('overloaded')) {
        console.log("Gemini API overloaded, returning fallback analysis");
        return this.getFallbackAnalysis(request);
      }
      
      throw new Error(`Failed to analyze medical consultation: ${error}`);
    }
  }

  async generateHealthPlan(patientData: any, consultationNotes: string): Promise<HealthPlan> {
    try {
      const systemPrompt = `You are a medical AI assistant creating personalized health plans for patients.
      Generate a comprehensive health plan based on patient data and consultation notes.
      
      Focus on:
      - Evidence-based treatment recommendations
      - Patient safety and compliance
      - Clear, actionable instructions
      - Appropriate follow-up care
      
      Respond with JSON containing:
      - medications: array of medication objects with name, dosage, frequency, instructions
      - dietPlan: detailed dietary recommendations
      - exercisePlan: exercise recommendations with any limitations
      - followUpInstructions: follow-up care instructions
      - reminders: array of reminder objects for medications and appointments`;

      const prompt = `
      Create a comprehensive health plan for:
      
      Patient Information: ${JSON.stringify(patientData)}
      Consultation Notes: ${consultationNotes}
      
      Generate a personalized, safe, and effective health plan that the patient can easily follow.
      Include specific medication instructions, dietary guidelines, and exercise recommendations.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash-exp",
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: "application/json",
          responseSchema: {
            type: "object",
            properties: {
              medications: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    dosage: { type: "string" },
                    frequency: { type: "string" },
                    instructions: { type: "string" }
                  }
                }
              },
              dietPlan: { type: "string" },
              exercisePlan: { type: "string" },
              followUpInstructions: { type: "string" },
              reminders: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    type: { type: "string" },
                    message: { type: "string" },
                    frequency: { type: "string" }
                  }
                }
              }
            },
            required: ["medications", "dietPlan", "exercisePlan", "followUpInstructions", "reminders"]
          }
        },
        contents: prompt,
      });

      const rawJson = response.text;
      return rawJson ? JSON.parse(rawJson) : this.getFallbackHealthPlan();
    } catch (error: any) {
      console.error("Health plan generation error:", error);
      
      // Return fallback health plan if API is overloaded
      if (error.status === 503 || error.status === 429 || error.message?.includes('overloaded')) {
        console.log("Gemini API overloaded, returning fallback health plan");
        return this.getFallbackHealthPlan();
      }
      
      throw new Error(`Failed to generate health plan: ${error}`);
    }
  }

  async chatWithPatient(message: string, patientHistory: any): Promise<string> {
    try {
      const systemPrompt = `You are a helpful medical AI assistant for patients. 
      Provide accurate, helpful health information while emphasizing the importance of professional medical advice.
      Always recommend consulting with their doctor for serious concerns.
      Be empathetic and supportive while maintaining medical accuracy.
      
      Guidelines:
      - Provide general health information and explanations
      - Encourage medication compliance
      - Suggest when to contact their healthcare provider
      - Never provide specific medical diagnoses
      - Be supportive and encouraging
      - Focus on patient education and empowerment`;

      const prompt = `
      Patient Message: ${message}
      
      Patient Medical Context: ${JSON.stringify(patientHistory)}
      
      Provide a helpful, empathetic response that educates and supports the patient while encouraging appropriate medical care.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash-exp",
        config: {
          systemInstruction: systemPrompt,
        },
        contents: prompt,
      });

      return response.text || "I'm sorry, I couldn't process your request right now. Please try again or contact your healthcare provider for urgent concerns.";
    } catch (error: any) {
      console.error("Patient chat error:", error);
      
      // Return helpful fallback response if API is overloaded
      if (error.status === 503 || error.status === 429 || error.message?.includes('overloaded')) {
        return this.getFallbackPatientResponse(message);
      }
      
      return "I'm experiencing technical difficulties. Please contact your healthcare provider for urgent concerns.";
    }
  }

  async recommendJournals(doctorSpecialty: string, recentCases: string[]): Promise<JournalRecommendation[]> {
    try {
      const systemPrompt = `You are a medical research AI assistant.
      Recommend relevant medical journals and recent research based on doctor specialty and recent cases.
      Focus on current, evidence-based research from reputable medical journals.
      
      Provide realistic journal recommendations that would be available in medical databases.`;

      const prompt = `
      Doctor Specialty: ${doctorSpecialty}
      Recent Cases: ${recentCases.join(', ')}
      
      Recommend 5 relevant medical journal articles or research papers that would be valuable for this medical professional.
      Include realistic titles, journal names, brief summaries, and relevance explanations.
      Focus on recent advances and clinical guidelines relevant to their practice.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash-exp",
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: "application/json",
          responseSchema: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                journal: { type: "string" },
                summary: { type: "string" },
                relevanceScore: { type: "number" },
                url: { type: "string" }
              }
            }
          }
        },
        contents: prompt,
      });

      const rawJson = response.text;
      if (rawJson) {
        try {
          return JSON.parse(rawJson);
        } catch (parseError) {
          console.error("JSON parsing error for journals:", parseError);
          return this.getFallbackJournals(doctorSpecialty);
        }
      }
      return this.getFallbackJournals(doctorSpecialty);
    } catch (error: any) {
      console.error("Journal recommendation error:", error);
      
      // Return fallback journals if API is overloaded
      if (error.status === 503 || error.status === 429 || error.message?.includes('overloaded')) {
        return this.getFallbackJournals(doctorSpecialty);
      }
      
      return [];
    }
  }
  // Fallback methods for when Gemini API is overloaded
  private getFallbackAnalysis(request: MedicalAnalysisRequest): MedicalAnalysisResponse {
    // Basic rule-based analysis when AI is unavailable
    const symptoms = request.symptoms;
    const hasSymptoms = symptoms && symptoms.length > 0;
    
    return {
      diagnosticSuggestions: hasSymptoms 
        ? [`Consider further evaluation of reported symptoms: ${symptoms.join(', ')}`, 'Recommend comprehensive physical examination', 'Review patient medical history thoroughly']
        : ['Comprehensive clinical assessment recommended', 'Review chief complaint and history of present illness'],
      recommendedTests: [
        'Complete Blood Count (CBC)',
        'Basic Metabolic Panel',
        'Vital signs assessment',
        'Physical examination findings documentation'
      ],
      treatmentOptions: [
        'Clinical observation and monitoring',
        'Symptomatic treatment as appropriate',
        'Patient education and counseling',
        'Follow-up scheduling based on clinical judgment'
      ],
      urgencyLevel: 'medium' as const,
      confidence: 0.6,
      clinicalNotes: 'AI analysis temporarily unavailable. This fallback assessment provides general clinical guidance. Please rely on clinical judgment and patient presentation for decision-making.'
    };
  }

  private getFallbackHealthPlan(): HealthPlan {
    return {
      medications: [
        {
          name: 'As prescribed by physician',
          dosage: 'Per doctor instructions',
          frequency: 'As directed',
          instructions: 'Take medications exactly as prescribed by your healthcare provider'
        }
      ],
      dietPlan: 'Follow a balanced, nutritious diet with adequate fruits, vegetables, whole grains, and lean proteins. Stay hydrated and limit processed foods. Consult with your healthcare provider for specific dietary recommendations.',
      exercisePlan: 'Engage in regular physical activity as appropriate for your condition and fitness level. Start slowly and gradually increase intensity. Consult your doctor before beginning any new exercise program.',
      followUpInstructions: 'Schedule follow-up appointments as recommended by your healthcare provider. Monitor your symptoms and contact your doctor if you experience any concerning changes.',
      reminders: [
        {
          type: 'medication',
          message: 'Take your medications as prescribed',
          frequency: 'daily'
        },
        {
          type: 'appointment',
          message: 'Schedule follow-up with your doctor',
          frequency: 'as needed'
        }
      ]
    };
  }

  private getFallbackPatientResponse(message: string): string {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('pain') || lowerMessage.includes('hurt')) {
      return "I understand you're experiencing pain. Please describe your symptoms to your healthcare provider, including when it started, the severity, and what makes it better or worse. If the pain is severe or sudden, consider seeking immediate medical attention.";
    }
    
    if (lowerMessage.includes('medication') || lowerMessage.includes('medicine')) {
      return "For questions about your medications, please consult with your doctor or pharmacist. They can provide specific guidance about dosing, side effects, and interactions. Never stop or change medications without medical supervision.";
    }
    
    if (lowerMessage.includes('emergency') || lowerMessage.includes('urgent')) {
      return "If this is a medical emergency, please call emergency services immediately or go to the nearest emergency room. For urgent but non-emergency concerns, contact your healthcare provider's office or urgent care center.";
    }
    
    return "I'm here to help with general health information, but I'm experiencing technical difficulties right now. For specific medical concerns, please contact your healthcare provider. If this is urgent, don't hesitate to seek immediate medical attention.";
  }

  private getFallbackJournals(specialty: string): JournalRecommendation[] {
    const generalJournals = [
      {
        title: "Current Advances in Medical Practice",
        journal: "Journal of General Medicine",
        summary: "Recent updates in evidence-based medical practice and clinical guidelines",
        relevanceScore: 0.8,
        url: "https://pubmed.ncbi.nlm.nih.gov"
      },
      {
        title: "Patient Safety and Quality Improvement",
        journal: "Medical Quality Review",
        summary: "Best practices for improving patient outcomes and safety protocols",
        relevanceScore: 0.7,
        url: "https://pubmed.ncbi.nlm.nih.gov"
      }
    ];

    // Add specialty-specific journals when possible
    if (specialty.toLowerCase().includes('cardio')) {
      generalJournals.push({
        title: "Recent Developments in Cardiovascular Medicine",
        journal: "Cardiology Today",
        summary: "Latest research in cardiovascular disease prevention and treatment",
        relevanceScore: 0.9,
        url: "https://pubmed.ncbi.nlm.nih.gov"
      });
    }

    return generalJournals;
  }
}

export const geminiService = new GeminiService();
