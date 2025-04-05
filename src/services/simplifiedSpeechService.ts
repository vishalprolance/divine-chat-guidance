import IndicTTSService from './indicTTSService';
import { findBestVoice, getSpeechRate } from '../utils/voiceUtils';
import { splitTextIntoChunks, cleanTextForSpeech } from '../utils/textUtils';
import { setupTextHighlighting, clearHighlightTimeouts } from '../utils/highlightUtils';

/**
 * Simplified speech service that prioritizes Indic languages through AI4Bharat
 * and falls back to browser TTS for other languages
 */
class SimplifiedSpeechService {
  private utterance: SpeechSynthesisUtterance | null = null;
  private indicService: IndicTTSService;
  private isSpeaking = false;
  private textToHighlight: string = '';
  private currentHighlightIndex = 0;
  private highlightTimeouts: number[] = [];
  private watchdogInterval: number | null = null;
  private chunkedUtterances: SpeechSynthesisUtterance[] = [];
  private currentUtteranceIndex = 0;
  private audioContext: AudioContext | null = null;
  private audioSource: AudioBufferSourceNode | null = null;
  
  // Event callbacks
  public onSpeechStart: (() => void) | null = null;
  public onSpeechEnd: (() => void) | null = null;
  public onSpeechError: ((error: any) => void) | null = null;
  public onTextHighlight: ((text: string, index: number) => void) | null = null;

  constructor() {
    this.indicService = new IndicTTSService();
    this.setupIndicServiceCallbacks();
    
    // Try to initialize AudioContext for more reliable audio playback
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (e) {
      console.warn("AudioContext not supported, falling back to standard audio elements", e);
    }
  }

  private setupIndicServiceCallbacks(): void {
    this.indicService.setCallbacks(
      // On start
      () => {
        this.isSpeaking = true;
        if (this.onSpeechStart) this.onSpeechStart();
      },
      // On end
      () => {
        this.isSpeaking = false;
        if (this.onSpeechEnd) this.onSpeechEnd();
      },
      // On error
      (error) => {
        this.isSpeaking = false;
        if (this.onSpeechError) this.onSpeechError(error);
      },
      // On highlight
      (text, index) => {
        if (this.onTextHighlight) this.onTextHighlight(text, index);
      }
    );
  }

  /**
   * Speaks the given text in the specified language
   * Uses AI4Bharat for Indic languages and browser TTS for others
   * @param text The text to speak
   * @param language The language code (e.g., 'kn-IN')
   * @param forceIndicTTS Whether to force the use of IndicTTS (for Kannada and Bengali)
   */
  public async speak(text: string, language: string, forceIndicTTS: boolean = false): Promise<void> {
    if (!text.trim()) return;
    
    console.log(`Speaking text in ${language}:`, text.substring(0, 50) + (text.length > 50 ? '...' : ''));
    
    // Stop any existing speech
    this.stop();
    
    // For Kannada and Bengali, use AI4Bharat service
    if (['kn-IN', 'bn-IN'].includes(language) || forceIndicTTS) {
      console.log(`Using AI4Bharat for ${language}`);
      
      // First attempt with AI4Bharat
      if (this.onSpeechStart) this.onSpeechStart();
      
      try {
        const indicSuccess = await this.indicService.speak(text, language);
        
        // If successful, we're done
        if (indicSuccess) {
          return;
        }
        
        console.warn(`AI4Bharat TTS failed for ${language}, trying direct audio synthesis`);
        
        // If AI4Bharat fails, try synthesizing speech directly
        const success = await this.synthesizeIndicSpeech(text, language);
        if (success) return;
        
        // If direct synthesis fails, fall back to browser TTS but avoid Hindi/English
        console.warn(`Direct synthesis failed for ${language}, falling back to browser TTS`);
      } catch (error) {
        console.error(`Error with AI4Bharat TTS for ${language}:`, error);
        
        if (this.onSpeechError) {
          this.onSpeechError(error);
        }
      }
    }
    
    // For other languages or as fallback, use browser TTS
    this.useBrowserTTS(text, language);
  }

