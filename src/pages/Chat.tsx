import React from 'react';
import ChatInterface from '@/components/ChatInterface';
import ThemeToggle from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
const Chat = () => {
  return <div className="min-h-screen flex flex-col px-2 py-2 md:px-4 md:py-4 overflow-hidden bg-white dark:bg-black">
      <div className="w-full max-w-3xl mx-auto h-[calc(100vh-16px)] flex flex-col overflow-hidden">
        <div className="flex justify-between items-center mb-4 sticky top-0 z-30 bg-white dark:bg-black pb-2 rounded">
          <div className="flex items-center gap-2">
            <Link to="/">
              <Button variant="ghost" size="icon" className="rounded-full">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="text-left animate-divine-fade-in">
              <h1 className="text-xl md:text-2xl font-bold text-black dark:text-white mb-1">
                Life Guidance
              </h1>
              <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                Seek wisdom from the eternal teachings
              </p>
            </div>
          </div>
          <ThemeToggle />
        </div>
        
        <div className="flex-grow flex flex-col overflow-hidden mb-2">
          <ChatInterface />
        </div>
        
        <footer className="mt-1 text-center text-xs text-gray-600 dark:text-gray-400 py-2 sticky bottom-0 z-10 bg-white dark:bg-black">
          Inspired by the timeless wisdom of Bhagavad Gita and ancient texts
        </footer>
      </div>
    </div>;
};
export default Chat;