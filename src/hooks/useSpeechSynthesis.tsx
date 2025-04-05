
import { useState, useRef, useEffect } from 'react';
import SimplifiedSpeechService from '../services/simplifiedSpeechService';

export function useSpeechSynthesis() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [highlightedWordIndex, setHighlightedWordIndex] = useState<number | null>(null);
  const [currentSpeakingMessage, setCurrentSpeakingMessage] = useState<string | null>(null);
  const [lastSpokenLanguage, setLastSpokenLanguage] = useState<string | null>(null);
  const [audioPlaybackFailed, setAudioPlaybackFailed] = useState(false);
  
  const speechServiceRef = useRef<SimplifiedSpeechService>(new SimplifiedSpeechService());

  useEffect(() => {
    // Initialize speech service
    speechServiceRef.current = new SimplifiedSpeechService();
    
    const speechService = speechServiceRef.current;
    
    speechService.onSpeechStart = () => {
      console.log("Speech started - setting speaking state to true");
      setIsSpeaking(true);
      setAudioPlaybackFailed(false); // Reset error state when speech starts
    };
    
    speechService.onSpeechEnd = () => {
      console.log("Speech ended - cleaning up state");
      setIsSpeaking(false);
      setHighlightedWordIndex(null);
      setCurrentSpeakingMessage(null);
    };
    
    speechService.onSpeechError = (error) => {
      console.error("Speech error encountered:", error);
      setIsSpeaking(false);
      setHighlightedWordIndex(null);
      setCurrentSpeakingMessage(null);
      setAudioPlaybackFailed(true); // Set error state when speech fails
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
    console.log(`Initiating speech for language: ${language} - text: "${text.substring(0, 50)}..."`);
    
    // Stop any previous speech and reset state
    stopSpeaking();
    
    // Set the current message being spoken so it can be highlighted
    setCurrentSpeakingMessage(text);
    setLastSpokenLanguage(language);
    setAudioPlaybackFailed(false); // Reset error state
    
    // Force use AI4Bharat TTS for Kannada and Bengali
    if (['kn-IN', 'bn-IN'].includes(language)) {
      console.log(`Speaking in ${language === 'kn-IN' ? 'Kannada' : 'Bengali'} using AI4Bharat TTS service`);
      try {
        // Dedicated handling to ensure we get audio output
        speechServiceRef.current.speak(text, language, true);
        
        // Set a fallback timeout in case speech doesn't start
        setTimeout(() => {
          if (!isSpeaking && !audioPlaybackFailed) {
            console.log("Speech failed to start after timeout, trying fallback");
            setAudioPlaybackFailed(true);
            // Try one more time with explicit fallback
            speechServiceRef.current.speak(text, language, true);
          }
        }, 2000);
      } catch (error) {
        console.error(`Error initiating ${language} speech:`, error);
        setAudioPlaybackFailed(true);
      }
    } else {
      // For other languages, use the regular speak method
      speechServiceRef.current.speak(text, language);
    }
  };

  const stopSpeaking = () => {
    console.log("Stopping all speech");
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
    audioPlaybackFailed,
    speakResponse,
    stopSpeaking
  };
}
