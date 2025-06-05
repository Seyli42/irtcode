import React from 'react';
import { motion } from 'framer-motion';

interface StatCardProps {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  trend?: 'up' | 'down' | 'neutral';
  className?: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, value, label, trend, className = '' }) => {
  const trendColor = trend === 'up' 
    ? 'text-success-500' 
    : trend === 'down' 
    ? 'text-error-500' 
    : 'text-gray-500';

  const trendIcon = trend === 'up' 
    ? '↑' 
    : trend === 'down' 
    ? '↓' 
    : '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 ${className}`}
    >
      <div className="flex items-center">
        <div className="mr-3 text-primary-500">{icon}</div>
        <div>
          <div className="flex items-center gap-1">
            <span className="text-2xl font-semibold">{value}</span>
            {trend && <span className={`${trendColor}`}>{trendIcon}</span>}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">{label}</div>
        </div>
      </div>
    </motion.div>
  );
};

export default StatCard;