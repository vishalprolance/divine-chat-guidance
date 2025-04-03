
import React from 'react';
import ChatInterface from '../components/ChatInterface';
import ThemeToggle from '../components/ThemeToggle';

const Index = () => {
  return (
    <div className="h-screen flex flex-col px-4 py-6 overflow-hidden">
      <div className="max-w-4xl mx-auto w-full flex-grow flex flex-col overflow-hidden">
        <div className="flex justify-end mb-4">
          <ThemeToggle />
        </div>
        
        <div className="text-center mb-6 animate-divine-fade-in">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
            Life Guidance
          </h1>
          <p className="text-lg text-divine-gold/90">
            Seek wisdom from the eternal teachings of the Bhagavad Gita
          </p>
        </div>
        
        <div className="flex-grow flex flex-col overflow-hidden">
          <ChatInterface />
        </div>
        
        <footer className="mt-4 text-center text-sm text-white/60">
          Inspired by the timeless wisdom of Bhagavad Gita and ancient texts
        </footer>
      </div>
    </div>
  );
};

export default Index;
