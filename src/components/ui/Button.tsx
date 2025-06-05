import React from 'react';
import { motion } from 'framer-motion';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'error' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  icon?: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  icon,
  className = '',
  disabled = false,
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-md transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';

  const variantClasses = {
    primary: 'bg-primary-500 text-white hover:bg-primary-600 active:bg-primary-700 focus:ring-primary-500',
    secondary: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 active:bg-gray-100 focus:ring-primary-500 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700',
    success: 'bg-success-500 text-white hover:bg-success-600 active:bg-success-700 focus:ring-success-500',
    error: 'bg-error-500 text-white hover:bg-error-600 active:bg-error-700 focus:ring-error-500',
    outline: 'bg-transparent text-primary-500 border border-primary-500 hover:bg-primary-50 active:bg-primary-100 focus:ring-primary-500 dark:hover:bg-primary-900 dark:active:bg-primary-800',
    ghost: 'bg-transparent text-primary-500 hover:bg-primary-50 active:bg-primary-100 focus:ring-primary-500 dark:hover:bg-primary-900/20 dark:active:bg-primary-800/20'
  };

  const sizeClasses = {
    sm: 'text-sm px-3 py-1.5',
    md: 'text-base px-4 py-2',
    lg: 'text-lg px-6 py-3'
  };

  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${widthClass} ${className}`}
      disabled={disabled}
      {...props}
    >
      {icon && <span className={`${children ? 'mr-2' : ''}`}>{icon}</span>}
      {children}
    </motion.button>
  );
};

export default Button;