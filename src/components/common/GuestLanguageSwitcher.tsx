"use client";
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Languages, ChevronDown } from 'lucide-react';
import { i18n } from '@/app/i18n-provider';

interface GuestLanguageSwitcherProps {
  className?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  position?: 'top-right' | 'top-left' | 'center';
}

const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
  { code: 'ur', name: 'اردو', flag: '🇵🇰' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
  { code: 'bn', name: 'বাংলা', flag: '🇧🇩' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
];

export const GuestLanguageSwitcher: React.FC<GuestLanguageSwitcherProps> = ({
  className = "",
  showLabel = true,
  size = "md",
  position = "center"
}) => {
  const { t } = useTranslation(['common']);
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Get current language from i18n or localStorage
    const storedLanguage = localStorage.getItem('language') || i18n.language || 'en';
    setCurrentLanguage(storedLanguage);
  }, []);

  const changeLanguage = async (languageCode: string) => {
    if (languageCode === currentLanguage) return;

    setIsLoading(true);
    try {
      // Change language in i18n
      await i18n.changeLanguage(languageCode);
      
      // Store in localStorage for persistence
      localStorage.setItem('language', languageCode);
      
      // Update state
      setCurrentLanguage(languageCode);
      
      // Set document direction for RTL languages
      document.documentElement.dir = (languageCode === 'ar' || languageCode === 'ur') ? 'rtl' : 'ltr';
      
      setIsOpen(false);
    } catch (error) {
      console.error('Error changing language:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const sizeClasses = {
    sm: 'text-sm px-2 py-1',
    md: 'text-sm px-3 py-2',
    lg: 'text-base px-4 py-3'
  };

  const positionClasses = {
    'top-right': 'absolute top-4 right-4',
    'top-left': 'absolute top-4 left-4',
    'center': 'relative'
  };

  const currentLang = languages.find(lang => lang.code === currentLanguage) || languages[0];

  return (
    <div className={`${positionClasses[position]} ${className}`}>
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          disabled={isLoading}
          className={`
            ${sizeClasses[size]}
            flex items-center space-x-2 bg-white dark:bg-gray-800 
            border border-gray-300 dark:border-gray-600 rounded-lg
            text-gray-700 dark:text-gray-300 
            hover:bg-gray-50 dark:hover:bg-gray-700 
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            transition-colors duration-200
            ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          <Languages className="w-4 h-4" />
          {showLabel && (
            <>
              <span className="flex items-center space-x-1">
                <span>{currentLang.flag}</span>
                <span className="font-medium">{currentLang.name}</span>
              </span>
              <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </>
          )}
        </button>

        {isOpen && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-10" 
              onClick={() => setIsOpen(false)}
            />
            
            {/* Dropdown */}
            <div className="absolute z-20 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg">
              <div className="py-1">
                {languages.map((language) => (
                  <button
                    key={language.code}
                    type="button"
                    onClick={() => changeLanguage(language.code)}
                    disabled={isLoading}
                    className={`
                      w-full text-left px-4 py-2 text-sm flex items-center space-x-3
                      hover:bg-gray-50 dark:hover:bg-gray-700
                      transition-colors duration-200
                      ${currentLanguage === language.code 
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' 
                        : 'text-gray-700 dark:text-gray-300'
                      }
                      ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                    `}
                  >
                    <span className="text-lg">{language.flag}</span>
                    <span className="font-medium">{language.name}</span>
                    {currentLanguage === language.code && (
                      <span className="ml-auto text-blue-600 dark:text-blue-400">✓</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
