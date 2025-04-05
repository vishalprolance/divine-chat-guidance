
import React from 'react';

const TypingIndicator = () => {
  return (
    <div className="message message-bot">
      <div className="flex items-center space-x-2">
        <div className="w-2 h-2 bg-black dark:bg-white rounded-full animate-bounce"></div>
        <div className="w-2 h-2 bg-black dark:bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        <div className="w-2 h-2 bg-black dark:bg-white rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
      </div>
    </div>
  );
};

export default TypingIndicator;
