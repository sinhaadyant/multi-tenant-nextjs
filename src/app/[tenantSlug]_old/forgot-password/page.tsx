"use client";

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Mail, Building2, ArrowLeft, CheckCircle } from 'lucide-react';

// Validation schema
const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

// Forgot password API function
const forgotPassword = async (data: ForgotPasswordFormData & { tenantSlug: string }) => {
  const response = await fetch('/api/tenant/auth/forgot-password', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to send reset email');
  }

  return response.json();
};

export default function TenantForgotPasswordPage() {
  const params = useParams();
  const tenantSlug = params.tenantSlug as string;
  
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  // Forgot password mutation
  const forgotPasswordMutation = useMutation({
    mutationFn: (data: ForgotPasswordFormData) => forgotPassword({ ...data, tenantSlug }),
    onSuccess: (response) => {
      if (response.success) {
        setIsEmailSent(true);
        setError(null);
        // Store token for testing (remove in production)
        if (response.data?.token) {
          setResetToken(response.data.token);
        }
        toast.success('Password reset instructions sent to your email!');
      }
    },
    onError: (error: any) => {
      const errorMessage = error.message || 'Failed to send reset email';
      setError(errorMessage);
      toast.error(errorMessage);
    },
  });

  const onSubmit = (data: ForgotPasswordFormData) => {
    setError(null);
    forgotPasswordMutation.mutate(data);
  };

  if (isEmailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <div className="flex justify-center">
              <Image
                src="/images/logo/logo.svg"
                alt="Logo"
                width={150}
                height={40}
                className="dark:hidden"
              />
              <Image
                src="/images/logo/logo-dark.svg"
                alt="Logo"
                width={150}
                height={40}
                className="hidden dark:block"
              />
            </div>
            <div className="mt-6 text-center">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <Building2 className="w-5 h-5 text-blue-500" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {tenantSlug.charAt(0).toUpperCase() + tenantSlug.slice(1)}
                </h2>
              </div>
              <div className="flex justify-center mb-4">
                <CheckCircle className="w-16 h-16 text-green-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Check your email
              </h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                We've sent password reset instructions to your email address.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {/* For testing purposes - remove in production */}
            {resetToken && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
                  <strong>Testing Mode:</strong> Reset token (remove in production):
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-300 break-all">
                  {resetToken}
                </p>
                <Link
                  href={`/${tenantSlug}/reset-password?token=${resetToken}`}
                  className="inline-block mt-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Click here to reset password
                </Link>
              </div>
            )}

            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Didn't receive the email? Check your spam folder or{' '}
                <button
                  onClick={() => setIsEmailSent(false)}
                  className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  try again
                </button>
              </p>
            </div>

            <div className="text-center">
              <Link
                href={`/${tenantSlug}/login`}
                className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="flex justify-center">
            <Image
              src="/images/logo/logo.svg"
              alt="Logo"
              width={150}
              height={40}
              className="dark:hidden"
            />
            <Image
              src="/images/logo/logo-dark.svg"
              alt="Logo"
              width={150}
              height={40}
              className="hidden dark:block"
            />
          </div>
          <div className="mt-6 text-center">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Building2 className="w-5 h-5 text-blue-500" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {tenantSlug.charAt(0).toUpperCase() + tenantSlug.slice(1)}
              </h2>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Forgot your password?
            </h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Enter your email address and we'll send you a link to reset your password.
            </p>
          </div>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
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

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Email address
            </label>
            <div className="mt-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                {...register('email')}
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none relative block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-800 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Enter your email address"
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email.message}</p>
            )}
          </div>

          <div>
            <button
              type="submit"
              disabled={forgotPasswordMutation.isPending}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {forgotPasswordMutation.isPending ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Sending...
                </div>
              ) : (
                'Send reset instructions'
              )}
            </button>
          </div>

          <div className="text-center">
            <Link
              href={`/${tenantSlug}/login`}
              className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to sign in
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
} 