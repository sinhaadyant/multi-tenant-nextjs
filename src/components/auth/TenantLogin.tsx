"use client";

import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import axios from 'axios';
import toast from 'react-hot-toast';

// Login form validation schema
const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

interface TenantInfo {
  id: string;
  name: string;
  slug: string;
  plan: string;
  status: string;
  description?: string;
}

interface TenantLoginProps {
  tenantSlug: string;
  onLoginSuccess: (result: any) => void;
  isSubmitting: boolean;
}

const TenantLogin: React.FC<TenantLoginProps> = ({ tenantSlug, onLoginSuccess, isSubmitting }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tenantInfo, setTenantInfo] = useState<TenantInfo | null>(null);
  const [loadingTenant, setLoadingTenant] = useState(true);
  const [tenantNotFound, setTenantNotFound] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  // Fetch tenant information
  useEffect(() => {
    const fetchTenantInfo = async () => {
      try {
        setLoadingTenant(true);
        const response = await axios.get(`/api/tenant/${tenantSlug}/info`);
        if (response.data.success) {
          setTenantInfo(response.data.data.tenant);
        } else {
          setTenantNotFound(true);
        }
      } catch (error: any) {
        console.error('Error fetching tenant info:', error);
        if (error.response?.status === 404 || error.response?.data?.success === false) {
          setTenantNotFound(true);
        }
      } finally {
        setLoadingTenant(false);
      }
    };

    if (tenantSlug) {
      fetchTenantInfo();
    }
  }, [tenantSlug]);

  const onSubmit = async (data: LoginFormData) => {
    setError(null);

    try {
      console.log('🔐 Attempting login for tenant:', tenantSlug);
      
      const result = await axios.post('/api/tenant/auth/login', {
        email: data.email,
        password: data.password,
        tenantSlug: tenantSlug
      });

      if (result.data.success && result.data.data) {
        console.log('✅ Login API call successful');
        await onLoginSuccess(result.data);
      } else {
        console.error('❌ Login API call failed:', result.data.message);
        setError(result.data.message || 'Login failed. Please try again.');
        toast.error(result.data.message || 'Login failed');
      }
    } catch (err: any) {
      console.error('❌ Login error:', err);
      const errorMessage = err.response?.data?.message || 'Network error. Please check your connection and try again.';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  // Show loading state while fetching tenant info
  if (loadingTenant) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Loading tenant information...
          </p>
        </div>
      </div>
    );
  }

  // Show 404 if tenant not found
  if (tenantNotFound) {
    return (
      <div className="relative flex flex-col items-center justify-center min-h-screen p-6 overflow-hidden z-1">
        <div className="mx-auto w-full max-w-[242px] text-center sm:max-w-[472px]">
          <h1 className="mb-8 font-bold text-gray-800 text-title-md dark:text-white/90 xl:text-title-2xl">
            Tenant Not Found
          </h1>

          <div className="mb-8">
            <svg className="mx-auto h-24 w-24 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>

          <p className="mt-10 mb-6 text-base text-gray-700 dark:text-gray-400 sm:text-lg">
            The tenant "{tenantSlug}" does not exist or is not active.
          </p>

          <a
            href="/"
            className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-5 py-3.5 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
          >
            Back to Home Page
          </a>
        </div>
        <p className="absolute text-sm text-center text-gray-500 -translate-x-1/2 bottom-6 left-1/2 dark:text-gray-400">
          &copy; {new Date().getFullYear()} - Multi-Tenant Platform
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-md space-y-8">
        {/* Tenant Info Card */}
        {tenantInfo && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="text-center">
              <div className="mx-auto h-12 w-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mb-4">
                <span className="text-white font-bold text-lg">
                  {tenantInfo.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                {tenantInfo.name}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {tenantInfo.description || `Welcome to ${tenantInfo.name}`}
              </p>
              <div className="flex justify-center items-center gap-3">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  tenantInfo.status === 'active' 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                }`}>
                  {tenantInfo.status}
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  {tenantInfo.plan}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Login Form Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 border border-gray-200 dark:border-gray-700">
          <div className="mb-8 text-center">
            <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
              Sign In to {tenantInfo?.name || 'Your Account'}
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
              Continue with Google
            </button>
            
            <button
              disabled
              className="flex w-full items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z"/>
              </svg>
              Continue with Microsoft
            </button>
          </div>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-2 text-gray-500 dark:bg-gray-800 dark:text-gray-400">Or continue with email</span>
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
              disabled={isSubmitting}
              className="flex w-full items-center justify-center rounded-lg bg-brand-500 px-4 py-3 text-sm font-medium text-white hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:focus:ring-offset-gray-800"
            >
              {isSubmitting ? (
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
                href={`/${tenantSlug}/forgot-password`}
                className="text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400 dark:hover:text-brand-300"
              >
                Forgot your password?
              </a>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            © 2024 Multi-Tenant Platform. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TenantLogin;
