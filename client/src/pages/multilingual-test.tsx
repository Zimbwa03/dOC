import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Mic, MicOff, Languages, Volume2, Play, Square } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TranscriptEntry {
  id: string;
  text: string;
  language: string;
  confidence: number;
  timestamp: Date;
}

export default function MultilingualTest() {
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'sn' | 'auto'>('en');
  const [recognition, setRecognition] = useState<any>(null);

  useEffect(() => {
    // Initialize Web Speech API
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      recognitionInstance.maxAlternatives = 3;
      
      // Set initial language
      const languageMap = {
        'en': 'en-US',
        'sn': 'sn-ZW', // Shona (Zimbabwe)
        'auto': 'en-US' // Default to English for auto-detection
      };
      
      recognitionInstance.lang = languageMap[selectedLanguage];
      
      recognitionInstance.onresult = (event: any) => {
        const results = Array.from(event.results);
        const latestResult = results[results.length - 1] as any;

        if (latestResult.isFinal) {
          const transcriptText = latestResult[0].transcript;
          const confidence = latestResult[0].confidence;

          const newEntry: TranscriptEntry = {
            id: Date.now().toString(),
            text: transcriptText,
            language: selectedLanguage,
            confidence: confidence,
            timestamp: new Date()
          };

          setTranscript(prev => [...prev, newEntry]);
        }
      };

      recognitionInstance.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        toast({
          title: "Speech Recognition Error",
          description: "There was an issue with voice recognition. Please check your microphone.",
          variant: "destructive",
        });
      };

      recognitionInstance.onend = () => {
        if (isRecording) {
          // Auto-restart if still recording
          setTimeout(() => {
            if (isRecording && recognitionInstance) {
              recognitionInstance.start();
            }
          }, 100);
        }
      };

      setRecognition(recognitionInstance);
    }
  }, []);

  // Update language when selection changes
  useEffect(() => {
    if (recognition) {
      const languageMap = {
        'en': 'en-US',
        'sn': 'sn-ZW', // Shona (Zimbabwe)
        'auto': 'en-US' // Default to English for auto-detection
      };
      
      recognition.lang = languageMap[selectedLanguage];
      
      if (isRecording) {
        // Restart recognition with new language
        recognition.stop();
        setTimeout(() => {
          if (isRecording) {
            recognition.start();
          }
        }, 100);
      }
    }
  }, [selectedLanguage, recognition, isRecording]);

  const startRecording = async () => {
    try {
      if (!recognition) {
        toast({
          title: "Speech Recognition Not Available",
          description: "Speech recognition is not supported in this browser.",
          variant: "destructive",
        });
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });

      recognition.start();
      setIsRecording(true);

      toast({
        title: "Recording Started",
        description: `Transcription started in ${selectedLanguage === 'sn' ? 'Shona' : selectedLanguage === 'auto' ? 'Auto-detect' : 'English'}`,
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
    if (recognition) {
      recognition.stop();
    }
    setIsRecording(false);

    toast({
      title: "Recording Stopped",
      description: "Transcription has been stopped.",
    });
  };

  const clearTranscript = () => {
    setTranscript([]);
    toast({
      title: "Transcript Cleared",
      description: "All transcript entries have been cleared.",
    });
  };

  const getLanguageDisplayName = (lang: string) => {
    switch (lang) {
      case 'sn': return '🇿🇼 Shona';
      case 'auto': return '🔄 Auto-detect';
      default: return '🇺🇸 English';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Multi-Lingual Transcription Test
          </h1>
          <p className="text-gray-600">
            Test live transcription in multiple languages including Shona (Zimbabwe)
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Controls Panel */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Volume2 className="w-5 h-5 mr-2 text-blue-600" />
                Transcription Controls
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Language Selection */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700">
                  Transcription Language
                </label>
                <Select value={selectedLanguage} onValueChange={(value) => setSelectedLanguage(value as 'en' | 'sn' | 'auto')}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">🇺🇸 English (US)</SelectItem>
                    <SelectItem value="sn">🇿🇼 Shona (Zimbabwe)</SelectItem>
                    <SelectItem value="auto">🔄 Auto-detect</SelectItem>
                  </SelectContent>
                </Select>
                <Badge variant="outline" className="text-xs">
                  {getLanguageDisplayName(selectedLanguage)} Active
                </Badge>
              </div>

              {/* Recording Controls */}
              <div className="space-y-3">
                <div className="flex space-x-3">
                  <Button
                    onClick={isRecording ? stopRecording : startRecording}
                    variant={isRecording ? "destructive" : "default"}
                    size="lg"
                    className="flex-1"
                    disabled={!recognition}
                  >
                    {isRecording ? (
                      <>
                        <Square className="w-5 h-5 mr-2" />
                        Stop Recording
                      </>
                    ) : (
                      <>
                        <Mic className="w-5 h-5 mr-2" />
                        Start Recording
                      </>
                    )}
                  </Button>
                </div>

                {isRecording && (
                  <div className="text-center">
                    <div className="inline-flex items-center space-x-2 px-3 py-2 bg-red-100 text-red-800 rounded-full">
                      <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium">Recording...</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Instructions */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-800 mb-2">How to Test:</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Select your preferred transcription language</li>
                  <li>• Click "Start Recording" and speak clearly</li>
                  <li>• Try speaking in different languages</li>
                  <li>• Watch real-time transcription appear on the right</li>
                  <li>• Switch languages during recording to test live switching</li>
                </ul>
              </div>

              {/* Clear Button */}
              <Button
                onClick={clearTranscript}
                variant="outline"
                disabled={transcript.length === 0}
                className="w-full"
              >
                Clear Transcript
              </Button>
            </CardContent>
          </Card>

          {/* Live Transcript */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Languages className="w-5 h-5 mr-2 text-green-600" />
                Live Transcript
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {transcript.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Mic className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <p className="text-lg font-medium">Start recording to see live transcript</p>
                    <p className="text-sm">Transcription will appear here in real-time</p>
                  </div>
                ) : (
                  transcript.map((entry) => (
                    <div key={entry.id} className="flex items-start space-x-3 p-3 bg-white rounded-lg shadow-sm border">
                      <Badge variant="outline" className="flex-shrink-0 mt-1">
                        {getLanguageDisplayName(entry.language)}
                      </Badge>
                      <div className="flex-1">
                        <p className="text-sm text-gray-800">{entry.text}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {entry.timestamp.toLocaleTimeString()} • Confidence: {(entry.confidence * 100).toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {transcript.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <div className="flex justify-between items-center text-sm text-gray-600">
                    <span>Total Entries: {transcript.length}</span>
                    <span>Current Language: {getLanguageDisplayName(selectedLanguage)}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Language Information */}
        <Card className="mt-8 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Languages className="w-5 h-5 mr-2 text-purple-600" />
              Language Support Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                <h4 className="font-semibold text-green-800 mb-2">🇺🇸 English</h4>
                <p className="text-sm text-green-700">
                  Full support for medical terminology and clinical language
                </p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-800 mb-2">🇿🇼 Shona</h4>
                <p className="text-sm text-blue-700">
                  Native language support for Zimbabwean patients and doctors
                </p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
                <h4 className="font-semibold text-purple-800 mb-2">🔄 Auto-detect</h4>
                <p className="text-sm text-purple-700">
                  Automatic language detection for mixed-language consultations
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
