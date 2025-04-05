
import { useState, useRef, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import SimplifiedSpeechService from '../services/simplifiedSpeechService';

export function useSpeechRecognition(language: string) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const temporaryTranscriptRef = useRef<string>('');
  const { toast } = useToast();

  const startRecording = (selectedLanguage: string) => {
    setTranscript('');
    temporaryTranscriptRef.current = '';
    
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = selectedLanguage;
      
      recognition.onstart = () => {
        setIsRecording(true);
        console.log('Speech recognition started in language:', selectedLanguage);
      };
      
      recognition.onresult = (event) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        
        temporaryTranscriptRef.current = currentTranscript;
        setTranscript(currentTranscript);
      };
      
      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
        toast({
          title: "Speech Recognition Error",
          description: `Error: ${event.error}. Please try again.`,
          variant: "destructive"
        });
      };
      
      recognition.onend = () => {
        setIsRecording(false);
      };
      
      recognition.start();
      recognitionRef.current = recognition;
    } else {
      console.error('Speech recognition not supported in this browser');
      toast({
        title: "Browser Not Supported",
        description: "Speech recognition is not supported in this browser. Please try using Chrome, Edge, or Safari.",
        variant: "destructive"
      });
    }
  };

  const stopRecording = (sendTranscript: boolean = false) => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
      
      const result = temporaryTranscriptRef.current.trim();
      if (sendTranscript) {
        return result;
      }
      
      setTranscript('');
      return '';
    }
    return '';
  };

  const toggleRecording = async () => {
    if (!isRecording) {
      startRecording(language);
      return null;
    } else {
      return stopRecording(true);
    }
  };

  // Clean up recognition on language change
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [language]);

  return {
    isRecording,
    transcript,
    startRecording,
    stopRecording,
    toggleRecording,
    temporaryTranscriptRef
  };
}
