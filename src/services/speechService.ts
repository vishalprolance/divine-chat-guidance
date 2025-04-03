
/**
 * Service to handle text-to-speech functionality across different languages
 */
class SpeechService {
  private utterance: SpeechSynthesisUtterance | null = null;
  private chunkedUtterances: SpeechSynthesisUtterance[] = [];
  private currentUtteranceIndex = 0;
  private isSpeaking = false;
  private pausedWordIndex = 0;
  private resumeTimeout: number | null = null;
  
  // Event callbacks
  public onSpeechStart: (() => void) | null = null;
  public onSpeechEnd: (() => void) | null = null;
  public onSpeechError: ((error: any) => void) | null = null;

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
   * Splits long text into smaller chunks to prevent speech synthesis from stopping
   * This helps with all languages where speech tends to break
   */
  private splitTextIntoChunks(text: string, language: string): string[] {
    // Use smaller chunks for languages that are more likely to have issues
    let chunkSize = 100;
    
    // Different chunk sizes for different languages based on their complexity
    if (language === 'en-US') {
      chunkSize = 200;
    } else if (['hi-IN', 'mr-IN'].includes(language)) {
      chunkSize = 120;
    } else if (['kn-IN', 'sa-IN', 'bn-IN'].includes(language)) {
      chunkSize = 80; // Smaller chunks for Kannada, Sanskrit and Bengali
    }
    
    const chunks: string[] = [];
    
    // Try to split on sentence boundaries to make speech more natural
    // Include language-specific sentence endings
    const sentenceRegex = /[^.!?।॥\n]+[.!?।॥\n]+|\s+/g;
    const sentences = text.match(sentenceRegex) || [text];
    
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
    
    // Log the number of chunks created
    console.log(`Split text into ${chunks.length} chunks for language ${language}`);
    
    return chunks;
  }

  /**
   * Find the best voice for the given language with improved fallback
   */
  private findVoice(language: string): SpeechSynthesisVoice | null {
    if (!('speechSynthesis' in window)) return null;
    
    const voices = window.speechSynthesis.getVoices();
    console.log(`Finding voice for language: ${language}`);
    
    // Primary match - exact language code
    let preferredVoice = voices.find(voice => voice.lang === language);
    
    // Secondary match - language portion only
    if (!preferredVoice) {
      const langCode = language.split('-')[0];
      preferredVoice = voices.find(voice => voice.lang.startsWith(langCode + '-'));
    }
    
    // Language-specific fallbacks with enhanced matching
    if (!preferredVoice) {
      if (language === "hi-IN") {
        preferredVoice = voices.find(voice => 
          voice.lang.includes("hi") || 
          voice.name.toLowerCase().includes("hindi") || 
          voice.name.toLowerCase().includes("indian")
        );
      } else if (language === "kn-IN") {
        // For Kannada, try any Indian voice as they may handle Indic scripts better
        preferredVoice = voices.find(voice => 
          voice.lang.includes("kn") || 
          voice.name.toLowerCase().includes("kannada") || 
          voice.lang.includes("IN") ||
          voice.name.toLowerCase().includes("indian")
        );
      } else if (language === "sa-IN") {
        // For Sanskrit, first try Hindi as they share many phonological features
        preferredVoice = voices.find(voice => 
          voice.lang.includes("sa") || 
          voice.name.toLowerCase().includes("sanskrit") || 
          voice.lang.includes("hi-IN") || 
          voice.name.toLowerCase().includes("hindi") || 
          voice.lang.includes("IN") ||
          voice.name.toLowerCase().includes("indian")
        );
      } else if (language === "mr-IN") {
        // For Marathi, try Hindi or any Indian voice
        preferredVoice = voices.find(voice => 
          voice.lang.includes("mr") || 
          voice.name.toLowerCase().includes("marathi") || 
          voice.lang.includes("hi-IN") || 
          voice.name.toLowerCase().includes("hindi") || 
          voice.lang.includes("IN") ||
          voice.name.toLowerCase().includes("indian")
        );
      } else if (language === "bn-IN") {
        // For Bengali, try any Indian voice
        preferredVoice = voices.find(voice => 
          voice.lang.includes("bn") || 
          voice.name.toLowerCase().includes("bengali") || 
          voice.name.toLowerCase().includes("bangla") || 
          voice.lang.includes("IN") ||
          voice.name.toLowerCase().includes("indian")
        );
      }
    }
    
    // If still no voice found, try any Google voice as they tend to have better support
    if (!preferredVoice) {
      preferredVoice = voices.find(voice => 
        voice.name.includes("Google")
      );
    }
    
    // Last resort - just use any available voice
    if (!preferredVoice && voices.length > 0) {
      preferredVoice = voices[0];
    }
    
    if (preferredVoice) {
      console.log(`Selected voice: ${preferredVoice.name} (${preferredVoice.lang}) for language: ${language}`);
    } else {
      console.log(`No voice found for language: ${language}`);
    }
    
    return preferredVoice || null;
  }

