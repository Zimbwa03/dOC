# 🎤 ElevenLabs Digital Doctor Integration Setup Guide

## 🚀 **Complete Setup Instructions**

This guide will walk you through setting up the ElevenLabs voice cloning system for your digital doctor feature.

## 📋 **Prerequisites**

- ElevenLabs account (free tier available)
- Node.js 18+ installed
- PostgreSQL database running
- Microphone access for voice recording

## 🔑 **Step 1: ElevenLabs Account Setup**

### 1.1 Create Account
1. Go to [elevenlabs.io](https://elevenlabs.io)
2. Click "Sign Up" and create your account
3. Verify your email address

### 1.2 Get API Key
1. Log into your ElevenLabs dashboard
2. Go to "Profile" → "API Key"
3. Copy your API key (starts with `xi-api-`)

### 1.3 Voice Cloning Setup
1. Navigate to "Voice Library" in the dashboard
2. Click "Add Voice" → "Clone Voice"
3. Upload a voice sample (minimum 30 seconds)
4. Note the generated `voice_id`

## 🌐 **Step 2: Environment Configuration**

### 2.1 Add Environment Variables
Add these to your `.env` file:

```env
# ElevenLabs Configuration
ELEVENLABS_API_KEY=xi-api-your-api-key-here
ELEVENLABS_VOICE_ID=your-voice-id-here
ELEVENLABS_MODEL_ID=eleven_multilingual_v2

# Database Configuration
DATABASE_URL=postgresql://username:password@host:port/database

# Other Required Variables
WHATSAPP_API_TOKEN=your_whatsapp_token
WHATSAPP_PHONE_NUMBER_ID=your_whatsapp_phone_id
TAVILY_API_KEY=your_tavily_key
SERP_API_KEY=your_serp_key
GEMINI_API_KEY=your_gemini_key
GOOGLE_AI_API_KEY=your_google_ai_key
PORT=5000
```

### 2.2 Install Dependencies
```bash
npm install @elevenlabs/node-api
```

## 🎯 **Step 3: Doctor Voice Setup**

### 3.1 Access Voice Setup
1. Log into the doctor dashboard
2. Navigate to "Settings" → "Voice Cloning"
3. Or access directly: `/doctor/voice-setup`

### 3.2 Record Voice Sample
1. **Select Language**: Choose your primary language (English/Shona/Mixed)
2. **Start Recording**: Click "Start Recording" and speak clearly
3. **Recording Guidelines**:
   - Speak naturally in your medical consultation tone
   - Record at least 30 seconds for best results
   - Avoid background noise
   - Use your usual speaking pace

### 3.3 Clone Voice
1. Click "Clone Voice with ElevenLabs"
2. Wait for processing (usually 1-2 minutes)
3. Test your cloned voice with the "Test Voice Clone" button

## 🔧 **Step 4: Digital Doctor Configuration**

### 4.1 Patient Portal Integration
The digital doctor automatically:
- Uses your cloned voice for responses
- Accesses patient medical history
- Provides multilingual support
- Maintains conversation context

### 4.2 Language Support
- **English**: Full medical terminology support
- **Shona**: Cultural greetings + English medical terms
- **Mixed**: Natural language mixing for comfort

## 📱 **Step 5: Testing the System**

### 5.1 Test Voice Clone
1. Use the "Test Voice Clone" button
2. Verify audio quality and pronunciation
3. Check language-specific features

### 5.2 Test Patient Interaction
1. Log into patient portal
2. Navigate to "AI Assistant" tab
3. Send a message and hear your cloned voice respond
4. Test different languages

## 🎨 **Advanced Configuration**

### 5.1 Voice Settings Optimization
```typescript
// In server/services/digital-doctor.ts
const voiceSettings = {
  stability: 0.7,        // Voice consistency (0.0-1.0)
  similarity_boost: 0.8, // Cloning accuracy (0.0-1.0)
  style: 0.3,           // Expressiveness (0.0-1.0)
  use_speaker_boost: true // Enhanced speaker recognition
};
```

### 5.2 Language-Specific Settings
```typescript
// Shona language optimization
case 'sn':
  return {
    ...baseSettings,
    stability: 0.8,        // More stable for Shona
    similarity_boost: 0.9  // Higher accuracy needed
  };
```

## 🔒 **Security & Privacy**

### 6.1 Data Protection
- Voice samples are encrypted in transit
- API keys are stored securely in environment variables
- Patient conversations are HIPAA compliant
- Voice data is processed on ElevenLabs secure servers

### 6.2 Access Control
- Only authenticated doctors can clone voices
- Voice IDs are tied to specific doctor accounts
- Patient access is restricted to their assigned doctor

## 🚨 **Troubleshooting**

### 7.1 Common Issues

#### Voice Cloning Fails
- Check API key validity
- Ensure audio file is at least 30 seconds
- Verify microphone permissions
- Check internet connection

#### Poor Voice Quality
- Re-record with better audio quality
- Increase recording duration
- Reduce background noise
- Speak more clearly and naturally

#### Language Recognition Issues
- Verify language selection
- Use consistent language during recording
- Test with simple phrases first

### 7.2 Error Messages

```
"Voice cloning failed" → Check API key and audio file
"Microphone access denied" → Grant browser permissions
"API rate limit exceeded" → Wait and try again
"Invalid voice ID" → Re-clone voice
```

## 📊 **Monitoring & Analytics**

### 8.1 Voice Usage Tracking
- Monitor API usage in ElevenLabs dashboard
- Track patient interaction frequency
- Analyze language preference patterns
- Monitor voice quality feedback

### 8.2 Performance Metrics
- Response generation time
- Audio quality scores
- Patient satisfaction ratings
- Language accuracy metrics

## 🔮 **Future Enhancements**

### 9.1 Planned Features
- Real-time voice adaptation
- Emotion recognition integration
- Multi-doctor voice management
- Advanced language models

### 9.2 Customization Options
- Voice personality settings
- Medical specialty optimization
- Regional accent support
- Patient preference learning

## 📞 **Support & Resources**

### 10.1 Documentation
- [ElevenLabs API Documentation](https://docs.elevenlabs.io/)
- [Voice Cloning Best Practices](https://elevenlabs.io/voice-cloning)
- [Multilingual Model Guide](https://elevenlabs.io/models)

### 10.2 Community
- ElevenLabs Discord server
- Healthcare AI forums
- Developer communities

## ✅ **Setup Checklist**

- [ ] ElevenLabs account created
- [ ] API key obtained
- [ ] Environment variables configured
- [ ] Dependencies installed
- [ ] Voice sample recorded (30+ seconds)
- [ ] Voice cloned successfully
- [ ] Test voice clone working
- [ ] Patient portal integration tested
- [ ] Multilingual support verified
- [ ] Security measures confirmed

## 🎉 **Congratulations!**

Your digital doctor system is now fully configured with ElevenLabs voice cloning! Patients can now interact with a personalized AI assistant that sounds exactly like you, providing a more engaging and culturally appropriate healthcare experience.

---

**Need Help?** Contact the development team or refer to the troubleshooting section above.

**Last Updated**: December 2024
**Version**: 1.0.0
