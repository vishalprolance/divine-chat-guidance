
import IndicTTSService from './indicTTSService';

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
   */
  public async speak(text: string, language: string): Promise<void> {
    if (!text.trim()) return;
    
    console.log(`Speaking text in ${language}:`, text.substring(0, 50) + (text.length > 50 ? '...' : ''));
    
    // Stop any existing speech
    this.stop();
    
    // For Kannada and Bengali, ALWAYS use AI4Bharat service
    if (['kn-IN', 'bn-IN'].includes(language)) {
      console.log(`Using AI4Bharat for ${language}`);
      const indicSuccess = await this.indicService.speak(text, language);
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
    
    // Create a new utterance
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language;
    this.utterance = utterance;
    
    // Adjust speech parameters based on language
    let rate = 1.0;
    if (['hi-IN', 'mr-IN'].includes(language)) {
      rate = 0.85;
    } else if (['sa-IN'].includes(language)) {
      rate = 0.8;
    } else if (['kn-IN', 'bn-IN'].includes(language)) {
      // Even slower for complex scripts
      rate = 0.75;
    } else {
      rate = 0.9;
    }
    utterance.rate = rate;
    utterance.pitch = 1.0;
    
    // Find the best voice
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(voice => voice.lang === language) || 
                          voices.find(voice => voice.lang.startsWith(language.split('-')[0])) ||
                          voices.find(voice => voice.lang.includes('en')) ||
                          voices[0];
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
      console.log(`Using voice: ${preferredVoice.name} (${preferredVoice.lang}) for language: ${language}`);
    }
    
    // Setup event handlers
    utterance.onstart = () => {
      this.isSpeaking = true;
      this.setupTextHighlighting(text, rate, language);
      if (this.onSpeechStart) this.onSpeechStart();
    };
    
    utterance.onend = () => {
      this.isSpeaking = false;
      this.clearHighlightTimeouts();
      if (this.onSpeechEnd) this.onSpeechEnd();
    };
    
    utterance.onerror = (event) => {
      this.isSpeaking = false;
      console.error("Speech synthesis error:", event);
      this.clearHighlightTimeouts();
      if (this.onSpeechError) this.onSpeechError(event);
    };
    
    // Start speaking
    try {
      window.speechSynthesis.speak(utterance);
    } catch (error) {
      console.error("Error starting speech synthesis:", error);
      this.isSpeaking = false;
      if (this.onSpeechError) this.onSpeechError(error);
    }
  }

  /**
   * Set up text highlighting with proper timing adjusted for each language
   */
  private setupTextHighlighting(text: string, rate: number, language: string): void {
    if (!this.onTextHighlight) return;
    
    this.textToHighlight = text;
    this.currentHighlightIndex = 0;
    
    // Clear any existing highlight timeouts
    this.clearHighlightTimeouts();
    
    // Split text into words
    const words = text.split(/\s+/);
    
    // Calculate time per word based on language complexity
    let avgWordsPerMinute;
    if (language === 'kn-IN') {
      avgWordsPerMinute = 80; // Slowest for Kannada
    } else if (language === 'bn-IN') {
      avgWordsPerMinute = 90; // Slow for Bengali
    } else if (['hi-IN', 'mr-IN', 'sa-IN'].includes(language)) {
      avgWordsPerMinute = 110; // Medium for other Indic languages
    } else {
      avgWordsPerMinute = 140; // Default for Latin script
    }
    
    const msPerWord = 60000 / avgWordsPerMinute / (rate || 0.9);
    
    // Set up timeouts for each word
    let currentTime = 300; // Start after a short delay
    
    words.forEach((word, index) => {
      // Calculate delay based on word length and language
      let wordDelay;
      
      if (['kn-IN', 'bn-IN'].includes(language)) {
        // Kannada and Bengali words need more time per character
        wordDelay = msPerWord * (1 + 0.8 * (word.length / 4));
      } else if (['hi-IN', 'mr-IN', 'sa-IN'].includes(language)) {
        // Hindi, Marathi and Sanskrit
        wordDelay = msPerWord * (1 + 0.6 * (word.length / 5));
      } else {
        // Latin script
        wordDelay = msPerWord * (0.8 + 0.5 * (word.length / 6));
      }
      
      const timeout = window.setTimeout(() => {
        if (this.isSpeaking) {
          this.currentHighlightIndex = index;
          this.onTextHighlight?.(this.textToHighlight, index);
        }
      }, currentTime);
      
      this.highlightTimeouts.push(timeout);
      currentTime += wordDelay;
    });
  }

  /**
   * Clears all highlight timeouts
   */
  private clearHighlightTimeouts(): void {
    this.highlightTimeouts.forEach(timeout => window.clearTimeout(timeout));
    this.highlightTimeouts = [];
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
    this.clearHighlightTimeouts();
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
    this.clearHighlightTimeouts();
  }
}

export default SimplifiedSpeechService;
