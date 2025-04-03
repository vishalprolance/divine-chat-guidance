
/**
 * Enhanced service to handle text-to-speech functionality across different languages
 * with improved support for Indic languages like Kannada and Bengali
 */
class SpeechService {
  private utterance: SpeechSynthesisUtterance | null = null;
  private chunkedUtterances: SpeechSynthesisUtterance[] = [];
  private currentUtteranceIndex = 0;
  private isSpeaking = false;
  private pausedWordIndex = 0;
  private resumeTimeout: number | null = null;
  private watchdogInterval: number | null = null;
  private currentHighlightIndex = 0;
  private textToHighlight: string = '';
  private highlightTimeouts: number[] = [];
  
  // Event callbacks
  public onSpeechStart: (() => void) | null = null;
  public onSpeechEnd: (() => void) | null = null;
  public onSpeechError: ((error: any) => void) | null = null;
  public onTextHighlight: ((text: string, index: number) => void) | null = null;

  constructor() {
    this.setupSpeechSynthesis();
  }

  private setupSpeechSynthesis() {
    if ('speechSynthesis' in window) {
      // Wait for voices to load
      window.speechSynthesis.onvoiceschanged = () => {
        const voices = window.speechSynthesis.getVoices();
        console.log("Loaded voices:", voices.map(v => `${v.name} (${v.lang})`));
      };
      
      // Try to trigger voice loading
      window.speechSynthesis.getVoices();
    }
  }

  /**
   * Splits long text into smaller chunks for reliable speech synthesis
   * With special handling for complex scripts like Kannada and Bengali
   */
  private splitTextIntoChunks(text: string, language: string): string[] {
    // Use smaller chunks for languages that need more processing
    let chunkSize = 80; // Default smaller chunks for all languages
    
    // Different chunk sizes for different languages based on their complexity
    if (language === 'en-US') {
      chunkSize = 160;
    } else if (language === 'hi-IN') {
      chunkSize = 100;
    } else if (['kn-IN', 'bn-IN'].includes(language)) {
      chunkSize = 60; // Even smaller chunks for Kannada and Bengali
    } else if (language === 'sa-IN') {
      chunkSize = 70; // Sanskrit needs smaller chunks too
    } else if (language === 'mr-IN') {
      chunkSize = 90; // Marathi
    }
    
    const chunks: string[] = [];
    
    // Try to split on sentence boundaries
    // Include language-specific sentence endings
    const sentenceRegex = /[^.!?।॥\n]+[.!?।॥\n]+|\s+/g;
    // Ensure match returns a non-null value or use an empty array as fallback
    const matches = text.match(sentenceRegex) || [];
    let sentences: string[] = matches.length > 0 ? Array.from(matches) : [text];
    
    // If we couldn't split by sentences, split by words as a fallback
    if (sentences.length === 1 && text.length > chunkSize) {
      sentences = text.split(/\s+/).map(word => word + ' ');
    }
    
    let currentChunk = '';
    for (const sentence of sentences) {
      if ((currentChunk + sentence).length <= chunkSize) {
        currentChunk += sentence;
      } else {
        if (currentChunk) {
          chunks.push(currentChunk.trim());
        }
        currentChunk = sentence;
      }
    }
    
    if (currentChunk) {
      chunks.push(currentChunk.trim());
    }
    
    console.log(`Split text into ${chunks.length} chunks for language ${language}`);
    return chunks;
  }

