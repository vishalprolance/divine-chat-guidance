
import { useRef, useEffect } from 'react';

interface UseMessageScrollProps {
  messages: any[];
  transcript: string;
  isProcessing: boolean;
  highlightedWordIndex: number | null;
}

export function useMessageScroll({ 
  messages, 
  transcript, 
  isProcessing,
  highlightedWordIndex
}: UseMessageScrollProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const highlightedWordRef = useRef<HTMLSpanElement>(null);
  const lastHighlightedIndex = useRef<number | null>(null);
  const isUserScrollingRef = useRef<boolean>(false);
  const userScrollTimerRef = useRef<number | null>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current && !isUserScrollingRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, transcript, isProcessing]);

  // Track user scrolling
  useEffect(() => {
    const scrollContainer = scrollAreaRef.current;
    
    if (!scrollContainer) return;
    
    const handleScroll = () => {
      // User is manually scrolling
      isUserScrollingRef.current = true;
      
      // Reset the timer
      if (userScrollTimerRef.current) {
        window.clearTimeout(userScrollTimerRef.current);
      }
      
      // After 5 seconds of no scrolling, allow auto-scroll again
      userScrollTimerRef.current = window.setTimeout(() => {
        isUserScrollingRef.current = false;
      }, 5000);
    };
    
    scrollContainer.addEventListener('touchmove', handleScroll);
    scrollContainer.addEventListener('wheel', handleScroll);
    
    return () => {
      scrollContainer.removeEventListener('touchmove', handleScroll);
      scrollContainer.removeEventListener('wheel', handleScroll);
      if (userScrollTimerRef.current) {
        window.clearTimeout(userScrollTimerRef.current);
      }
    };
  }, []);

  // Auto-scroll to the highlighted word if it's outside viewport
  useEffect(() => {
    if (
      highlightedWordRef.current && 
      highlightedWordIndex !== null && 
      (highlightedWordIndex !== lastHighlightedIndex.current) &&
      !isUserScrollingRef.current
    ) {
      lastHighlightedIndex.current = highlightedWordIndex;
      const wordElement = highlightedWordRef.current;
      const container = scrollAreaRef.current;
      
      if (wordElement && container) {
        const containerRect = container.getBoundingClientRect();
        const wordRect = wordElement.getBoundingClientRect();
        
        // Check if word is outside the visible area or close to edges
        const isOutsideViewport = 
          wordRect.bottom > containerRect.bottom - 50 || 
          wordRect.top < containerRect.top + 50;
        
        if (isOutsideViewport) {
          wordElement.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });
        }
      }
    }
  }, [highlightedWordIndex]);

  return {
    messagesEndRef,
    scrollAreaRef,
    highlightedWordRef
  };
}
