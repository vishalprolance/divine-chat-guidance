
import React, { useRef, useEffect } from 'react';

interface Message {
  type: 'user' | 'bot';
  text: string;
}

interface MessageListProps {
  messages: Message[];
  isProcessing: boolean;
  transcript: string;
  isRecording: boolean;
  greetingMessage: string;
  fontSize: number;
  highlightedWordIndex: number | null;
  currentSpeakingMessage: string | null;
}

const MessageList = ({ 
  messages, 
  isProcessing, 
  transcript, 
  isRecording, 
  greetingMessage, 
  fontSize,
  highlightedWordIndex,
  currentSpeakingMessage
}: MessageListProps) => {
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

  // Helper function to highlight the currently spoken word
  const renderHighlightedText = (text: string, isCurrentlySpeaking: boolean) => {
    if (!isCurrentlySpeaking || highlightedWordIndex === null) {
      return <span style={{ fontSize: `${fontSize}px` }}>{text}</span>;
    }

    const words = text.split(/(\s+)/);
    
    return (
      <span style={{ fontSize: `${fontSize}px` }}>
        {words.map((word, index) => {
          // For whitespace, just render it
          if (word.trim() === '') {
            return <span key={`space-${index}`}>{word}</span>;
          }
          
          // For words
          return (
            <span 
              key={`word-${index}`}
              ref={index === highlightedWordIndex ? highlightedWordRef : null} 
              className={index === highlightedWordIndex ? 
                'highlighted-word' : 
                ''}
            >
              {word}
            </span>
          );
        })}
      </span>
    );
  };

  return (
    <div 
      className="flex-1 w-full overflow-y-auto pb-4 custom-scrollbar" 
      style={{
        WebkitOverflowScrolling: 'touch',
        height: '100%',
        overflowY: 'auto',
        overscrollBehavior: 'contain',
        touchAction: 'pan-y'
      }} 
      ref={scrollAreaRef}
    >
      <div className="px-4 space-y-4 pb-6">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-gray-400 animate-divine-fade-in">
            <p className="text-center mb-4" style={{ fontSize: `${fontSize}px` }}>{greetingMessage}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`message ${message.type === 'user' ? 'message-user' : 'message-bot'}`}
              >
                {renderHighlightedText(
                  message.text, 
                  message.type === 'bot' && currentSpeakingMessage === message.text
                )}
              </div>
            ))}
            
            {isProcessing && (
              <div className="message message-bot">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-black dark:bg-white rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-black dark:bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-black dark:bg-white rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            )}
            
            {transcript && isRecording && (
              <div className="message message-user opacity-70">
                <span style={{ fontSize: `${fontSize}px` }}>{transcript}</span>
              </div>
            )}
          </div>
        )}
        <div ref={messagesEndRef} className="h-4" />
      </div>
      
      <style>
        {`
        .message {
          margin-bottom: 1rem;
          padding: 0.75rem 1rem;
          border-radius: 0.75rem;
          max-width: 85%;
          animation: fadeIn 0.3s ease-in-out;
          line-height: 1.6;
          white-space: pre-wrap;
          word-break: break-word;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          transition: all 0.3s ease;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .message-user {
          background-color: rgba(210, 230, 255, 0.5);
          border-left: 3px solid rgba(100, 150, 255, 0.7);
          margin-left: auto;
          border-top-right-radius: 0;
          color: #000000;
        }
        
        .dark .message-user {
          background-color: rgba(50, 80, 140, 0.4);
          border-left: 3px solid rgba(100, 150, 255, 0.5);
          color: #ffffff;
        }
        
        .message-bot {
          background-color: rgba(240, 240, 250, 0.5);
          border-left: 3px solid rgba(120, 90, 190, 0.7);
          margin-right: auto;
          border-top-left-radius: 0;
          color: #000000;
        }
        
        .dark .message-bot {
          background-color: rgba(60, 50, 100, 0.4);
          border-left: 3px solid rgba(150, 130, 200, 0.6);
          color: #ffffff;
        }
        
        .highlighted-word {
          background-color: rgba(144, 97, 249, 0.35);
          border-radius: 4px;
          padding: 0 2px;
          display: inline-block;
          transition: all 0.2s ease;
        }
        
        .dark .highlighted-word {
          background-color: rgba(144, 97, 249, 0.5);
        }
        
        /* Specific styles for Kannada and Bengali */
        .kn-IN .highlighted-word, 
        .bn-IN .highlighted-word {
          background-color: rgba(144, 97, 249, 0.5);
          padding: 0 3px;
          margin: 0 1px;
        }
        
        @media (max-width: 640px) {
          .message {
            max-width: 90%;
          }
        }
        `}
      </style>
    </div>
  );
};

export default MessageList;
