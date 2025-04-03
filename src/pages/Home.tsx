
import React from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import ThemeToggle from '@/components/ThemeToggle';
import { BookOpenText, MessageCircleIcon, SunMoon } from 'lucide-react';

const Home = () => {
  return (
    <div className="min-h-screen flex flex-col overflow-hidden bg-gradient-to-b from-white to-gray-50 dark:from-black dark:to-gray-900">
      <div className="container flex flex-col items-center justify-center min-h-screen px-4 py-10 gap-6">
        <header className="w-full flex justify-between items-center mb-8 sticky top-0 z-10 p-4">
          <h1 className="text-2xl font-serif font-bold text-black dark:text-white">Life Guidance</h1>
          <ThemeToggle />
        </header>
        
        <div className="flex flex-col items-center justify-center flex-grow text-center max-w-xl">
          <div className="mb-8 animate-divine-fade-in">
            <SunMoon className="w-20 h-20 mx-auto mb-4 text-amber-500 dark:text-amber-400" />
          </div>
          
          <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4 text-black dark:text-white animate-divine-fade-in" style={{animationDelay: '0.2s'}}>
            Find Inner Peace Through Ancient Wisdom
          </h2>
          
          <p className="text-lg md:text-xl mb-8 text-gray-700 dark:text-gray-300 animate-divine-fade-in" style={{animationDelay: '0.4s'}}>
            Explore timeless teachings from the Bhagavad Gita and other ancient texts
            to guide you through life's challenges.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full mb-8 animate-divine-fade-in" style={{animationDelay: '0.6s'}}>
            <div className="p-6 rounded-lg bg-white dark:bg-gray-800 shadow-md flex flex-col items-center text-center">
              <BookOpenText className="w-10 h-10 mb-4 text-amber-500 dark:text-amber-400" />
              <h3 className="font-serif text-xl font-semibold mb-2">Ancient Wisdom</h3>
              <p className="text-gray-600 dark:text-gray-300">Access timeless philosophical teachings in modern context</p>
            </div>
            
            <div className="p-6 rounded-lg bg-white dark:bg-gray-800 shadow-md flex flex-col items-center text-center">
              <MessageCircleIcon className="w-10 h-10 mb-4 text-amber-500 dark:text-amber-400" />
              <h3 className="font-serif text-xl font-semibold mb-2">Personal Guidance</h3>
              <p className="text-gray-600 dark:text-gray-300">Ask questions and receive guidance tailored to your needs</p>
            </div>
          </div>
          
          <Link to="/chat" className="w-full max-w-xs animate-divine-fade-in" style={{animationDelay: '0.8s'}}>
            <Button className="w-full bg-amber-500 hover:bg-amber-600 dark:bg-amber-500 dark:text-black dark:hover:bg-amber-400 py-6 text-lg rounded-full shadow-lg transition-all duration-300 transform hover:scale-105">
              Start Your Journey
            </Button>
          </Link>
        </div>
        
        <footer className="w-full mt-auto text-center text-sm text-gray-600 dark:text-gray-400 py-4">
          <p>Inspired by the timeless wisdom of Bhagavad Gita and ancient texts</p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
            Disclaimer: This app is an AI-powered guide and does not intend to hurt any religious beliefs or sentiments. All content is AI-generated.
          </p>
        </footer>
      </div>
    </div>
  );
};

export default Home;
