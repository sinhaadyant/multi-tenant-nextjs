"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Mail, Loader2, CheckCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { requestPasswordReset } from '@/services/authService';
import { AuthLanguageSwitcher } from '@/components/common/AuthLanguageSwitcher';

// Forgot password form validation schema
const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPassword() {
  const { t } = useTranslation('auth');
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await requestPasswordReset(data.email);

      if (response.success) {
        setSuccess(true);
        // In a real implementation, we would just show success message
        // For demo purposes, we'll redirect to reset password page
        console.log('✅ Forgot password successful, redirecting with token:', response.token?.substring(0, 10) + '...');
        setTimeout(() => {
          const redirectUrl = `/superadmin/reset-password?token=${encodeURIComponent(response.token)}`;
          console.log('🔗 Redirecting to:', redirectUrl);
          router.push(redirectUrl);
        }, 2000);
      } else {
        console.log('❌ Forgot password failed:', response.message);
        setError(response.message);
      }
    } catch (err) {
      setError(t('forgotPassword.errors.networkError'));
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col flex-1 w-full">
        <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto space-y-8">
          <div className="text-center">
            <div className="mt-6 flex justify-center">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            <h2 className="mt-4 text-3xl font-bold text-gray-900 dark:text-white">
              {t('forgotPassword.checkEmailTitle')}
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              {t('forgotPassword.checkEmailSubtitle')} <br />
              <span className="font-medium">{getValues('email')}</span>
            </p>
            <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
              {t('forgotPassword.redirectingDemo')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 w-full">
      {/* Language Switcher */}
      <div className="flex justify-end mb-4">
        <AuthLanguageSwitcher />
      </div>
      
      <div className="w-full max-w-md sm:pt-10 mx-auto mb-5">
        <Link
          href="/superadmin/login"
          className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          {t('forgotPassword.backToLogin')}
        </Link>
      </div>
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto space-y-8">
        {/* Header */}
        <div className="text-center mb-8">
          {/* SuperAdmin Badge */}
          <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full mb-4 shadow-sm">
            <Mail className="w-6 h-6 text-white" />
          </div>
          
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90 sm:text-3xl">
            {t('forgotPassword.title')}
          </h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {t('forgotPassword.subtitle')}
          </p>
        </div>

        {/* Forgot Password Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('forgotPassword.emailLabel')}
            </label>
            <input
              {...register('email')}
              type="email"
              id="email"
              className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white ${
                errors.email ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder={t('forgotPassword.emailPlaceholder')}
              disabled={isLoading}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-blue-600 dark:hover:bg-blue-700"
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5" />
                {t('forgotPassword.sendingInstructions')}
              </>
            ) : (
              t('forgotPassword.sendInstructions')
            )}
          </button>
        </form>
      </div>
    </div>
  );
}