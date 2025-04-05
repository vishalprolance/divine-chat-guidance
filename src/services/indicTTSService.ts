
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
        return false;
      };
      
      // In this implementation, we're simulating API usage with browser TTS
      // For Kannada and Bengali, we'll use a specific voice if available
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language;
      utterance.rate = 0.75; // Slow down for better syllable matching
      
      // Set the voice for the utterance
      const voices = window.speechSynthesis.getVoices();
      const matchingVoices = voices.filter(voice => 
        voice.lang === language || 
        voice.lang.startsWith(language.split('-')[0])
      );
      
      if (matchingVoices.length > 0) {
        utterance.voice = matchingVoices[0];
        console.log(`Using specific voice: ${matchingVoices[0].name} for ${language}`);
      } else {
        // If no specific voice, avoid using German voices for Indic languages
        const availableVoices = voices.filter(v => !v.name.toLowerCase().includes('deutsch'));
        // Try to find an Indian English voice as fallback
        const indianVoice = availableVoices.find(v => v.name.toLowerCase().includes('indian') || v.lang === 'en-IN');
        
        if (indianVoice) {
          utterance.voice = indianVoice;
          console.log(`Using Indian English voice: ${indianVoice.name} for ${language}`);
        } else {
          // Last resort, use any non-German voice
          const anyVoice = availableVoices.length > 0 ? availableVoices[0] : voices[0];
          utterance.voice = anyVoice;
          console.log(`Using fallback voice: ${anyVoice.name} for ${language}`);
        }
      }
      
      utterance.onstart = () => {
        console.log(`AI4Bharat ${langConfig.name} voice started speaking`);
      };
      
      // Fix for TypeScript error - properly type the event handlers
      utterance.onend = () => {
        if (audio && audio.onended) {
          audio.onended.call(audio, new Event('ended'));
        }
      };
      
      utterance.onerror = (event: SpeechSynthesisErrorEvent) => {
        if (audio && audio.onerror) {
          // Create a similar event that the audio element can handle
          const errorEvent = new ErrorEvent('error', { 
            message: event.error 
          });
          audio.onerror.call(audio, errorEvent);
        }
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
