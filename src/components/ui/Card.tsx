import React from 'react';
import { motion } from 'framer-motion';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  withPadding?: boolean;
  animate?: boolean;
}

const Card: React.FC<CardProps> = ({
  children,
  className = '',
  withPadding = true,
  animate = true,
}) => {
  const baseClasses = 'bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden';
  const paddingClass = withPadding ? 'p-4' : '';

  if (animate) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={`${baseClasses} ${paddingClass} ${className}`}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <div className={`${baseClasses} ${paddingClass} ${className}`}>
      {children}
    </div>
  );
};

export default Card;