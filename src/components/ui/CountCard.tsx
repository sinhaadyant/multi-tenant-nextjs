"use client";

import React from 'react';
import { LucideIcon } from 'lucide-react';
import { AnimatedCounter } from './AnimatedCounter';

interface CountCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  growth?: number;
  growthLabel?: string;
  bgColor: string;
  iconColor: string;
  className?: string;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}

export const CountCard: React.FC<CountCardProps> = ({
  title,
  value,
  icon: Icon,
  growth,
  growthLabel,
  bgColor,
  iconColor,
  className = "",
  prefix = "",
  suffix = "",
  decimals = 0
}) => {
  const getGrowthColor = (growthValue: number) => {
    if (growthValue > 0) return 'text-green-500';
    if (growthValue < 0) return 'text-red-500';
    return 'text-gray-500';
  };

  const getGrowthIcon = (growthValue: number) => {
    if (growthValue > 0) return '↗';
    if (growthValue < 0) return '↘';
    return '→';
  };

  return (
    <div className={`p-6 bg-white rounded-lg shadow-sm border border-gray-200 dark:bg-gray-800 dark:border-gray-700 hover:shadow-md transition-shadow duration-200 ${className}`}>
      <div className="flex items-center">
        <div className={`p-2 rounded-lg ${bgColor}`}>
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
        <div className="ml-4 flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {title}
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            <AnimatedCounter
              value={value}
              prefix={prefix}
              suffix={suffix}
              decimals={decimals}
            />
          </p>
        </div>
      </div>
      
      {growth !== undefined && (
        <div className="mt-4 flex items-center text-sm">
          <span className={`font-medium ${getGrowthColor(growth)}`}>
            {getGrowthIcon(growth)} {Math.abs(growth)}%
          </span>
          {growthLabel && (
            <span className="text-gray-500 dark:text-gray-400 ml-2">
              {growthLabel}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
