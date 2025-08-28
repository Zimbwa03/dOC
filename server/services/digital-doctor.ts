import { ElevenLabs } from 'elevenlabs';
import { storage } from '../storage';

// Initialize ElevenLabs client
const elevenLabs = new ElevenLabs({
  apiKey: process.env.ELEVENLABS_API_KEY || '',
});

export interface DigitalDoctorRequest {
  patientId: string;
  message: string;
  language: 'en' | 'sn' | 'mixed';
  doctorId: string;
}

export interface DigitalDoctorResponse {
  text: string;
  audioUrl: string;
  duration: number;
  language: string;
  doctorName: string;
  context: any;
}

export class DigitalDoctorService {
  private modelId = 'eleven_multilingual_v2';

  // Generate AI response with full medical context
  async generateResponse(request: DigitalDoctorRequest): Promise<DigitalDoctorResponse> {
    try {
      // Get patient and doctor information
      const patient = await storage.getPatientById(request.patientId);
      const doctor = await storage.getDoctorById(request.doctorId);
      
      if (!patient || !doctor) {
        throw new Error('Patient or doctor not found');
      }

      // Get comprehensive medical context
      const context = await this.buildMedicalContext(request.patientId, request.doctorId);
      
      // Create medical prompt
      const medicalPrompt = this.createMedicalPrompt(request.message, context, request.language);
      
      // Generate AI response using ElevenLabs
      const aiResponse = await this.generateAIResponse(medicalPrompt, request.language);
      
      // Convert to speech using doctor's cloned voice
      const voiceMessage = await this.textToSpeech(aiResponse, doctor.voiceId || process.env.ELEVENLABS_VOICE_ID, request.language);
      
      return {
        text: aiResponse,
        audioUrl: voiceMessage.audioUrl,
        duration: voiceMessage.duration,
        language: request.language,
        doctorName: doctor.fullName,
        context: context
      };
    } catch (error) {
      console.error('Error in digital doctor service:', error);
      throw new Error('Failed to generate digital doctor response');
    }
  }

