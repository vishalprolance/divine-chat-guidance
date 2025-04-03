
import React from 'react';
import ChatInterface from '../components/ChatInterface';
import ThemeToggle from '../components/ThemeToggle';

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col px-2 py-2 md:px-4 md:py-4 overflow-hidden bg-white dark:bg-black">
      <div className="w-full max-w-md mx-auto h-full flex flex-col overflow-hidden">
        <div className="flex justify-between items-center mb-2">
          <div className="text-left mr-auto animate-divine-fade-in">
            <h1 className="text-xl md:text-2xl font-bold text-black dark:text-white mb-1">
              Life Guidance
            </h1>
            <p className="text-sm text-black/80 dark:text-white/80 font-medium">
              Seek wisdom from the eternal teachings of the Bhagavad Gita
            </p>
          </div>
          <ThemeToggle />
        </div>
        
        <div className="flex-grow flex flex-col overflow-hidden mb-2">
          <ChatInterface />
        </div>
        
        <footer className="mt-1 text-center text-xs text-black/70 dark:text-white/70">
          Inspired by the timeless wisdom of Bhagavad Gita and ancient texts
        </footer>
      </div>
    </div>
  );
};

export default Index;
