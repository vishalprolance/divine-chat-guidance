
import { useState, useRef, useEffect } from 'react';
import SimplifiedSpeechService from '../services/simplifiedSpeechService';

export function useSpeechSynthesis() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [highlightedWordIndex, setHighlightedWordIndex] = useState<number | null>(null);
  const [currentSpeakingMessage, setCurrentSpeakingMessage] = useState<string | null>(null);
  const [lastSpokenLanguage, setLastSpokenLanguage] = useState<string | null>(null);
  
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
      const loadVoices = () => {
        const voices = speechSynthesis.getVoices();
        console.log("Available voices loaded:", voices.length);
        
        // Log all available voices for debugging
        voices.forEach((voice, index) => {
          console.log(`Voice ${index + 1}: ${voice.name} (${voice.lang})${voice.localService ? ' - Local' : ''}`);
        });
      };
      
      // Chrome and Edge require this event listener
      speechSynthesis.onvoiceschanged = loadVoices;
      
      // For browsers that load voices immediately
      loadVoices();
    }
  }, []);

  const speakResponse = (text: string, language: string) => {
    stopSpeaking();
    
    // Set the current message being spoken so it can be highlighted
    setCurrentSpeakingMessage(text);
    setLastSpokenLanguage(language);
    
    // Enhanced logging specifically for Kannada and Bengali
    if (['kn-IN', 'bn-IN'].includes(language)) {
      console.log(`Speaking in ${language === 'kn-IN' ? 'Kannada' : 'Bengali'} using AI4Bharat TTS service when available`);
      // Force use AI4Bharat TTS for these languages
      speechServiceRef.current.speak(text, language, true);
    } else {
      // For other languages, use the regular speak method
      speechServiceRef.current.speak(text, language);
    }
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
    lastSpokenLanguage,
    speakResponse,
    stopSpeaking
  };
}
