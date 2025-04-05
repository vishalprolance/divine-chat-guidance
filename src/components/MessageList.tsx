
import React from 'react';
import { useMessageScroll } from '../hooks/useMessageScroll';
import MessageItem from './message/MessageItem';
import TypingIndicator from './message/TypingIndicator';
import TranscriptDisplay from './message/TranscriptDisplay';
import WelcomeMessage from './message/WelcomeMessage';
import MessageStyles from './message/MessageStyles';

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
  
  const { messagesEndRef, scrollAreaRef, highlightedWordRef } = useMessageScroll({
    messages,
    transcript,
    isProcessing,
    highlightedWordIndex
  });

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
          <WelcomeMessage greetingMessage={greetingMessage} fontSize={fontSize} />
        ) : (
          <div className="space-y-4">
            {messages.map((message, index) => (
              <MessageItem
                key={index}
                type={message.type}
                text={message.text}
                fontSize={fontSize}
                isHighlighted={message.type === 'bot' && currentSpeakingMessage === message.text}
                highlightedWordIndex={highlightedWordIndex}
                highlightedWordRef={highlightedWordRef}
              />
            ))}
            
            {isProcessing && <TypingIndicator />}
            
            <TranscriptDisplay 
              transcript={transcript} 
              isRecording={isRecording} 
              fontSize={fontSize} 
            />
          </div>
        )}
        <div ref={messagesEndRef} className="h-4" />
      </div>
      
      <MessageStyles />
    </div>
  );
};

export default MessageList;
