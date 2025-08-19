import React, { ReactNode } from 'react';

interface AvatarProps {
  children: ReactNode;
  className?: string;
}

interface AvatarImageProps {
  src?: string;
  alt?: string;
  className?: string;
}

interface AvatarFallbackProps {
  children: ReactNode;
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({ children, className = '' }) => {
  return (
    <div className={`relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full ${className}`}>
      {children}
    </div>
  );
};

export const AvatarImage: React.FC<AvatarImageProps> = ({ src, alt, className = '' }) => {
  if (!src) return null;
  
  return (
    <img
      src={src}
      alt={alt}
      className={`aspect-square h-full w-full ${className}`}
    />
  );
};

export const AvatarFallback: React.FC<AvatarFallbackProps> = ({ children, className = '' }) => {
  return (
    <div className={`flex h-full w-full items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 ${className}`}>
      {children}
    </div>
  );
};
