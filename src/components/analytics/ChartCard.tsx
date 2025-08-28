"use client";

import React, { useState } from 'react';
import {
  MoreVertical,
  Download,
  Maximize2,
  Minimize2,
  BarChart3,
  PieChart,
  TrendingUp,
  FileText,
  FileDown,
  Image
} from 'lucide-react';
import { Dropdown } from '@/components/ui/dropdown/Dropdown';
import { DropdownItem } from '@/components/ui/dropdown/DropdownItem';

export interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  isLoading?: boolean;
  error?: string | null;
  chartTypes?: Array<'bar' | 'line' | 'pie' | 'donut'>;
  currentChartType?: 'bar' | 'line' | 'pie' | 'donut';
  onChartTypeChange?: (type: 'bar' | 'line' | 'pie' | 'donut') => void;
  onExport?: (format: 'png' | 'pdf' | 'csv') => void;
  onFullscreen?: () => void;
  isFullscreen?: boolean;
  showActions?: boolean;
  showChartTypeSwitcher?: boolean;
  showExportOptions?: boolean;
  showFullscreenToggle?: boolean;
}

export const ChartCard: React.FC<ChartCardProps> = ({
  title,
  subtitle,
  children,
  className = '',
  isLoading = false,
  error = null,
  chartTypes = ['bar', 'line', 'pie'],
  currentChartType = 'bar',
  onChartTypeChange,
  onExport,
  onFullscreen,
  isFullscreen = false,
  showActions = true,
  showChartTypeSwitcher = true,
  showExportOptions = true,
  showFullscreenToggle = true
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);

  const handleChartTypeChange = (type: 'bar' | 'line' | 'pie' | 'donut') => {
    onChartTypeChange?.(type);
    setIsDropdownOpen(false);
  };

  const handleExport = (format: 'png' | 'pdf' | 'csv') => {
    onExport?.(format);
    setIsExportDropdownOpen(false);
  };

  const getChartTypeIcon = (type: 'bar' | 'line' | 'pie' | 'donut') => {
    switch (type) {
      case 'bar':
        return <BarChart3 className="w-4 h-4" />;
      case 'line':
        return <TrendingUp className="w-4 h-4" />;
      case 'pie':
      case 'donut':
        return <PieChart className="w-4 h-4" />;
      default:
        return <BarChart3 className="w-4 h-4" />;
    }
  };

  const getChartTypeLabel = (type: 'bar' | 'line' | 'pie' | 'donut') => {
    switch (type) {
      case 'bar':
        return 'Bar Chart';
      case 'line':
        return 'Line Chart';
      case 'pie':
        return 'Pie Chart';
      case 'donut':
        return 'Donut Chart';
      default:
        return 'Bar Chart';
    }
  };

  if (error) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
            {subtitle && (
              <p className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
            )}
          </div>
        </div>
        <div className="flex items-center justify-center h-64 text-center">
          <div className="text-red-500 dark:text-red-400">
            <div className="text-sm font-medium mb-2">Error loading chart</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700">
        <div className="flex-1">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h3>
          {subtitle && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>
          )}
        </div>

        {/* Actions */}
        {showActions && (
          <div className="flex items-center space-x-1">
            {/* Chart Type Switcher */}
            {showChartTypeSwitcher && chartTypes.length > 1 && onChartTypeChange && (
              <div className="relative">
                <button 
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-brand-500 transition-colors dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
                >
                  {getChartTypeIcon(currentChartType)}
                  <span className="ml-1.5 text-xs">{getChartTypeLabel(currentChartType)}</span>
                </button>
                <Dropdown
                  isOpen={isDropdownOpen}
                  onClose={() => setIsDropdownOpen(false)}
                >
                  {chartTypes.map((type) => (
                    <DropdownItem
                      key={type}
                      onClick={() => handleChartTypeChange(type)}
                      className="flex items-center space-x-2 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      {getChartTypeIcon(type)}
                      <span className="text-sm">{getChartTypeLabel(type)}</span>
                    </DropdownItem>
                  ))}
                </Dropdown>
              </div>
            )}

            {/* Export Options */}
            {showExportOptions && onExport && (
              <div className="relative">
                <button 
                  onClick={() => setIsExportDropdownOpen(!isExportDropdownOpen)}
                  className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-brand-500 transition-colors dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="ml-1.5 text-xs">Export</span>
                </button>
                <Dropdown
                  isOpen={isExportDropdownOpen}
                  onClose={() => setIsExportDropdownOpen(false)}
                >
                  <DropdownItem onClick={() => handleExport('png')} className="flex items-center space-x-2 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700">
                    <Image className="w-4 h-4" />
                    <span className="text-sm">Export as PNG</span>
                  </DropdownItem>
                  <DropdownItem onClick={() => handleExport('pdf')} className="flex items-center space-x-2 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700">
                    <FileText className="w-4 h-4" />
                    <span className="text-sm">Export as PDF</span>
                  </DropdownItem>
                  <DropdownItem onClick={() => handleExport('csv')} className="flex items-center space-x-2 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700">
                    <FileDown className="w-4 h-4" />
                    <span className="text-sm">Export as CSV</span>
                  </DropdownItem>
                </Dropdown>
              </div>
            )}

            {/* Fullscreen Toggle */}
            {showFullscreenToggle && onFullscreen && (
              <button
                onClick={onFullscreen}
                className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-brand-500 transition-colors dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
              >
                {isFullscreen ? (
                  <Minimize2 className="w-3.5 h-3.5" />
                ) : (
                  <Maximize2 className="w-3.5 h-3.5" />
                )}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Chart Content */}
      <div className="relative p-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
};
