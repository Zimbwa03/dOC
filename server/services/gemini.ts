import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY || ""
});

export interface MedicalAnalysisRequest {
  symptoms: string[];
  patientHistory?: string;
  transcript?: string;
  doctorSpecialization?: string;
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
      
      Symptoms: ${request.symptoms.join(', ')}
      ${request.patientHistory ? `Patient History: ${request.patientHistory}` : ''}
      ${request.transcript ? `Consultation Transcript: ${request.transcript}` : ''}
      ${request.doctorSpecialization ? `Doctor Specialization: ${request.doctorSpecialization}` : ''}
      
      Please provide comprehensive medical analysis and recommendations based on the information provided.
      Focus on patient safety and evidence-based medicine.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-pro",
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
    } catch (error) {
      console.error("Medical analysis error:", error);
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
        model: "gemini-2.5-pro",
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
      return rawJson ? JSON.parse(rawJson) : {
        medications: [],
        dietPlan: "Follow a balanced diet as recommended by your healthcare provider.",
        exercisePlan: "Engage in regular physical activity as appropriate for your condition.",
        followUpInstructions: "Schedule a follow-up appointment with your doctor.",
        reminders: []
      };
    } catch (error) {
      console.error("Health plan generation error:", error);
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
        model: "gemini-2.5-flash",
        config: {
          systemInstruction: systemPrompt,
        },
        contents: prompt,
      });

      return response.text || "I'm sorry, I couldn't process your request right now. Please try again or contact your healthcare provider for urgent concerns.";
    } catch (error) {
      console.error("Patient chat error:", error);
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
        model: "gemini-2.5-pro",
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
      return rawJson ? JSON.parse(rawJson) : [];
    } catch (error) {
      console.error("Journal recommendation error:", error);
      return [];
    }
  }
}

export const geminiService = new GeminiService();
