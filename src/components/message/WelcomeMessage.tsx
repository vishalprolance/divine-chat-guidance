
import React from 'react';

interface WelcomeMessageProps {
  greetingMessage: string;
  fontSize: number;
}

const WelcomeMessage = ({ greetingMessage, fontSize }: WelcomeMessageProps) => {
  return (
    <div className="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-gray-400 animate-divine-fade-in">
      <p className="text-center mb-4" style={{ fontSize: `${fontSize}px` }}>{greetingMessage}</p>
    </div>
  );
};

export default WelcomeMessage;