  // Build comprehensive medical context
  private async buildMedicalContext(patientId: string, doctorId: string): Promise<any> {
    try {
      // Get latest consultation
      const consultations = await storage.getConsultationsByPatient(patientId, 1);
      const latestConsultation = consultations[0];
      
      // Get health plan
      const healthPlan = await storage.getPatientHealthPlan(patientId);
      
      // Get medication history
      const medications = healthPlan?.medications || [];
      
      // Get AI interactions history
      const aiInteractions = await storage.getAiInteractions(patientId, 10);
      
      return {
        patientId,
        doctorId,
        latestConsultation,
        healthPlan,
        medications,
        aiInteractions,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Error building medical context:', error);
      return {};
    }
  }

  // Create comprehensive medical prompt
  private createMedicalPrompt(message: string, context: any, language: 'en' | 'sn' | 'mixed'): string {
    const { latestConsultation, healthPlan, medications } = context;
    
    let prompt = `You are Dr. ${context.doctorName || 'Zimbwa'}, a professional healthcare provider. `;
    prompt += `You are speaking to your patient ${context.patientName || 'Ruvimbo'}. `;
    
    // Add consultation context
    if (latestConsultation) {
      prompt += `Based on your last consultation on ${new Date(latestConsultation.consultationDate).toLocaleDateString()}, `;
      
      if (latestConsultation.diagnosis) {
        prompt += `you diagnosed: ${latestConsultation.diagnosis}. `;
      }
      
      if (latestConsultation.doctorNotes) {
        prompt += `Your clinical notes indicated: ${latestConsultation.doctorNotes}. `;
      }
      
      if (latestConsultation.patientReport) {
        prompt += `Patient report showed: ${latestConsultation.patientReport}. `;
      }
    }
    
    // Add medication context
    if (medications && medications.length > 0) {
      prompt += `The patient is currently taking: ${medications.map((med: any) => `${med.name} ${med.dosage}`).join(', ')}. `;
    }
    
    // Add health plan context
    if (healthPlan) {
      if (healthPlan.dietPlan) {
        prompt += `You recommended a diet plan: ${healthPlan.dietPlan}. `;
      }
      if (healthPlan.exercisePlan) {
        prompt += `For exercise, you suggested: ${healthPlan.exercisePlan}. `;
      }
    }
    
    // Add current patient message
    prompt += `Now the patient says: "${message}". `;
    
    // Language-specific instructions
    if (language === 'sn') {
      prompt += `Respond in Shona (Zimbabwean language) with warmth and care. Use medical terms in English when necessary for clarity. `;
      prompt += `Start with "Mhoro" (hello) and use familiar Shona expressions. `;
    } else if (language === 'mixed') {
      prompt += `Respond in a mix of Shona and English. Use Shona for greetings and personal connection, English for medical terms. `;
      prompt += `This creates a comfortable, culturally appropriate medical conversation. `;
    } else {
      prompt += `Respond in English with a warm, professional medical tone. `;
    }
    
    prompt += `Be caring, professional, and medically accurate. Ask follow-up questions if needed. `;
    prompt += `Remember you are the patient's actual doctor, not an AI assistant. `;
    
    return prompt;
  }

  // Generate AI response using ElevenLabs
  private async generateAIResponse(prompt: string, language: 'en' | 'sn' | 'mixed'): Promise<string> {
    try {
      // For now, we'll use a mock response since ElevenLabs AI generation requires specific setup
      // In production, you would call ElevenLabs AI generation API
      
      const mockResponses = {
        en: [
          "Hello Ruvimbo, I'm Dr. Zimbwa. How are you feeling today? I've reviewed your recent consultation and want to check on your progress.",
          "I see from our last appointment that we discussed your treatment plan. How have you been managing with the medications I prescribed?",
          "Thank you for sharing that with me. Based on your symptoms, I'd like to ask a few follow-up questions to better understand your current condition."
        ],
        sn: [
          "Mhoro Ruvimbo, ndini Dr. Zimbwa. Unofara sei nhasi? Ndakaona consultation yedu yapfuura uye ndinoda kuziva kuti urikufamba sei.",
          "Ndinoona kubva kugungano redu rekupedzisira kuti takakurukura nezve treatment plan. Wakambotarisira sei nemishonga yandakakupa?",
          "Ndatenda nekugovana izvozvo neni. Zvichienderana nezviratidzo zvako, ndinoda kubvunza mibvunzo yekutevera kuti ndinzwisise mamiriro ako azvino."
        ],
        mixed: [
          "Mhoro Ruvimbo, I'm Dr. Zimbwa. How are you feeling today? Ndakaona consultation yedu yapfuura uye I want to check on your progress.",
          "I see from our last appointment kuti takakurukura treatment plan. How have you been managing nemishonga yandakakupa?",
          "Thank you nekugovana izvozvo neni. Based on your symptoms, ndinoda kubvunza follow-up questions kuti ndinzwisise current condition yako."
        ]
      };
      
      const responses = mockResponses[language] || mockResponses.en;
      return responses[Math.floor(Math.random() * responses.length)];
      
    } catch (error) {
      console.error('Error generating AI response:', error);
      return "I understand your concern. Let me review your medical records and provide you with the best guidance.";
    }
  }

  // Convert text to speech using ElevenLabs
  private async textToSpeech(text: string, voiceId: string, language: 'en' | 'sn' | 'mixed'): Promise<any> {
    try {
      const voiceSettings = this.getVoiceSettings(language);
      
      const audioStream = await elevenLabs.textToSpeech({
        text,
        voice_id: voiceId,
        model_id: this.modelId,
        voice_settings: voiceSettings
      });

      // In a real implementation, you would save this to cloud storage
      // and return a public URL. For now, we'll return a mock response
      return {
        audioUrl: `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
        duration: this.estimateDuration(text)
      };
    } catch (error) {
      console.error('Error in text-to-speech:', error);
      throw new Error('Failed to generate speech');
    }
  }

  // Get voice settings based on language
  private getVoiceSettings(language: 'en' | 'sn' | 'mixed') {
    const baseSettings = {
      stability: 0.7,
      similarity_boost: 0.8,
      style: 0.3,
      use_speaker_boost: true
    };

    switch (language) {
      case 'sn':
        return {
          ...baseSettings,
          stability: 0.8, // More stable for Shona pronunciation
          similarity_boost: 0.9
        };
      case 'mixed':
        return {
          ...baseSettings,
          stability: 0.75,
          style: 0.4 // Slightly more expressive for mixed language
        };
      default:
        return baseSettings;
    }
  }

  // Estimate audio duration
  private estimateDuration(text: string): number {
    const wordsPerMinute = 150;
    const words = text.split(' ').length;
    return Math.ceil((words / wordsPerMinute) * 60);
  }

  // Clone doctor's voice
  async cloneDoctorVoice(audioFile: Buffer, doctorName: string): Promise<string> {
    try {
      // This would typically be done on the backend for security
      // For now, we'll return a mock voice ID
      console.log('Voice cloning would be implemented on backend');
      return 'cloned_voice_id_123';
    } catch (error) {
      console.error('Error cloning voice:', error);
      throw new Error('Failed to clone doctor voice');
    }
  }
}

export default DigitalDoctorService;
