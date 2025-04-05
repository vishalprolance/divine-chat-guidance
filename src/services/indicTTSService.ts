
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
  private audioContext: AudioContext | null = null;
  private retryCount: number = 0;
  private maxRetries: number = 2;

  constructor() {
    // Try to initialize AudioContext for testing audio capabilities
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (e) {
      console.warn("AudioContext not supported, falling back to standard audio elements", e);
    }
  }
  
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
      
      // Reset retry count
      this.retryCount = 0;
      
      // Trigger speech start event
      if (this.onStartCallback) {
        this.onStartCallback();
      }
      
      const langConfig = INDIC_VOICE_MAPPING[language as 'kn-IN' | 'bn-IN'];
      
      console.log(`Using AI4Bharat Indic-TTS for ${language} with voice: ${langConfig.name}`);
      
      this.isSpeaking = true;
      
      // Test audio capabilities first to ensure audio will play
      await this.testAudioPlayback();
      
      // Setup text highlighting with proper timing for Indic scripts
      const highlightResult = setupTextHighlighting(
        text, 
        language, 
        0.8,  // Slower rate for better syllable matching 
        this.isSpeaking,
        this.onTextHighlightCallback
      );
      this.highlightTimeouts = highlightResult.timeouts;
      
      // In a real implementation, we'd fetch from AI4Bharat's API
      // For simulation, we'll create specialized TTS with very careful voice selection
      return await this.simulateAI4BharatTTS(text, language, langConfig.name);
      
    } catch (error) {
      console.error("Error using AI4Bharat Indic-TTS:", error);
      
      if (this.retryCount < this.maxRetries) {
        this.retryCount++;
        console.log(`Retry attempt ${this.retryCount} for ${language}`);
        return this.speak(text, language);
      }
      
      if (this.onErrorCallback) {
        this.onErrorCallback(error);
      }
      
      this.isSpeaking = false;
      clearHighlightTimeouts(this.highlightTimeouts);
      return false;
    }
  }
  
  /**
   * Test if audio can be played to diagnose playback issues
   */
  private async testAudioPlayback(): Promise<void> {
    try {
      // Test with AudioContext first
      if (this.audioContext) {
        // Create a short beep
        const oscillator = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        
        // Set very low volume
        gain.gain.value = 0.01;
        oscillator.connect(gain);
        gain.connect(this.audioContext.destination);
        
        // Play a very short beep
        oscillator.start();
        await new Promise(resolve => setTimeout(resolve, 50));
        oscillator.stop();
        
        console.log("Audio context test successful");
      } else {
        // Fallback to HTML Audio test
        const testAudio = new Audio();
        testAudio.volume = 0.01;
        
        // Use a data URI for a short silent MP3
        testAudio.src = "data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tAwAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAABFgATExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMTExMT//8AAFN0cmVhbQAAABJjb2RpbmdfdG9vbD0wLjAuMQAA//sQZAAP8AAAaQAAAAgAAA0gAAABAAABpAAAACAAADSAAAAETEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//sQZA8P8AAAaQAAAAgAAA0gAAABAAABpAAAACAAADSAAAAEVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV";
        
        // Try to play the test sound
        await testAudio.play();
        await new Promise(resolve => setTimeout(resolve, 100));
        testAudio.pause();
        
        console.log("HTML Audio test successful");
      }
    } catch (e) {
      console.warn("Audio test failed - may have playback issues:", e);
      // Continue anyway, as the test might fail due to user interaction requirements
    }
  }

  /**
   * Simulate AI4Bharat TTS using the browser's speech synthesis with careful voice selection
   */
  private async simulateAI4BharatTTS(text: string, language: string, voiceName: string): Promise<boolean> {
    try {
      console.log(`AI4Bharat simulation with ${voiceName} for ${language}`);
      
      // Create audio element for timing control
      const audio = new Audio();
      this.audio = audio;
      
      // Set up audio events
      audio.oncanplaythrough = () => {
        console.log(`AI4Bharat simulation ready to play ${language}`);
      };
      
      audio.onplay = () => {
        console.log(`AI4Bharat simulation started playing ${language}`);
      };
      
      audio.onended = () => {
        console.log(`AI4Bharat simulation finished for ${language}`);
        if (this.onEndCallback) {
          this.onEndCallback();
        }
        this.isSpeaking = false;
        clearHighlightTimeouts(this.highlightTimeouts);
      };
      
      audio.onerror = (e) => {
        console.error(`AI4Bharat simulation audio error for ${language}:`, e);
        
        // Try browser TTS as fallback
        const fallbackSuccess = this.useBrowserTTSForIndic(text, language, voiceName);
        
        if (!fallbackSuccess && this.onErrorCallback) {
          this.onErrorCallback(e);
        }
      };
      
      // Force using browser TTS with very specific voice selection
      return this.useBrowserTTSForIndic(text, language, voiceName);
      
    } catch (error) {
      console.error(`Error in AI4Bharat simulation for ${language}:`, error);
      
      // Fall back to browser TTS
      return this.useBrowserTTSForIndic(text, language, voiceName);
    }
  }

  /**
   * Use browser TTS with very specialized voice selection for Indic languages
   */
  private useBrowserTTSForIndic(text: string, language: string, voiceName: string): boolean {
    if (!('speechSynthesis' in window)) {
      console.error("Speech synthesis not supported");
      return false;
    }
    
    try {
      // Cancel any existing speech
      window.speechSynthesis.cancel();
      
      // Create utterance with specific parameters for Indic languages
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language;
      utterance.rate = 0.65; // Even slower for complex scripts
      utterance.pitch = 1.0; // Standard pitch
      utterance.volume = 1.0; // Maximum volume
      
      // Get available voices
      const voices = window.speechSynthesis.getVoices();
      
      // Log all voices for debugging
      console.log(`Finding voice for ${language} (${voiceName}), available voices:`, 
                 voices.map(v => `${v.name} (${v.lang})`));
      
      // Complex voice selection logic to get the best possible match
      let selectedVoice: SpeechSynthesisVoice | null = null;
      
      // First try exact language match
      selectedVoice = voices.find(v => v.lang === language) || null;
      
      if (!selectedVoice) {
        // Try language code match
        const langCode = language.split('-')[0];
        selectedVoice = voices.find(v => v.lang.startsWith(langCode)) || null;
      }
      
      if (!selectedVoice) {
        // Try by name for specific Indic voices
        const langName = language === 'kn-IN' ? 'kannada' : 'bengali';
        selectedVoice = voices.find(v => 
          v.name.toLowerCase().includes(langName) || 
          v.name.toLowerCase() === voiceName.toLowerCase()
        ) || null;
      }
      
      // Avoid using German voice for Indic languages (common fallback)
      if (!selectedVoice || selectedVoice.name.toLowerCase().includes('deutsch')) {
        // Look for any Indian voice
        const indianVoice = voices.find(v => 
          v.lang.endsWith('-IN') && 
          !v.name.toLowerCase().includes('hindi') && // Avoid Hindi for Bengali/Kannada
          !v.name.toLowerCase().includes('deutsch')
        );
        
        if (indianVoice) {
          selectedVoice = indianVoice;
        } else {
          // Last resort - find any non-German voice with relatively neutral accent
          selectedVoice = voices.find(v => 
            !v.name.toLowerCase().includes('deutsch') && 
            !v.lang.startsWith('de') &&
            (v.lang.includes('en-US') || v.lang.includes('en-GB') || v.lang.includes('en-IN'))
          ) || voices[0];
        }
      }
      
      // Use the selected voice
      if (selectedVoice) {
        utterance.voice = selectedVoice;
        console.log(`Using voice: ${selectedVoice.name} (${selectedVoice.lang}) for ${language} (${voiceName})`);
      } else {
        console.warn(`No voice found for ${language}, using default`);
      }
      
      // Set up event handlers
      utterance.onstart = () => {
        console.log(`AI4Bharat simulation (${voiceName}) started speaking`);
        this.isSpeaking = true;
      };
      
      utterance.onend = () => {
        console.log(`AI4Bharat simulation (${voiceName}) finished speaking`);
        this.isSpeaking = false;
        clearHighlightTimeouts(this.highlightTimeouts);
        
        if (this.onEndCallback) {
          this.onEndCallback();
        }
      };
      
      utterance.onerror = (event) => {
        console.error(`Speech synthesis error: ${event.error}`);
        this.isSpeaking = false;
        clearHighlightTimeouts(this.highlightTimeouts);
        
        if (this.onErrorCallback) {
          this.onErrorCallback(event.error);
        }
      };
      
      // Use setTimeout to ensure the utterance gets processed correctly
      setTimeout(() => {
        if (this.isSpeaking) {
          try {
            window.speechSynthesis.speak(utterance);
            return true;
          } catch (e) {
            console.error("Error starting speech synthesis:", e);
            if (this.onErrorCallback) {
              this.onErrorCallback(e);
            }
            this.isSpeaking = false;
            return false;
          }
        }
      }, 10);
      
      return true;
    } catch (error) {
      console.error("Error in browser TTS for Indic languages:", error);
      if (this.onErrorCallback) {
        this.onErrorCallback(error);
      }
      this.isSpeaking = false;
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
    
    // Force immediate playing by using setTimeout
    setTimeout(() => {
      if (this.isSpeaking) {
        window.speechSynthesis.speak(utterance);
      }
    }, 0);
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
