
import React, { useRef } from 'react';

interface MessageItemProps {
  type: 'user' | 'bot';
  text: string;
  fontSize: number;
  isHighlighted: boolean;
  highlightedWordIndex: number | null;
  highlightedWordRef?: React.RefObject<HTMLSpanElement>;
}

const MessageItem = ({ 
  type, 
  text, 
  fontSize, 
  isHighlighted,
  highlightedWordIndex,
  highlightedWordRef
}: MessageItemProps) => {

  // Helper function to highlight the currently spoken word
  const renderText = () => {
    if (!isHighlighted || highlightedWordIndex === null) {
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
    <div className={`message ${type === 'user' ? 'message-user' : 'message-bot'}`}>
      {renderText()}
    </div>
  );
};

export default MessageItem;
