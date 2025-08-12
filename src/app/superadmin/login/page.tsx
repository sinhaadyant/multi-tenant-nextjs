"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAppDispatch } from '@/hooks/redux';
import { setLogin } from '@/store/slices/authSlice';
import { login } from '@/services/authService';
import { validateToken } from '@/lib/tokenValidation';
import toast from 'react-hot-toast';
import { useAuthRedirect } from '@/hooks/useAuthRedirect';

// Login form validation schema
const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function SuperAdminLogin() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  
  // Check if user is already authenticated and redirect if needed
  const { shouldRedirect, isLoading: authLoading } = useAuthRedirect({
    redirectTo: '/superadmin/dashboard'
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });





  const handleLoginSuccess = async (result: any) => {
    try {
      // Validate token before storing (skip validation in browser for now)

      // Store in Redux (which will persist automatically)
      const loginPayload = {
        user: result.data.user,
        token: result.data.token,
        refreshToken: result.data.refreshToken,
        email: result.data.user.email, // Add the missing email field
        expiresAt: result.data.expiresAt,
      };
      
      dispatch(setLogin(loginPayload));
      
      // Debug: Check Redux state immediately after dispatch
      setTimeout(() => {
        // We can't access store directly here, but we can check localStorage
        const persistedState = localStorage.getItem('persist:superadmin-root');
        if (persistedState) {
          try {
            const parsed = JSON.parse(persistedState);
            const authData = parsed.auth ? JSON.parse(parsed.auth) : null;
            // Clear corrupted persisted state
            if (!authData) {
              localStorage.removeItem('persist:superadmin-root');
            }
          } catch (parseError) {
            // Clear corrupted persisted state
            localStorage.removeItem('persist:superadmin-root');
          }
        }
      }, 100);

      // Store tokens in multiple locations for redundancy
      try {
        // Store access token in localStorage (primary location for API)
        localStorage.setItem('auth_token', result.data.token);
        localStorage.setItem('superadmin_token', result.data.token);
        
        // Store access token in sessionStorage (backup)
        sessionStorage.setItem('access_token', result.data.token);
        
        // Store refresh token in localStorage
        localStorage.setItem('refresh_token', result.data.refreshToken);
        
        // Verify storage
        const storedAuthToken = localStorage.getItem('auth_token');
        const storedSuperadminToken = localStorage.getItem('superadmin_token');
        const storedAccessToken = sessionStorage.getItem('access_token');
        const storedRefreshToken = localStorage.getItem('refresh_token');
        
        if (!storedAuthToken || !storedSuperadminToken || !storedRefreshToken) {
          throw new Error('Failed to store tokens in browser storage');
        }
        
      } catch (storageError) {
        throw storageError;
      }

      toast.success('Login successful!');
      
      // Redirect immediately after successful login
      try {
        router.replace('/superadmin/dashboard');
      } catch (error) {
        // Fallback to window.location
        window.location.href = '/superadmin/dashboard';
      }

    } catch (error: any) {
      setError(error.message || 'Failed to process login');
      toast.error('Login failed. Please try again.');
    }
  };

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await login(data);

      if (result.success && result.data) {
        await handleLoginSuccess(result);
      } else {
        setError(result.message || 'Login failed. Please try again.');
        toast.error(result.message || 'Login failed');
      }
    } catch (err: any) {
      const errorMessage = 'Network error. Please check your connection and try again.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="mx-auto w-full max-w-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Don't render the login form if user should be redirected
  if (shouldRedirect) {
    return (
      <div className="mx-auto w-full max-w-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }



  return (
    <div className="mx-auto w-full max-w-[400px]">
      <div className="mb-8 text-center">
        <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
          SuperAdmin Sign In
        </h1>
        <p className="text-base text-gray-600 dark:text-gray-400">
          Welcome back! Please sign in to your account.
        </p>
      </div>

      {/* Social Login Buttons - Design Only */}
      <div className="mb-6 space-y-3">
        <button
          disabled
          className="flex w-full items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google (Coming Soon)
        </button>
        
        <button
          disabled
          className="flex w-full items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z"/>
          </svg>
          Continue with Apple (Coming Soon)
        </button>
      </div>

      {/* Divider */}
      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-white px-2 text-gray-500 dark:bg-gray-900 dark:text-gray-400">Or continue with email</span>
        </div>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
        {/* Email Field */}
        <div>
          <label htmlFor="email" className="mb-2.5 block text-sm font-medium text-gray-900 dark:text-white">
            Email
          </label>
          <div className="relative">
            <input
              {...register('email')}
              type="email"
              placeholder="Enter your email"
              autoComplete="email"
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder:text-gray-500 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-400 dark:focus:border-brand-500"
            />
          </div>
          {errors.email && (
            <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
          )}
        </div>

        {/* Password Field */}
        <div>
          <label htmlFor="password" className="mb-2.5 block text-sm font-medium text-gray-900 dark:text-white">
            Password
          </label>
          <div className="relative">
            <input
              {...register('password')}
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              autoComplete="current-password"
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 pr-12 text-gray-900 placeholder:text-gray-500 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-400 dark:focus:border-brand-500"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
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
          className="flex w-full items-center justify-center rounded-lg bg-brand-500 px-4 py-3 text-sm font-medium text-white hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:focus:ring-offset-gray-800"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Signing in...
            </>
          ) : (
            'Sign In'
          )}
        </button>

        {/* Forgot Password Link */}
        <div className="text-center">
          <a
            href="/superadmin/forgot-password"
            className="text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400 dark:hover:text-brand-300"
          >
            Forgot your password?
          </a>
        </div>
      </form>
    </div>
  );
}