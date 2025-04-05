
import { useState, useRef, useEffect } from 'react';
import SimplifiedSpeechService from '../services/simplifiedSpeechService';

export function useSpeechSynthesis() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [highlightedWordIndex, setHighlightedWordIndex] = useState<number | null>(null);
  const [currentSpeakingMessage, setCurrentSpeakingMessage] = useState<string | null>(null);
  
  const speechServiceRef = useRef<SimplifiedSpeechService>(new SimplifiedSpeechService());

  useEffect(() => {
    // Initialize speech service
    speechServiceRef.current = new SimplifiedSpeechService();
    
    const speechService = speechServiceRef.current;
    
    speechService.onSpeechStart = () => {
      setIsSpeaking(true);
    };
    
    speechService.onSpeechEnd = () => {
      setIsSpeaking(false);
      setHighlightedWordIndex(null);
      setCurrentSpeakingMessage(null);
    };
    
    speechService.onSpeechError = (error) => {
      console.error("Speech error:", error);
      setIsSpeaking(false);
      setHighlightedWordIndex(null);
      setCurrentSpeakingMessage(null);
    };
    
    speechService.onTextHighlight = (text, index) => {
      setHighlightedWordIndex(index);
      setCurrentSpeakingMessage(text);
    };
    
    return () => {
      speechService.cleanup();
    };
  }, []);

  // Load voices
  useEffect(() => {
    if ('speechSynthesis' in window) {
      speechSynthesis.onvoiceschanged = () => {
        const voices = speechSynthesis.getVoices();
        console.log("Available voices loaded:", voices.length);
      };
      
      speechSynthesis.getVoices();
    }
  }, []);

  const speakResponse = (text: string, language: string) => {
    stopSpeaking();
    
    // Set the current message being spoken so it can be highlighted
    setCurrentSpeakingMessage(text);
    speechServiceRef.current.speak(text, language);
  };

  const stopSpeaking = () => {
    speechServiceRef.current.stop();
    setIsSpeaking(false);
    setHighlightedWordIndex(null);
    setCurrentSpeakingMessage(null);
  };

  return {
    isSpeaking,
    highlightedWordIndex,
    currentSpeakingMessage,
    speakResponse,
    stopSpeaking
  };
}
