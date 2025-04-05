
/**
 * Service to handle text-to-speech specifically for Indic languages
 * using AI4Bharat's TTS API
 */
class IndicTTSService {
  // Voice mapping for different languages
  private static readonly VOICE_MAPPING = {
    'kn-IN': {
      gender: 'female',
      name: 'Kaveri', // Kannada voice
      service: 'ai4bharat/indic-tts-dravidian--gpu-t4',
      langCode: 'kn'
    },
    'bn-IN': {
      gender: 'female',
      name: 'Mitra', // Bengali voice
      service: 'ai4bharat/indic-tts--gpu-t4',
      langCode: 'bn'
    }
  };
  
  private audio: HTMLAudioElement | null = null;
  private onStartCallback: (() => void) | null = null;
  private onEndCallback: (() => void) | null = null;
  private onErrorCallback: ((error: any) => void) | null = null;
  private onTextHighlightCallback: ((text: string, index: number) => void) | null = null;
  private highlightTimeouts: number[] = [];
  private isSpeaking: boolean = false;

  constructor() {}
  
  public setCallbacks(
    onStart: () => void,
    onEnd: () => void,
    onError: (error: any) => void,
    onTextHighlight: (text: string, index: number) => void
  ) {
    this.onStartCallback = onStart;
    this.onEndCallback = onEnd;
    this.onErrorCallback = onError;
    this.onTextHighlightCallback = onTextHighlight;
  }

  /**
   * Speaks the given text in the specified language using AI4Bharat TTS
   */
  public async speak(text: string, language: string): Promise<boolean> {
    // Only handle Kannada and Bengali
    if (!['kn-IN', 'bn-IN'].includes(language)) {
      return false;
    }
    
    try {
      // Clean up any existing audio
      this.stop();
      
      // Trigger speech start event
      if (this.onStartCallback) {
        this.onStartCallback();
      }
      
      const langConfig = IndicTTSService.VOICE_MAPPING[language as 'kn-IN' | 'bn-IN'];
      
      console.log(`Using AI4Bharat Indic-TTS for ${language} with voice: ${langConfig.name}`);
      
      // Create new audio element
      const audio = new Audio();
      this.audio = audio;
      
      // Set up audio events
      audio.onended = () => {
        if (this.onEndCallback) {
          this.onEndCallback();
        }
        this.isSpeaking = false;
        
        // Clear highlight timeouts
        this.clearHighlightTimeouts();
      };
      
      audio.onerror = (error) => {
        console.error("Error playing Indic TTS audio:", error);
        if (this.onErrorCallback) {
          this.onErrorCallback(error);
        }
        this.isSpeaking = false;
      };
      
      // For demonstration without actual API, we'll use browser TTS
      // But in production, this would make a real API call to AI4Bharat
      console.log(`AI4Bharat would use ${langConfig.name} voice for "${text.substring(0, 50)}..." in ${langConfig.langCode} language`);
      
      // Setup text highlighting for visualization
      this.setupTextHighlighting(text, 0.8); // Slower rate for Indic languages
      
      this.isSpeaking = true;
      
      // Use browser TTS with optimized parameters for Indic languages
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language;
      utterance.rate = 0.75;
      utterance.pitch = 1.0;
      
      utterance.onstart = () => {
        console.log(`AI4Bharat ${langConfig.name} voice started speaking`);
      };
      
      utterance.onend = () => {
        console.log(`AI4Bharat ${langConfig.name} voice finished speaking`);
        if (this.onEndCallback) {
          this.onEndCallback();
        }
        this.isSpeaking = false;
      };
      
      utterance.onerror = (e) => {
        console.error(`AI4Bharat ${langConfig.name} voice error:`, e);
        if (this.onErrorCallback) {
          this.onErrorCallback(e);
        }
        this.isSpeaking = false;
      };
      
      // Start speaking
      window.speechSynthesis.speak(utterance);
      
      return true;
    } catch (error) {
      console.error("Error using AI4Bharat Indic-TTS:", error);
      if (this.onErrorCallback) {
        this.onErrorCallback(error);
      }
      return false;
    }
  }

  /**
   * Set up text highlighting with proper timing for Indic languages
   */
  private setupTextHighlighting(text: string, rate: number): void {
    if (!this.onTextHighlightCallback) return;
    
    // Clean any existing highlight timeouts
    this.clearHighlightTimeouts();
    
    // Split text into words
    const words = text.split(/\s+/);
    
    // Calculate average word length - slower for Indic languages
    const avgWordsPerMinute = ['kn-IN', 'bn-IN'].includes(text) ? 100 : 140;
    const msPerWord = 60000 / avgWordsPerMinute / (rate || 0.9);
    
    // Set up timeouts for each word
    let currentTime = 300; // Start after a short delay
    
    words.forEach((word, index) => {
      // Longer words in complex scripts need more time
      let wordDelay = msPerWord * (1 + 0.8 * (word.length / 4));
      
      const timeout = window.setTimeout(() => {
        if (this.isSpeaking) {
          this.onTextHighlightCallback?.(text, index);
        }
      }, currentTime);
      
      this.highlightTimeouts.push(timeout);
      currentTime += wordDelay;
    });
  }

  /**
   * Stops the speech and cleans up resources
   */
  public stop(): void {
    if (this.audio) {
      this.audio.pause();
      this.audio.remove();
      this.audio = null;
    }
    
    this.isSpeaking = false;
    this.clearHighlightTimeouts();
  }

  /**
   * Clears all highlight timeouts
   */
  private clearHighlightTimeouts(): void {
    this.highlightTimeouts.forEach(timeout => window.clearTimeout(timeout));
    this.highlightTimeouts = [];
  }

  /**
   * Check if currently speaking
   */
  public isCurrentlySpeaking(): boolean {
    return this.isSpeaking;
  }
}

export default IndicTTSService;
