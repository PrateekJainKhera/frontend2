// src/components/custom/VoiceInputOverlay.tsx
'use client';

import { useEffect, useState } from 'react';
import { Mic } from 'lucide-react';

interface VoiceInputOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onFinalTranscript: (transcript: string) => void;
}

export function VoiceInputOverlay({ isOpen, onClose, onFinalTranscript }: VoiceInputOverlayProps) {
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Browser does not support Speech Recognition.");
      onClose();
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'en-IN';
    recognition.interimResults = true; // Get live feedback

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      let final_transcript = '';
      let interim_transcript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          final_transcript += event.results[i][0].transcript;
        } else {
          interim_transcript += event.results[i][0].transcript;
        }
      }
      
      setInterimTranscript(interim_transcript);
      
      if (final_transcript) {
        onFinalTranscript(final_transcript.trim());
        onClose();
      }
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      onClose();
    };
    
    recognition.onend = () => {
      setIsListening(false);
      // If the overlay is still open, close it (handles cases where no speech was detected)
      onClose();
    };

    recognition.start();

    return () => {
      recognition.stop();
    };
  }, [isOpen, onClose, onFinalTranscript]);

  if (!isOpen) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 bg-white/95 backdrop-blur-sm z-50 flex flex-col items-center justify-center"
      onClick={onClose} // Allow user to click anywhere to close
    >
      <div className="text-center">
        <div className="relative w-24 h-24 mb-8">
          {/* Pulsing animation */}
          <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-75"></div>
          <div className="relative bg-red-600 text-white rounded-full w-24 h-24 flex items-center justify-center">
            <Mic className="h-12 w-12" />
          </div>
        </div>
        <p className="text-2xl font-semibold text-gray-800">Listening...</p>
        <p className="text-lg text-gray-600 mt-2 min-h-[28px]">
          {interimTranscript}
        </p>
      </div>
    </div>
  );
}