
/**
 * Service to handle text-to-speech functionality across different languages
 */
class SpeechService {
  private utterance: SpeechSynthesisUtterance | null = null;
  private chunkedUtterances: SpeechSynthesisUtterance[] = [];
  private currentUtteranceIndex = 0;
  private isSpeaking = false;
  
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
        console.log("Loaded voices:", voices.length);
      };
      
      // Try to trigger voice loading
      window.speechSynthesis.getVoices();
    }
  }

  /**
   * Splits long text into smaller chunks to prevent speech synthesis from stopping
   * This helps with Hindi and other languages where speech tends to break
   */
  private splitTextIntoChunks(text: string, chunkSize: number = 200): string[] {
    const chunks: string[] = [];
    
    // Try to split on sentence boundaries (. ! ? । ॥) to make speech more natural
    const sentences = text.match(/[^.!?।॥]+[.!?।॥]+|\s+/g) || [text];
    
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
    
    return chunks;
  }

  /**
   * Find the best voice for the given language
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
    
    // Language-specific fallbacks
    if (!preferredVoice) {
      // Special handling for each supported language
      if (language === "hi-IN") {
        preferredVoice = voices.find(voice => 
          voice.lang.includes("hi") || 
          voice.name.toLowerCase().includes("hindi") || 
          voice.name.toLowerCase().includes("indian")
        );
      } else if (language === "kn-IN") {
        preferredVoice = voices.find(voice => 
          voice.lang.includes("kn") || 
          voice.name.toLowerCase().includes("kannada") || 
          voice.name.toLowerCase().includes("indian")
        );
      } else if (language === "sa-IN") {
        preferredVoice = voices.find(voice => 
          voice.lang.includes("sa") || 
          voice.name.toLowerCase().includes("sanskrit") || 
          // For Sanskrit, try Hindi as fallback since they have similar phonology
          voice.lang.includes("hi") || 
          voice.name.toLowerCase().includes("hindi") || 
          voice.name.toLowerCase().includes("indian")
        );
      } else if (language === "mr-IN") {
        preferredVoice = voices.find(voice => 
          voice.lang.includes("mr") || 
          voice.name.toLowerCase().includes("marathi") || 
          // For Marathi, try Hindi as fallback
          voice.lang.includes("hi") || 
          voice.name.toLowerCase().includes("hindi") || 
          voice.name.toLowerCase().includes("indian")
        );
      } else if (language === "bn-IN") {
        preferredVoice = voices.find(voice => 
          voice.lang.includes("bn") || 
          voice.name.toLowerCase().includes("bengali") || 
          voice.name.toLowerCase().includes("bangla") || 
          voice.name.toLowerCase().includes("indian")
        );
      }
    }
    
    // Final fallback - any Indian voice or Google voice
    if (!preferredVoice) {
      preferredVoice = voices.find(voice => 
        voice.lang.includes("IN") || 
        voice.name.includes("India") ||
        voice.name.includes("Google")
      );
    }
    
    // Last resort - just use any voice
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
   * Speak text in specified language
   */
  public speak(text: string, language: string): void {
    if (!('speechSynthesis' in window)) {
      console.error("Speech synthesis not supported");
      return;
    }
    
    // Stop any ongoing speech
    this.stop();
    
    // Split text into smaller chunks for better reliability
    const textChunks = this.splitTextIntoChunks(text);
    this.chunkedUtterances = [];
    this.currentUtteranceIndex = 0;
    
    // Find the best voice for this language
    const voice = this.findVoice(language);
    
    // Create utterances for each chunk
    for (const chunk of textChunks) {
      const utterance = new SpeechSynthesisUtterance(chunk);
      utterance.lang = language;
      
      // Adjust speech parameters for better clarity
      utterance.rate = 0.9;  // Slightly slower for clarity
      utterance.pitch = 1;
      
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
    }
  }

  /**
   * Setup event handlers for an utterance
   */
  private setupUtteranceEvents(utterance: SpeechSynthesisUtterance): void {
    // When a chunk finishes, start the next one
    utterance.onend = () => {
      this.currentUtteranceIndex++;
      
      // If there are more chunks, speak the next one
      if (this.currentUtteranceIndex < this.chunkedUtterances.length) {
        const nextUtterance = this.chunkedUtterances[this.currentUtteranceIndex];
        this.setupUtteranceEvents(nextUtterance);
        window.speechSynthesis.speak(nextUtterance);
      } else {
        // All chunks finished
        this.isSpeaking = false;
        
        // Trigger speech end event
        if (this.onSpeechEnd) {
          this.onSpeechEnd();
        }
      }
    };
    
    // Handle errors
    utterance.onerror = (event) => {
      console.error("Speech synthesis error:", event);
      this.isSpeaking = false;
      
      // Trigger error event
      if (this.onSpeechError) {
        this.onSpeechError(event);
      }
    };
  }

  /**
   * Stop speaking
   */
  public stop(): void {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      this.isSpeaking = false;
      
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
   * Resume speaking
   */
  public resume(): void {
    if ('speechSynthesis' in window && this.isSpeaking) {
      window.speechSynthesis.resume();
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
  }
}

export default SpeechService;
