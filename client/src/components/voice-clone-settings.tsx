import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Mic, 
  MicOff, 
  Play, 
  Square, 
  Upload, 
  Volume2, 
  Settings,
  CheckCircle,
  AlertCircle,
  Download,
  RefreshCw
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface VoiceCloneSettingsProps {
  doctorId: string;
  doctorName: string;
  currentVoiceId?: string;
  onVoiceCloned?: (voiceId: string) => void;
}

interface VoiceSample {
  id: string;
  name: string;
  audioUrl: string;
  duration: number;
  quality: 'low' | 'medium' | 'high';
}

export default function VoiceCloneSettings({ 
  doctorId, 
  doctorName, 
  currentVoiceId,
  onVoiceCloned 
}: VoiceCloneSettingsProps) {
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState<Blob | null>(null);
  const [voiceSamples, setVoiceSamples] = useState<VoiceSample[]>([]);
  const [testText, setTestText] = useState("");
  const [isPlayingTest, setIsPlayingTest] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Start recording voice sample
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

      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setRecordedAudio(audioBlob);
        setIsRecording(false);
        
        toast({
          title: "Recording Complete",
          description: "Voice sample recorded successfully. You can now clone your voice.",
        });
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);

      toast({
        title: "Recording Started",
        description: "Please speak clearly for 10-15 seconds to create a quality voice sample.",
      });

    } catch (error) {
      toast({
        title: "Recording Failed",
        description: "Could not access microphone. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Clone voice using recorded audio
  const cloneVoice = async () => {
    if (!recordedAudio) {
      toast({
        title: "No Audio Sample",
        description: "Please record a voice sample first.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Convert blob to buffer for upload
      const arrayBuffer = await recordedAudio.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const formData = new FormData();
      formData.append('audio', new Blob([buffer], { type: 'audio/webm' }));
      formData.append('doctorId', doctorId);
      formData.append('doctorName', doctorName);

      const response = await apiRequest("/api/doctor/clone-voice", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.success) {
          toast({
            title: "Voice Cloned Successfully",
            description: "Your voice has been cloned and is ready for use.",
          });
          
          onVoiceCloned?.(data.voiceId);
          
          // Add to voice samples
          setVoiceSamples(prev => [...prev, {
            id: data.voiceId,
            name: `${doctorName}'s Voice`,
            audioUrl: URL.createObjectURL(recordedAudio),
            duration: Math.round(recordedAudio.size / 1000), // Rough estimate
            quality: 'high'
          }]);
          
          setRecordedAudio(null);
        } else {
          throw new Error(data.error || "Voice cloning failed");
        }
      } else {
        throw new Error("Failed to clone voice");
      }
    } catch (error) {
      console.error("Voice cloning error:", error);
      toast({
        title: "Voice Cloning Failed",
        description: error instanceof Error ? error.message : "An error occurred during voice cloning",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Test cloned voice
  const testVoice = async () => {
    if (!currentVoiceId || !testText.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide a voice ID and text to test.",
        variant: "destructive",
      });
      return;
    }

    setIsPlayingTest(true);

    try {
      const response = await apiRequest("/api/digital-doctor/test-voice", {
        method: "POST",
        body: {
          voiceId: currentVoiceId,
          text: testText,
          language: 'en'
        },
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.success) {
          // Play the generated audio
          const audio = new Audio(data.audioUrl);
          audio.play();
          
          toast({
            title: "Voice Test Successful",
            description: "Playing your cloned voice...",
          });
        } else {
          throw new Error(data.error || "Voice test failed");
        }
      } else {
        throw new Error("Failed to test voice");
      }
    } catch (error) {
      console.error("Voice test error:", error);
      toast({
        title: "Voice Test Failed",
        description: error instanceof Error ? error.message : "An error occurred during voice testing",
        variant: "destructive",
      });
    } finally {
      setIsPlayingTest(false);
    }
  };

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('audio/')) {
      setUploadedFile(file);
      toast({
        title: "File Selected",
        description: `${file.name} selected for voice cloning.`,
      });
    } else {
      toast({
        title: "Invalid File",
        description: "Please select an audio file.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <Settings className="w-5 h-5 mr-2 text-blue-600" />
            Voice Clone Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Voice Status */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">Voice Clone Status</h4>
                <p className="text-sm text-gray-600">
                  {currentVoiceId ? "Voice cloned successfully" : "No voice clone available"}
                </p>
              </div>
              <Badge variant={currentVoiceId ? "default" : "secondary"}>
                {currentVoiceId ? (
                  <CheckCircle className="w-4 h-4 mr-1" />
                ) : (
                  <AlertCircle className="w-4 h-4 mr-1" />
                )}
                {currentVoiceId ? "Active" : "Inactive"}
              </Badge>
            </div>
          </div>

          {/* Voice Recording */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Record Voice Sample</h4>
            <div className="flex items-center space-x-4">
              <Button
                onClick={isRecording ? stopRecording : startRecording}
                variant={isRecording ? "destructive" : "default"}
                disabled={isProcessing}
                className="flex items-center"
              >
                {isRecording ? (
                  <>
                    <Square className="w-4 h-4 mr-2" />
                    Stop Recording
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4 mr-2" />
                    Start Recording
                  </>
                )}
              </Button>
              
              {isRecording && (
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-sm text-red-600">Recording...</span>
                </div>
              )}
            </div>

            {recordedAudio && (
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="font-medium text-green-800">Voice Sample Recorded</h5>
                    <p className="text-sm text-green-600">
                      Duration: {Math.round(recordedAudio.size / 1000)}s • Size: {(recordedAudio.size / 1024).toFixed(1)}KB
                    </p>
                  </div>
                  <Button
                    onClick={cloneVoice}
                    disabled={isProcessing}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {isProcessing ? (
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4 mr-2" />
                    )}
                    Clone Voice
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* File Upload Alternative */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Or Upload Audio File</h4>
            <div className="flex items-center space-x-4">
              <Input
                type="file"
                accept="audio/*"
                onChange={handleFileUpload}
                className="flex-1"
              />
              {uploadedFile && (
                <Button
                  onClick={cloneVoice}
                  disabled={isProcessing}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Clone from File
                </Button>
              )}
            </div>
          </div>

          {/* Voice Testing */}
          {currentVoiceId && (
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Test Your Cloned Voice</h4>
              <div className="space-y-3">
                <Textarea
                  placeholder="Enter text to test your cloned voice..."
                  value={testText}
                  onChange={(e) => setTestText(e.target.value)}
                  className="min-h-[80px]"
                />
                <Button
                  onClick={testVoice}
                  disabled={!testText.trim() || isPlayingTest}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {isPlayingTest ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Play className="w-4 h-4 mr-2" />
                  )}
                  Test Voice
                </Button>
              </div>
            </div>
          )}

          {/* Voice Samples */}
          {voiceSamples.length > 0 && (
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Your Voice Samples</h4>
              <div className="space-y-2">
                {voiceSamples.map((sample) => (
                  <div key={sample.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Volume2 className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="font-medium text-gray-900">{sample.name}</p>
                        <p className="text-sm text-gray-600">
                          Quality: {sample.quality} • Duration: {sample.duration}s
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      Active
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
