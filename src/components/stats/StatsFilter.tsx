import React from 'react';
import { motion } from 'framer-motion';

interface StatsFilterProps {
  period: 'day' | 'week' | 'month';
  onChange: (period: 'day' | 'week' | 'month') => void;
}

const StatsFilter: React.FC<StatsFilterProps> = ({ period, onChange }) => {
  const options = [
    { value: 'day', label: 'Jour' },
    { value: 'week', label: 'Semaine' },
    { value: 'month', label: 'Mois' },
  ];

  return (
    <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-1.5 flex items-center justify-center mb-6">
      {options.map((option) => (
        <motion.button
          key={option.value}
          whileTap={{ scale: 0.95 }}
          onClick={() => onChange(option.value as 'day' | 'week' | 'month')}
          className={`relative rounded-md px-4 py-2 text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 flex-1 text-center ${
            period === option.value
              ? 'text-primary-900 dark:text-white'
              : 'text-gray-700 dark:text-gray-300 hover:text-primary-700 dark:hover:text-primary-300'
          }`}
        >
          {period === option.value && (
            <motion.div
              layoutId="activeFilter"
              className="absolute inset-0 bg-white dark:bg-gray-700 rounded-md"
              initial={false}
              transition={{ type: 'spring', duration: 0.4 }}
            />
          )}
          <span className="relative">{option.label}</span>
        </motion.button>
      ))}
    </div>
  );
};

export default StatsFilter;