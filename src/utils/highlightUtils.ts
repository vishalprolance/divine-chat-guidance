
/**
 * Utility functions for text highlighting with speech
 */

/**
 * Set up text highlighting with proper timing for speech
 */
export const setupTextHighlighting = (
  text: string, 
  language: string, 
  rate: number,
  isSpeaking: boolean,
  onTextHighlight: ((text: string, index: number) => void) | null
): { 
  timeouts: number[],
  textToHighlight: string 
} => {
  // Guard clause if no callback is provided
  if (!onTextHighlight) return { timeouts: [], textToHighlight: text };
  
  const highlightTimeouts: number[] = [];
  
  // Split text into words
  const words = text.split(/\s+/);
  
  // Calculate timing based on language complexity
  const wordsPerMinute = getWordsPerMinute(language);
  const msPerWord = 60000 / wordsPerMinute / (rate || 0.9);
  
  // Set up timeouts for each word
  let currentTime = 300; // Start after a small delay
  
  words.forEach((word, index) => {
    // Calculate delay based on word length and language complexity
    let wordDelay = msPerWord;
    
    // Adjust timing for different scripts
    if (['kn-IN', 'bn-IN'].includes(language)) {
      // Longer words in complex scripts need more time
      wordDelay = msPerWord * (1 + 0.8 * (word.length / 4));
    } else {
      wordDelay = msPerWord * (0.7 + 0.6 * (word.length / 5));
    }
    
    const timeout = window.setTimeout(() => {
      if (isSpeaking) {
        onTextHighlight(text, index);
      }
    }, currentTime);
    
    highlightTimeouts.push(timeout);
    currentTime += wordDelay;
  });
  
  return {
    timeouts: highlightTimeouts,
    textToHighlight: text
  };
};

/**
 * Clear all highlight timeouts
 */
export const clearHighlightTimeouts = (timeouts: number[]): void => {
  timeouts.forEach(timeout => window.clearTimeout(timeout));
};

/**
 * Calculate appropriate words per minute for the given language
 */
const getWordsPerMinute = (language: string): number => {
  if (['kn-IN', 'bn-IN', 'sa-IN'].includes(language)) {
    return 70; // Much slower for complex scripts
  } else if (['hi-IN', 'mr-IN'].includes(language)) {
    return 90; // Slower for Devanagari
  }
  return 120; // Default for Latin script
};