  /**
   * Attempt to synthesize Indic speech with direct audio manipulation
   * This is a fallback when AI4Bharat's API isn't available
   */
  private async synthesizeIndicSpeech(text: string, language: string): Promise<boolean> {
    try {
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      // Create an oscillator for basic audio feedback (just to confirm audio works)
      const oscillator = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();
      
      // Set very low volume as this is just a test tone
      gain.gain.value = 0.01;
      oscillator.type = 'sine';
      oscillator.frequency.value = 440; // A4 note
      
      oscillator.connect(gain);
      gain.connect(this.audioContext.destination);
      
      // Play a short beep to test audio
      oscillator.start();
      await new Promise(resolve => setTimeout(resolve, 100));
      oscillator.stop();
      
      // Set up text highlighting with proper timing
      const highlightResult = setupTextHighlighting(
        text, 
        language, 
        0.8, // Slower rate for better syllable matching
        true,
        this.onTextHighlight
      );
      this.highlightTimeouts = highlightResult.timeouts;
      
      console.log(`Direct audio synthesis test successful for ${language}`);
      
      // Start the actual speech - in a real implementation we would
      // generate speech audio here, but for now we'll simulate it with the browser TTS
      // but use a very carefully selected voice
      return this.useBrowserTTSForIndic(text, language);
    } catch (error) {
      console.error("Error in direct audio synthesis:", error);
      return false;
    }
  }
  
  /**
   * Special handling for Indic languages with browser TTS
   */
  private useBrowserTTSForIndic(text: string, language: string): boolean {
    if (!('speechSynthesis' in window)) {
      console.error("Speech synthesis not supported");
      return false;
    }
    
    // Cancel any existing speech
    window.speechSynthesis.cancel();
    
    // Create a new utterance
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language;
    utterance.rate = 0.7; // Slower for clearer pronunciation
    
    // Get all available voices
    const voices = window.speechSynthesis.getVoices();
    
    console.log(`Finding specialized voice for ${language}`);
    
    // For Indic languages, we need to be extremely careful with voice selection
    let selectedVoice: SpeechSynthesisVoice | null = null;
    
    // First try to find exact language match
    selectedVoice = voices.find(v => v.lang === language) || null;
    
    if (!selectedVoice) {
      // Try to find voice by language code (bn, kn)
      const langCode = language.split('-')[0];
      selectedVoice = voices.find(v => v.lang.startsWith(langCode)) || null;
    }
    
    // Avoid German voice for Indic languages (often the default fallback)
    if (!selectedVoice || selectedVoice.name.toLowerCase().includes('deutsch')) {
      // Try ANY Indian voice before falling back to others
      const indianVoice = voices.find(v => 
        v.lang.endsWith('-IN') && 
        !v.name.toLowerCase().includes('deutsch') &&
        !v.lang.startsWith('de')
      );
      
      if (indianVoice) {
        selectedVoice = indianVoice;
      } else {
        // Last resort - find any non-German voice
        selectedVoice = voices.find(v => 
          !v.name.toLowerCase().includes('deutsch') && 
          !v.lang.startsWith('de')
        ) || voices[0];
      }
    }
    
    if (selectedVoice) {
      utterance.voice = selectedVoice;
      console.log(`Using voice ${selectedVoice.name} (${selectedVoice.lang}) for ${language}`);
    } else {
      console.warn(`No suitable voice found for ${language}`);
    }
    
    // Set up event handlers
    utterance.onstart = () => {
      console.log(`Browser TTS started for ${language}`);
      this.isSpeaking = true;
    };
    
    utterance.onend = () => {
      console.log(`Browser TTS ended for ${language}`);
      this.isSpeaking = false;
      clearHighlightTimeouts(this.highlightTimeouts);
      if (this.onSpeechEnd) this.onSpeechEnd();
    };
    
    utterance.onerror = (error) => {
      console.error(`Browser TTS error for ${language}:`, error);
      this.isSpeaking = false;
      clearHighlightTimeouts(this.highlightTimeouts);
      if (this.onSpeechError) this.onSpeechError(error);
    };
    
    try {
      // Start speaking
      window.speechSynthesis.speak(utterance);
      
      // Set up watchdog to make sure speech continues
      this.setupWatchdog();
      return true;
    } catch (error) {
      console.error("Error starting speech:", error);
      if (this.onSpeechError) this.onSpeechError(error);
      return false;
    }
  }

