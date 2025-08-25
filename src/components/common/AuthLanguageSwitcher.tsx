import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import i18n, { i18nInitialized } from '@/lib/i18n';
import { Globe, ChevronDown } from 'lucide-react';

const languageOptions = [
  { code: 'en', name: 'EN', nativeName: 'English' },
  { code: 'hi', name: 'HI', nativeName: 'हिंदी' },
  { code: 'ur', name: 'UR', nativeName: 'اُردُو' },
  { code: 'ar', name: 'AR', nativeName: 'العربية' },
  { code: 'bn', name: 'BN', nativeName: 'বাংলা' },
  { code: 'fr', name: 'FR', nativeName: 'Français' },
];

export const AuthLanguageSwitcher: React.FC = () => {
  const { t } = useTranslation('common');
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const initializeLanguage = async () => {
      try {
        // Wait for i18n to be initialized
        if (!i18nInitialized) {
          await new Promise<void>((resolve) => {
            const checkInitialized = () => {
              if (i18nInitialized) {
                resolve();
              } else {
                setTimeout(checkInitialized, 100);
              }
            };
            checkInitialized();
          });
        }

        // Get saved language or default to 'en'
        const savedLanguage = localStorage.getItem('language') || 'en';
        setCurrentLanguage(savedLanguage);
        
        // Apply the language
        await i18n.changeLanguage(savedLanguage);
        
        // Set RTL for Arabic and Urdu
        if (savedLanguage === 'ar' || savedLanguage === 'ur') {
          document.documentElement.dir = 'rtl';
        } else {
          document.documentElement.dir = 'ltr';
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error initializing language:', error);
        setIsLoading(false);
      }
    };

    initializeLanguage();
  }, []);

  const handleLanguageChange = async (newLanguage: string) => {
    try {
      console.log('AuthLanguageSwitcher: Changing language to:', newLanguage);
      
      // Wait for i18n to be initialized
      if (!i18nInitialized) {
        console.log('AuthLanguageSwitcher: Waiting for i18n initialization...');
        await new Promise<void>((resolve) => {
          const checkInitialized = () => {
            if (i18nInitialized) {
              resolve();
            } else {
              setTimeout(checkInitialized, 100);
            }
          };
          checkInitialized();
        });
      }

      console.log('AuthLanguageSwitcher: i18n initialized, changing language...');
      
      // Update i18next
      await i18n.changeLanguage(newLanguage);
      
      console.log('AuthLanguageSwitcher: Language changed to:', i18n.language);
      
      // Update state
      setCurrentLanguage(newLanguage);
      
      // Save to localStorage
      localStorage.setItem('language', newLanguage);

      // Set RTL for Arabic and Urdu
      if (newLanguage === 'ar' || newLanguage === 'ur') {
        document.documentElement.dir = 'rtl';
      } else {
        document.documentElement.dir = 'ltr';
      }

      setIsOpen(false);
    } catch (error) {
      console.error('AuthLanguageSwitcher: Error changing language:', error);
    }
  };

  const currentLanguageOption = languageOptions.find(lang => lang.code === currentLanguage);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center w-8 h-8">
        <div className="w-3 h-3 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-1 px-2 py-1 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors duration-200"
        title="Select Language"
      >
        <Globe className="w-3 h-3" />
        <span>{currentLanguageOption?.name || 'EN'}</span>
        <ChevronDown className={`w-2 h-2 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="absolute right-0 mt-1 w-40 bg-white dark:bg-gray-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
            <div className="py-1">
              {languageOptions.map((option) => (
                <button
                  key={option.code}
                  onClick={() => handleLanguageChange(option.code)}
                  className={`flex items-center justify-between w-full px-3 py-2 text-xs text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 ${
                    currentLanguage === option.code
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                      : 'text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <span className="font-medium">{option.nativeName}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {option.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
          {/* Click outside to close */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
        </>
      )}
    </div>
  );
};
