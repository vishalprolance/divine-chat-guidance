
/**
 * Utility functions for text processing and chunking
 */

/**
 * Cleans text for speech synthesis by handling punctuation
 * to improve speech quality and avoid reading symbols
 */
export const cleanTextForSpeech = (text: string): string => {
  // Replace special characters with appropriate pauses or ignore them
  return text
    // Replace asterisks and their content with just the content
    .replace(/\*([^*]+)\*/g, '$1')
    // Replace dashes with slight pause
    .replace(/--+/g, ', ')
    .replace(/\s-\s/g, ', ')
    // Replace bullets with pauses
    .replace(/•/g, ', ')
    // Replace multiple dots with pause
    .replace(/\.{2,}/g, '. ')
    // Remove hash symbols
    .replace(/#/g, '')
    // Clean up brackets of all kinds and their content
    .replace(/\[([^\]]+)\]/g, '$1')
    .replace(/\(([^)]+)\)/g, '$1')
    .replace(/\{([^}]+)\}/g, '$1')
    // Replace slashes with "or" in most contexts
    .replace(/(\w)\/(\w)/g, '$1 or $2')
    // Remove any repeated spaces
    .replace(/\s+/g, ' ')
    // Final trim
    .trim();
};

/**
 * Splits long text into smaller chunks for reliable speech synthesis
 * With special handling for complex scripts like Kannada and Bengali
 */
export const splitTextIntoChunks = (text: string, language: string): string[] => {
  // Clean the text before splitting it
  const cleanedText = cleanTextForSpeech(text);
  
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
  const matches = cleanedText.match(sentenceRegex) || [];
  let sentences: string[] = matches.length > 0 ? Array.from(matches) : [cleanedText];
  
  // If we couldn't split by sentences, split by words as a fallback
  if (sentences.length === 1 && cleanedText.length > chunkSize) {
    sentences = cleanedText.split(/\s+/).map(word => word + ' ');
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
};
