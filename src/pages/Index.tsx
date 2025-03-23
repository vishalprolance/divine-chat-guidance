
import React from 'react';
import ChatInterface from '../components/ChatInterface';
import ThemeToggle from '../components/ThemeToggle';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-divine-blue/5 to-divine-gold/5 dark:from-divine-blue/20 dark:to-divine-purple/30 px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-end mb-4">
          <ThemeToggle />
        </div>
        
        <div className="text-center mb-12 animate-divine-fade-in">
          <h1 className="text-4xl font-bold text-divine-blue dark:text-divine-gold mb-4">
            Life Guidance
          </h1>
          <p className="text-lg text-divine-blue/80 dark:text-divine-gold/80">
            Seek wisdom from the eternal teachings of the Bhagavad Gita
          </p>
        </div>
        
        <ChatInterface />
        
        <footer className="mt-8 text-center text-sm text-divine-blue/60 dark:text-divine-gold/60">
          Inspired by the timeless wisdom of Bhagavad Gita and ancient texts
        </footer>
      </div>
    </div>
  );
};

export default Index;