  /**
   * Speak text in specified language with improved chunking and error handling
   */
  public speak(text: string, language: string): void {
    if (!('speechSynthesis' in window)) {
      console.error("Speech synthesis not supported");
      return;
    }
    
    // Stop any ongoing speech
    this.stop();
    
    // Split text into smaller chunks for better reliability
    // Use language-specific chunking
    const textChunks = this.splitTextIntoChunks(text, language);
    this.chunkedUtterances = [];
    this.currentUtteranceIndex = 0;
    
    // Find the best voice for this language
    const voice = this.findVoice(language);
    
    // Create utterances for each chunk
    for (const chunk of textChunks) {
      const utterance = new SpeechSynthesisUtterance(chunk);
      utterance.lang = language;
      
      // Adjust speech parameters for better clarity
      // Different parameters for different languages
      if (language === 'en-US') {
        utterance.rate = 0.9;
        utterance.pitch = 1.0;
      } else if (language === 'hi-IN') {
        utterance.rate = 0.85;  // Slightly slower for Hindi
        utterance.pitch = 1.0;
      } else if (language === 'kn-IN') {
        utterance.rate = 0.8;   // Even slower for Kannada
        utterance.pitch = 1.0;
      } else if (language === 'sa-IN') {
        utterance.rate = 0.75;  // Slowest for Sanskrit
        utterance.pitch = 1.0;
      } else if (language === 'mr-IN') {
        utterance.rate = 0.85;  // Similar to Hindi for Marathi
        utterance.pitch = 1.0;
      } else if (language === 'bn-IN') {
        utterance.rate = 0.85;  // For Bengali
        utterance.pitch = 1.0;
      } else {
        utterance.rate = 0.9;   // Default
        utterance.pitch = 1.0;
      }
      
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
      
      // Trigger speech start event
      if (this.onSpeechStart) {
        this.onSpeechStart();
      }
      
      // Start speaking the first chunk
      window.speechSynthesis.speak(this.chunkedUtterances[0]);
      
      // Set a watchdog timer to ensure speech continues
      this.setupWatchdog();
    }
  }

  /**
   * Setup watchdog to restart if speech synthesis stops unexpectedly
   */
  private setupWatchdog(): void {
    // Check every 5 seconds if speech synthesis is paused unexpectedly
    const watchdogInterval = setInterval(() => {
      if (this.isSpeaking && window.speechSynthesis.paused) {
        console.log("Detected unexpected speech pause, resuming...");
        window.speechSynthesis.resume();
      }
      
      if (!this.isSpeaking) {
        clearInterval(watchdogInterval);
      }
    }, 5000);
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
          window.speechSynthesis.speak(nextUtterance);
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
            window.speechSynthesis.speak(nextUtterance);
          }
        }, 300);
      } else {
        // All chunks finished
        this.isSpeaking = false;
        
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
    
    if (this.resumeTimeout !== null) {
      window.clearTimeout(this.resumeTimeout);
      this.resumeTimeout = null;
    }
  }
}

export default SpeechService;
