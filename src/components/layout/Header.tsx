import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Moon, Sun } from 'lucide-react';
import { motion } from 'framer-motion';

interface HeaderProps {
  title: string;
}

const Header: React.FC<HeaderProps> = ({ title }) => {
  const { isDark, setTheme } = useTheme();

  return (
    <header className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 z-20 transition-colors">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center bg-white dark:bg-gray-800 rounded-lg p-1">
            <img src="/images/logo.svg" alt="IRT Logo" className="h-8 w-auto mr-2" />
            <h1 className="text-xl text-primary-500 font-medium">{title}</h1>
          </div>
          
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none"
            aria-label={isDark ? 'Activer le mode clair' : 'Activer le mode sombre'}
          >
            {isDark ? (
              <Moon size={20} className="text-primary-400" />
            ) : (
              <Sun size={20} className="text-primary-500" />
            )}
          </motion.button>
        </div>
      </div>
    </header>
  );
};

export default Header;