  /**
   * Find the best voice for the given language with enhanced matching for Indic languages
   */
  private findVoice(language: string): SpeechSynthesisVoice | null {
    if (!('speechSynthesis' in window)) return null;
    
    const voices = window.speechSynthesis.getVoices();
    console.log(`Finding voice for language: ${language}, available voices:`, voices.length);
    
    // Primary match - exact language code
    let preferredVoice = voices.find(voice => voice.lang === language);
    
    // Secondary match - language portion only (e.g., 'kn' for 'kn-IN')
    if (!preferredVoice) {
      const langCode = language.split('-')[0];
      preferredVoice = voices.find(voice => voice.lang.startsWith(langCode + '-'));
    }
    
    // Enhanced language-specific fallbacks with better matching logic
    if (!preferredVoice) {
      if (language === "hi-IN") {
        // For Hindi - try Google Hindi first
        preferredVoice = voices.find(voice => 
          voice.name.toLowerCase().includes("hindi") ||
          voice.lang.includes("hi") ||
          voice.name.toLowerCase().includes("indian")
        );
      } else if (language === "kn-IN") {
        // For Kannada - first try Hindi as fallback (better than German)
        // Since many browsers don't have native Kannada support but Hindi sounds closer
        preferredVoice = voices.find(voice => 
          voice.name.toLowerCase().includes("kannada") ||
          voice.lang.includes("kn") ||
          voice.name.toLowerCase().includes("हिन्दी") ||
          voice.name.toLowerCase().includes("hindi") ||
          voice.lang.includes("hi-IN") ||
          voice.name.toLowerCase().includes("indian")
        );
      } else if (language === "bn-IN") {
        // For Bengali - first try Hindi as fallback (better than German)
        preferredVoice = voices.find(voice => 
          voice.name.toLowerCase().includes("bengali") ||
          voice.name.toLowerCase().includes("bangla") ||
          voice.lang.includes("bn") ||
          voice.name.toLowerCase().includes("हिन्दी") ||
          voice.name.toLowerCase().includes("hindi") ||
          voice.lang.includes("hi-IN") ||
          voice.name.toLowerCase().includes("indian")
        );
      } else if (language === "sa-IN") {
        // For Sanskrit - try Hindi as fallback since they share script
        preferredVoice = voices.find(voice => 
          voice.lang.includes("sa") || 
          voice.name.toLowerCase().includes("sanskrit") || 
          voice.name.toLowerCase().includes("hindi") ||
          voice.lang.includes("hi-IN") ||
          voice.name.toLowerCase().includes("indian")
        );
      } else if (language === "mr-IN") {
        // For Marathi - try Hindi as they share script
        preferredVoice = voices.find(voice => 
          voice.lang.includes("mr") || 
          voice.name.toLowerCase().includes("marathi") || 
          voice.name.toLowerCase().includes("hindi") ||
          voice.lang.includes("hi-IN") ||
          voice.name.toLowerCase().includes("indian")
        );
      }
    }
    
    // If still no voice and it's an Indian language, try using Hindi voice
    // Hindi is better than German for most Indian languages
    if (!preferredVoice && language.endsWith("-IN")) {
      preferredVoice = voices.find(voice => 
        voice.name.includes("हिन्दी") ||
        voice.name.includes("Hindi") ||
        voice.lang === "hi-IN"
      );
    }
    
    // If still no voice, try to find any Indian English voice
    if (!preferredVoice && language.endsWith("-IN")) {
      preferredVoice = voices.find(voice => 
        voice.name.includes("Indian") || 
        voice.name.includes("Ravi") || 
        voice.name.includes("Heera") || 
        voice.lang === "en-IN"
      );
    }
    
    // For Indic languages, specifically avoid German if possible
    if (language.endsWith("-IN") && preferredVoice && preferredVoice.name.includes("Deutsch")) {
      // Try to find ANY voice that isn't German
      const nonGermanVoice = voices.find(voice => 
        !voice.name.includes("Deutsch") && 
        (voice.lang.includes("IN") || voice.lang.includes("US") || voice.lang.includes("GB"))
      );
      
      if (nonGermanVoice) {
        preferredVoice = nonGermanVoice;
      }
    }
    
    // Last resort - just use English voice instead of German
    if ((!preferredVoice || preferredVoice.name.includes("Deutsch")) && voices.length > 0) {
      // Prefer any English voice over German for Indian languages
      preferredVoice = voices.find(voice => voice.lang.includes("en-US") || voice.lang.includes("en-IN") || voice.lang.includes("en-GB")) || voices[0];
    }
    
    if (preferredVoice) {
      console.log(`Selected voice: ${preferredVoice.name} (${preferredVoice.lang}) for language: ${language}`);
    } else {
      console.log(`No voice found for language: ${language}`);
    }
    
    return preferredVoice || null;
  }

  /**
   * Set up text highlighting with proper timing
   */
  private setupTextHighlighting(text: string, rate: number): void {
    if (!this.onTextHighlight) return;
    
    this.textToHighlight = text;
    this.currentHighlightIndex = 0;
    
    // Clear any existing highlight timeouts
    this.highlightTimeouts.forEach(timeout => window.clearTimeout(timeout));
    this.highlightTimeouts = [];
    
    // Split text into words
    const words = text.split(/\s+/);
    
    // Calculate average word length for this language
    const avgWordsPerMinute = rate < 0.9 ? 150 : 180; // Slower for complex scripts
    const msPerWord = 60000 / avgWordsPerMinute / rate;
    
    // Set up timeouts for each word
    let currentTime = 300; // Start after a short delay
    
    words.forEach((word, index) => {
      const timeout = window.setTimeout(() => {
        if (this.isSpeaking) {
          this.currentHighlightIndex = index;
          this.onTextHighlight?.(this.textToHighlight, index);
        }
      }, currentTime);
      
      this.highlightTimeouts.push(timeout);
      currentTime += msPerWord * (0.7 + 0.6 * (word.length / 5)); // Adjust timing based on word length
    });
  }

