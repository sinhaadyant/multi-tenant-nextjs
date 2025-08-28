"use client";

import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AuthLanguageSwitcher } from '@/components/common/AuthLanguageSwitcher';

export default function TestI18nPage() {
  const { t, i18n } = useTranslation('auth');
  const [, forceUpdate] = useState({});

  // Listen for language changes
  useEffect(() => {
    const handleLanguageChange = () => {
      forceUpdate({});
    };

    window.addEventListener('languageChanged', handleLanguageChange);
    return () => {
      window.removeEventListener('languageChanged', handleLanguageChange);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              i18n Test Page
            </h1>
            <AuthLanguageSwitcher />
          </div>

          <div className="mb-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Current Language: <span className="font-semibold">{i18n.language}</span>
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Login Section */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white border-b pb-2">
                Login Form Translations
              </h2>
              <div className="space-y-2">
                <p><strong>Title:</strong> {t('login.title')}</p>
                <p><strong>Subtitle:</strong> {t('login.subtitle')}</p>
                <p><strong>Email Label:</strong> {t('login.emailLabel')}</p>
                <p><strong>Password Label:</strong> {t('login.passwordLabel')}</p>
                <p><strong>Remember Me:</strong> {t('login.rememberMe')}</p>
                <p><strong>Sign In Button:</strong> {t('login.signInButton')}</p>
                <p><strong>Forgot Password:</strong> {t('login.forgotPasswordLink')}</p>
              </div>
            </div>

            {/* Signup Section */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white border-b pb-2">
                Signup Form Translations
              </h2>
              <div className="space-y-2">
                <p><strong>Title:</strong> {t('signup.title')}</p>
                <p><strong>Subtitle:</strong> {t('signup.subtitle')}</p>
                <p><strong>Full Name:</strong> {t('signup.fullName')}</p>
                <p><strong>Email Address:</strong> {t('signup.emailAddress')}</p>
                <p><strong>Password:</strong> {t('signup.password')}</p>
                <p><strong>Create Account:</strong> {t('signup.createAccount')}</p>
              </div>
            </div>
          </div>

          <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
              Instructions
            </h3>
            <ul className="text-blue-800 dark:text-blue-200 space-y-1">
              <li>• Use the language switcher in the top-right corner to change languages</li>
              <li>• All text should update immediately when you change the language</li>
              <li>• Bengali (BN) has actual translations, other languages use English fallback</li>
              <li>• The language preference is saved in localStorage</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 
