import React, { ReactNode, useState, useRef, useEffect } from 'react';

interface DropdownMenuProps {
  children: ReactNode;
}

interface DropdownMenuTriggerProps {
  children: ReactNode;
  asChild?: boolean;
}

interface DropdownMenuContentProps {
  children: ReactNode;
  align?: 'start' | 'center' | 'end';
  className?: string;
}

interface DropdownMenuItemProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}

export const DropdownMenu: React.FC<DropdownMenuProps> = ({ children }) => {
  return <div>{children}</div>;
};

export const DropdownMenuTrigger: React.FC<DropdownMenuTriggerProps> = ({ children, asChild }) => {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);

  const handleClick = () => setIsOpen(!isOpen);

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
    <div ref={triggerRef} onClick={handleClick}>
      {children}
    </div>
  );
};

export const DropdownMenuContent: React.FC<DropdownMenuContentProps> = ({ 
  children, 
  align = 'start',
  className = '' 
}) => {
  return (
    <div className={`absolute z-50 mt-2 min-w-[8rem] overflow-hidden rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-1 shadow-lg ${className}`}>
      {children}
    </div>
  );
};

export const DropdownMenuItem: React.FC<DropdownMenuItemProps> = ({ 
  children, 
  onClick,
  className = '' 
}) => {
  return (
    <div
      onClick={onClick}
      className={`relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700 ${className}`}
    >
      {children}
    </div>
  );
};