  /**
   * Use browser's native speech synthesis
   */
  private useBrowserTTS(text: string, language: string): void {
    if (!('speechSynthesis' in window)) {
      console.error("Speech synthesis not supported");
      return;
    }
    
    // Stop any ongoing speech
    window.speechSynthesis.cancel();
    
    // Split text into smaller chunks for better reliability
    const textChunks = splitTextIntoChunks(text, language);
    this.chunkedUtterances = [];
    this.currentUtteranceIndex = 0;
    
    // Find the best voice for this language
    const voice = findBestVoice(language);
    
    // Get appropriate speech rate for this language
    const rate = getSpeechRate(language);
    
    // Create utterances for each chunk
    for (const chunk of textChunks) {
      if (!chunk.trim()) continue; // Skip empty chunks
      
      const utterance = new SpeechSynthesisUtterance(chunk);
      utterance.lang = language;
      utterance.rate = rate;
      utterance.pitch = 1.0;
      
      // Set voice if we found one
      if (voice) {
        utterance.voice = voice;
      }
      
      this.chunkedUtterances.push(utterance);
    }
    
    // Setup event handlers for the first utterance
    if (this.chunkedUtterances.length > 0) {
      this.setupUtteranceEvents(this.chunkedUtterances[0]);
      this.isSpeaking = true;
      
      // Set up text highlighting
      const highlightResult = setupTextHighlighting(
        text, 
        language, 
        rate,
        this.isSpeaking,
        this.onTextHighlight
      );
      this.highlightTimeouts = highlightResult.timeouts;
      this.textToHighlight = highlightResult.textToHighlight;
      
      // Trigger speech start event
      if (this.onSpeechStart) {
        this.onSpeechStart();
      }
      
      // Start speaking the first chunk
      try {
        window.speechSynthesis.speak(this.chunkedUtterances[0]);
        console.log("Started speaking with voice:", this.chunkedUtterances[0].voice?.name);
        
        // Set up watchdog to ensure speech continues
        this.setupWatchdog();
      } catch (error) {
        console.error("Error starting speech synthesis:", error);
        if (this.onSpeechError) {
          this.onSpeechError(error);
        }
      }
    }
  }

  /**
   * Setup watchdog to restart if speech synthesis stops unexpectedly
   */
  private setupWatchdog(): void {
    // Clear any existing watchdog
    if (this.watchdogInterval !== null) {
      window.clearInterval(this.watchdogInterval);
    }
    
    // Check every 3 seconds if speech synthesis is paused unexpectedly
    this.watchdogInterval = window.setInterval(() => {
      if (this.isSpeaking) {
        // If paused unexpectedly, try to resume
        if (window.speechSynthesis.paused) {
          console.log("Detected unexpected speech pause, resuming...");
          window.speechSynthesis.resume();
        }
        
        // If somehow stopped, try to restart current chunk
        if (!window.speechSynthesis.speaking && !window.speechSynthesis.pending) {
          console.log("Detected unexpected speech stop, attempting recovery...");
          if (this.currentUtteranceIndex < this.chunkedUtterances.length) {
            try {
              // Try to continue with current chunk
              window.speechSynthesis.speak(this.chunkedUtterances[this.currentUtteranceIndex]);
            } catch (error) {
              console.error("Error in watchdog recovery:", error);
            }
          }
        }
      } else {
        // Clear watchdog if no longer speaking
        if (this.watchdogInterval !== null) {
          window.clearInterval(this.watchdogInterval);
          this.watchdogInterval = null;
        }
      }
    }, 3000);
  }

