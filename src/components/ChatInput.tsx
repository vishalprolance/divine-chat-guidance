
import React from 'react';
import { Button } from './ui/button';
import { Mic, Send, StopCircle } from 'lucide-react';

interface ChatInputProps {
  input: string;
  setInput: (input: string) => void;
  isRecording: boolean;
  isProcessing: boolean;
  toggleRecording: () => void;
  handleSendMessage: (text: string) => void;
}

const ChatInput = ({
  input,
  setInput,
  isRecording,
  isProcessing,
  toggleRecording,
  handleSendMessage
}: ChatInputProps) => {
  return (
    <div className="relative w-full">
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage(input)}
        placeholder="Ask your question..."
        className="w-full p-4 pr-24 bg-white dark:bg-black rounded-full border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent"
        disabled={isProcessing}
      />
      <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex space-x-2">
        <Button
          onClick={toggleRecording}
          variant="ghost"
          size="icon"
          className={`rounded-full ${isRecording 
            ? 'bg-red-100 dark:bg-red-900 text-red-500' 
            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'}`}
          disabled={isProcessing}
        >
          {isRecording ? <StopCircle className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
        </Button>
        <Button
          onClick={() => handleSendMessage(input)}
          variant="ghost"
          size="icon"
          className="rounded-full bg-black text-white dark:bg-white dark:text-black"
          disabled={!input.trim() || isProcessing}
        >
          <Send className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};

export default ChatInput;
