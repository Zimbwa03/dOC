import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ 
  apiKey: import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_GOOGLE_AI_API_KEY || ""
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

export async function analyzeMedicalConsultation(request: MedicalAnalysisRequest): Promise<MedicalAnalysisResponse> {
  try {
    const systemPrompt = `You are an advanced medical AI assistant helping doctors during consultations. 
    Analyze the provided medical information and provide diagnostic insights, treatment recommendations, and clinical guidance.
    Focus on evidence-based medicine and current clinical guidelines.
    
    Respond with structured JSON containing:
    - diagnosticSuggestions: array of potential diagnoses
    - recommendedTests: array of suggested diagnostic tests
    - treatmentOptions: array of treatment recommendations
    - urgencyLevel: assessment of case urgency (low/medium/high/emergency)
    - confidence: confidence score (0-1)
    - clinicalNotes: additional clinical observations
    
    Always emphasize the need for clinical judgment and that AI suggestions should supplement, not replace, medical expertise.`;

    const prompt = `
    Patient Symptoms: ${request.symptoms.join(', ')}
    ${request.patientHistory ? `Patient History: ${request.patientHistory}` : ''}
    ${request.transcript ? `Consultation Transcript: ${request.transcript}` : ''}
    ${request.doctorSpecialization ? `Doctor Specialization: ${request.doctorSpecialization}` : ''}
    
    Please provide comprehensive medical analysis and recommendations.`;

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

export async function generateHealthPlan(patientData: any, consultationNotes: string): Promise<any> {
  try {
    const systemPrompt = `You are a medical AI assistant creating personalized health plans.
    Generate a comprehensive health plan based on patient data and consultation notes.
    
    Respond with JSON containing:
    - medications: array of medication objects with name, dosage, frequency, instructions
    - dietPlan: detailed dietary recommendations
    - exercisePlan: exercise recommendations with limitations if any
    - followUpInstructions: follow-up care instructions
    - reminders: array of reminder objects for medications and appointments`;

    const prompt = `
    Patient Data: ${JSON.stringify(patientData)}
    Consultation Notes: ${consultationNotes}
    
    Create a comprehensive, personalized health plan.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
      },
      contents: prompt,
    });

    const rawJson = response.text;
    return rawJson ? JSON.parse(rawJson) : null;
  } catch (error) {
    console.error("Health plan generation error:", error);
    throw new Error(`Failed to generate health plan: ${error}`);
  }
}

export async function chatWithPatient(message: string, patientHistory: any): Promise<string> {
  try {
    const systemPrompt = `You are a helpful medical AI assistant for patients. 
    Provide accurate, helpful health information while emphasizing the importance of professional medical advice.
    Always recommend consulting with their doctor for serious concerns.
    Be empathetic and supportive while maintaining medical accuracy.`;

    const prompt = `
    Patient Message: ${message}
    Patient Medical History: ${JSON.stringify(patientHistory)}
    
    Provide a helpful, empathetic response.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: systemPrompt,
      },
      contents: prompt,
    });

    return response.text || "I'm sorry, I couldn't process your request right now. Please try again or contact your healthcare provider.";
  } catch (error) {
    console.error("Patient chat error:", error);
    return "I'm experiencing technical difficulties. Please contact your healthcare provider for urgent concerns.";
  }
}

export async function recommendJournals(doctorSpecialty: string, recentCases: string[]): Promise<any[]> {
  try {
    const systemPrompt = `You are a medical research AI assistant.
    Recommend relevant medical journals and recent research based on doctor specialty and recent cases.
    Focus on current, evidence-based research from reputable medical journals.`;

    const prompt = `
    Doctor Specialty: ${doctorSpecialty}
    Recent Cases: ${recentCases.join(', ')}
    
    Recommend 5 relevant medical journal articles or research papers.
    Include title, journal name, brief summary, and relevance explanation.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
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