  /**
   * Setup event handlers for an utterance with improved error handling
   */
  private setupUtteranceEvents(utterance: SpeechSynthesisUtterance): void {
    const currentIndex = this.currentUtteranceIndex;
    
    // When a chunk finishes, start the next one
    utterance.onend = () => {
      // Only proceed if we're still in speaking mode and this is the current utterance
      if (!this.isSpeaking || currentIndex !== this.currentUtteranceIndex) {
        return;
      }
      
      this.currentUtteranceIndex++;
      
      // If there are more chunks, speak the next one
      if (this.currentUtteranceIndex < this.chunkedUtterances.length) {
        const nextUtterance = this.chunkedUtterances[this.currentUtteranceIndex];
        this.setupUtteranceEvents(nextUtterance);
        
        // Add a small pause between chunks for more natural speech
        setTimeout(() => {
          if (this.isSpeaking) {
            try {
              window.speechSynthesis.speak(nextUtterance);
            } catch (error) {
              console.error("Error speaking next chunk:", error);
              this.handleSpeechError(error, this.currentUtteranceIndex);
            }
          }
        }, 300);
      } else {
        // All chunks finished
        this.isSpeaking = false;
        
        // Clear highlight timeouts
        clearHighlightTimeouts(this.highlightTimeouts);
        this.highlightTimeouts = [];
        
        // Clear watchdog
        if (this.watchdogInterval !== null) {
          window.clearInterval(this.watchdogInterval);
          this.watchdogInterval = null;
        }
        
        // Trigger speech end event
        if (this.onSpeechEnd) {
          this.onSpeechEnd();
        }
      }
    };
    
    // Handle errors with improved recovery logic
    utterance.onerror = (event) => {
      this.handleSpeechError(event, currentIndex);
    };
  }

  /**
   * Handle speech synthesis errors with retry logic
   */
  private handleSpeechError(error: any, utteranceIndex: number): void {
    console.error("Speech synthesis error:", error);
    
    // If this is not the last utterance and speaking is still active, try to continue
    if (this.isSpeaking && utteranceIndex < this.chunkedUtterances.length - 1) {
      console.log(`Attempting to continue with next chunk after error`);
      this.currentUtteranceIndex = utteranceIndex + 1;
      const nextUtterance = this.chunkedUtterances[this.currentUtteranceIndex];
      this.setupUtteranceEvents(nextUtterance);
      
      // Brief delay before trying next chunk
      setTimeout(() => {
        if (this.isSpeaking) {
          try {
            window.speechSynthesis.speak(nextUtterance);
          } catch (retryError) {
            console.error("Error in error recovery:", retryError);
            // If retry failed, report the error and stop
            this.stop();
            if (this.onSpeechError) {
              this.onSpeechError(retryError);
            }
          }
        }
      }, 500);
    } else {
      // Cannot continue, report error
      this.isSpeaking = false;
      
      // Trigger error event
      if (this.onSpeechError) {
        this.onSpeechError(error);
      }
    }
  }

  /**
   * Stop speaking with cleanup
   */
  public stop(): void {
    // Stop browser TTS
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    
    // Stop Indic TTS
    this.indicService.stop();
    
    // Stop any audio context playback
    if (this.audioSource) {
      try {
        this.audioSource.stop();
        this.audioSource.disconnect();
        this.audioSource = null;
      } catch (e) {
        console.error("Error stopping audio source:", e);
      }
    }
    
    this.isSpeaking = false;
    this.utterance = null;
    
    // Clear highlights
    clearHighlightTimeouts(this.highlightTimeouts);
    this.highlightTimeouts = [];
    
    // Clear watchdog
    if (this.watchdogInterval !== null) {
      window.clearInterval(this.watchdogInterval);
      this.watchdogInterval = null;
    }
  }

  /**
   * Clean up resources
   */
  public cleanup(): void {
    this.stop();
    this.utterance = null;
    this.onSpeechStart = null;
    this.onSpeechEnd = null;
    this.onSpeechError = null;
    this.onTextHighlight = null;
    clearHighlightTimeouts(this.highlightTimeouts);
    this.highlightTimeouts = [];
    
    // Clean up audio context
    if (this.audioContext && this.audioContext.state !== 'closed') {
      try {
        this.audioContext.close();
      } catch (e) {
        console.error("Error closing audio context:", e);
      }
    }
  }
}

export default SimplifiedSpeechService;
