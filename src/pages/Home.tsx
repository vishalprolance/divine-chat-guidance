
import React from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import ThemeToggle from '@/components/ThemeToggle';

const Home = () => {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-black text-black dark:text-white">
      <header className="w-full p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Life Guidance</h1>
        <ThemeToggle />
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 text-center">
        <div className="max-w-2xl mx-auto animate-divine-fade-in">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Seek wisdom from the eternal teachings
          </h2>
          <p className="text-lg md:text-xl mb-10 text-gray-700 dark:text-gray-300">
            Explore timeless wisdom from the Bhagavad Gita and ancient texts to find guidance for your modern life challenges.
          </p>
          
          <div className="space-y-4">
            <Link to="/chat">
              <Button className="px-8 py-6 text-lg rounded-lg bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors">
                Begin Your Journey
              </Button>
            </Link>
          </div>
        </div>
      </main>

      <footer className="w-full p-4 text-center text-sm text-gray-600 dark:text-gray-400">
        Inspired by the timeless wisdom of Bhagavad Gita and ancient texts
      </footer>
    </div>
  );
};

export default Home;
