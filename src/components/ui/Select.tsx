import React, { ReactNode, useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface SelectProps {
  children: ReactNode;
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
}

interface SelectTriggerProps {
  children: ReactNode;
  className?: string;
}

interface SelectContentProps {
  children: ReactNode;
}

interface SelectItemProps {
  children: ReactNode;
  value: string;
}

export const Select: React.FC<SelectProps> = ({ 
  children, 
  value, 
  onValueChange, 
  placeholder,
  className = '' 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState(value || '');
  const [selectedLabel, setSelectedLabel] = useState(placeholder || '');
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setSelectedValue(value || '');
  }, [value]);

  const handleSelect = (value: string, label: string) => {
    setSelectedValue(value);
    setSelectedLabel(label);
    onValueChange?.(value);
    setIsOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (triggerRef.current && !triggerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-10 w-full items-center justify-between rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm ring-offset-white dark:ring-offset-gray-950 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-950 dark:focus:ring-gray-300 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span className={selectedValue ? 'text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'}>
          {selectedLabel}
        </span>
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg max-h-60 overflow-auto">
          {children}
        </div>
      )}
    </div>
  );
};

export const SelectTrigger: React.FC<SelectTriggerProps> = ({ children, className = '' }) => {
  return <div className={className}>{children}</div>;
};

export const SelectContent: React.FC<SelectContentProps> = ({ children }) => {
  return <div>{children}</div>;
};

export const SelectItem: React.FC<SelectItemProps> = ({ children, value }) => {
  return (
    <div className="relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700">
      {children}
    </div>
  );
};

export const SelectValue: React.FC<{ placeholder?: string }> = ({ placeholder }) => {
  return <span>{placeholder}</span>;
};
