import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { 
  Microphone, 
  Play, 
  Pause, 
  Upload, 
  Volume2, 
  CheckCircle,
  AlertCircle,
  Settings,
  Languages
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface DoctorVoiceSetupProps {
  doctorId: string;
  doctorName: string;
  onVoiceCloned: (voiceId: string) => void;
}

export default function DoctorVoiceSetup({ doctorId, doctorName, onVoiceCloned }: DoctorVoiceSetupProps) {
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [voiceId, setVoiceId] = useState<string>("");
  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'sn' | 'mixed'>('en');
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });
      
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      const chunks: Blob[] = [];
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        chunks.push(event.data);
      };
      
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorderRef.current.start();
      setIsRecording(true);
      
      toast({
        title: "Recording Started",
        description: "Please speak clearly for at least 30 seconds for best voice cloning results",
      });
      
    } catch (error) {
      toast({
        title: "Recording Failed",
        description: "Could not access microphone. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      toast({
        title: "Recording Stopped",
        description: "Voice sample captured successfully",
      });
    }
  };

  const playRecording = () => {
    if (audioUrl && audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
        
        audioRef.current.onended = () => {
          setIsPlaying(false);
        };
      }
    }
  };

  const uploadVoiceSample = async () => {
    if (!audioBlob) {
      toast({
        title: "No Voice Sample",
        description: "Please record a voice sample first",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'doctor-voice-sample.webm');
      formData.append('doctorId', doctorId);
      formData.append('doctorName', doctorName);
      formData.append('language', selectedLanguage);

      const response = await apiRequest("POST", "/api/doctor/clone-voice", formData);
      const data = await response.json();
      
      if (data.success) {
        setVoiceId(data.voiceId);
        onVoiceCloned(data.voiceId);
        
        toast({
          title: "Voice Cloned Successfully",
          description: `Dr. ${doctorName}'s voice has been cloned and is ready for use`,
        });
      } else {
        throw new Error(data.error || 'Voice cloning failed');
      }
    } catch (error: any) {
      toast({
        title: "Voice Cloning Failed",
        description: error.message || "Could not clone voice. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const testVoiceClone = async () => {
    if (!voiceId) {
      toast({
        title: "No Voice ID",
        description: "Please clone your voice first",
        variant: "destructive",
      });
      return;
    }

    try {
      const testText = selectedLanguage === 'sn' 
        ? "Mhoro, ndini Dr. Zimbwa. Ndiri kuona patient yangu nhasi."
        : "Hello, I am Dr. Zimbwa. I am seeing my patient today.";

      const response = await apiRequest("POST", "/api/digital-doctor/test-voice", {
        voiceId,
        text: testText,
        language: selectedLanguage
      });
      
      const data = await response.json();
      
      if (data.success && data.audioUrl) {
        const audio = new Audio(data.audioUrl);
        audio.play();
        
        toast({
          title: "Voice Test",
          description: "Playing your cloned voice sample",
        });
      }
    } catch (error) {
      toast({
        title: "Voice Test Failed",
        description: "Could not test voice clone",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center text-xl">
          <Volume2 className="w-5 h-5 mr-2 text-blue-600" />
          Voice Cloning Setup
        </CardTitle>
        <p className="text-sm text-gray-600">
          Record your voice to create a digital clone for patient interactions
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Language Selection */}
        <div className="space-y-2">
          <Label htmlFor="language">Primary Language for Voice Cloning</Label>
          <select
            id="language"
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value as 'en' | 'sn' | 'mixed')}
            className="w-full p-2 border border-gray-300 rounded-md"
          >
            <option value="en">🇺🇸 English</option>
            <option value="sn">🇿🇼 Shona</option>
            <option value="mixed">🌍 Mixed Language</option>
          </select>
          <p className="text-xs text-gray-500">
            This will optimize voice cloning for your preferred language
          </p>
        </div>

        {/* Recording Section */}
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <Button
              onClick={isRecording ? stopRecording : startRecording}
              variant={isRecording ? "destructive" : "default"}
              className="flex items-center space-x-2"
            >
              {isRecording ? (
                <>
                  <Pause className="w-4 h-4" />
                  Stop Recording
                </>
              ) : (
                <>
                  <Microphone className="w-4 h-4" />
                  Start Recording
                </>
              )}
            </Button>
            
            {audioUrl && (
              <Button
                onClick={playRecording}
                variant="outline"
                className="flex items-center space-x-2"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                {isPlaying ? "Pause" : "Play"}
              </Button>
            )}
          </div>
          
          {isRecording && (
            <div className="flex items-center space-x-2 text-red-600">
              <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
              <span className="text-sm">Recording... Speak clearly and naturally</span>
            </div>
          )}
          
          {audioUrl && (
            <div className="flex items-center space-x-2 text-green-600">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm">Voice sample recorded successfully</span>
            </div>
          )}
        </div>

        {/* Audio Player */}
        {audioUrl && (
          <div className="space-y-2">
            <Label>Voice Sample Preview</Label>
            <audio
              ref={audioRef}
              src={audioUrl}
              controls
              className="w-full"
            />
          </div>
        )}

        {/* Upload Section */}
        {audioBlob && (
          <div className="space-y-4">
            <Button
              onClick={uploadVoiceSample}
              disabled={isUploading}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              <Upload className="w-4 h-4 mr-2" />
              {isUploading ? "Cloning Voice..." : "Clone Voice with ElevenLabs"}
            </Button>
            
            <div className="text-xs text-gray-500 text-center">
              <p>• Minimum 30 seconds recommended for best results</p>
              <p>• Speak naturally in your usual medical consultation tone</p>
              <p>• Voice will be used for digital doctor interactions</p>
            </div>
          </div>
        )}

        {/* Voice ID Display */}
        {voiceId && (
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="flex items-center space-x-2 mb-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="font-semibold text-green-800">Voice Cloned Successfully!</span>
            </div>
            <p className="text-sm text-green-700 mb-3">
              Your voice has been cloned and is ready for use in patient interactions.
            </p>
            <div className="flex space-x-2">
              <Button
                onClick={testVoiceClone}
                variant="outline"
                size="sm"
                className="border-green-600 text-green-600 hover:bg-green-50"
              >
                <Play className="w-4 h-4 mr-2" />
                Test Voice Clone
              </Button>
              <div className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                Voice ID: {voiceId.slice(0, 8)}...
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h4 className="font-semibold text-blue-800 mb-2">Voice Cloning Instructions</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Speak clearly and naturally in your usual medical consultation tone</li>
            <li>• Record at least 30 seconds for optimal voice cloning</li>
            <li>• Use the language you'll primarily use with patients</li>
            <li>• Avoid background noise and interruptions</li>
            <li>• Your cloned voice will be used for digital doctor interactions</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
