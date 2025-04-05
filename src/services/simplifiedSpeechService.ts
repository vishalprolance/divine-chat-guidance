
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
  
  // Event callbacks
  public onSpeechStart: (() => void) | null = null;
  public onSpeechEnd: (() => void) | null = null;
  public onSpeechError: ((error: any) => void) | null = null;
  public onTextHighlight: ((text: string, index: number) => void) | null = null;

  constructor() {
    this.indicService = new IndicTTSService();
    this.setupIndicServiceCallbacks();
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
      const indicSuccess = await this.indicService.speak(text, language);
      
      // Only if explicitly told to force IndicTTS and it failed, try again
      if (!indicSuccess && forceIndicTTS) {
        console.warn(`AI4Bharat failed for ${language} on first attempt, trying again...`);
        const retrySuccess = await this.indicService.speak(text, language);
        if (retrySuccess) return;
      }
      
      // If IndicTTS succeeded, return early
      if (indicSuccess) return;
      
      console.warn(`AI4Bharat failed for ${language}, falling back to browser TTS`);
    }
    
    // For other languages or as fallback, use browser TTS
    this.useBrowserTTS(text, language);
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
  }
}

export default SimplifiedSpeechService;
