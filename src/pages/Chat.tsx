
import React from 'react';
import ChatInterface from '@/components/ChatInterface';
import ThemeToggle from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const Chat = () => {
  return (
    <div className="min-h-screen flex flex-col px-2 py-2 md:px-4 md:py-4 bg-gradient-to-b from-white to-gray-50 dark:from-black dark:to-gray-950 overflow-hidden overscroll-none">
      <div className="w-full max-w-3xl mx-auto flex flex-col h-[calc(100vh-16px)]">
        <div className="flex justify-between items-center mb-4 sticky top-0 z-50 bg-white/90 dark:bg-black/90 backdrop-blur-md pb-2 pt-2 rounded-lg shadow-sm">
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
        
        <div className="flex-grow flex flex-col overflow-hidden mb-2 overscroll-none touch-auto relative" 
             style={{ 
               WebkitOverflowScrolling: 'touch',
               overscrollBehavior: 'contain',
               touchAction: 'pan-y'
             }}>
          <ChatInterface />
        </div>
        
        <footer className="mt-1 text-center text-xs text-gray-600 dark:text-gray-400 py-2 sticky bottom-0 z-10 bg-white/90 dark:bg-black/90 backdrop-blur-sm rounded-lg">
          <p>Inspired by the timeless wisdom of Bhagavad Gita and ancient texts</p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
            Disclaimer: This app is an AI-powered guide and does not intend to hurt any religious beliefs or sentiments. All content is AI-generated.
          </p>
        </footer>
      </div>
    </div>
  );
};

export default Chat;
