import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { 
  Mic, 
  MicOff, 
  Pause, 
  Play, 
  OctagonMinus, 
  User, 
  Stethoscope,
  Clock,
  Activity
} from "lucide-react";

interface TranscriptEntry {
  id: string;
  speaker: 'doctor' | 'patient';
  text: string;
  timestamp: Date;
  confidence: number;
}

interface ConsultationPanelProps {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  transcript: TranscriptEntry[];
  currentPatient?: {
    name: string;
    id: string;
  };
  onStartRecording: () => void;
  onPauseRecording: () => void;
  onResumeRecording: () => void;
  onStopRecording: () => void;
  className?: string;
}

export function ConsultationPanel({
  isRecording,
  isPaused,
  duration,
  transcript,
  currentPatient,
  onStartRecording,
  onPauseRecording,
  onResumeRecording,
  onStopRecording,
  className,
  ...props
}: ConsultationPanelProps) {
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getRecordingStatus = () => {
    if (!isRecording) return "Ready";
    if (isPaused) return "Paused";
    return "Recording";
  };

  const getStatusColor = () => {
    if (!isRecording) return "secondary";
    if (isPaused) return "warning";
    return "destructive";
  };

  return (
    <Card className={cn("w-full", className)} {...props}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center">
            <Stethoscope className="w-5 h-5 mr-2 text-primary" />
            Consultation Session
          </span>
          <Badge variant={getStatusColor() as any}>
            {getRecordingStatus()}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Patient Info */}
        {currentPatient && (
          <div className="bg-muted rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold">{currentPatient.name}</h4>
                <p className="text-sm text-muted-foreground">
                  Patient ID: {currentPatient.id}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Recording Controls */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {!isRecording ? (
                <Button
                  onClick={onStartRecording}
                  size="lg"
                  className="flex items-center space-x-2"
                >
                  <Mic className="w-5 h-5" />
                  <span>Start Recording</span>
                </Button>
              ) : (
                <div className="flex items-center space-x-2">
                  <Button
                    onClick={isPaused ? onResumeRecording : onPauseRecording}
                    size="lg"
                    variant={isPaused ? "default" : "secondary"}
                    className="flex items-center space-x-2"
                  >
                    {isPaused ? (
                      <>
                        <Play className="w-5 h-5" />
                        <span>Resume</span>
                      </>
                    ) : (
                      <>
                        <Pause className="w-5 h-5" />
                        <span>Pause</span>
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={onStopRecording}
                    size="lg"
                    variant="destructive"
                    className="flex items-center space-x-2"
                  >
                    <OctagonMinus className="w-5 h-5" />
                    <span>OctagonMinus</span>
                  </Button>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-3">
              {isRecording && (
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full recording-indicator" />
                  <span className="text-sm text-muted-foreground">Live</span>
                </div>
              )}
              <div className="flex items-center space-x-2 text-sm text-muted-foreground font-mono">
                <Clock className="w-4 h-4" />
                <span>{formatDuration(duration)}</span>
              </div>
            </div>
          </div>

          {/* Audio Level Indicator */}
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                isRecording && !isPaused ? "bg-red-500" : "bg-primary"
              )}
              style={{ 
                width: isRecording && !isPaused ? '75%' : '0%' 
              }}
            />
          </div>
        </div>

        {/* Live Transcript */}
        <div className="space-y-3">
          <h5 className="font-semibold flex items-center">
            <Activity className="w-4 h-4 mr-2" />
            Live Transcript
          </h5>
          <div className="bg-muted rounded-lg p-4 max-h-64 overflow-y-auto">
            {transcript.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Mic className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Start recording to see live transcript</p>
              </div>
            ) : (
              <div className="space-y-3">
                {transcript.map((entry) => (
                  <div key={entry.id} className="flex space-x-3">
                    <Badge 
                      variant={entry.speaker === 'doctor' ? 'default' : 'secondary'}
                      className="flex-shrink-0"
                    >
                      {entry.speaker === 'doctor' ? 'Doctor' : 'Patient'}
                    </Badge>
                    <div className="flex-1">
                      <p className="text-sm">{entry.text}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {entry.timestamp.toLocaleTimeString()} • 
                        Confidence: {Math.round(entry.confidence * 100)}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
