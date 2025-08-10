import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface CountCardProps {
  title: string;
  count: string | number;
  icon: React.ReactNode;
  bgColor: string;
  iconColor: string;
  onClick?: () => void;
  trend?: number | null;
  trendLabel?: string;
  className?: string;
}

export const CountCard: React.FC<CountCardProps> = ({
  title,
  count,
  icon,
  bgColor,
  iconColor,
  onClick,
  trend,
  trendLabel,
  className = ''
}) => {
  const isClickable = !!onClick;
  
  const cardClasses = `
    p-6 bg-white rounded-lg shadow-sm border border-gray-200 dark:bg-gray-800 dark:border-gray-700
    ${isClickable ? 'cursor-pointer hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200' : ''}
    ${className}
  `;

  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  return (
    <div 
      className={cardClasses}
      onClick={handleClick}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={isClickable ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      } : undefined}
    >
      <div className="flex items-center">
        <div className={`p-2 rounded-lg ${bgColor}`}>
          <div className={iconColor}>
            {icon}
          </div>
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {title}
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {count}
          </p>
        </div>
      </div>
      
      {trend !== null && trend !== undefined && (
        <div className="mt-4 flex items-center text-sm">
          {trend >= 0 ? (
            <TrendingUp className="w-4 h-4 text-green-500" />
          ) : (
            <TrendingDown className="w-4 h-4 text-red-500" />
          )}
          <span className={`ml-1 ${
            trend >= 0 
              ? 'text-green-600 dark:text-green-400' 
              : 'text-red-600 dark:text-red-400'
          }`}>
            {trend >= 0 ? '+' : ''}{trend}%
          </span>
          {trendLabel && (
            <span className="ml-2 text-gray-500 dark:text-gray-400">
              {trendLabel}
            </span>
          )}
        </div>
      )}
    </div>
  );
}; 