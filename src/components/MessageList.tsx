
import React, { useRef, useEffect } from 'react';
import { ScrollArea } from './ui/scroll-area';

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

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, transcript, isProcessing]);

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
              className={index === highlightedWordIndex ? 
                'bg-divine-gold/20 dark:bg-divine-gold/30 px-0.5 rounded transition-colors duration-150' : 
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
    <ScrollArea 
      className="message-container"
      ref={scrollAreaRef}
    >
      {messages.length === 0 && (
        <div className="flex flex-col items-center justify-center h-full text-divine-blue/60 dark:text-divine-gold/60 animate-divine-fade-in">
          <p className="text-center mb-4" style={{ fontSize: `${fontSize}px` }}>{greetingMessage}</p>
        </div>
      )}
      
      {messages.map((message, index) => (
        <div
          key={index}
          className={`message ${message.type === 'user' ? 'user-message' : 'bot-message'}`}
        >
          {renderHighlightedText(
            message.text, 
            message.type === 'bot' && currentSpeakingMessage === message.text
          )}
        </div>
      ))}
      
      {isProcessing && (
        <div className="message bot-message">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-divine-gold rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-divine-gold rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-2 h-2 bg-divine-gold rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
          </div>
        </div>
      )}
      
      {transcript && isRecording && (
        <div className="message user-message opacity-70">
          <span style={{ fontSize: `${fontSize}px` }}>{transcript}</span>
        </div>
      )}
      
      <div ref={messagesEndRef} />
    </ScrollArea>
  );
};

export default MessageList;
