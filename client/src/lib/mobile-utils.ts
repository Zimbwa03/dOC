// Mobile device detection and media capabilities
export const isMobileDevice = (): boolean => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

export const isIOS = (): boolean => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
};

export const isAndroid = (): boolean => {
  return /Android/.test(navigator.userAgent);
};

// Get the best supported audio MIME type for recording
export const getSupportedAudioMimeType = (): string => {
  const types = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/mpeg',
    'audio/wav',
    'audio/ogg'
  ];
  
  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }
  
  // Fallback - most browsers support this
  return 'audio/webm';
};

// Get mobile-optimized audio constraints
export const getMobileOptimizedAudioConstraints = () => {
  const baseConstraints = {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
  };

  // For mobile devices, don't specify sample rate to let the device choose
  if (isMobileDevice()) {
    return {
      audio: {
        ...baseConstraints,
        // Let mobile devices choose their optimal settings
        channelCount: { ideal: 1 }, // Mono for better compatibility
      }
    };
  }

  // For desktop, we can be more specific
  return {
    audio: {
      ...baseConstraints,
      sampleRate: { ideal: 44100 },
      channelCount: { ideal: 2 },
    }
  };
};

// Check if the browser supports media recording
export const checkMediaRecordingSupport = (): { 
  supported: boolean; 
  error?: string; 
} => {
  if (!navigator.mediaDevices) {
    return {
      supported: false,
      error: 'Media devices not supported. Please use HTTPS and a modern browser.'
    };
  }

  if (!navigator.mediaDevices.getUserMedia) {
    return {
      supported: false,
      error: 'getUserMedia not supported. Please update your browser.'
    };
  }

  if (!window.MediaRecorder) {
    return {
      supported: false,
      error: 'MediaRecorder not supported. Please update your browser.'
    };
  }

  return { supported: true };
};

// Request microphone permissions with better mobile handling
export const requestMicrophonePermission = async (): Promise<{
  success: boolean;
  stream?: MediaStream;
  error?: string;
}> => {
  try {
    const supportCheck = checkMediaRecordingSupport();
    if (!supportCheck.supported) {
      return {
        success: false,
        error: supportCheck.error
      };
    }

    const constraints = getMobileOptimizedAudioConstraints();
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    
    return {
      success: true,
      stream
    };
  } catch (error: any) {
    let errorMessage = 'Could not access microphone.';
    
    if (error.name === 'NotAllowedError') {
      errorMessage = 'Microphone permission denied. Please enable microphone access in your browser settings.';
    } else if (error.name === 'NotFoundError') {
      errorMessage = 'No microphone found. Please connect a microphone and try again.';
    } else if (error.name === 'NotSupportedError') {
      errorMessage = 'Recording not supported. Please use HTTPS and a modern browser.';
    } else if (error.name === 'SecurityError') {
      errorMessage = 'Security error. Please ensure you\'re using HTTPS.';
    }

    return {
      success: false,
      error: errorMessage
    };
  }
};