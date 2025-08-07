import React, { useState, useCallback } from 'react';
import { ChevronDown, Calendar } from 'lucide-react';

interface DateFilterDropdownProps {
  selectedRange: string;
  onRangeChange: (range: string) => void;
  isLoading?: boolean;
}

const DateFilterDropdown: React.FC<DateFilterDropdownProps> = ({
  selectedRange,
  onRangeChange,
  isLoading = false
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const filterOptions = [
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: '1 Month' },
    { value: '60d', label: '60 Days' },
    { value: '90d', label: '90 Days' },
    { value: 'all', label: 'All Time' }
  ];

  const selectedOption = filterOptions.find(option => option.value === selectedRange);

  const handleOptionClick = useCallback((range: string) => {
    onRangeChange(range);
    setIsOpen(false);
  }, [onRangeChange]);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        className="flex items-center justify-between w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
      >
        <div className="flex items-center">
          <Calendar className="w-4 h-4 mr-2 text-gray-400" />
          <span>{selectedOption?.label || 'Select Range'}</span>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 z-10 w-48 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg dark:bg-gray-800 dark:border-gray-700">
          <div className="py-1">
            {filterOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handleOptionClick(option.value)}
                className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${
                  selectedRange === option.value
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                    : 'text-gray-700 dark:text-gray-300'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Backdrop to close dropdown */}
      {isOpen && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default DateFilterDropdown; 