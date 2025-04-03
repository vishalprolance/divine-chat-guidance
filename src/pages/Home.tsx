
import React from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import ThemeToggle from '@/components/ThemeToggle';

const Home = () => {
  return (
    <div className="min-h-screen flex flex-col overflow-hidden bg-white dark:bg-black">
      <div className="container flex flex-col items-center justify-center h-screen px-4 py-10 gap-6">
        <header className="w-full flex justify-between items-center mb-8 sticky top-0 z-10">
          <h1 className="text-2xl font-bold text-black dark:text-white">Life Guidance</h1>
          <ThemeToggle />
        </header>
        
        <div className="flex flex-col items-center justify-center flex-grow text-center max-w-xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-black dark:text-white">
            Find Inner Peace Through Ancient Wisdom
          </h2>
          <p className="text-lg md:text-xl mb-8 text-gray-700 dark:text-gray-300">
            Explore timeless teachings from the Bhagavad Gita and other ancient texts
            to guide you through life's challenges.
          </p>
          <Link to="/chat" className="w-full max-w-xs">
            <Button className="w-full bg-black hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200 py-6 text-lg rounded-full">
              Start Your Journey
            </Button>
          </Link>
        </div>
        
        <footer className="w-full mt-auto text-center text-sm text-gray-600 dark:text-gray-400 py-4">
          Inspired by the timeless wisdom of Bhagavad Gita and ancient texts
        </footer>
      </div>
    </div>
  );
};

export default Home;
