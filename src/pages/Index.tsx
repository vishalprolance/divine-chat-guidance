
import React from 'react';
import ChatInterface from '../components/ChatInterface';
import ThemeToggle from '../components/ThemeToggle';

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col px-3 py-4 md:px-6 md:py-6 overflow-hidden bg-divine-gradient">
      <div className="max-w-4xl mx-auto w-full flex-grow flex flex-col overflow-hidden">
        <div className="flex justify-between items-center mb-4">
          <div className="text-left mr-auto animate-divine-fade-in">
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-1 md:mb-2 text-shadow">
              Life Guidance
            </h1>
            <p className="text-sm md:text-base text-divine-gold/90 font-medium">
              Seek wisdom from the eternal teachings of the Bhagavad Gita
            </p>
          </div>
          <ThemeToggle />
        </div>
        
        <div className="flex-grow flex flex-col overflow-hidden mb-4">
          <ChatInterface />
        </div>
        
        <footer className="mt-2 text-center text-xs md:text-sm text-white/70 dark:text-divine-gold/70">
          Inspired by the timeless wisdom of Bhagavad Gita and ancient texts
        </footer>
      </div>
      
      <style jsx>{`
        .bg-divine-gradient {
          background: linear-gradient(135deg, #24243e 0%, #302b63 50%, #0f0c29 100%);
        }
        
        .text-shadow {
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }
        
        @media (max-width: 640px) {
          .bg-divine-gradient {
            background: linear-gradient(135deg, #24243e 0%, #302b63 40%, #0f0c29 100%);
          }
        }
      `}</style>
    </div>
  );
};

export default Index;
