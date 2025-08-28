import { ElevenLabs } from '@elevenlabs/node-api';

// Initialize ElevenLabs client
const elevenLabs = new ElevenLabs({
  apiKey: process.env.ELEVENLABS_API_KEY || '',
});

export interface DigitalDoctorContext {
  patientName: string;
  patientId: string;
  doctorName: string;
  doctorVoiceId: string;
  consultationHistory: any[];
  currentMedications: any[];
  healthPlan: any;
  language: 'en' | 'sn' | 'mixed';
}

export interface VoiceMessage {
  text: string;
  audioUrl: string;
  duration: number;
  language: string;
}

export class DigitalDoctorService {
  private voiceId: string;
  private modelId: string;

  constructor(voiceId: string) {
    this.voiceId = voiceId;
    this.modelId = 'eleven_multilingual_v2';
  }

  // Generate AI response with medical context
  async generateMedicalResponse(
    patientMessage: string,
    context: DigitalDoctorContext
  ): Promise<string> {
    try {
      // Create comprehensive medical context prompt
      const medicalPrompt = this.createMedicalPrompt(patientMessage, context);
      
      // Call ElevenLabs AI for response generation
      const response = await elevenLabs.generate({
        text: medicalPrompt,
        voice_id: this.voiceId,
        model_id: this.modelId,
        voice_settings: {
          stability: 0.7,
          similarity_boost: 0.8,
          style: 0.3,
          use_speaker_boost: true
        }
      });

      return response.text || 'I understand your concern. Let me review your medical records.';
    } catch (error) {
      console.error('Error generating medical response:', error);
      return 'I apologize, but I\'m having trouble processing your request right now. Please try again.';
    }
  }

  // Convert text to speech using cloned doctor voice
  async textToSpeech(
    text: string,
    language: 'en' | 'sn' | 'mixed'
  ): Promise<VoiceMessage> {
    try {
      // Adjust voice settings based on language
      const voiceSettings = this.getVoiceSettings(language);
      
      const audioStream = await elevenLabs.textToSpeech({
        text,
        voice_id: this.voiceId,
        model_id: this.modelId,
        voice_settings: voiceSettings
      });

      // Convert stream to audio URL
      const audioBlob = new Blob([audioStream], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(audioBlob);

      return {
        text,
        audioUrl,
        duration: this.estimateDuration(text),
        language
      };
    } catch (error) {
      console.error('Error in text-to-speech:', error);
      throw new Error('Failed to generate speech');
    }
  }

  // Create comprehensive medical context prompt
  private createMedicalPrompt(patientMessage: string, context: DigitalDoctorContext): string {
    const { patientName, doctorName, consultationHistory, currentMedications, healthPlan, language } = context;
    
    const languagePrefix = language === 'sn' ? 'Ndini Dr. ' : 'I am Dr. ';
    const greeting = language === 'sn' ? `Mhoro ${patientName}, ndiri Dr. ${doctorName}` : `Hello ${patientName}, I am Dr. ${doctorName}`;
    
    let prompt = `${greeting}. I am your digital healthcare assistant. `;
    
    if (consultationHistory && consultationHistory.length > 0) {
      const latestConsultation = consultationHistory[0];
      prompt += `Based on our last consultation on ${new Date(latestConsultation.consultationDate).toLocaleDateString()}, `;
      
      if (latestConsultation.diagnosis) {
        prompt += `I diagnosed you with: ${latestConsultation.diagnosis}. `;
      }
      
      if (latestConsultation.doctorNotes) {
        prompt += `My notes indicated: ${latestConsultation.doctorNotes}. `;
      }
    }
    
    if (currentMedications && currentMedications.length > 0) {
      prompt += `You are currently taking: ${currentMedications.map(med => `${med.name} ${med.dosage}`).join(', ')}. `;
    }
    
    if (healthPlan) {
      if (healthPlan.dietPlan) {
        prompt += `I recommended a diet plan: ${healthPlan.dietPlan}. `;
      }
      if (healthPlan.exercisePlan) {
        prompt += `For exercise, I suggested: ${healthPlan.exercisePlan}. `;
      }
    }
    
    prompt += `Now, you said: "${patientMessage}". Please provide a professional, caring, and medically accurate response as Dr. ${doctorName}. `;
    
    if (language === 'sn') {
      prompt += 'Respond in Shona, but you can mix with English medical terms when necessary.';
    } else if (language === 'mixed') {
      prompt += 'Respond in a mix of English and Shona, using Shona for greetings and personal connection, English for medical terms.';
    } else {
      prompt += 'Respond in English with a warm, professional medical tone.';
    }
    
    return prompt;
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

  // Estimate audio duration based on text length
  private estimateDuration(text: string): number {
    const wordsPerMinute = 150;
    const words = text.split(' ').length;
    return Math.ceil((words / wordsPerMinute) * 60);
  }

  // Clone doctor's voice from audio sample
  async cloneDoctorVoice(audioFile: File, doctorName: string): Promise<string> {
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

  // Get available voices
  async getAvailableVoices(): Promise<any[]> {
    try {
      const voices = await elevenLabs.voices.getAll();
      return voices;
    } catch (error) {
      console.error('Error fetching voices:', error);
      return [];
    }
  }
}

export default DigitalDoctorService;
