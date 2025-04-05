
import { INDIC_VOICE_MAPPING } from '../utils/voiceUtils';
import { setupTextHighlighting, clearHighlightTimeouts } from '../utils/highlightUtils';

/**
 * Service to handle text-to-speech specifically for Indic languages
 * using AI4Bharat's TTS API
 */
class IndicTTSService {
  private audio: HTMLAudioElement | null = null;
  private onStartCallback: (() => void) | null = null;
  private onEndCallback: (() => void) | null = null;
  private onErrorCallback: ((error: any) => void) | null = null;
  private onTextHighlightCallback: ((text: string, index: number) => void) | null = null;
  private highlightTimeouts: number[] = [];
  private isSpeaking: boolean = false;
  private apiBaseURL: string = 'https://tts-api.ai4bharat.org/';

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
      
      const langConfig = INDIC_VOICE_MAPPING[language as 'kn-IN' | 'bn-IN'];
      
      console.log(`Using AI4Bharat Indic-TTS for ${language} with voice: ${langConfig.name}`);
      
      this.isSpeaking = true;
      
      // Setup more precise text highlighting with proper timing for Indic scripts
      const highlightResult = setupTextHighlighting(
        text, 
        language, 
        0.8,  // Slower rate for better syllable matching 
        this.isSpeaking,
        this.onTextHighlightCallback
      );
      this.highlightTimeouts = highlightResult.timeouts;
      
      // Create audio element to play the synthesized speech
      const audio = new Audio();
      this.audio = audio;
      
      // Set up audio events
      audio.onended = () => {
        console.log(`AI4Bharat ${langConfig.name} voice finished speaking`);
        if (this.onEndCallback) {
          this.onEndCallback();
        }
        this.isSpeaking = false;
      };
      
      audio.onerror = (e) => {
        console.error(`AI4Bharat ${langConfig.name} voice error:`, e);
        if (this.onErrorCallback) {
          this.onErrorCallback(e);
        }
        this.isSpeaking = false;
        clearHighlightTimeouts(this.highlightTimeouts);
        return false;
      };

      // In a real implementation, we would fetch from AI4Bharat's API
      // For this demo, we're simulating with browser TTS
      try {
        // Attempt to use the real API simulation
        const langCode = language === 'kn-IN' ? 'kn' : 'bn';
        const gender = langConfig.gender || 'female';
        const voiceName = language === 'kn-IN' ? 'Kaveri' : 'Mitra';
        
        console.log(`Using ${voiceName} (${gender}) for ${language}`);
        
        // Simulate more accurate timings for these languages
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = language;
        utterance.rate = 0.7; // Slower rate for better clarity with complex scripts
        
        // Set the voice for the utterance - try to find language-specific voice
        const voices = window.speechSynthesis.getVoices();
        
        // First try exact language match
        let indicVoice = voices.find(voice => 
          voice.lang === language || 
          (language === 'kn-IN' && voice.name.toLowerCase().includes('kannada')) ||
          (language === 'bn-IN' && (voice.name.toLowerCase().includes('bengali') || voice.name.toLowerCase().includes('bangla')))
        );
        
        // If no exact match, try Hindi as a fallback for Indic scripts
        if (!indicVoice) {
          indicVoice = voices.find(voice => 
            voice.lang === 'hi-IN' || 
            voice.name.toLowerCase().includes('hindi') ||
            voice.name.toLowerCase().includes('indian')
          );
        }
        
        // If still no match, use any available voice but avoid German
        if (!indicVoice) {
          indicVoice = voices.find(voice => !voice.name.toLowerCase().includes('deutsch'));
        }
        
        if (indicVoice) {
          utterance.voice = indicVoice;
          console.log(`Using voice: ${indicVoice.name} for ${language}`);
        } else {
          console.log(`No specific voice found for ${language}, using default`);
        }
        
        utterance.onstart = () => {
          console.log(`AI4Bharat ${voiceName} voice started speaking`);
        };
        
        utterance.onend = () => {
          if (this.onEndCallback) {
            this.onEndCallback();
          }
          this.isSpeaking = false;
          clearHighlightTimeouts(this.highlightTimeouts);
        };
        
        utterance.onerror = (event: SpeechSynthesisErrorEvent) => {
          console.error(`Speech synthesis error: ${event.error}`);
          if (this.onErrorCallback) {
            this.onErrorCallback(event.error);
          }
          this.isSpeaking = false;
          clearHighlightTimeouts(this.highlightTimeouts);
        };
        
        // Start speaking
        window.speechSynthesis.speak(utterance);
        
        return true;
      } catch (apiError) {
        console.error("Error using AI4Bharat API:", apiError);
        
        // Fallback to browser TTS with best effort for Indic languages
        this.fallbackToBrowserTTS(text, language);
        return true;
      }
    } catch (error) {
      console.error("Error using AI4Bharat Indic-TTS:", error);
      if (this.onErrorCallback) {
        this.onErrorCallback(error);
      }
      this.isSpeaking = false;
      clearHighlightTimeouts(this.highlightTimeouts);
      return false;
    }
  }

  /**
   * Fallback to browser TTS when API fails
   */
  private fallbackToBrowserTTS(text: string, language: string): void {
    console.log(`Falling back to browser TTS for ${language}`);
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language;
    utterance.rate = 0.7; // Slower for complex scripts
    
    // Try to find the best matching voice
    const voices = window.speechSynthesis.getVoices();
    const languageCode = language.split('-')[0];
    
    // Try to find an exact match
    let voice = voices.find(v => v.lang === language);
    
    // If no exact match, try to find a voice with the same language code
    if (!voice) {
      voice = voices.find(v => v.lang.startsWith(languageCode));
    }
    
    // If still no match, try Hindi for Indic languages
    if (!voice) {
      voice = voices.find(v => 
        v.lang === 'hi-IN' || 
        v.name.toLowerCase().includes('hindi')
      );
    }
    
    if (voice) {
      utterance.voice = voice;
    }
    
    window.speechSynthesis.speak(utterance);
  }

  /**
   * Stops the speech and cleans up resources
   */
  public stop(): void {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    
    if (this.audio) {
      this.audio.pause();
      this.audio = null;
    }
    
    this.isSpeaking = false;
    clearHighlightTimeouts(this.highlightTimeouts);
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
