
/**
 * Utility functions for voice selection and language handling
 */

// Voice mapping for different languages
export const INDIC_VOICE_MAPPING = {
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

/**
 * Find the best voice for the given language with enhanced matching for Indic languages
 */
export const findBestVoice = (language: string): SpeechSynthesisVoice | null => {
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
      // For Kannada
      preferredVoice = voices.find(voice => 
        voice.name.toLowerCase().includes("kannada") ||
        voice.lang.includes("kn") ||
        voice.name.toLowerCase().includes("हिन्दी") ||
        voice.name.toLowerCase().includes("hindi") ||
        voice.lang.includes("hi-IN") ||
        voice.name.toLowerCase().includes("indian")
      );
    } else if (language === "bn-IN") {
      // For Bengali
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
    preferredVoice = voices.find(voice => 
      voice.lang.includes("en-US") || 
      voice.lang.includes("en-IN") || 
      voice.lang.includes("en-GB")
    ) || voices[0];
  }
  
  if (preferredVoice) {
    console.log(`Selected voice: ${preferredVoice.name} (${preferredVoice.lang}) for language: ${language}`);
  } else {
    console.log(`No voice found for language: ${language}`);
  }
  
  return preferredVoice || null;
};

/**
 * Get appropriate speech rate for the given language
 */
export const getSpeechRate = (language: string): number => {
  if (language === 'en-US') {
    return 0.9;
  } else if (language === 'hi-IN') {
    return 0.85;  // Slightly slower for Hindi
  } else if (language === 'kn-IN') {
    return 0.8;   // Slower for Kannada
  } else if (language === 'sa-IN') {
    return 0.75;  // Slowest for Sanskrit
  } else if (language === 'mr-IN') {
    return 0.85;  // Similar to Hindi for Marathi
  } else if (language === 'bn-IN') {
    return 0.8;   // Slower for Bengali
  }
  return 0.9;     // Default
};

/**
 * Calculate appropriate words per minute for the given language
 */
export const getWordsPerMinute = (language: string): number => {
  if (['kn-IN', 'bn-IN', 'sa-IN'].includes(language)) {
    return 70; // Much slower for complex scripts
  } else if (['hi-IN', 'mr-IN'].includes(language)) {
    return 90; // Slower for Devanagari
  }
  return 120; // Default for Latin script
};
