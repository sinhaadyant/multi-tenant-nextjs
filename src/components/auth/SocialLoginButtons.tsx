"use client";

import React from 'react';
import { Google, Apple } from 'lucide-react';
import { Button } from '@/components/ui/button/Button';

interface SocialLoginConfig {
  enabled: boolean;
  google: {
    enabled: boolean;
    clientId?: string;
  };
  apple: {
    enabled: boolean;
    clientId?: string;
  };
}

interface SocialLoginButtonsProps {
  config: SocialLoginConfig;
  onGoogleLogin?: () => void;
  onAppleLogin?: () => void;
  disabled?: boolean;
  className?: string;
}

const SocialLoginButtons: React.FC<SocialLoginButtonsProps> = ({
  config,
  onGoogleLogin,
  onAppleLogin,
  disabled = false,
  className = ''
}) => {
  // Don't render if social login is disabled globally
  if (!config.enabled) {
    return null;
  }

  // Don't render if no providers are enabled
  if (!config.google.enabled && !config.apple.enabled) {
    return null;
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-gray-300 dark:border-gray-600" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-white dark:bg-gray-900 px-2 text-gray-500 dark:text-gray-400">
            Or continue with
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {config.google.enabled && (
          <Button
            type="button"
            variant="outline"
            onClick={onGoogleLogin}
            disabled={disabled || !config.google.clientId}
            className="w-full flex items-center justify-center gap-3"
          >
            <Google className="w-5 h-5 text-red-500" />
            <span>Continue with Google</span>
          </Button>
        )}

        {config.apple.enabled && (
          <Button
            type="button"
            variant="outline"
            onClick={onAppleLogin}
            disabled={disabled || !config.apple.clientId}
            className="w-full flex items-center justify-center gap-3 bg-black text-white hover:bg-gray-800 dark:bg-black dark:text-white dark:hover:bg-gray-800"
          >
            <Apple className="w-5 h-5" />
            <span>Continue with Apple</span>
          </Button>
        )}
      </div>

      {(!config.google.clientId || !config.apple.clientId) && (
        <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
          {!config.google.clientId && config.google.enabled && (
            <p>Google OAuth not configured</p>
          )}
          {!config.apple.clientId && config.apple.enabled && (
            <p>Apple Sign-In not configured</p>
          )}
        </div>
      )}
    </div>
  );
};

export default SocialLoginButtons;
