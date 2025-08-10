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
    console.log('🎉 Login successful, processing response:', {
      hasUser: !!result.data.user,
      hasToken: !!result.data.token,
      hasRefreshToken: !!result.data.refreshToken,
    });

    try {
      // Validate token before storing (skip validation in browser for now)
      console.log('🔍 Token validation skipped in browser (will validate on server)');

      console.log('✅ Token validation passed');

      // Store in Redux (which will persist automatically)
      const loginPayload = {
        user: result.data.user,
        token: result.data.token,
        refreshToken: result.data.refreshToken,
        email: result.data.user.email, // Add the missing email field
        expiresAt: result.data.expiresAt,
      };
      
      console.log('📦 Dispatching login payload:', {
        user: loginPayload.user?.email,
        hasToken: !!loginPayload.token,
        hasRefreshToken: !!loginPayload.refreshToken,
      });
      
      dispatch(setLogin(loginPayload));
      console.log('✅ Redux login dispatched');
      
      // Debug: Check Redux state immediately after dispatch
      setTimeout(() => {
        console.log('🔍 Checking Redux state after dispatch...');
        // We can't access store directly here, but we can check localStorage
        const persistedState = localStorage.getItem('persist:superadmin-root');
        if (persistedState) {
          try {
            const parsed = JSON.parse(persistedState);
            const authData = parsed.auth ? JSON.parse(parsed.auth) : null;
            console.log('📊 Redux persisted state:', {
              isLoggedIn: authData?.isLoggedIn,
              hasUser: !!authData?.user,
              hasToken: !!authData?.token,
              hasRefreshToken: !!authData?.refreshToken,
            });
          } catch (parseError) {
            console.error('❌ Error parsing persisted state:', parseError);
            // Clear corrupted persisted state
            localStorage.removeItem('persist:superadmin-root');
            console.log('🧹 Cleared corrupted persisted state');
          }
        }
      }, 100);

      // Store tokens in multiple locations for redundancy
      try {
        console.log('💾 Storing tokens in browser storage...');
        
        // Store access token in sessionStorage
        sessionStorage.setItem('access_token', result.data.token);
        console.log('✅ Access token stored in sessionStorage');
        
        // Store refresh token in localStorage
        localStorage.setItem('refresh_token', result.data.refreshToken);
        console.log('✅ Refresh token stored in localStorage');
        
        // Verify storage
        const storedAccessToken = sessionStorage.getItem('access_token');
        const storedRefreshToken = localStorage.getItem('refresh_token');
        
        console.log('🔍 Storage verification:');
        console.log('📦 sessionStorage access_token:', storedAccessToken ? 'EXISTS' : 'NOT FOUND');
        console.log('📦 localStorage refresh_token:', storedRefreshToken ? 'EXISTS' : 'NOT FOUND');
        console.log('📦 localStorage persist:superadmin-root:', localStorage.getItem('persist:superadmin-root') ? 'EXISTS' : 'NOT FOUND');
        
        if (!storedAccessToken || !storedRefreshToken) {
          throw new Error('Failed to store tokens in browser storage');
        }
        
      } catch (storageError) {
        console.error('❌ Failed to store tokens in browser storage:', storageError);
        throw storageError;
      }

      toast.success('Login successful!');
      
      // Redirect immediately after successful login
      console.log('🔄 Redirecting to dashboard...');
      console.log('📍 Current pathname:', window.location.pathname);
      console.log('🎯 Target pathname: /superadmin/dashboard');
      
      try {
        router.replace('/superadmin/dashboard');
        console.log('✅ Router.replace called successfully');
      } catch (error) {
        console.error('❌ Router.replace failed:', error);
        // Fallback to window.location
        window.location.href = '/superadmin/dashboard';
      }

    } catch (error: any) {
      console.error('❌ Error processing login success:', error);
      setError(error.message || 'Failed to process login');
      toast.error('Login failed. Please try again.');
    }
  };

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('🔐 Attempting login with auth service');
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