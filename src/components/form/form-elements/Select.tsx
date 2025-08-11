import React from 'react';

interface SelectProps {
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  className?: string;
  disabled?: boolean;
  children?: React.ReactNode;
}

const Select: React.FC<SelectProps> = ({
  value,
  onChange,
  className = '',
  disabled = false,
  children
}) => {
  return (
    <select
      value={value}
      onChange={onChange}
      disabled={disabled}
      className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${className}`}
    >
      {children}
    </select>
  );
};

export default Select; 