  /**
   * Speak text in specified language with advanced chunking for better reliability
   */
  public speak(text: string, language: string): void {
    if (!('speechSynthesis' in window)) {
      console.error("Speech synthesis not supported");
      return;
    }
    
    // Stop any ongoing speech
    this.stop();
    
    // Split text into smaller chunks for better reliability
    const textChunks = this.splitTextIntoChunks(text, language);
    this.chunkedUtterances = [];
    this.currentUtteranceIndex = 0;
    
    // Find the best voice for this language
    const voice = this.findVoice(language);
    
    // Create utterances for each chunk
    for (const chunk of textChunks) {
      if (!chunk.trim()) continue; // Skip empty chunks
      
      const utterance = new SpeechSynthesisUtterance(chunk);
      utterance.lang = language;
      
      // Adjust speech parameters for better clarity based on language
      let rate = 1.0;
      if (language === 'en-US') {
        rate = 0.9;
        utterance.pitch = 1.0;
      } else if (language === 'hi-IN') {
        rate = 0.85;  // Slightly slower for Hindi
        utterance.pitch = 1.0;
      } else if (language === 'kn-IN') {
        rate = 0.8;   // Slower for Kannada
        utterance.pitch = 1.0;
      } else if (language === 'sa-IN') {
        rate = 0.75;  // Slowest for Sanskrit
        utterance.pitch = 1.0;
      } else if (language === 'mr-IN') {
        rate = 0.85;  // Similar to Hindi for Marathi
        utterance.pitch = 1.0;
      } else if (language === 'bn-IN') {
        rate = 0.8;   // Slower for Bengali 
        utterance.pitch = 1.0;
      } else {
        rate = 0.9;   // Default
        utterance.pitch = 1.0;
      }
      utterance.rate = rate;
      
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
      if (textChunks.length > 0) {
        this.setupTextHighlighting(text, this.chunkedUtterances[0].rate);
      }
      
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
        this.highlightTimeouts.forEach(timeout => window.clearTimeout(timeout));
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
   * Stop speaking with cleanup
   */
  public stop(): void {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      this.isSpeaking = false;
      this.chunkedUtterances = [];
      this.currentUtteranceIndex = 0;
      
      // Clear any pending timeouts
      if (this.resumeTimeout !== null) {
        window.clearTimeout(this.resumeTimeout);
        this.resumeTimeout = null;
      }
      
      // Clear highlight timeouts
      this.highlightTimeouts.forEach(timeout => window.clearTimeout(timeout));
      this.highlightTimeouts = [];
      
      // Clear watchdog
      if (this.watchdogInterval !== null) {
        window.clearInterval(this.watchdogInterval);
        this.watchdogInterval = null;
      }
      
      // Trigger speech end event if needed
      if (this.onSpeechEnd) {
        this.onSpeechEnd();
      }
    }
  }

  /**
   * Pause speaking
   */
  public pause(): void {
    if ('speechSynthesis' in window && this.isSpeaking) {
      window.speechSynthesis.pause();
    }
  }

  /**
   * Resume speaking with improved error recovery
   */
  public resume(): void {
    if ('speechSynthesis' in window && this.isSpeaking) {
      window.speechSynthesis.resume();
      
      // Setup watchdog to ensure speech continues
      this.setupWatchdog();
    }
  }

  /**
   * Clean up resources
   */
  public cleanup(): void {
    this.stop();
    this.utterance = null;
    this.chunkedUtterances = [];
    this.onSpeechStart = null;
    this.onSpeechEnd = null;
    this.onSpeechError = null;
    this.onTextHighlight = null;
    
    // Clear all timeouts
    if (this.resumeTimeout !== null) {
      window.clearTimeout(this.resumeTimeout);
      this.resumeTimeout = null;
    }
    
    this.highlightTimeouts.forEach(timeout => window.clearTimeout(timeout));
    this.highlightTimeouts = [];
    
    if (this.watchdogInterval !== null) {
      window.clearInterval(this.watchdogInterval);
      this.watchdogInterval = null;
    }
  }
}

export default SpeechService;
