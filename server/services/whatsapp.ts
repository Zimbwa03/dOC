interface WhatsAppMessage {
  to: string;
  type: 'text';
  text: {
    body: string;
  };
}

class WhatsAppService {
  private apiUrl: string;
  private accessToken: string;
  private phoneNumberId: string;

  constructor() {
    this.apiUrl = 'https://graph.facebook.com/v17.0';
    this.accessToken = process.env.WHATSAPP_API_TOKEN || '';
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
  }

  private formatPhoneNumber(phoneNumber: string): string {
    // Remove all non-numeric characters
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    // If the number doesn't start with a country code, assume US (+1)
    if (cleaned.length === 10) {
      return `1${cleaned}`;
    }
    
    // If it starts with 1 and has 11 digits, it's already formatted for US
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return cleaned;
    }
    
    // Otherwise, return as-is (assume it includes country code)
    return cleaned;
  }

  async sendMessage(to: string, message: string): Promise<boolean> {
    try {
      if (!this.accessToken || !this.phoneNumberId) {
        console.warn('WhatsApp API not configured - message would be sent:', message);
        return true; // Return true for development when API is not configured
      }

      const formattedPhone = this.formatPhoneNumber(to);
      
      const whatsappMessage: WhatsAppMessage = {
        to: formattedPhone,
        type: 'text',
        text: {
          body: message
        }
      };

      const response = await fetch(`${this.apiUrl}/${this.phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(whatsappMessage),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('WhatsApp API error:', response.status, errorData);
        return false;
      }

      const result = await response.json();
      console.log('WhatsApp message sent successfully:', result);
      return true;
    } catch (error) {
      console.error('WhatsApp send error:', error);
      return false;
    }
  }

  async sendMedicationReminder(patientPhone: string, doctorName: string, medication: string): Promise<boolean> {
    const message = `🏥 *Docdot Medication Reminder*

Hello! This is a reminder from Dr. ${doctorName}.

💊 *Time to take your medication:*
${medication}

Please take your medication as prescribed. If you have any questions or concerns, don't hesitate to contact your healthcare provider.

Stay healthy! 💙

_This is an automated message from Docdot Healthcare AI System_`;

    return await this.sendMessage(patientPhone, message);
  }

  async sendAppointmentReminder(patientPhone: string, doctorName: string, appointmentDate: Date): Promise<boolean> {
    const formattedDate = appointmentDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const message = `🏥 *Docdot Appointment Reminder*

Hello! This is a reminder from Dr. ${doctorName}.

📅 *Upcoming Appointment:*
${formattedDate}

Please arrive 15 minutes early for check-in. If you need to reschedule, please contact our office as soon as possible.

We look forward to seeing you! 💙

_This is an automated message from Docdot Healthcare AI System_`;

    return await this.sendMessage(patientPhone, message);
  }

  async sendHealthPlanUpdate(patientPhone: string, doctorName: string, updateType: string): Promise<boolean> {
    const message = `🏥 *Docdot Health Plan Update*

Hello! Dr. ${doctorName} has updated your health plan.

📋 *Update Type:* ${updateType}

Please log into your Docdot patient portal to view the updated health plan and any new instructions.

If you have any questions about your updated plan, please contact your healthcare provider.

Stay healthy! 💙

_This is an automated message from Docdot Healthcare AI System_`;

    return await this.sendMessage(patientPhone, message);
  }

  async sendReminder(patientPhone: string, doctorName: string, message: string, type: string): Promise<boolean> {
    switch (type) {
      case 'medication':
        return await this.sendMedicationReminder(patientPhone, doctorName, message);
      case 'appointment':
        const appointmentDate = new Date(message); // Assuming message contains date string
        return await this.sendAppointmentReminder(patientPhone, doctorName, appointmentDate);
      case 'health_plan':
        return await this.sendHealthPlanUpdate(patientPhone, doctorName, message);
      default:
        // Generic reminder
        const genericMessage = `🏥 *Docdot Reminder*

Hello! This is a reminder from Dr. ${doctorName}.

${message}

If you have any questions, please contact your healthcare provider.

Stay healthy! 💙

_This is an automated message from Docdot Healthcare AI System_`;
        return await this.sendMessage(patientPhone, genericMessage);
    }
  }
}

export const whatsappService = new WhatsAppService();
