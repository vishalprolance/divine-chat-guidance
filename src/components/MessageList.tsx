
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
}

const MessageList = ({ messages, isProcessing, transcript, isRecording, greetingMessage }: MessageListProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, transcript, isProcessing]);

  return (
    <div className="message-container">
      {messages.length === 0 && (
        <div className="flex flex-col items-center justify-center h-full text-divine-blue/60 dark:text-divine-gold/60 animate-divine-fade-in">
          <p className="text-center mb-4">{greetingMessage}</p>
        </div>
      )}
      
      {messages.map((message, index) => (
        <div
          key={index}
          className={`message ${message.type === 'user' ? 'user-message' : 'bot-message'}`}
        >
          {message.text}
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
          {transcript}
        </div>
      )}
      
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;
